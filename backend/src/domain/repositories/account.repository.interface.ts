/**
 * Account Repository Interface - Domain Layer
 * Defines contract for account persistence (framework-agnostic)
 */

import { Account } from '../entities/account.entity';

export interface IAccountRepository {
  /**
   * Create a new account
   */
  create(account: Account): Promise<Account>;

  /**
   * Find account by ID
   */
  findById(id: string): Promise<Account | null>;

  /**
   * Find account by IBAN
   */
  findByIban(iban: string): Promise<Account | null>;

  /**
   * Find all accounts for a user
   */
  findByUserId(userId: string): Promise<Account[]>;

  /**
   * Update account
   */
  update(account: Account): Promise<Account>;

  /**
   * Delete account
   */
  delete(id: string): Promise<void>;

  /**
   * Check if IBAN exists
   */
  ibanExists(iban: string): Promise<boolean>;

  /**
   * Find all accounts (with pagination)
   */
  findAll(skip: number, take: number): Promise<{ accounts: Account[]; total: number }>;
}
