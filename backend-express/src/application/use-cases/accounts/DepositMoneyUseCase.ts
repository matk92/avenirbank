import { Account } from '@domain/entities/Account';
import { Transaction, TransactionType } from '@domain/entities/Transaction';
import { Money } from '@domain/value-objects/Money';
import { IAccountRepository } from '@domain/repositories/IAccountRepository';
import { ITransactionRepository } from '@domain/repositories/ITransactionRepository';

export interface DepositMoneyRequest {
  accountId: string;
  amount: number;
  description?: string;
}

export interface DepositMoneyResponse {
  account: Account;
  transaction: Transaction;
}

export class DepositMoneyUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly transactionRepository: ITransactionRepository
  ) {}

  public async execute(request: DepositMoneyRequest): Promise<DepositMoneyResponse> {
    // Validate amount
    const money = Money.create(request.amount);
    
    // Find account
    const account = await this.accountRepository.findById(request.accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Credit account
    account.credit(money.getAmount());

    // Create transaction record
    const transaction = Transaction.create({
      toAccountId: request.accountId,
      amount: money.getAmount(),
      type: TransactionType.DEPOSIT,
      description: request.description || `Deposit of ${money.toString()}`
    });

    // Save both account and transaction
    const [updatedAccount, savedTransaction] = await Promise.all([
      this.accountRepository.update(account),
      this.transactionRepository.create(transaction)
    ]);

    return {
      account: updatedAccount,
      transaction: savedTransaction
    };
  }
}
