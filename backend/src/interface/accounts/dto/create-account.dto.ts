/**
 * Create Account DTO - Interface Layer
 * Validation for account creation requests
 */

import { IsString, IsEnum, IsOptional, IsNumber, Min, Max, Length } from 'class-validator';
import { AccountType } from '@domain/entities/account.entity';

export class CreateAccountDto {
  @IsString()
  @Length(1, 100, { message: 'Account name must be between 1 and 100 characters' })
  name!: string;

  @IsEnum(AccountType, { message: 'Account type must be either CHECKING or SAVINGS' })
  type!: AccountType;

  @IsOptional()
  @IsNumber({}, { message: 'Initial deposit must be a number' })
  @Min(0, { message: 'Initial deposit cannot be negative' })
  @Max(1000000, { message: 'Initial deposit cannot exceed 1,000,000 EUR' })
  initialDeposit?: number;
}
