/**
 * User Repository Interface - Domain Layer
 * Defines contract for user persistence (framework-agnostic)
 */

import { User } from '../entities/user.entity';

export interface IUserRepository {
  /**
   * Save a new user (create or update)
   */
  save(user: User): Promise<User>;

  /**
   * Find user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Update user
   */
  update(user: User): Promise<User>;

  /**
   * Delete user
   */
  delete(id: string): Promise<void>;

  /**
   * Find all users (with pagination)
   */
  findAll(skip: number, take: number): Promise<{ users: User[]; total: number }>;

  /**
   * Find users by role
   */
  findByRole(role: string, skip: number, take: number): Promise<{ users: User[]; total: number }>;

  /**
   * Check if email exists
   */
  emailExists(email: string): Promise<boolean>;
  
  /**
   * Find user by email confirmation token
   */
  findByEmailConfirmationToken(token: string): Promise<User | null>;
}
