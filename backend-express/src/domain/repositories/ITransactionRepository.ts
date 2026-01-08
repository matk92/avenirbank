import { Transaction } from '../entities/Transaction';

export interface ITransactionRepository {
  create(transaction: Transaction): Promise<Transaction>;
  findById(id: string): Promise<Transaction | null>;
  findByAccountId(accountId: string): Promise<Transaction[]>;
  findByAccountIds(accountIds: string[]): Promise<Transaction[]>;
  findByUserId(userId: string): Promise<Transaction[]>;
}
