/**
 * Get User Accounts Use Case - Application Layer
 * Retrieves all accounts for a specific user
 */

import { IAccountRepository } from '@domain/repositories/account.repository.interface';
import { AccountType } from '@domain/entities/account.entity';

export interface GetUserAccountsRequest {
  userId: string;
}

export interface AccountSummary {
  id: string;
  iban: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetUserAccountsResponse {
  accounts: AccountSummary[];
  totalAccounts: number;
  totalBalance: number;
}

export class GetUserAccountsUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(request: GetUserAccountsRequest): Promise<GetUserAccountsResponse> {
    // Get all accounts for the user
    const allAccounts = await this.accountRepository.findByUserId(request.userId);

    // Filter to only active accounts
    const activeAccounts = allAccounts.filter(account => account.isActive);

    // Calculate total balance across active accounts
    const totalBalance = activeAccounts.reduce((sum, account) => sum + account.balance, 0);

    // Map to response format
    const accountSummaries: AccountSummary[] = activeAccounts.map(account => ({
      id: account.id,
      iban: account.iban,
      name: account.name,
      type: account.type,
      balance: account.balance,
      currency: account.currency,
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));

    return {
      accounts: accountSummaries,
      totalAccounts: activeAccounts.length,
      totalBalance,
    };
  }
}
