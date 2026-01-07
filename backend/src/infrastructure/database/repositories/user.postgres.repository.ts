import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '@domain/entities/user.entity';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { UserTypeOrmEntity, UserRoleEnum } from '../entities/user.typeorm.entity';

/**
 * PostgreSQL User Repository - Infrastructure Layer
 * Implements IUserRepository interface
 * Handles all database operations for users
 */

@Injectable()
export class UserPostgresRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserTypeOrmEntity)
    private readonly typeOrmRepository: Repository<UserTypeOrmEntity>,
  ) {}

  /**
   * Save a new user to database
   */
  async save(user: User): Promise<User> {
    const entity = this.toPersistence(user);
    const savedEntity = await this.typeOrmRepository.save(entity);
    return this.toDomain(savedEntity);
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.typeOrmRepository.findOne({
      where: { email },
    });
    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const entity = await this.typeOrmRepository.findOne({
      where: { id },
    });
    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Find all users (with pagination)
   */
  async findAll(skip: number = 0, take: number = 10): Promise<{ users: User[]; total: number }> {
    const [entities, total] = await this.typeOrmRepository.findAndCount({
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
    return {
      users: entities.map((entity) => this.toDomain(entity)),
      total,
    };
  }

  /**
   * Update user
   */
  async update(user: User): Promise<User> {
    const entity = this.toPersistence(user);
    const updatedEntity = await this.typeOrmRepository.save(entity);
    return this.toDomain(updatedEntity);
  }

  /**
   * Delete user by ID
   */
  async delete(id: string): Promise<void> {
    await this.typeOrmRepository.delete(id);
  }

  /**
   * Find users by role
   */
  async findByRole(
    role: string,
    skip: number = 0,
    take: number = 10,
  ): Promise<{ users: User[]; total: number }> {
    const [entities, total] = await this.typeOrmRepository.findAndCount({
      where: { role: role as UserRoleEnum },
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
    return {
      users: entities.map((entity: UserTypeOrmEntity) => this.toDomain(entity)),
      total,
    };
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await this.typeOrmRepository.count({
      where: { email },
    });
    return count > 0;
  }
  
  /**
   * Find user by email confirmation token
   */
  async findByEmailConfirmationToken(token: string): Promise<User | null> {
    const entity = await this.typeOrmRepository.findOne({
      where: { emailConfirmationToken: token },
    });
    return entity ? this.toDomain(entity) : null;
  }

  /**
   * Convert domain User to TypeORM entity (persistence)
   */
  private toPersistence(user: User): UserTypeOrmEntity {
    const entity = new UserTypeOrmEntity();
    entity.id = user.id;
    entity.firstName = user.firstName;
    entity.lastName = user.lastName;
    entity.email = user.email;
    entity.passwordHash = user.passwordHash;
    entity.role = user.role as unknown as UserRoleEnum;
    entity.isEmailConfirmed = user.isEmailConfirmed;
    entity.emailConfirmationToken = user.emailConfirmationToken;
    entity.emailConfirmationTokenExpiry = user.emailConfirmationTokenExpiry;
    entity.isBanned = user.isBanned;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    return entity;
  }

  /**
   * Convert TypeORM entity to domain User
   */
  private toDomain(entity: UserTypeOrmEntity): User {
    const user = new User(
      entity.id,
      entity.email,
      entity.firstName,
      entity.lastName,
      entity.passwordHash,
      entity.role as unknown as UserRole,
    );
    user.isEmailConfirmed = entity.isEmailConfirmed;
    user.emailConfirmationToken = entity.emailConfirmationToken;
    user.emailConfirmationTokenExpiry = entity.emailConfirmationTokenExpiry;
    user.isBanned = entity.isBanned;
    user.createdAt = entity.createdAt;
    user.updatedAt = entity.updatedAt;
    return user;
  }
}
