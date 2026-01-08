import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { GetCurrentSavingsRateUseCase } from '@application/use-cases/savings/get-current-savings-rate.use-case';

@Controller('savings-rate')
export class SavingsRateController {
  constructor(private readonly getCurrentSavingsRateUseCase: GetCurrentSavingsRateUseCase) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getCurrentRate() {
    const rate = await this.getCurrentSavingsRateUseCase.execute();
    if (!rate) {
      return { rate: null };
    }

    return {
      id: rate.id,
      rate: rate.rate,
      effectiveDate: rate.effectiveDate.toISOString(),
      setBy: rate.setBy,
    };
  }
}