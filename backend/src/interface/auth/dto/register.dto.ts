import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'firstName must be a string' })
  @MinLength(2, { message: 'firstName must be at least 2 characters' })
  @MaxLength(50, { message: 'firstName must not exceed 50 characters' })
  firstName!: string;

  @IsString({ message: 'lastName must be a string' })
  @MinLength(2, { message: 'lastName must be at least 2 characters' })
  @MaxLength(50, { message: 'lastName must not exceed 50 characters' })
  lastName!: string;

  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  @IsString({ message: 'password must be a string' })
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(100, { message: 'password must not exceed 100 characters' })
  password!: string;
}
