import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SavingsRate } from '@domain/entities/savings-rate.entity';
import { SavingsRateTypeOrmEntity } from '@infrastructure/database/entities/savings-rate.typeorm.entity';
import { UserTypeOrmEntity, UserRoleEnum } from '@infrastructure/database/entities/user.typeorm.entity';
import { AccountTypeOrmEntity } from '@infrastructure/database/entities/account.typeorm.entity';
import { AccountType } from '@domain/entities/account.entity';
import { NotificationsService } from '@interface/notifications/notifications.service';

export interface SetSavingsRateCommand {
  rate: number;
  effectiveDate: Date;
  setBy: string;
}

@Injectable()
export class SetSavingsRateUseCase {
  constructor(
    @InjectRepository(SavingsRateTypeOrmEntity)
    private readonly savingsRateRepository: Repository<SavingsRateTypeOrmEntity>,
    @InjectRepository(UserTypeOrmEntity)
    private readonly userRepository: Repository<UserTypeOrmEntity>,
    @InjectRepository(AccountTypeOrmEntity)
    private readonly accountRepository: Repository<AccountTypeOrmEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async execute(command: SetSavingsRateCommand): Promise<SavingsRate> {
    const director = await this.userRepository.findOne({ where: { id: command.setBy } });
    if (!director || director.role !== UserRoleEnum.DIRECTOR) {
      throw new NotFoundException('Director not found');
    }

    const previous = await this.savingsRateRepository.findOne({
      where: {},
      order: { effectiveDate: 'DESC' },
    });
    const previousRate = previous?.rate != null ? Number(previous.rate) : null;

    const newRate = Number(command.rate);

    const domainEntity = new SavingsRate(
      uuidv4(),
      newRate,
      command.effectiveDate,
      command.setBy,
    );

    const entity = new SavingsRateTypeOrmEntity();
    entity.id = domainEntity.id;
    entity.rate = domainEntity.rate;
    entity.effectiveDate = domainEntity.effectiveDate;
    entity.setBy = domainEntity.setBy;

    await this.savingsRateRepository.save(entity);

    await this.notifyClientsWithSavingsAccounts(newRate, previousRate);

    return domainEntity;
  }

  private async notifyClientsWithSavingsAccounts(newRate: number, previousRate: number | null): Promise<void> {
    const savingsAccounts = await this.accountRepository.find({
      where: { type: AccountType.SAVINGS, isActive: true },
    });

    const uniqueUserIds = savingsAccounts.length
      ? Array.from(new Set(savingsAccounts.map((acc) => acc.userId)))
      : (await this.userRepository.find({ where: { role: UserRoleEnum.CLIENT } })).map((u) => u.id);

    const direction =
      previousRate === null
        ? 'a été défini'
        : newRate > previousRate
          ? 'a augmenté'
          : newRate < previousRate
            ? 'a diminué'
            : 'a été confirmé';

    const message =
      previousRate === null
        ? `Le taux d'épargne ${direction}. Nouveau taux : ${newRate.toFixed(2)}% par an.`
        : `Le taux d'épargne ${direction} (${previousRate.toFixed(2)}% → ${newRate.toFixed(2)}% par an).`;

    for (const userId of uniqueUserIds) {
      await this.notificationsService.createNotification(userId, message);
    }
  }
}