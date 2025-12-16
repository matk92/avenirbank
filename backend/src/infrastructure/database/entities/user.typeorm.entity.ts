import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

/**
 * User TypeORM Entity - Infrastructure Layer
 * Maps domain User to database table
 * Handles persistence concerns only
 */

export enum UserRoleEnum {
  CLIENT = 'CLIENT',
  ADVISOR = 'ADVISOR',
  DIRECTOR = 'DIRECTOR',
}

@Entity('users')
@Unique(['email'])
@Index(['email'])
@Index(['createdAt'])
export class UserTypeOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  firstName!: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  lastName!: string;

  @Column({ type: 'varchar', length: 255, nullable: false, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: UserRoleEnum,
    default: UserRoleEnum.CLIENT,
    nullable: false,
  })
  role!: UserRoleEnum;

  @Column({ type: 'boolean', default: false, nullable: false })
  isEmailConfirmed!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  emailConfirmationToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  emailConfirmationTokenExpiry?: Date;

  @Column({ type: 'boolean', default: false, nullable: false })
  isBanned!: boolean;

  @CreateDateColumn({ type: 'timestamp', nullable: false })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: false })
  updatedAt!: Date;
}
