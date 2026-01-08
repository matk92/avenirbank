import { IAccountRepository } from '@domain/repositories/IAccountRepository';

export interface CloseAccountRequest {
  accountId: string;
  userId: string;
}

export interface CloseAccountResponse {
  message: string;
}

export class CloseAccountUseCase {
  constructor(private readonly accountRepository: IAccountRepository) {}

  public async execute(request: CloseAccountRequest): Promise<CloseAccountResponse> {
    // Find account
    const account = await this.accountRepository.findById(request.accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Verify ownership
    if (account.getUserId() !== request.userId) {
      throw new Error('You can only close your own accounts');
    }

    // Check if account has balance
    if (account.getBalance() !== 0) {
      throw new Error('Cannot close account with non-zero balance. Please transfer all funds first.');
    }

    // Delete account
    await this.accountRepository.delete(request.accountId);

    return {
      message: `Account ${account.getName()} (${account.getIban()}) has been closed successfully`
    };
  }
}
