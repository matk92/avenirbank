import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { MessagingGateway } from './messaging.gateway';
import { GroupChatGateway } from './group-chat.gateway';
import { MessagingService } from './messaging.service';
import { MessagingController } from './messaging.controller';
import { ConversationTypeOrmEntity } from '@infrastructure/database/entities/conversation.typeorm.entity';
import { MessageTypeOrmEntity } from '@infrastructure/database/entities/message.typeorm.entity';
import { GroupMessageTypeOrmEntity } from '@infrastructure/database/entities/group-message.typeorm.entity';
import { UserTypeOrmEntity } from '@infrastructure/database/entities/user.typeorm.entity';
import { NotificationsModule } from '@interface/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConversationTypeOrmEntity,
      MessageTypeOrmEntity,
      GroupMessageTypeOrmEntity,
      UserTypeOrmEntity,
    ]),
    NotificationsModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [MessagingController],
  providers: [MessagingGateway, GroupChatGateway, MessagingService],
  exports: [MessagingService, MessagingGateway],
})
export class MessagingModule {}