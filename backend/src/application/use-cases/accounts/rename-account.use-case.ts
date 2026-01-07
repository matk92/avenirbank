/**
 * Rename Account Use Case - Application Layer
 * Handles renaming of user accounts
 */

import { IAccountRepository } from '@domain/repositories/account.repository.interface';

export interface RenameAccountRequest {
  accountId: string;
  newName: string;
  userId: string; // For authorization
}

export interface RenameAccountResponse {
  account: {
    id: string;
    iban: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class RenameAccountUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(request: RenameAccountRequest): Promise<RenameAccountResponse> {
    // Validate name
    if (!request.newName || request.newName.trim().length === 0) {
      throw new Error('Account name cannot be empty');
    }

    if (request.newName.length > 100) {
      throw new Error('Account name cannot exceed 100 characters');
    }

    // Find the account
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
      throw new Error('Cannot rename inactive account');
    }

    // Update the account name
    account.name = request.newName.trim();

    // Save the updated account
    const updatedAccount = await this.accountRepository.update(account);

    return {
      account: {
        id: updatedAccount.id,
        iban: updatedAccount.iban,
        name: updatedAccount.name,
        type: updatedAccount.type,
        balance: updatedAccount.balance,
        currency: updatedAccount.currency,
        isActive: updatedAccount.isActive,
        createdAt: updatedAccount.createdAt,
        updatedAt: updatedAccount.updatedAt,
      },
    };
  }
}
