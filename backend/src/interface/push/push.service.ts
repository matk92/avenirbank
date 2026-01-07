import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as webpush from 'web-push';
import { PushSubscriptionTypeOrmEntity } from '@infrastructure/database/entities/push-subscription.typeorm.entity';

export type WebPushPayload = {
  title: string;
  body: string;
  url?: string;
};

@Injectable()
export class PushService {
  constructor(
    @InjectRepository(PushSubscriptionTypeOrmEntity)
    private readonly pushRepo: Repository<PushSubscriptionTypeOrmEntity>,
  ) {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:dev@avenirbank.local';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
    }
  }

  getVapidPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null;
  }

  async upsertSubscriptionForUser(userId: string, subscription: unknown): Promise<void> {
    const endpoint = this.extractEndpoint(subscription);
    if (!endpoint) return;

    const existing = await this.pushRepo.findOne({ where: { endpoint } });
    if (existing) {
      existing.userId = userId;
      existing.subscription = subscription;
      await this.pushRepo.save(existing);

      if (process.env.NODE_ENV === 'development') {
        console.info('[web-push] Subscription updated', {
          userId,
          endpoint: this.sanitizeEndpoint(endpoint),
        });
      }
      return;
    }

    const entity = new PushSubscriptionTypeOrmEntity();
    entity.id = uuidv4();
    entity.userId = userId;
    entity.endpoint = endpoint;
    entity.subscription = subscription;

    await this.pushRepo.save(entity);

    if (process.env.NODE_ENV === 'development') {
      console.info('[web-push] Subscription created', {
        userId,
        endpoint: this.sanitizeEndpoint(endpoint),
      });
    }
  }

  async removeSubscriptionByEndpoint(userId: string, endpoint: string): Promise<void> {
    await this.pushRepo.delete({ userId, endpoint });

    if (process.env.NODE_ENV === 'development') {
      console.info('[web-push] Subscription removed', {
        userId,
        endpoint: this.sanitizeEndpoint(endpoint),
      });
    }
  }

  async sendPushToUser(userId: string, payload: WebPushPayload): Promise<void> {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    if (!publicKey || !privateKey) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[web-push] VAPID keys missing: push disabled');
      }
      return;
    }

    const subs = await this.pushRepo.find({ where: { userId } });
    if (!subs.length) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[web-push] No subscriptions for user', userId);
      }
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.info('[web-push] Sending push', {
        userId,
        subscriptions: subs.length,
        title: payload?.title,
      });
    }

    const jsonPayload = JSON.stringify(payload);

    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(s.subscription as any, jsonPayload);

          if (process.env.NODE_ENV === 'development') {
            console.info('[web-push] sendNotification ok', {
              userId,
              endpoint: this.sanitizeEndpoint(s.endpoint),
            });
          }
        } catch (err: any) {
          const statusCode = err?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await this.pushRepo.delete({ endpoint: s.endpoint });

            if (process.env.NODE_ENV === 'development') {
              console.warn('[web-push] Subscription gone; deleted', {
                userId,
                endpoint: this.sanitizeEndpoint(s.endpoint),
                statusCode,
              });
            }
            return;
          }

          if (process.env.NODE_ENV === 'development') {
            console.warn('[web-push] sendNotification failed', {
              statusCode,
              endpoint: this.sanitizeEndpoint(s.endpoint),
              message: err?.message,
            });
          }
        }
      }),
    );
  }

  private extractEndpoint(subscription: unknown): string | null {
    if (!subscription || typeof subscription !== 'object') return null;
    const maybe = subscription as any;
    return typeof maybe.endpoint === 'string' ? maybe.endpoint : null;
  }

  private sanitizeEndpoint(endpoint: string): string {
    try {
      const url = new URL(endpoint);
      return `${url.origin}${url.pathname}`;
    } catch {
      return endpoint.length > 80 ? `${endpoint.slice(0, 77)}...` : endpoint;
    }
  }
}