import { Injectable } from '@nestjs/common';
import { UserPostgresRepository } from '../../../infrastructure/database/repositories/user.postgres.repository';

@Injectable()
export class ConfirmEmailUseCase {
  constructor(
    private readonly userRepository: UserPostgresRepository,
  ) {}

  /**
   * Confirm a user's email using a verification token
   * @param token The verification token
   */
  async execute(token: string): Promise<void> {
    // Find user by token
    const user = await this.userRepository.findByEmailConfirmationToken(token);
    if (!user) {
      throw new Error('Invalid verification token');
    }

    // Confirm email with token
    user.confirmEmailWithToken(token);
    
    // Save the updated user
    await this.userRepository.save(user);
  }
}
