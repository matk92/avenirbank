import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@interface/auth/jwt-auth.guard';
import { RolesGuard } from '@interface/auth/roles.guard';
import { Roles } from '@interface/auth/roles.decorator';
import { UserRole } from '@domain/entities/user.entity';
import { CurrentUser } from '@infrastructure/decorators/current-user.decorator';
import { SetSavingsRateUseCase } from '@application/use-cases/savings/set-savings-rate.use-case';
import { GetCurrentSavingsRateUseCase } from '@application/use-cases/savings/get-current-savings-rate.use-case';
import { SetSavingsRateDto } from './dto/set-savings-rate.dto';

@Controller('director/savings-rate')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DIRECTOR)
export class DirectorSavingsController {
  constructor(
    private readonly setSavingsRateUseCase: SetSavingsRateUseCase,
    private readonly getCurrentSavingsRateUseCase: GetCurrentSavingsRateUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getCurrentRate() {
    const rate = await this.getCurrentSavingsRateUseCase.execute();

    if (!rate) {
      return {
        rate: null,
        message: 'No savings rate has been set yet',
      };
    }

    return {
      id: rate.id,
      rate: rate.rate,
      effectiveDate: rate.effectiveDate.toISOString(),
      setBy: rate.setBy,
      createdAt: rate.createdAt.toISOString(),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async setSavingsRate(
    @CurrentUser() user: { id: string },
    @Body() dto: SetSavingsRateDto,
  ) {
    const effectiveDate = dto.effectiveDate ? new Date(dto.effectiveDate) : new Date();

    const rate = await this.setSavingsRateUseCase.execute({
      rate: dto.rate,
      effectiveDate,
      setBy: user.id,
    });

    return {
      id: rate.id,
      rate: rate.rate,
      effectiveDate: rate.effectiveDate.toISOString(),
      setBy: rate.setBy,
      createdAt: rate.createdAt.toISOString(),
      message: `Savings rate set to ${rate.rate}%. All clients with savings accounts have been notified.`,
    };
  }
}
