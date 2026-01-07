import { compare } from 'bcrypt';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { User } from '@domain/entities/user.entity';

/**
 * Login Use Case - Application Layer
 * Handles user authentication business logic
 */

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  user: User;
}

export class LoginUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    this.validateInput(input);

    // Find user by email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Compare passwords
    const isPasswordValid = await compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }
    
    // Check if email is verified
    if (!user.isEmailConfirmed) {
      throw new Error('Please verify your email before logging in');
    }

    return { user };
  }

  private validateInput(input: LoginInput): void {
    if (!input.email || !input.password) {
      throw new Error('All fields are required');
    }

    if (input.email.length > 255) {
      throw new Error('Email is too long');
    }

    if (input.password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
  }
}
