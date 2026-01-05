import { Entity, PrimaryColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { UserTypeOrmEntity, UserRoleEnum } from './user.typeorm.entity';

@Entity('group_messages')
@Index(['room'])
@Index(['createdAt'])
export class GroupMessageTypeOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  room!: string;

  @Column({ type: 'uuid', nullable: false })
  authorId!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'authorId' })
  author!: UserTypeOrmEntity;

  @Column({ type: 'varchar', length: 100 })
  authorName!: string;

  @Column({ type: 'enum', enum: UserRoleEnum })
  authorRole!: UserRoleEnum;

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}