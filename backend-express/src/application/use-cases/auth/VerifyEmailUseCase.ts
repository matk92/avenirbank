import { User } from '@domain/entities/User';
import { IUserRepository } from '@domain/repositories/IUserRepository';

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  user: User;
  message: string;
}

export class VerifyEmailUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(request: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    // Find user by verification token
    const user = await this.userRepository.findByEmailVerificationToken(request.token);
    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    // Check if email is already verified
    if (user.isEmailVerified()) {
      throw new Error('Email is already verified');
    }

    // Verify email
    user.verifyEmail();

    // Save updated user
    const updatedUser = await this.userRepository.update(user);

    return {
      user: updatedUser,
      message: 'Email verified successfully'
    };
  }
}
