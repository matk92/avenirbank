import { Account, AccountProps } from '@domain/entities/Account';
import { IAccountRepository } from '@domain/repositories/IAccountRepository';
import { AccountModel, IAccountDocument } from '../schemas/AccountSchema';

export class MongoAccountRepository implements IAccountRepository {
  public async create(account: Account): Promise<Account> {
    const accountProps = account.toPlainObject();
    const accountDoc = new AccountModel({
      ...accountProps,
      _id: undefined // Let MongoDB generate the ID
    });
    
    const savedDoc = await accountDoc.save();
    return this.mapToEntity(savedDoc);
  }

  public async findById(id: string): Promise<Account | null> {
    const accountDoc = await AccountModel.findById(id);
    return accountDoc ? this.mapToEntity(accountDoc) : null;
  }

  public async findByUserId(userId: string): Promise<Account[]> {
    const accountDocs = await AccountModel.find({ userId }).sort({ createdAt: -1 });
    return accountDocs.map((doc: IAccountDocument) => this.mapToEntity(doc));
  }

  public async findByIban(iban: string): Promise<Account | null> {
    const accountDoc = await AccountModel.findOne({ iban: iban.toUpperCase() });
    return accountDoc ? this.mapToEntity(accountDoc) : null;
  }

  public async update(account: Account): Promise<Account> {
    const accountProps = account.toPlainObject();
    const updatedDoc = await AccountModel.findByIdAndUpdate(
      accountProps.id,
      {
        userId: accountProps.userId,
        name: accountProps.name,
        iban: accountProps.iban,
        balance: accountProps.balance,
        type: accountProps.type,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!updatedDoc) {
      throw new Error('Account not found');
    }

    return this.mapToEntity(updatedDoc);
  }

  public async delete(id: string): Promise<void> {
    const result = await AccountModel.findByIdAndDelete(id);
    if (!result) {
      throw new Error('Account not found');
    }
  }

  public async existsByIban(iban: string): Promise<boolean> {
    const count = await AccountModel.countDocuments({ iban: iban.toUpperCase() });
    return count > 0;
  }

  private mapToEntity(doc: IAccountDocument): Account {
    const props: AccountProps = {
      id: (doc as any)._id.toString(),
      userId: doc.userId,
      name: doc.name,
      iban: doc.iban,
      balance: doc.balance,
      type: doc.type,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    };

    return Account.fromPersistence(props);
  }
}
