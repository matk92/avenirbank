import { IAccountRepository } from '@domain/repositories/account.repository.interface';

export interface CloseAccountRequest {
  accountId: string;
  userId: string;
  transferToAccountId?: string;
}

export interface CloseAccountResponse {
  accountId: string;
  status: 'closed';
  balanceTransferred?: number;
  transferredToAccountId?: string;
}

export class CloseAccountUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(request: CloseAccountRequest): Promise<CloseAccountResponse> {
    const account = await this.accountRepository.findById(request.accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    if (account.userId !== request.userId) {
      throw new Error('Unauthorized: Account does not belong to user');
    }

    if (!account.isActive) {
      throw new Error('Account is already closed');
    }

    let balanceTransferred = 0;
    let transferredToAccountId: string | undefined;

    if (account.balance > 0) {
      if (!request.transferToAccountId) {
        throw new Error('Account has balance. Please specify a target account for transfer.');
      }

      const targetAccount = await this.accountRepository.findById(request.transferToAccountId);
      if (!targetAccount) {
        throw new Error('Target account not found');
      }

      if (targetAccount.userId !== request.userId) {
        throw new Error('Unauthorized: Target account does not belong to user');
      }

      if (!targetAccount.isActive) {
        throw new Error('Target account is not active');
      }

      balanceTransferred = account.balance;
      account.debit(balanceTransferred);
      targetAccount.credit(balanceTransferred);
      transferredToAccountId = targetAccount.id;

      await Promise.all([
        this.accountRepository.update(account),
        this.accountRepository.update(targetAccount),
      ]);
    }

    account.isActive = false;
    await this.accountRepository.update(account);

    return {
      accountId: account.id,
      status: 'closed',
      balanceTransferred,
      transferredToAccountId,
    };
  }
}
