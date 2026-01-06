import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ConversationTypeOrmEntity, ConversationStatusEnum } from '@infrastructure/database/entities/conversation.typeorm.entity';
import { MessageTypeOrmEntity } from '@infrastructure/database/entities/message.typeorm.entity';
import { UserTypeOrmEntity, UserRoleEnum } from '@infrastructure/database/entities/user.typeorm.entity';
import { MessagingGateway } from './messaging.gateway';

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(ConversationTypeOrmEntity)
    private conversationRepository: Repository<ConversationTypeOrmEntity>,
    @InjectRepository(MessageTypeOrmEntity)
    private messageRepository: Repository<MessageTypeOrmEntity>,
    @InjectRepository(UserTypeOrmEntity)
    private userRepository: Repository<UserTypeOrmEntity>,
    private messagingGateway: MessagingGateway,
  ) {}

  async getConversationsForUser(userId: string) {
    const conversations = await this.conversationRepository.find({
      where: [
        { user1Id: userId },
        { user2Id: userId },
      ],
      relations: ['user1', 'user2'],
      order: { updatedAt: 'DESC' },
    });

    return conversations.map((c) => this.mapConversationToDto(c, userId));
  }

  async getConversationById(conversationId: string, userId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['user1', 'user2'],
    });

    if (!conversation) return null;

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return null;
    }

    return this.mapConversationToDto(conversation, userId);
  }

  async getMessages(conversationId: string, userId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) return [];

    if (conversation.user1Id !== userId && conversation.user2Id !== userId) {
      return [];
    }

    const messages = await this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: 'ASC' },
    });

    return messages.map((m: MessageTypeOrmEntity) => ({
      id: m.id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      senderName: m.senderName,
      senderRole: m.senderRole.toLowerCase(),
      content: m.content,
      timestamp: m.createdAt,
      read: m.read,
    }));
  }

  async createMessage(conversationId: string, senderId: string, content: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) return null;

    if (conversation.user1Id !== senderId && conversation.user2Id !== senderId) {
      return null;
    }

    const user = await this.userRepository.findOne({ where: { id: senderId } });
    if (!user) return null;

    const message = new MessageTypeOrmEntity();
    message.id = uuidv4();
    message.conversationId = conversationId;
    message.senderId = senderId;
    message.senderName = `${user.firstName} ${user.lastName}`;
    message.senderRole = user.role;
    message.content = content;
    message.read = false;

    await this.messageRepository.save(message);

    if (conversation.user1Id === senderId) {
      await this.conversationRepository.update(
        { id: conversationId },
        { unreadCountUser2: () => '"unreadCountUser2" + 1' },
      );
    } else {
      await this.conversationRepository.update(
        { id: conversationId },
        { unreadCountUser1: () => '"unreadCountUser1" + 1' },
      );
    }

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole.toLowerCase(),
      content: message.content,
      timestamp: message.createdAt,
      read: message.read,
    };
  }

  async markMessagesAsRead(conversationId: string, userId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) return;

 
    const otherUserId = conversation.user1Id === userId ? conversation.user2Id : conversation.user1Id;

    await this.messageRepository.update(
      { conversationId, senderId: otherUserId, read: false },
      { read: true },
    );

    if (conversation.user1Id === userId) {
      await this.conversationRepository.update({ id: conversationId }, { unreadCountUser1: 0 });
    } else {
      await this.conversationRepository.update({ id: conversationId }, { unreadCountUser2: 0 });
    }
  }

  async getAllUsers(currentUserId: string) {
    const users = await this.userRepository.find({
      where: { isBanned: false },
    });

    return users
      .filter((u) => u.id !== currentUserId)
      .map((u: UserTypeOrmEntity) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role.toLowerCase(),
      }));
  }

  async searchUsersByEmail(email: string, role?: string, currentUserId?: string) {
    if (!email || email.length < 2) return [];

    const whereConditions: any[] = [];
    
    const baseCondition: any = {
      email: Like(`%${email.toLowerCase()}%`),
      isBanned: false,
    };

    if (role && role !== 'all') {
      const roleEnum = role.toUpperCase() as keyof typeof UserRoleEnum;
      if (UserRoleEnum[roleEnum]) {
        baseCondition.role = UserRoleEnum[roleEnum];
      }
    }

    whereConditions.push(baseCondition);

    const users = await this.userRepository.find({
      where: whereConditions,
      take: 10,
    });

    return users
      .filter((u) => u.id !== currentUserId)
      .map((u: UserTypeOrmEntity) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        role: u.role.toLowerCase(),
      }));
  }

  async getOrCreateConversation(userId1: string, userId2: string) {
    // Check if conversation already exists (in either direction)
    let conversation = await this.conversationRepository.findOne({
      where: [
        { user1Id: userId1, user2Id: userId2 },
        { user1Id: userId2, user2Id: userId1 },
      ],
      relations: ['user1', 'user2'],
    });

    if (conversation) {
      return this.mapConversationToDto(conversation, userId1);
    }

    conversation = new ConversationTypeOrmEntity();
    conversation.id = uuidv4();
    conversation.user1Id = userId1;
    conversation.user2Id = userId2;
    conversation.status = ConversationStatusEnum.ACTIVE;
    conversation.unreadCountUser1 = 0;
    conversation.unreadCountUser2 = 0;
    conversation.clientId = userId1;
    conversation.advisorId = userId2;
    conversation.unreadCount = 0;
    
    await this.conversationRepository.save(conversation);

    conversation = await this.conversationRepository.findOne({
      where: { id: conversation.id },
      relations: ['user1', 'user2'],
    });

    return conversation ? this.mapConversationToDto(conversation, userId1) : null;
  }

  async deleteConversation(conversationId: string, userId: string) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });

    if (!conversation) return false;

    const isParticipant = conversation.user1Id === userId || conversation.user2Id === userId;
    if (!isParticipant) return false;

    const result = await this.conversationRepository.delete({ id: conversationId });
    const success = (result.affected ?? 0) > 0;
    if (success) {
      this.messagingGateway.emitConversationDeleted({
        conversationId,
        user1Id: conversation.user1Id,
        user2Id: conversation.user2Id,
      });
    }
    return success;
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messageRepository.findOne({
      where: { id: messageId },
    });

    if (!message) return false;

    const conversation = await this.conversationRepository.findOne({
      where: { id: message.conversationId },
    });

    if (!conversation) return false;

    const isParticipant = conversation.user1Id === userId || conversation.user2Id === userId;
    if (!isParticipant) return false;

    if (message.senderId !== userId) return false;

    const result = await this.messageRepository.delete({ id: messageId });
    const success = (result.affected ?? 0) > 0;
    if (success) {
      this.messagingGateway.emitMessageDeleted({
        conversationId: message.conversationId,
        messageId,
      });
    }
    return success;
  }

  private mapConversationToDto(c: ConversationTypeOrmEntity, currentUserId: string) {
    // Determine who is the "other" participant
    const isUser1 = c.user1Id === currentUserId;
    const otherUser = isUser1 ? c.user2 : c.user1;
    const unreadCount = isUser1 ? c.unreadCountUser1 : c.unreadCountUser2;

    return {
      id: c.id,
      recipientId: otherUser?.id,
      recipientName: otherUser ? `${otherUser.firstName} ${otherUser.lastName}` : 'Unknown',
      recipientEmail: otherUser?.email,
      recipientRole: otherUser?.role?.toLowerCase(),
      status: c.status,
      unreadCount: unreadCount || 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    };
  }
}