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
import { GroupMessageTypeOrmEntity } from '@infrastructure/database/entities/group-message.typeorm.entity';
import { MessageGroupTypeOrmEntity } from '@infrastructure/database/entities/message-group.typeorm.entity';
import { MessageGroupMemberTypeOrmEntity } from '@infrastructure/database/entities/message-group-member.typeorm.entity';
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
    firstName?: string;
    lastName?: string;
  };
}

@WebSocketGateway({
  namespace: '/group-chat',
  cors: {
    origin: websocketCorsOrigins,
    credentials: true,
  },
})
export class GroupChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private roomParticipants: Map<string, Set<string>> = new Map();

  constructor(
    private jwtService: JwtService,
    @InjectRepository(GroupMessageTypeOrmEntity)
    private groupMessageRepository: Repository<GroupMessageTypeOrmEntity>,
    @InjectRepository(MessageGroupTypeOrmEntity)
    private messageGroupRepository: Repository<MessageGroupTypeOrmEntity>,
    @InjectRepository(MessageGroupMemberTypeOrmEntity)
    private messageGroupMemberRepository: Repository<MessageGroupMemberTypeOrmEntity>,
    @InjectRepository(UserTypeOrmEntity)
    private userRepository: Repository<UserTypeOrmEntity>,
  ) {}

  private extractGroupId(room: string) {
    if (!room) return null;
    if (!room.startsWith('group:')) return null;
    const groupId = room.slice('group:'.length);
    return groupId || null;
  }

  private async ensureMember(room: string, userId: string) {
    const groupId = this.extractGroupId(room);
    if (!groupId) return false;

    const membership = await this.messageGroupMemberRepository.findOne({
      where: { groupId, userId },
    });
    return Boolean(membership);
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      
      if (payload.role !== UserRoleEnum.ADVISOR && payload.role !== UserRoleEnum.DIRECTOR) {
        client.disconnect();
        return;
      }

      const user = await this.userRepository.findOne({ where: { id: payload.sub } });
      if (!user) {
        client.disconnect();
        return;
      }

      client.user = {
        ...payload,
        firstName: user.firstName,
        lastName: user.lastName,
      };
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (!client.user) return;

    this.roomParticipants.forEach((participants, room) => {
      if (participants.has(client.user.sub)) {
        participants.delete(client.user.sub);
        this.server.to(room).emit('participant-left', {
          participantCount: participants.size,
        });
      }
    });
  }

  @SubscribeMessage('join-group')
  async handleJoinGroup(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() room: string,
  ) {
    if (!client.user) return;
    const allowed = await this.ensureMember(room, client.user.sub);
    if (!allowed) return;

    client.join(room);

    if (!this.roomParticipants.has(room)) {
      this.roomParticipants.set(room, new Set());
    }
    this.roomParticipants.get(room)!.add(client.user.sub);

    const participantCount = this.roomParticipants.get(room)!.size;
    this.server.to(room).emit('participant-joined', {
      participantCount,
    });
  }

  @SubscribeMessage('leave-group')
  handleLeaveGroup(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() room: string,
  ) {
    if (!client.user) return;

    client.leave(room);

    const participants = this.roomParticipants.get(room);
    if (participants) {
      participants.delete(client.user.sub);
      this.server.to(room).emit('participant-left', {
        participantCount: participants.size,
      });
    }
  }

  @SubscribeMessage('get-group-messages')
  async handleGetGroupMessages(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() room: string,
  ) {
    if (!client.user) return;
    const allowed = await this.ensureMember(room, client.user.sub);
    if (!allowed) return;
    const messages = await this.groupMessageRepository.find({
      where: { room },
      order: { createdAt: 'ASC' },
      take: 100,
    });

    const formattedMessages = messages.map((m: GroupMessageTypeOrmEntity) => ({
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

    client.emit('group-messages-history', formattedMessages);
  }

  @SubscribeMessage('send-group-message')
  async handleSendGroupMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string; content: string },
  ) {
    if (!client.user) return;
    const allowed = await this.ensureMember(data.room, client.user.sub);
    if (!allowed) return;

    const message = new GroupMessageTypeOrmEntity();
    message.id = uuidv4();
    message.room = data.room;
    message.authorId = client.user.sub;
    message.authorName = `${client.user.firstName} ${client.user.lastName}`;
    message.authorRole = client.user.role as UserRoleEnum;
    message.content = data.content;

    await this.groupMessageRepository.save(message);
    const groupId = this.extractGroupId(data.room);
    if (groupId) {
      await this.messageGroupRepository.update({ id: groupId }, { updatedAt: () => 'CURRENT_TIMESTAMP' });
    }

    const messagePayload = {
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

    this.server.to(data.room).emit('group-message', messagePayload);

    if (groupId) {
      const members = await this.messageGroupMemberRepository.find({ where: { groupId } });
      for (const member of members) {
        if (member.userId === client.user.sub) continue;
        this.server.to(`user:${member.userId}`).emit('group-message-notification', {
          groupId,
          message: 'Vous avez un message de groupe en attente',
        });
      }
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    if (!client.user) return;
    this.ensureMember(data.room, client.user.sub).then((allowed) => {
      if (!allowed) return;

      client.to(data.room).emit('user-typing', {
        userId: client.user.sub,
        userName: `${client.user.firstName} ${client.user.lastName}`,
      });
    });
  }
}