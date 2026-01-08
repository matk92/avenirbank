import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavingsRateTypeOrmEntity } from '@infrastructure/database/entities/savings-rate.typeorm.entity';
import { GetCurrentSavingsRateUseCase } from '@application/use-cases/savings/get-current-savings-rate.use-case';
import { SavingsRateController } from './savings-rate.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SavingsRateTypeOrmEntity])],
  controllers: [SavingsRateController],
  providers: [GetCurrentSavingsRateUseCase],
})
export class SavingsModule {}