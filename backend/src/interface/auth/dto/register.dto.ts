import { IsEmail, IsString } from 'class-validator';
import { IsPersonName, IsStrongPassword } from '@interface/shared/validators/common-validators';

export class RegisterDto {
  @IsString({ message: 'firstName must be a string' })
  @IsPersonName({ message: 'firstName must be between 2 and 50 characters' })
  firstName!: string;

  @IsString({ message: 'lastName must be a string' })
  @IsPersonName({ message: 'lastName must be between 2 and 50 characters' })
  lastName!: string;

  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  @IsString({ message: 'password must be a string' })
  @IsStrongPassword({ message: 'password must be between 8 and 100 characters' })
  password!: string;
}
