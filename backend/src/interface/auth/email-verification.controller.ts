import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../infrastructure/guards/jwt-auth.guard';
import { GenerateVerificationTokenUseCase } from '../../application/use-cases/email-verification/generate-verification-token.use-case';
import { ConfirmEmailUseCase } from '../../application/use-cases/email-verification/confirm-email.use-case';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { CurrentUser } from '../../infrastructure/decorators/current-user.decorator';

@Controller('auth/email-verification')
export class EmailVerificationController {
  constructor(
    private readonly generateVerificationTokenUseCase: GenerateVerificationTokenUseCase,
    private readonly confirmEmailUseCase: ConfirmEmailUseCase,
  ) {}

  /**
   * Generate and send a new verification email to the current user
   */
  @UseGuards(JwtAuthGuard)
  @Post('send')
  async sendVerificationEmail(@CurrentUser() user: { id: string }): Promise<{ message: string }> {
    await this.generateVerificationTokenUseCase.execute(user.id);
    return { message: 'Verification email sent successfully' };
  }

  /**
   * Verify email with token
   */
  @Post('verify')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    await this.confirmEmailUseCase.execute(verifyEmailDto.token);
    return { message: 'Email verified successfully' };
  }

  /**
   * Verify email with token (GET method for email links)
   */
  @Get('verify/:token')
  async verifyEmailGet(@Param('token') token: string): Promise<{ message: string }> {
    await this.confirmEmailUseCase.execute(token);
    return { message: 'Email verified successfully' };
  }
}
