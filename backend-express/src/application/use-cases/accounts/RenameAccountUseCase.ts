import { Account } from '@domain/entities/Account';
import { IAccountRepository } from '@domain/repositories/IAccountRepository';

export interface RenameAccountRequest {
  accountId: string;
  userId: string;
  newName: string;
}

export interface RenameAccountResponse {
  account: Account;
}

export class RenameAccountUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  public async execute(request: RenameAccountRequest): Promise<RenameAccountResponse> {
    // Validate new name
    if (!request.newName || request.newName.trim().length < 2) {
      throw new Error('Account name must be at least 2 characters long');
    }
    if (request.newName.trim().length > 100) {
      throw new Error('Account name must be less than 100 characters');
    }

    // Find account
    const account = await this.accountRepository.findById(request.accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Verify ownership
    if (account.getUserId() !== request.userId) {
      throw new Error('You can only rename your own accounts');
    }

    // Update name
    account.updateName(request.newName.trim());

    // Save account
    const updatedAccount = await this.accountRepository.update(account);

    return {
      account: updatedAccount
    };
  }
}
