import jwt from 'jsonwebtoken';
import { ITokenService, TokenPayload } from '@application/use-cases/auth/LoginUserUseCase';

export class JwtTokenService implements ITokenService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor(secret: string, expiresIn: string = '24h') {
    this.secret = secret;
    this.expiresIn = expiresIn;
  }

  public async generateAccessToken(payload: TokenPayload): Promise<string> {
    return jwt.sign(
      payload,
      this.secret,
      { expiresIn: this.expiresIn } as jwt.SignOptions
    );
  }

  public async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.secret) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
}
