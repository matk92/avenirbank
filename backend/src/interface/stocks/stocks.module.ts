import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DirectorStocksController } from './stocks.controller';
import { ClientInvestmentsController } from './client-investments.controller';
import { StockTypeOrmEntity } from '@infrastructure/database/entities/stock.typeorm.entity';
import { StockHoldingTypeOrmEntity } from '@infrastructure/database/entities/stock-holding.typeorm.entity';
import { StockOrderTypeOrmEntity } from '@infrastructure/database/entities/stock-order.typeorm.entity';
import { StockTradeTypeOrmEntity } from '@infrastructure/database/entities/stock-trade.typeorm.entity';
import { InvestmentWalletTypeOrmEntity } from '@infrastructure/database/entities/investment-wallet.typeorm.entity';
import { AccountTypeOrmEntity } from '@infrastructure/database/entities/account.typeorm.entity';
import { CreateStockUseCase } from '@application/use-cases/stocks/create-stock.use-case';
import { ListDirectorStocksUseCase } from '@application/use-cases/stocks/list-director-stocks.use-case';
import { ToggleStockAvailabilityUseCase } from '@application/use-cases/stocks/toggle-stock-availability.use-case';
import { DeleteStockUseCase } from '@application/use-cases/stocks/delete-stock.use-case';
import { ListClientStocksUseCase } from '@application/use-cases/investments/list-client-stocks.use-case';
import { PlaceStockOrderUseCase } from '@application/use-cases/investments/place-stock-order.use-case';
import { ListClientOrdersUseCase } from '@application/use-cases/investments/list-client-orders.use-case';
import { RolesGuard } from '@interface/auth/roles.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StockTypeOrmEntity,
      StockHoldingTypeOrmEntity,
      StockOrderTypeOrmEntity,
      StockTradeTypeOrmEntity,
      InvestmentWalletTypeOrmEntity,
      AccountTypeOrmEntity,
    ]),
  ],
  controllers: [DirectorStocksController, ClientInvestmentsController],
  providers: [
    RolesGuard,
    CreateStockUseCase,
    ListDirectorStocksUseCase,
    ToggleStockAvailabilityUseCase,
    DeleteStockUseCase,
    ListClientStocksUseCase,
    PlaceStockOrderUseCase,
    ListClientOrdersUseCase,
  ],
})
export class StocksModule {}
