import { Entity, PrimaryColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { UserTypeOrmEntity } from './user.typeorm.entity';

@Entity('notifications')
@Index(['recipientId'])
@Index(['read'])
@Index(['createdAt'])
export class NotificationTypeOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  recipientId!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'recipientId' })
  recipient!: UserTypeOrmEntity;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'boolean', default: false })
  read!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}