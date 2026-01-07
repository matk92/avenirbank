/**
 * Account TypeORM Entity - Infrastructure Layer
 * Database mapping for Account domain entity
 */

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { AccountType } from '@domain/entities/account.entity';
import { UserTypeOrmEntity } from './user.typeorm.entity';

@Entity('accounts')
export class AccountTypeOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column({ unique: true, length: 27 })
  iban!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({
    type: 'enum',
    enum: AccountType,
    default: AccountType.CHECKING
  })
  type!: AccountType;

  @Column('decimal', { precision: 15, scale: 2, default: 0, transformer: {
    to: (value: number) => value,
    from: (value: string) => parseFloat(value)
  }})
  balance!: number;

  @Column({ length: 3, default: 'EUR' })
  currency!: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => UserTypeOrmEntity)
  @JoinColumn({ name: 'userId' })
  user!: UserTypeOrmEntity;
}
