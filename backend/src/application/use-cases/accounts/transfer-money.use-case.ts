/**
 * Transfer Money Use Case - Application Layer
 * Handles money transfer between accounts within the bank
 */

import { IAccountRepository } from '@domain/repositories/account.repository.interface';

export interface TransferMoneyRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  reference?: string;
  userId: string; // For authorization
}

export interface TransferMoneyResponse {
  fromAccount: {
    id: string;
    iban: string;
    name: string;
    balance: number;
    currency: string;
  };
  toAccount: {
    id: string;
    iban: string;
    name: string;
    balance: number;
    currency: string;
  };
  transfer: {
    amount: number;
    reference: string;
    timestamp: Date;
  };
}

export class TransferMoneyUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(request: TransferMoneyRequest): Promise<TransferMoneyResponse> {
    // Validate amount
    if (request.amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    if (request.amount > 100000) {
      throw new Error('Transfer amount cannot exceed 100,000 EUR per transaction');
    }

    // Validate accounts are different
    if (request.fromAccountId === request.toAccountId) {
      throw new Error('Cannot transfer to the same account');
    }

    // Find both accounts
    const [fromAccount, toAccount] = await Promise.all([
      this.accountRepository.findById(request.fromAccountId),
      this.accountRepository.findById(request.toAccountId),
    ]);

    if (!fromAccount) {
      throw new Error('Source account not found');
    }

    if (!toAccount) {
      throw new Error('Destination account not found');
    }

    // Verify source account ownership
    if (fromAccount.userId !== request.userId) {
      throw new Error('Unauthorized: Source account does not belong to user');
    }

    // Verify both accounts are active
    if (!fromAccount.isActive) {
      throw new Error('Source account is not active');
    }

    if (!toAccount.isActive) {
      throw new Error('Destination account is not active');
    }

    // Verify sufficient funds
    if (fromAccount.balance < request.amount) {
      throw new Error('Insufficient funds in source account');
    }

    // Verify currency compatibility (both must be EUR for now)
    if (fromAccount.currency !== toAccount.currency) {
      throw new Error('Currency mismatch between accounts');
    }

    // Perform transfer (debit from source, credit to destination)
    fromAccount.debit(request.amount);
    toAccount.credit(request.amount);

    // Save both accounts
    const [updatedFromAccount, updatedToAccount] = await Promise.all([
      this.accountRepository.update(fromAccount),
      this.accountRepository.update(toAccount),
    ]);

    return {
      fromAccount: {
        id: updatedFromAccount.id,
        iban: updatedFromAccount.iban,
        name: updatedFromAccount.name,
        balance: updatedFromAccount.balance,
        currency: updatedFromAccount.currency,
      },
      toAccount: {
        id: updatedToAccount.id,
        iban: updatedToAccount.iban,
        name: updatedToAccount.name,
        balance: updatedToAccount.balance,
        currency: updatedToAccount.currency,
      },
      transfer: {
        amount: request.amount,
        reference: request.reference || `Transfer from ${fromAccount.iban} to ${toAccount.iban}`,
        timestamp: new Date(),
      },
    };
  }
}
