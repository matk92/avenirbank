import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { ConversationTypeOrmEntity, ConversationStatusEnum } from '@infrastructure/database/entities/conversation.typeorm.entity';
import { MessageTypeOrmEntity } from '@infrastructure/database/entities/message.typeorm.entity';
import { UserTypeOrmEntity, UserRoleEnum } from '@infrastructure/database/entities/user.typeorm.entity';

const websocketCorsOrigins = (() => {
  const raw = process.env.FRONTEND_URL;
  if (!raw) return true;

  const origins = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : true;
})();

interface AuthenticatedSocket extends Socket {
  user: {
    sub: string;
    email: string;
    role: UserRoleEnum;
  };
}

@WebSocketGateway({
  namespace: '/messaging',
  cors: {
    origin: websocketCorsOrigins,
    credentials: true,
  },
})
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedUsers: Map<string, string> = new Map();

  constructor(
    private jwtService: JwtService,
    @InjectRepository(ConversationTypeOrmEntity)
    private conversationRepository: Repository<ConversationTypeOrmEntity>,
    @InjectRepository(MessageTypeOrmEntity)
    private messageRepository: Repository<MessageTypeOrmEntity>,
    @InjectRepository(UserTypeOrmEntity)
    private userRepository: Repository<UserTypeOrmEntity>,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.user = payload;
      this.connectedUsers.set(payload.sub, client.id);

      client.join(`user:${payload.sub}`);

      if (payload.role === UserRoleEnum.ADVISOR || payload.role === UserRoleEnum.DIRECTOR) {
        client.join('advisors');
      }
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      this.connectedUsers.delete(client.user.sub);
    }
  }

  @SubscribeMessage('join-conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: data.conversationId },
    });

    if (!conversation) return;

    const isParticipant =
      conversation.user1Id === client.user.sub || conversation.user2Id === client.user.sub;
    if (!isParticipant) return;

    client.join(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('leave-conversation')
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      conversationId: string;
      content: string;
    },
  ) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: data.conversationId },
    });

    if (!conversation) return;

    const isParticipant =
      conversation.user1Id === client.user.sub || conversation.user2Id === client.user.sub;
    if (!isParticipant) return;

    const user = await this.userRepository.findOne({ where: { id: client.user.sub } });
    if (!user) return;

    const message = new MessageTypeOrmEntity();
    message.id = uuidv4();
    message.conversationId = data.conversationId;
    message.senderId = client.user.sub;
    message.senderName = `${user.firstName} ${user.lastName}`;
    message.senderRole = user.role;
    message.content = data.content;
    message.read = false;

    await this.messageRepository.save(message);

    if (conversation.user1Id === client.user.sub) {
      await this.conversationRepository.update(
        { id: data.conversationId },
        { unreadCountUser2: () => '"unreadCountUser2" + 1' },
      );
    } else {
      await this.conversationRepository.update(
        { id: data.conversationId },
        { unreadCountUser1: () => '"unreadCountUser1" + 1' },
      );
    }

    const messagePayload = {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole.toLowerCase(),
      content: message.content,
      timestamp: message.createdAt,
      read: message.read,
    };

    this.server.to(`conversation:${data.conversationId}`).emit('new-message', messagePayload);
  }

  @SubscribeMessage('claim-conversation')
  async handleClaimConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; advisorId: string; advisorName: string },
  ) {
    if (client.user.role !== UserRoleEnum.ADVISOR && client.user.role !== UserRoleEnum.DIRECTOR) {
      return;
    }

    const conversation = await this.conversationRepository.findOne({
      where: { id: data.conversationId, status: ConversationStatusEnum.PENDING },
    });

    if (!conversation) return;

    const user = await this.userRepository.findOne({ where: { id: client.user.sub } });
    if (!user) return;

    await this.conversationRepository.update(
      { id: data.conversationId },
      {
        advisorId: client.user.sub,
        status: ConversationStatusEnum.ACTIVE,
      },
    );

    client.join(`conversation:${data.conversationId}`);

    this.server.to('advisors').emit('conversation-claimed', {
      conversationId: data.conversationId,
      advisorId: client.user.sub,
      advisorName: `${user.firstName} ${user.lastName}`,
    });
  }

  @SubscribeMessage('transfer-conversation')
  async handleTransferConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody()
    data: {
      conversationId: string;
      toAdvisorId: string;
      toAdvisorName: string;
      reason: string;
    },
  ) {
    if (client.user.role !== UserRoleEnum.ADVISOR && client.user.role !== UserRoleEnum.DIRECTOR) {
      return;
    }

    const conversation = await this.conversationRepository.findOne({
      where: { id: data.conversationId, advisorId: client.user.sub },
    });

    if (!conversation) return;

    const toAdvisor = await this.userRepository.findOne({
      where: { id: data.toAdvisorId },
    });

    if (!toAdvisor || (toAdvisor.role !== UserRoleEnum.ADVISOR && toAdvisor.role !== UserRoleEnum.DIRECTOR)) {
      return;
    }

    await this.conversationRepository.update(
      { id: data.conversationId },
      {
        advisorId: data.toAdvisorId,
        transferredAt: new Date(),
      },
    );

    client.leave(`conversation:${data.conversationId}`);

    const targetSocketId = this.connectedUsers.get(data.toAdvisorId);
    if (targetSocketId) {
      const sockets = await this.server.sockets.fetchSockets();
      const targetSocket = sockets.find((s) => s.id === targetSocketId);
      if (targetSocket) {
        targetSocket.join(`conversation:${data.conversationId}`);
      }
    }

    this.server.to('advisors').emit('conversation-transferred', {
      conversationId: data.conversationId,
      toAdvisorId: data.toAdvisorId,
      toAdvisorName: `${toAdvisor.firstName} ${toAdvisor.lastName}`,
      reason: data.reason,
    });
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.to(`conversation:${data.conversationId}`).emit('user-typing', {
      conversationId: data.conversationId,
      userId: client.user.sub,
    });
  }

  @SubscribeMessage('mark-read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const conversation = await this.conversationRepository.findOne({
      where: { id: data.conversationId },
    });

    if (!conversation) return;

    const isParticipant =
      conversation.user1Id === client.user.sub || conversation.user2Id === client.user.sub;
    if (!isParticipant) return;

    const otherUserId = conversation.user1Id === client.user.sub ? conversation.user2Id : conversation.user1Id;

    const unreadMessages = await this.messageRepository.find({
      where: {
        conversationId: data.conversationId,
        senderId: otherUserId,
        read: false,
      },
      select: ['id'],
    });

    const messageIds = unreadMessages.map((m) => m.id);

    if (messageIds.length > 0) {
      await this.messageRepository.update(
        {
          conversationId: data.conversationId,
          senderId: otherUserId,
          read: false,
        },
        { read: true },
      );
    }

    if (conversation.user1Id === client.user.sub) {
      await this.conversationRepository.update({ id: data.conversationId }, { unreadCountUser1: 0 });
    } else {
      await this.conversationRepository.update({ id: data.conversationId }, { unreadCountUser2: 0 });
    }

    if (messageIds.length === 0) return;

    const payload = {
      conversationId: data.conversationId,
      messageIds,
      readerId: client.user.sub,
    };

    this.server.to(`conversation:${data.conversationId}`).emit('messages-read', payload);
    this.server.to(`user:${otherUserId}`).emit('messages-read', payload);
  }

  async notifyNewConversation(conversation: ConversationTypeOrmEntity, clientName: string) {
    this.server.to('advisors').emit('new-conversation', {
      id: conversation.id,
      clientId: conversation.clientId,
      clientName,
      status: conversation.status,
      unreadCount: conversation.unreadCount,
      createdAt: conversation.createdAt,
    });
  }
}