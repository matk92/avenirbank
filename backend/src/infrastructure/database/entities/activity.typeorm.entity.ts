import { Entity, PrimaryColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { UserTypeOrmEntity } from './user.typeorm.entity';

@Entity('activities')
@Index(['authorId'])
@Index(['createdAt'])
export class ActivityTypeOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'uuid', nullable: false })
  authorId!: string;

  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'authorId' })
  author!: UserTypeOrmEntity;

  @Column({ type: 'varchar', length: 100 })
  authorName!: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;
}