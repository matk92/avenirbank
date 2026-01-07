import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Like } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ConversationTypeOrmEntity, ConversationStatusEnum } from '@infrastructure/database/entities/conversation.typeorm.entity';
import { MessageTypeOrmEntity } from '@infrastructure/database/entities/message.typeorm.entity';
import { GroupMessageTypeOrmEntity } from '@infrastructure/database/entities/group-message.typeorm.entity';
import { MessageGroupTypeOrmEntity } from '@infrastructure/database/entities/message-group.typeorm.entity';
import { MessageGroupMemberTypeOrmEntity } from '@infrastructure/database/entities/message-group-member.typeorm.entity';
import { UserTypeOrmEntity, UserRoleEnum } from '@infrastructure/database/entities/user.typeorm.entity';
import { MessagingGateway } from './messaging.gateway';
import { GroupChatGateway } from './group-chat.gateway';
import { NotificationsService } from '@interface/notifications/notifications.service';

@Injectable()
export class MessagingService {
  constructor(
    @InjectRepository(ConversationTypeOrmEntity)
    private conversationRepository: Repository<ConversationTypeOrmEntity>,
    @InjectRepository(MessageTypeOrmEntity)
    private messageRepository: Repository<MessageTypeOrmEntity>,
    @InjectRepository(GroupMessageTypeOrmEntity)
    private groupMessageRepository: Repository<GroupMessageTypeOrmEntity>,
    @InjectRepository(MessageGroupTypeOrmEntity)
    private messageGroupRepository: Repository<MessageGroupTypeOrmEntity>,
    @InjectRepository(MessageGroupMemberTypeOrmEntity)
    private messageGroupMemberRepository: Repository<MessageGroupMemberTypeOrmEntity>,
    @InjectRepository(UserTypeOrmEntity)
    private userRepository: Repository<UserTypeOrmEntity>,
    private messagingGateway: MessagingGateway,
    private groupChatGateway: GroupChatGateway,
    private notificationsService: NotificationsService,
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

    const recipientId = conversation.user1Id === senderId ? conversation.user2Id : conversation.user1Id;
    await this.notificationsService.createNotification(recipientId, 'Vous avez un message en attente');

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

    const dto = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole.toLowerCase(),
      content: message.content,
      timestamp: message.createdAt,
      read: message.read,
    };
    
    this.messagingGateway.server?.to?.(`user:${recipientId}`)?.emit?.('message-notification', {
      conversationId,
      message: 'Vous avez un message en attente',
    });

    return dto;
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
    if (!userId1 || !userId2 || userId1 === userId2) {
      throw new BadRequestException('Invalid conversation participants');
    }

    const user1 = await this.userRepository.findOne({ where: { id: userId1 } });
    const user2 = await this.userRepository.findOne({ where: { id: userId2 } });

    if (!user1) throw new BadRequestException('User not found');
    if (!user2 || user2.isBanned) throw new BadRequestException('Target user not found');

    if (user1.role === UserRoleEnum.CLIENT && user2.role !== UserRoleEnum.ADVISOR) {
      throw new ForbiddenException('Clients can only message advisors');
    }

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

    conversation.clientId =
      user1.role === UserRoleEnum.CLIENT
        ? userId1
        : user2.role === UserRoleEnum.CLIENT
          ? userId2
          : userId1;
    conversation.advisorId =
      user1.role === UserRoleEnum.ADVISOR
        ? userId1
        : user2.role === UserRoleEnum.ADVISOR
          ? userId2
          : undefined;

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
  private getGroupRoom(groupId: string) {
    return `group:${groupId}`;
  }

