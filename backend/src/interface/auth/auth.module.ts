import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthDiagnosticController } from './auth-diagnostic.controller';
import { RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';
import { ConfirmEmailUseCase } from '@application/use-cases/email-verification/confirm-email.use-case';
import { UserPostgresRepository } from '@infrastructure/database/repositories/user.postgres.repository';
import { EmailService } from '@infrastructure/services/email.service';
import { UserTypeOrmEntity } from '@infrastructure/database/entities/user.typeorm.entity';
import { JwtStrategy } from './jwt.strategy';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { IEmailService } from '@application/use-cases/auth/register.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserTypeOrmEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-jwt-secret',
      signOptions: { expiresIn: '7d' },
    }),
    ConfigModule,
  ],
  controllers: [AuthController, AuthDiagnosticController],
  providers: [
    UserPostgresRepository,
    EmailService,
    {
      provide: 'IUserRepository',
      useClass: UserPostgresRepository,
    },
    {
      provide: 'IEmailService',
      useClass: EmailService,
    },
    {
      provide: RegisterUseCase,
      useFactory: (userRepo: IUserRepository, emailService: IEmailService) => 
        new RegisterUseCase(userRepo, emailService),
      inject: ['IUserRepository', 'IEmailService'],
    },
    {
      provide: LoginUseCase,
      useFactory: (userRepo: IUserRepository) => 
        new LoginUseCase(userRepo),
      inject: ['IUserRepository'],
    },
    {
      provide: ConfirmEmailUseCase,
      useFactory: (userRepo: IUserRepository) => 
        new ConfirmEmailUseCase(userRepo),
      inject: ['IUserRepository'],
    },
    JwtStrategy,
  ],
  exports: [JwtStrategy, JwtModule, PassportModule],
})
export class AuthModule {}
