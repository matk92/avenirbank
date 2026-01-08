import { Account } from '@domain/entities/Account';
import { Transaction, TransactionType } from '@domain/entities/Transaction';
import { Money } from '@domain/value-objects/Money';
import { IAccountRepository } from '@domain/repositories/IAccountRepository';
import { ITransactionRepository } from '@domain/repositories/ITransactionRepository';

export interface TransferMoneyRequest {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}

export interface TransferMoneyResponse {
  fromAccount: Account;
  toAccount: Account;
  transaction: Transaction;
}

export class TransferMoneyUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly transactionRepository: ITransactionRepository
  ) {}

  public async execute(request: TransferMoneyRequest): Promise<TransferMoneyResponse> {
    // Validate amount
    const money = Money.create(request.amount);
    
    // Validate different accounts
    if (request.fromAccountId === request.toAccountId) {
      throw new Error('Cannot transfer to the same account');
    }

    // Find both accounts
    const [fromAccount, toAccount] = await Promise.all([
      this.accountRepository.findById(request.fromAccountId),
      this.accountRepository.findById(request.toAccountId)
    ]);

    if (!fromAccount) {
      throw new Error('Source account not found');
    }
    if (!toAccount) {
      throw new Error('Destination account not found');
    }

    // Check sufficient funds
    if (!fromAccount.hasSufficientFunds(money.getAmount())) {
      throw new Error('Insufficient funds');
    }

    // Perform transfer (atomic operation)
    fromAccount.debit(money.getAmount());
    toAccount.credit(money.getAmount());

    // Create transaction record
    const transaction = Transaction.create({
      fromAccountId: request.fromAccountId,
      toAccountId: request.toAccountId,
      amount: money.getAmount(),
      type: TransactionType.TRANSFER,
      description: request.description || `Transfer of ${money.toString()} from ${fromAccount.getName()} to ${toAccount.getName()}`
    });

    // Save all changes atomically
    const [updatedFromAccount, updatedToAccount, savedTransaction] = await Promise.all([
      this.accountRepository.update(fromAccount),
      this.accountRepository.update(toAccount),
      this.transactionRepository.create(transaction)
    ]);

    return {
      fromAccount: updatedFromAccount,
      toAccount: updatedToAccount,
      transaction: savedTransaction
    };
  }
}
