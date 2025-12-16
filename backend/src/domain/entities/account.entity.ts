/**
 * Account Entity - Domain Layer
 * Pure business logic, no framework dependencies
 */

export enum AccountType {
  CHECKING = 'CHECKING',
  SAVINGS = 'SAVINGS',
}

export class Account {
  id: string;
  userId: string;
  iban: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    userId: string,
    iban: string,
    name: string,
    type: AccountType,
  ) {
    this.id = id;
    this.userId = userId;
    this.iban = iban;
    this.name = name;
    this.type = type;
    this.balance = 0;
    this.currency = 'EUR';
    this.isActive = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Add funds to account
   */
  credit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }
    if (!this.isActive) {
      throw new Error('Account is not active');
    }
    this.balance += amount;
    this.updatedAt = new Date();
  }

  /**
   * Remove funds from account
   */
  debit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Debit amount must be positive');
    }
    if (!this.isActive) {
      throw new Error('Account is not active');
    }
    if (this.balance < amount) {
      throw new Error('Insufficient funds');
    }
    this.balance -= amount;
    this.updatedAt = new Date();
  }

  /**
   * Rename account
   */
  rename(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error('Account name cannot be empty');
    }
    this.name = newName.trim();
    this.updatedAt = new Date();
  }

  /**
   * Deactivate account
   */
  deactivate(): void {
    if (!this.isActive) {
      throw new Error('Account is already inactive');
    }
    this.isActive = false;
    this.updatedAt = new Date();
  }

  /**
   * Check if account is savings account
   */
  isSavingsAccount(): boolean {
    return this.type === AccountType.SAVINGS;
  }

  /**
   * Check if account is checking account
   */
  isCheckingAccount(): boolean {
    return this.type === AccountType.CHECKING;
  }
}
