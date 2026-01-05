import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationTypeOrmEntity } from '@infrastructure/database/entities/notification.typeorm.entity';
import { ActivityTypeOrmEntity } from '@infrastructure/database/entities/activity.typeorm.entity';
import { UserTypeOrmEntity } from '@infrastructure/database/entities/user.typeorm.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NotificationTypeOrmEntity,
      ActivityTypeOrmEntity,
      UserTypeOrmEntity,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}