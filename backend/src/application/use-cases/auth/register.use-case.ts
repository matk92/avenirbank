import { Injectable, BadRequestException } from '@nestjs/common';
import { hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole } from '@domain/entities/user.entity';
import { UserPostgresRepository } from '@infrastructure/database/repositories/user.postgres.repository';

/**
 * Register Use Case - Application Layer
 * Handles user registration business logic
 * No HTTP or database specifics here
 */

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RegisterOutput {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

@Injectable()
export class RegisterUseCase {
  constructor(private readonly userRepository: UserPostgresRepository) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    // Validate input
    this.validateInput(input);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hash(input.password, 10);

    // Create domain user
    const user = new User(
      uuidv4(),
      input.email,
      input.firstName,
      input.lastName,
      passwordHash,
      UserRole.CLIENT, // New users are always clients
    );

    // Save to repository
    const savedUser = await this.userRepository.save(user);

    // Return output
    return {
      id: savedUser.id,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
      role: savedUser.role,
    };
  }

  private validateInput(input: RegisterInput): void {
    if (!input.email || !input.password || !input.firstName || !input.lastName) {
      throw new BadRequestException('All fields are required');
    }

    if (input.email.length > 255) {
      throw new BadRequestException('Email is too long');
    }

    if (input.password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    if (input.firstName.length < 2 || input.firstName.length > 100) {
      throw new BadRequestException('First name must be between 2 and 100 characters');
    }

    if (input.lastName.length < 2 || input.lastName.length > 100) {
      throw new BadRequestException('Last name must be between 2 and 100 characters');
    }
  }
}
