import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@interface/auth/auth.module';
import { RolesGuard } from '@interface/auth/roles.guard';
import { AccountTypeOrmEntity } from '@infrastructure/database/entities/account.typeorm.entity';
import { UserTypeOrmEntity } from '@infrastructure/database/entities/user.typeorm.entity';
import { SavingsRateTypeOrmEntity } from '@infrastructure/database/entities/savings-rate.typeorm.entity';
import { AccountPostgresRepository } from '@infrastructure/database/repositories/account.postgres.repository';
import { UserPostgresRepository } from '@infrastructure/database/repositories/user.postgres.repository';
import { EmailService } from '@infrastructure/services/email.service';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { IEmailService, RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { DirectorClientsController } from './director-clients.controller';
import { DirectorAccountsController } from './director-accounts.controller';
import { DirectorSavingsController } from './director-savings.controller';
import { SetSavingsRateUseCase } from '@application/use-cases/savings/set-savings-rate.use-case';
import { GetCurrentSavingsRateUseCase } from '@application/use-cases/savings/get-current-savings-rate.use-case';
import { NotificationsModule } from '@interface/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountTypeOrmEntity, UserTypeOrmEntity, SavingsRateTypeOrmEntity]),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [DirectorClientsController, DirectorAccountsController, DirectorSavingsController],
  providers: [
    RolesGuard,
    AccountPostgresRepository,
    UserPostgresRepository,
    EmailService,
    SetSavingsRateUseCase,
    GetCurrentSavingsRateUseCase,
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