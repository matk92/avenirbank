import { Entity, PrimaryColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { UserTypeOrmEntity, UserRoleEnum } from './user.typeorm.entity';
import { ConversationTypeOrmEntity } from './conversation.typeorm.entity';

@Entity('messages')
@Index(['conversationId'])
@Index(['senderId'])
@Index(['createdAt'])
export class MessageTypeOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  conversationId!: string;

  @ManyToOne(() => ConversationTypeOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation!: ConversationTypeOrmEntity;

  @Column({ type: 'uuid', nullable: false })
  senderId!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'senderId' })
  sender!: UserTypeOrmEntity;

  @Column({ type: 'varchar', length: 100 })
  senderName!: string;

  @Column({ type: 'enum', enum: UserRoleEnum })
  senderRole!: UserRoleEnum;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'boolean', default: false })
  read!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}