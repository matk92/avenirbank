import bcrypt from 'bcrypt';
import { IPasswordService } from '@application/use-cases/auth/LoginUserUseCase';

export class BcryptPasswordService implements IPasswordService {
  private readonly saltRounds: number = 10;

  public async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  public async compare(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}
