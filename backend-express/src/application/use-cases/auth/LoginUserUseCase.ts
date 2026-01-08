import { User } from '@domain/entities/User';
import { Email } from '@domain/value-objects/Email';
import { IUserRepository } from '@domain/repositories/IUserRepository';

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface LoginUserResponse {
  user: User;
  accessToken: string;
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService
  ) {}

  public async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    // Validate email format
    const email = Email.create(request.email);
    
    // Find user by email
    const user = await this.userRepository.findByEmail(email.getValue());
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await this.passwordService.compare(
      request.password,
      user.getPassword()
    );
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Check if email is verified
    if (!user.isEmailVerified()) {
      throw new Error('Please verify your email before logging in');
    }

    // Generate access token
    const accessToken = await this.tokenService.generateAccessToken({
      userId: user.getId(),
      email: user.getEmail(),
      role: user.getRole()
    });

    return {
      user,
      accessToken
    };
  }
}

// Service interfaces (will be implemented in infrastructure layer)
export interface IPasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hashedPassword: string): Promise<boolean>;
}

export interface ITokenService {
  generateAccessToken(payload: TokenPayload): Promise<string>;
  verifyAccessToken(token: string): Promise<TokenPayload>;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}
