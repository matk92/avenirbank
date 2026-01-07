import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PushSubscriptionTypeOrmEntity } from '@infrastructure/database/entities/push-subscription.typeorm.entity';
import { PushController } from './push.controller';
import { PushService } from './push.service';

@Module({
  imports: [TypeOrmModule.forFeature([PushSubscriptionTypeOrmEntity])],
  controllers: [PushController],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}