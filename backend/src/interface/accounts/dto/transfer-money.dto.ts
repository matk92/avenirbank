/**
 * Transfer Money DTO - Interface Layer
 * Validation for money transfer requests
 */

import { IsString, IsNumber, IsOptional, Min, Max, IsUUID } from 'class-validator';

export class TransferMoneyDto {
  @IsUUID(4, { message: 'From account ID must be a valid UUID' })
  fromAccountId!: string;

  @IsUUID(4, { message: 'To account ID must be a valid UUID' })
  toAccountId!: string;

  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Transfer amount must be at least 0.01 EUR' })
  @Max(100000, { message: 'Transfer amount cannot exceed 100,000 EUR per transaction' })
  amount!: number;

  @IsOptional()
  @IsString()
  reference?: string;
}
