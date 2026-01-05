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
    const messages = await this.groupMessageRepository.find({
      where: { room },
      order: { createdAt: 'ASC' },
      take: 100,
    });

    const formattedMessages = messages.map((m: GroupMessageTypeOrmEntity) => ({
      id: m.id,
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

    const message = new GroupMessageTypeOrmEntity();
    message.id = uuidv4();
    message.room = data.room;
    message.authorId = client.user.sub;
    message.authorName = `${client.user.firstName} ${client.user.lastName}`;
    message.authorRole = client.user.role as UserRoleEnum;
    message.content = data.content;

    await this.groupMessageRepository.save(message);

    const messagePayload = {
      id: message.id,
      author: {
        id: message.authorId,
        name: message.authorName,
        role: message.authorRole.toLowerCase(),
      },
      content: message.content,
      createdAt: message.createdAt.toISOString(),
    };

    this.server.to(data.room).emit('group-message', messagePayload);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ) {
    if (!client.user) return;

    client.to(data.room).emit('user-typing', {
      userId: client.user.sub,
      userName: `${client.user.firstName} ${client.user.lastName}`,
    });
  }
}