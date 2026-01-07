/**
 * Transfer To Client Main DTO - Interface Layer
 * Validation for transfer-to-client-main requests
 */

import { IsEmail, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class TransferToClientMainDto {
  @IsUUID(4, { message: 'From account ID must be a valid UUID' })
  fromAccountId!: string;

  @IsEmail({}, { message: 'Recipient email must be a valid email address' })
  recipientEmail!: string;

  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(0.01, { message: 'Transfer amount must be at least 0.01 EUR' })
  @Max(100000, { message: 'Transfer amount cannot exceed 100,000 EUR per transaction' })
  amount!: number;

  @IsOptional()
  @IsString()
  reference?: string;
}
