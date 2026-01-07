import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';
import { ConfirmEmailUseCase } from '@application/use-cases/email-verification/confirm-email.use-case';
import { UserPostgresRepository } from '@infrastructure/database/repositories/user.postgres.repository';
import { EmailService } from '@infrastructure/services/email.service';
import { UserTypeOrmEntity } from '@infrastructure/database/entities/user.typeorm.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserTypeOrmEntity]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
      signOptions: { expiresIn: '7d' },
    }),
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [
    UserPostgresRepository,
    EmailService,
    RegisterUseCase,
    LoginUseCase,
    ConfirmEmailUseCase,
  ],
})
export class AuthModule {}
