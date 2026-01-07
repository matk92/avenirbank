/**
 * Transfer To Client Main Account Use Case - Application Layer
 * Transfers money from one of the current user's accounts to the recipient client's main account.
 */

import { IAccountRepository } from '@domain/repositories/account.repository.interface';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { Account, AccountType } from '@domain/entities/account.entity';

export interface TransferToClientMainRequest {
  fromAccountId: string;
  recipientEmail: string;
  amount: number;
  reference?: string;
  userId: string;
}

export interface TransferToClientMainResponse {
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
    recipientEmail: string;
  };
}

export class TransferToClientMainUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: TransferToClientMainRequest): Promise<TransferToClientMainResponse> {
    const recipientEmail = (request.recipientEmail ?? '').trim().toLowerCase();

    if (!recipientEmail) {
      throw new Error('Recipient email is required');
    }

    if (request.amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    if (request.amount > 100000) {
      throw new Error('Transfer amount cannot exceed 100,000 EUR per transaction');
    }

    const fromAccount = await this.accountRepository.findById(request.fromAccountId);
    if (!fromAccount) {
      throw new Error('Source account not found');
    }

    if (fromAccount.userId !== request.userId) {
      throw new Error('Unauthorized: Source account does not belong to user');
    }

    if (!fromAccount.isActive) {
      throw new Error('Source account is not active');
    }

    const recipientUser = await this.userRepository.findByEmail(recipientEmail);
    if (!recipientUser) {
      throw new Error('Recipient not found');
    }

    if (recipientUser.id === request.userId) {
      throw new Error('Cannot transfer to yourself');
    }

    const recipientAccounts = await this.accountRepository.findByUserId(recipientUser.id);
    const toAccount = pickMainAccount(recipientAccounts);
    if (!toAccount) {
      throw new Error('Recipient has no active account');
    }

    if (toAccount.id === fromAccount.id) {
      throw new Error('Cannot transfer to the same account');
    }

    if (!toAccount.isActive) {
      throw new Error('Destination account is not active');
    }

    if (fromAccount.currency !== toAccount.currency) {
      throw new Error('Currency mismatch between accounts');
    }

    if (fromAccount.balance < request.amount) {
      throw new Error('Insufficient funds in source account');
    }

    fromAccount.debit(request.amount);
    toAccount.credit(request.amount);

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
        reference:
          request.reference || `Transfer from ${fromAccount.iban} to main account of ${recipientEmail}`,
        timestamp: new Date(),
        recipientEmail,
      },
    };
  }
}

function pickMainAccount(accounts: Account[]): Account | null {
  const active = accounts.filter((a) => a.isActive);
  if (active.length === 0) return null;

  const activeChecking = active
    .filter((a) => a.type === AccountType.CHECKING)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  if (activeChecking.length > 0) return activeChecking[0];

  return active.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
}
