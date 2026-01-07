import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { GenerateVerificationTokenUseCase } from '../../application/use-cases/email-verification/generate-verification-token.use-case';
import { ConfirmEmailUseCase } from '../../application/use-cases/email-verification/confirm-email.use-case';
import { EmailService } from '../../infrastructure/services/email.service';
import { UserTypeOrmEntity } from '../../infrastructure/database/entities/user.typeorm.entity';
import { UserPostgresRepository } from '../../infrastructure/database/repositories/user.postgres.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserTypeOrmEntity]),
    ConfigModule
  ],
  providers: [
    UserPostgresRepository,
    GenerateVerificationTokenUseCase,
    ConfirmEmailUseCase,
    EmailService,
  ],
  exports: [
    UserPostgresRepository,
    GenerateVerificationTokenUseCase,
    ConfirmEmailUseCase,
    EmailService,
  ],
})
export class EmailVerificationModule {}
