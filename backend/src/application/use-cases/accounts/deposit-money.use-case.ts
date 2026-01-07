/**
 * Deposit Money Use Case - Application Layer
 * Handles money deposit to account
 */

import { IAccountRepository } from '@domain/repositories/account.repository.interface';

export interface DepositMoneyRequest {
  accountId: string;
  amount: number;
  userId: string; // For authorization
}

export interface DepositMoneyResponse {
  account: {
    id: string;
    iban: string;
    name: string;
    balance: number;
    currency: string;
    updatedAt: Date;
  };
  transaction: {
    amount: number;
    type: 'DEPOSIT';
    timestamp: Date;
  };
}

export class DepositMoneyUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(request: DepositMoneyRequest): Promise<DepositMoneyResponse> {
    // Validate amount
    if (request.amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }

    if (request.amount > 1000000) {
      throw new Error('Deposit amount cannot exceed 1,000,000 EUR');
    }

    // Find account
    const account = await this.accountRepository.findById(request.accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Verify account ownership
    if (account.userId !== request.userId) {
      throw new Error('Unauthorized: Account does not belong to user');
    }

    // Verify account is active
    if (!account.isActive) {
      throw new Error('Cannot deposit to inactive account');
    }

    // Perform deposit
    account.credit(request.amount);

    // Save updated account
    const updatedAccount = await this.accountRepository.update(account);

    return {
      account: {
        id: updatedAccount.id,
        iban: updatedAccount.iban,
        name: updatedAccount.name,
        balance: updatedAccount.balance,
        currency: updatedAccount.currency,
        updatedAt: updatedAccount.updatedAt,
      },
      transaction: {
        amount: request.amount,
        type: 'DEPOSIT',
        timestamp: new Date(),
      },
    };
  }
}
