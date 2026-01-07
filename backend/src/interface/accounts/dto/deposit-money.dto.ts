/**
 * Deposit Money DTO - Interface Layer
 * Validation for money deposit requests
 */

import { IsNumber, Min, Max } from 'class-validator';

export class DepositMoneyDto {
  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Deposit amount must be at least 0.01 EUR' })
  @Max(1000000, { message: 'Deposit amount cannot exceed 1,000,000 EUR' })
  amount!: number;
}
