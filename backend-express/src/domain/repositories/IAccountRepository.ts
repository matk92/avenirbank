import { Account } from '../entities/Account';

export interface IAccountRepository {
  create(account: Account): Promise<Account>;
  findById(id: string): Promise<Account | null>;
  findByUserId(userId: string): Promise<Account[]>;
  findByIban(iban: string): Promise<Account | null>;
  update(account: Account): Promise<Account>;
  delete(id: string): Promise<void>;
  existsByIban(iban: string): Promise<boolean>;
}
