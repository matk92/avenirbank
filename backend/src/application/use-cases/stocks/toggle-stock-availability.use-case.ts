import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockTypeOrmEntity } from '@infrastructure/database/entities/stock.typeorm.entity';
import { ListDirectorStocksUseCase } from './list-director-stocks.use-case';

@Injectable()
export class ToggleStockAvailabilityUseCase {
  constructor(
    @InjectRepository(StockTypeOrmEntity)
    private readonly stocks: Repository<StockTypeOrmEntity>,
    private readonly listDirectorStocks: ListDirectorStocksUseCase,
  ) {}

  async execute(stockId: string, isAvailable: boolean) {
    if (!stockId) {
      throw new BadRequestException('Stock id manquant');
    }

    const stock = await this.stocks.findOne({ where: { id: stockId } });
    if (!stock) {
      throw new NotFoundException('Action introuvable');
    }
    stock.isAvailable = Boolean(isAvailable);
    await this.stocks.save(stock);

    const all = await this.listDirectorStocks.execute();
    return all.find((s) => s.id === stockId) ?? null;
  }
}



