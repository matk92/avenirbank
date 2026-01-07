import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserTypeOrmEntity } from './user.typeorm.entity';

@Entity('message_groups')
@Index(['updatedAt'])
export class MessageGroupTypeOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'uuid', nullable: false })
  createdById!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'createdById' })
  createdBy!: UserTypeOrmEntity;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt!: Date;
}