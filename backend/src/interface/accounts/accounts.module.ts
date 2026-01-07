import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@interface/auth/auth.module';
import { AccountsController } from './accounts.controller';
import { CreateAccountUseCase } from '@application/use-cases/accounts/create-account.use-case';
import { DepositMoneyUseCase } from '@application/use-cases/accounts/deposit-money.use-case';
import { TransferMoneyUseCase } from '@application/use-cases/accounts/transfer-money.use-case';
import { GetUserAccountsUseCase } from '@application/use-cases/accounts/get-user-accounts.use-case';
import { RenameAccountUseCase } from '@application/use-cases/accounts/rename-account.use-case';
import { AccountPostgresRepository } from '@infrastructure/database/repositories/account.postgres.repository';
import { UserPostgresRepository } from '@infrastructure/database/repositories/user.postgres.repository';
import { AccountTypeOrmEntity } from '@infrastructure/database/entities/account.typeorm.entity';
import { UserTypeOrmEntity } from '@infrastructure/database/entities/user.typeorm.entity';
import { IAccountRepository } from '@domain/repositories/account.repository.interface';
import { IUserRepository } from '@domain/repositories/user.repository.interface';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccountTypeOrmEntity, UserTypeOrmEntity]),
    AuthModule,
  ],
  controllers: [AccountsController],
  providers: [
    AccountPostgresRepository,
    UserPostgresRepository,
    {
      provide: 'IAccountRepository',
      useClass: AccountPostgresRepository,
    },
    {
      provide: 'IUserRepository',
      useClass: UserPostgresRepository,
    },
    {
      provide: CreateAccountUseCase,
      useFactory: (accountRepo: IAccountRepository, userRepo: IUserRepository) => 
        new CreateAccountUseCase(accountRepo, userRepo),
      inject: ['IAccountRepository', 'IUserRepository'],
    },
    {
      provide: DepositMoneyUseCase,
      useFactory: (accountRepo: IAccountRepository) => 
        new DepositMoneyUseCase(accountRepo),
      inject: ['IAccountRepository'],
    },
    {
      provide: TransferMoneyUseCase,
      useFactory: (accountRepo: IAccountRepository) => 
        new TransferMoneyUseCase(accountRepo),
      inject: ['IAccountRepository'],
    },
    {
      provide: GetUserAccountsUseCase,
      useFactory: (accountRepo: IAccountRepository) => 
        new GetUserAccountsUseCase(accountRepo),
      inject: ['IAccountRepository'],
    },
    {
      provide: RenameAccountUseCase,
      useFactory: (accountRepo: IAccountRepository) => 
        new RenameAccountUseCase(accountRepo),
      inject: ['IAccountRepository'],
    },
  ],
  exports: [AccountPostgresRepository],
})
export class AccountsModule {}
