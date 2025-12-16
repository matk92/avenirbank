import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';
import { UserPostgresRepository } from '@infrastructure/database/repositories/user.postgres.repository';
import { UserTypeOrmEntity } from '@infrastructure/database/entities/user.typeorm.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserTypeOrmEntity])],
  controllers: [AuthController],
  providers: [UserPostgresRepository, RegisterUseCase, LoginUseCase],
})
export class AuthModule {}
