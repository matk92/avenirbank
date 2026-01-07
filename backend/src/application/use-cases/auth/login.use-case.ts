import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { compare } from 'bcrypt';
import { UserPostgresRepository } from '@infrastructure/database/repositories/user.postgres.repository';
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

@Injectable()
export class LoginUseCase {
  constructor(private readonly userRepository: UserPostgresRepository) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    this.validateInput(input);

    // Find user by email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Compare passwords
    const isPasswordValid = await compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    
    // Check if email is verified
    if (!user.isEmailConfirmed) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    return { user };
  }

  private validateInput(input: LoginInput): void {
    if (!input.email || !input.password) {
      throw new BadRequestException('Email and password are required');
    }

    if (input.email.length > 255) {
      throw new BadRequestException('Email is too long');
    }

    if (input.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
  }
}
