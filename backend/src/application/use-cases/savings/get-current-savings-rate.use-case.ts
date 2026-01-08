import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavingsRate } from '@domain/entities/savings-rate.entity';
import { SavingsRateTypeOrmEntity } from '@infrastructure/database/entities/savings-rate.typeorm.entity';

@Injectable()
export class GetCurrentSavingsRateUseCase {
  constructor(
    @InjectRepository(SavingsRateTypeOrmEntity)
    private readonly savingsRateRepository: Repository<SavingsRateTypeOrmEntity>,
  ) {}

  async execute(): Promise<SavingsRate | null> {
    const entity = await this.savingsRateRepository.findOne({
      where: {},
      order: { effectiveDate: 'DESC' },
    });

    if (!entity) {
      return null;
    }

    return new SavingsRate(
      entity.id,
      entity.rate,
      entity.effectiveDate,
      entity.setBy,
    );
  }
}
