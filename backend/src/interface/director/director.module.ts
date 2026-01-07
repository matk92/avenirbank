import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@interface/auth/auth.module';
import { RolesGuard } from '@interface/auth/roles.guard';
import { AccountTypeOrmEntity } from '@infrastructure/database/entities/account.typeorm.entity';
import { UserTypeOrmEntity } from '@infrastructure/database/entities/user.typeorm.entity';
import { AccountPostgresRepository } from '@infrastructure/database/repositories/account.postgres.repository';
import { UserPostgresRepository } from '@infrastructure/database/repositories/user.postgres.repository';
import { EmailService } from '@infrastructure/services/email.service';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { IEmailService, RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { DirectorClientsController } from './director-clients.controller';
import { DirectorAccountsController } from './director-accounts.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AccountTypeOrmEntity, UserTypeOrmEntity]), AuthModule],
  controllers: [DirectorClientsController, DirectorAccountsController],
  providers: [
    RolesGuard,
    AccountPostgresRepository,
    UserPostgresRepository,
    EmailService,
    {
      provide: 'IAccountRepository',
      useClass: AccountPostgresRepository,
    },
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
  ],
})
export class DirectorModule {}