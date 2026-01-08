import { Transaction, TransactionProps } from '@domain/entities/Transaction';
import { ITransactionRepository } from '@domain/repositories/ITransactionRepository';
import { TransactionModel, ITransactionDocument } from '../schemas/TransactionSchema';

export class MongoTransactionRepository implements ITransactionRepository {
  public async create(transaction: Transaction): Promise<Transaction> {
    const transactionProps = transaction.toPlainObject();
    const transactionDoc = new TransactionModel({
      ...transactionProps,
      _id: undefined // Let MongoDB generate the ID
    });
    
    const savedDoc = await transactionDoc.save();
    return this.mapToEntity(savedDoc);
  }

  public async findById(id: string): Promise<Transaction | null> {
    const transactionDoc = await TransactionModel.findById(id);
    return transactionDoc ? this.mapToEntity(transactionDoc) : null;
  }

  public async findByAccountId(accountId: string): Promise<Transaction[]> {
    const transactionDocs = await TransactionModel.find({
      $or: [
        { fromAccountId: accountId },
        { toAccountId: accountId }
      ]
    }).sort({ createdAt: -1 });
    
    return transactionDocs.map((doc: ITransactionDocument) => this.mapToEntity(doc));
  }

  public async findByAccountIds(accountIds: string[]): Promise<Transaction[]> {
    const transactionDocs = await TransactionModel.find({
      $or: [
        { fromAccountId: { $in: accountIds } },
        { toAccountId: { $in: accountIds } }
      ]
    }).sort({ createdAt: -1 });
    
    return transactionDocs.map((doc: ITransactionDocument) => this.mapToEntity(doc));
  }

  public async findByUserId(_userId: string): Promise<Transaction[]> {
    // This would require a join with accounts collection
    // For now, this is a placeholder - will be implemented when needed
    return [];
  }

  private mapToEntity(doc: ITransactionDocument): Transaction {
    const props: TransactionProps = {
      id: (doc as any)._id.toString(),
      ...(doc.fromAccountId && { fromAccountId: doc.fromAccountId }),
      toAccountId: doc.toAccountId,
      amount: doc.amount,
      type: doc.type,
      description: doc.description,
      createdAt: doc.createdAt
    };

    return Transaction.fromPersistence(props);
  }
}
