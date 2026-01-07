import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@interface/auth/auth.module';
import { UsersModule } from '@interface/users/users.module';
import { AccountsModule } from '@interface/accounts/accounts.module';
import { TransactionsModule } from '@interface/transactions/transactions.module';
import { SavingsModule } from '@interface/savings/savings.module';
import { StocksModule } from '@interface/stocks/stocks.module';
import { LoansModule } from '@interface/loans/loans.module';
import { MessagingModule } from '@interface/messaging/messaging.module';
import { NotificationsModule } from '@interface/notifications/notifications.module';
import { DirectorModule } from '@interface/director/director.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'postgres',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'avenir',
      password: process.env.DATABASE_PASSWORD || 'password',
      database: process.env.DATABASE_NAME || 'avenirbank',
      entities: ['dist/**/*.typeorm.entity{.ts,.js}'],
      migrations: ['dist/infrastructure/database/migrations/*{.ts,.js}'],
      migrationsRun: true,
      synchronize: false,
      logging: process.env.NODE_ENV === 'development',
      retryAttempts: 5,
      retryDelay: 3000,
    }),
    AuthModule,
    UsersModule,
    AccountsModule,
    TransactionsModule,
    SavingsModule,
    StocksModule,
    DirectorModule,
    LoansModule,
    MessagingModule,
    NotificationsModule,
  ],
})
export class AppModule {}
