import { SavingsRate } from '@domain/entities/SavingsRate';
import { SavingsRateModel } from '@infrastructure/database/mongodb/schemas/SavingsRateSchema';

export class GetCurrentSavingsRateUseCase {
  async execute(): Promise<SavingsRate | null> {
    const entity = await SavingsRateModel.findOne()
      .sort({ effectiveDate: -1 })
      .exec();

    if (!entity) {
      return null;
    }

    return new SavingsRate(
      entity._id,
      entity.rate,
      entity.effectiveDate,
      entity.setBy,
    );
  }
}
