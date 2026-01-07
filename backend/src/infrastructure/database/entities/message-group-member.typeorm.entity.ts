import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserTypeOrmEntity } from './user.typeorm.entity';
import { MessageGroupTypeOrmEntity } from './message-group.typeorm.entity';

@Entity('message_group_members')
@Index(['groupId'])
@Index(['userId'])
@Index(['groupId', 'userId'], { unique: true })
export class MessageGroupMemberTypeOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: false })
  groupId!: string;

  @ManyToOne(() => MessageGroupTypeOrmEntity)
  @JoinColumn({ name: 'groupId' })
  group!: MessageGroupTypeOrmEntity;

  @Column({ type: 'uuid', nullable: false })
  userId!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'userId' })
  user!: UserTypeOrmEntity;

  @Column({ type: 'timestamp', nullable: true })
  lastReadAt!: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}