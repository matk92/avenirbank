import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';
import { GenerateVerificationTokenUseCase } from '@application/use-cases/email-verification/generate-verification-token.use-case';
import { ConfirmEmailUseCase } from '@application/use-cases/email-verification/confirm-email.use-case';
import { UserTypeOrmEntity } from '@infrastructure/database/entities/user.typeorm.entity';
import { UserPostgresRepository } from '@infrastructure/database/repositories/user.postgres.repository';
import { EmailService } from '@infrastructure/services/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserTypeOrmEntity]),
    ConfigModule
  ],
  controllers: [AuthController],
  providers: [
    UserPostgresRepository,
    EmailService,
    RegisterUseCase, 
    LoginUseCase,
    GenerateVerificationTokenUseCase,
    ConfirmEmailUseCase
  ],
  exports: []
})
export class AuthModule {}
