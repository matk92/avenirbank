import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { IEmailService } from '../../interfaces/email-service.interface';

@Injectable()
export class GenerateVerificationTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
  ) {}

  /**
   * Generate a verification token for a user and send verification email
   * @param userId The ID of the user to generate a token for
   */
  async execute(userId: string): Promise<void> {
    // Get the user from the repository
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if email is already confirmed
    if (user.isEmailConfirmed) {
      throw new Error('Email already confirmed');
    }

    // Generate a secure random token
    const generateToken = () => randomBytes(32).toString('hex');
    
    // Update user with new token
    user.generateEmailConfirmationToken(generateToken);
    
    // Save the updated user
    await this.userRepository.save(user);
    
    // Send verification email
    if (!user.emailConfirmationToken) {
      throw new Error('Email confirmation token not generated');
    }
    
    await this.emailService.sendVerificationEmail(
      user.email,
      user.emailConfirmationToken,
      `${user.firstName} ${user.lastName}`,
    );
  }
}
