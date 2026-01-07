import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum DirectorAccountTypeDto {
  CHECKING = 'checking',
  SAVINGS = 'savings',
}

export enum DirectorAccountStatusDto {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

export class CreateDirectorAccountDto {
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsEnum(DirectorAccountTypeDto)
  accountType!: DirectorAccountTypeDto;

  @IsNumber()
  @Min(0)
  balance!: number;

  @IsEnum(DirectorAccountStatusDto)
  @IsOptional()
  status?: DirectorAccountStatusDto;

  @IsNumber()
  @Min(0)
  @IsOptional()
  savingsRate?: number;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  name?: string;
}