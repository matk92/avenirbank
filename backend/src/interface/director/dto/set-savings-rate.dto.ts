import { IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';

export class SetSavingsRateDto {
  @IsNumber()
  @Min(0, { message: 'Savings rate cannot be negative' })
  @Max(100, { message: 'Savings rate cannot exceed 100%' })
  rate!: number;

  @IsOptional()
  @IsDateString()
  effectiveDate?: string;
}
