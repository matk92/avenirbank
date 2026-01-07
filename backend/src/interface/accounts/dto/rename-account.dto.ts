/**
 * Rename Account DTO - Interface Layer
 * Validation for account rename requests
 */

import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RenameAccountDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name!: string;
}
