import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Subject } from 'rxjs';
import { NotificationTypeOrmEntity } from '@infrastructure/database/entities/notification.typeorm.entity';
import { ActivityTypeOrmEntity } from '@infrastructure/database/entities/activity.typeorm.entity';
import { UserTypeOrmEntity, UserRoleEnum } from '@infrastructure/database/entities/user.typeorm.entity';

export interface NotificationEvent {
  type: 'notification';
  data: {
    id: string;
    recipientId: string;
    message: string;
    read: boolean;
    createdAt: string;
  };
}

export interface ActivityEvent {
  type: 'activity';
  data: {
    id: string;
    title: string;
    description: string;
    authorId: string;
    authorName: string;
    publishedAt: string;
  };
}

@Injectable()
export class NotificationsService {
  private notificationSubject = new Subject<NotificationEvent>();
  private activitySubject = new Subject<ActivityEvent>();

  constructor(
    @InjectRepository(NotificationTypeOrmEntity)
    private notificationRepository: Repository<NotificationTypeOrmEntity>,
    @InjectRepository(ActivityTypeOrmEntity)
    private activityRepository: Repository<ActivityTypeOrmEntity>,
    @InjectRepository(UserTypeOrmEntity)
    private userRepository: Repository<UserTypeOrmEntity>,
  ) {}

  get notificationStream$() {
    return this.notificationSubject.asObservable();
  }

  get activityStream$() {
    return this.activitySubject.asObservable();
  }

  async getNotificationsForUser(userId: string) {
    const notifications = await this.notificationRepository.find({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return notifications.map((n) => ({
      id: n.id,
      recipientId: n.recipientId,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }));
  }

  async createNotification(recipientId: string, message: string) {
    const notification = new NotificationTypeOrmEntity();
    notification.id = uuidv4();
    notification.recipientId = recipientId;
    notification.message = message;
    notification.read = false;

    await this.notificationRepository.save(notification);

    const event: NotificationEvent = {
      type: 'notification',
      data: {
        id: notification.id,
        recipientId: notification.recipientId,
        message: notification.message,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
      },
    };

    this.notificationSubject.next(event);

    return event.data;
  }

  async markNotificationAsRead(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, recipientId: userId },
    });

    if (!notification) return null;

    notification.read = true;
    await this.notificationRepository.save(notification);

    return {
      id: notification.id,
      recipientId: notification.recipientId,
      message: notification.message,
      read: notification.read,
      createdAt: notification.createdAt.toISOString(),
    };
  }

  async getActivities() {
    const activities = await this.activityRepository.find({
      order: { createdAt: 'DESC' },
      take: 50,
    });

    return activities.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      authorId: a.authorId,
      authorName: a.authorName,
      publishedAt: a.createdAt.toISOString(),
    }));
  }

  async createActivity(authorId: string, title: string, description: string) {
    const user = await this.userRepository.findOne({ where: { id: authorId } });
    if (!user) return null;

    if (user.role !== UserRoleEnum.ADVISOR && user.role !== UserRoleEnum.DIRECTOR) {
      return null;
    }

    const activity = new ActivityTypeOrmEntity();
    activity.id = uuidv4();
    activity.title = title;
    activity.description = description;
    activity.authorId = authorId;
    activity.authorName = `${user.firstName} ${user.lastName}`;

    await this.activityRepository.save(activity);

    const event: ActivityEvent = {
      type: 'activity',
      data: {
        id: activity.id,
        title: activity.title,
        description: activity.description,
        authorId: activity.authorId,
        authorName: activity.authorName,
        publishedAt: activity.createdAt.toISOString(),
      },
    };

    this.activitySubject.next(event);

    return event.data;
  }

  async sendNotificationToClient(senderId: string, clientId: string, message: string) {
    const sender = await this.userRepository.findOne({ where: { id: senderId } });
    if (!sender) return null;

    if (sender.role !== UserRoleEnum.ADVISOR && sender.role !== UserRoleEnum.DIRECTOR) {
      return null;
    }

    const client = await this.userRepository.findOne({ where: { id: clientId } });
    if (!client || client.role !== UserRoleEnum.CLIENT) {
      return null;
    }

    return this.createNotification(clientId, message);
  }

  async getRecentNotifications() {
    const notifications = await this.notificationRepository.find({
      relations: ['recipient'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return notifications.map((n) => ({
      id: n.id,
      recipientId: n.recipientId,
      recipientName: n.recipient ? `${n.recipient.firstName} ${n.recipient.lastName}` : 'Unknown',
      message: n.message,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    }));
  }
}