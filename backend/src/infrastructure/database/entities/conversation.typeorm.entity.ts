import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { UserTypeOrmEntity } from './user.typeorm.entity';

export enum ConversationStatusEnum {
  PENDING = 'pending',
  ACTIVE = 'active',
  CLOSED = 'closed',
}

@Entity('conversations')
@Index(['user1Id'])
@Index(['user2Id'])
@Index(['status'])
export class ConversationTypeOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  user1Id!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'user1Id' })
  user1!: UserTypeOrmEntity;

  @Column({ type: 'uuid', nullable: false })
  user2Id!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'user2Id' })
  user2!: UserTypeOrmEntity;

  @Column({
    type: 'enum',
    enum: ConversationStatusEnum,
    default: ConversationStatusEnum.ACTIVE,
  })
  status!: ConversationStatusEnum;

  @Column({ type: 'int', default: 0 })
  unreadCountUser1!: number;

  @Column({ type: 'int', default: 0 })
  unreadCountUser2!: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  clientId?: string;

  @Column({ type: 'uuid', nullable: true })
  advisorId?: string;

  @Column({ type: 'int', default: 0 })
  unreadCount!: number;

  @Column({ type: 'timestamp', nullable: true })
  transferredAt?: Date;
}