  async getGroupsForUser(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return [];

    if (user.role !== UserRoleEnum.ADVISOR && user.role !== UserRoleEnum.DIRECTOR) {
      return [];
    }

    const memberships = await this.messageGroupMemberRepository.find({
      where: { userId },
      relations: ['group'],
    });

    const groupIds = memberships.map((m) => m.groupId);
    if (groupIds.length === 0) return [];

    const memberCountsRaw = await this.messageGroupMemberRepository
      .createQueryBuilder('m')
      .select('m.groupId', 'groupId')
      .addSelect('COUNT(*)', 'count')
      .where('m.groupId IN (:...groupIds)', { groupIds })
      .groupBy('m.groupId')
      .getRawMany<{ groupId: string; count: string }>();

    const memberCountByGroupId = new Map<string, number>();
    for (const row of memberCountsRaw) {
      memberCountByGroupId.set(row.groupId, Number(row.count) || 0);
    }

    const unreadCountByGroupId = new Map<string, number>();
    for (const membership of memberships) {
      const room = this.getGroupRoom(membership.groupId);
      const lastReadAt = membership.lastReadAt;
      const qb = this.groupMessageRepository
        .createQueryBuilder('gm')
        .where('gm.room = :room', { room })
        .andWhere('gm.authorId != :userId', { userId });
      if (lastReadAt) {
        qb.andWhere('gm.createdAt > :lastReadAt', { lastReadAt });
      }
      const count = await qb.getCount();
      unreadCountByGroupId.set(membership.groupId, count);
    }

    const groups = memberships
      .map((m) => {
        const group = m.group;
        return {
          id: group.id,
          name: group.name,
          memberCount: memberCountByGroupId.get(group.id) ?? 0,
          unreadCount: unreadCountByGroupId.get(group.id) ?? 0,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt,
        };
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return groups;
  }

  async createGroup(
    creatorId: string,
    input: { name: string; memberIds: string[] },
  ) {
    const creator = await this.userRepository.findOne({ where: { id: creatorId } });
    if (!creator) throw new BadRequestException('User not found');

    if (creator.role !== UserRoleEnum.ADVISOR && creator.role !== UserRoleEnum.DIRECTOR) {
      throw new ForbiddenException('Only staff can create groups');
    }

    const rawName = (input?.name ?? '').trim();
    if (rawName.length < 2) {
      throw new BadRequestException('Group name is too short');
    }

    const uniqueMemberIds = Array.from(
      new Set([...(Array.isArray(input?.memberIds) ? input.memberIds : []), creatorId]),
    ).filter(Boolean);

    const users = await this.userRepository.find({ where: { id: In(uniqueMemberIds), isBanned: false } });
    const validUsers = users.filter(
      (u) => u.role === UserRoleEnum.ADVISOR || u.role === UserRoleEnum.DIRECTOR,
    );

    if (validUsers.length < 2) {
      throw new BadRequestException('A group must contain at least 2 staff members');
    }

    const group = new MessageGroupTypeOrmEntity();
    group.id = uuidv4();
    group.name = rawName;
    group.createdById = creatorId;
    await this.messageGroupRepository.save(group);

    const now = new Date();
    const members = validUsers.map((u) => {
      const m = new MessageGroupMemberTypeOrmEntity();
      m.id = uuidv4();
      m.groupId = group.id;
      m.userId = u.id;
      m.lastReadAt = now;
      return m;
    });
    await this.messageGroupMemberRepository.save(members);

    const dto = {
      id: group.id,
      name: group.name,
      memberCount: members.length,
      unreadCount: 0,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };

    return dto;
  }

  async markGroupAsRead(groupId: string, userId: string) {
    const membership = await this.messageGroupMemberRepository.findOne({
      where: { groupId, userId },
    });
    if (!membership) return;

    membership.lastReadAt = new Date();
    await this.messageGroupMemberRepository.save(membership);
  }

  async getGroupMessages(groupId: string, userId: string) {
    const membership = await this.messageGroupMemberRepository.findOne({
      where: { groupId, userId },
    });
    if (!membership) return [];

    const room = this.getGroupRoom(groupId);
    const messages = await this.groupMessageRepository.find({
      where: { room },
      order: { createdAt: 'ASC' },
      take: 100,
    });

    return messages.map((m) => ({
      id: m.id,
      room: m.room,
      author: {
        id: m.authorId,
        name: m.authorName,
        role: m.authorRole.toLowerCase(),
      },
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    }));
  }

  async createGroupMessage(groupId: string, senderId: string, content: string) {
    const sender = await this.userRepository.findOne({ where: { id: senderId } });
    if (!sender) return null;

    if (sender.role !== UserRoleEnum.ADVISOR && sender.role !== UserRoleEnum.DIRECTOR) {
      return null;
    }

    const membership = await this.messageGroupMemberRepository.findOne({
      where: { groupId, userId: senderId },
    });
    if (!membership) return null;

    const trimmed = (content ?? '').trim();
    if (!trimmed) return null;

    const room = this.getGroupRoom(groupId);

    const message = new GroupMessageTypeOrmEntity();
    message.id = uuidv4();
    message.room = room;
    message.authorId = senderId;
    message.authorName = `${sender.firstName} ${sender.lastName}`;
    message.authorRole = sender.role;
    message.content = trimmed;
    await this.groupMessageRepository.save(message);

    await this.messageGroupRepository.update({ id: groupId }, { updatedAt: () => 'CURRENT_TIMESTAMP' });

    const payload = {
      id: message.id,
      room: message.room,
      author: {
        id: message.authorId,
        name: message.authorName,
        role: message.authorRole.toLowerCase(),
      },
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    };

    this.groupChatGateway.server?.to?.(room)?.emit?.('group-message', payload);

    return payload;
  }
}