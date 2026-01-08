import { v4 as uuidv4 } from 'uuid';
import { SavingsRate } from '@domain/entities/SavingsRate';
import { SavingsRateModel } from '@infrastructure/database/mongodb/schemas/SavingsRateSchema';
import { UserModel } from '@infrastructure/database/mongodb/schemas/UserSchema';
import { AccountModel } from '@infrastructure/database/mongodb/schemas/AccountSchema';
import { UserRole } from '@domain/entities/User';
import { AccountType } from '@domain/entities/Account';

export interface SetSavingsRateCommand {
  rate: number;
  effectiveDate: Date;
  setBy: string;
}

export class SetSavingsRateUseCase {
  async execute(command: SetSavingsRateCommand): Promise<SavingsRate> {
    const director = await UserModel.findById(command.setBy);
    if (!director || director.role !== UserRole.DIRECTOR) {
      throw new Error('Director not found');
    }

    const domainEntity = new SavingsRate(
      uuidv4(),
      command.rate,
      command.effectiveDate,
      command.setBy,
    );

    await SavingsRateModel.create({
      _id: domainEntity.id,
      rate: domainEntity.rate,
      effectiveDate: domainEntity.effectiveDate,
      setBy: domainEntity.setBy,
      createdAt: domainEntity.createdAt,
    });

    await this.notifyClientsWithSavingsAccounts(command.rate);

    return domainEntity;
  }

  private async notifyClientsWithSavingsAccounts(newRate: number): Promise<void> {
    const savingsAccounts = await AccountModel.find({
      type: AccountType.SAVINGS,
    });

    const uniqueUserIds = Array.from(new Set(savingsAccounts.map(acc => acc.userId)));

    console.log(`Notifying ${uniqueUserIds.length} clients about new savings rate: ${newRate}%`);
  }
}
