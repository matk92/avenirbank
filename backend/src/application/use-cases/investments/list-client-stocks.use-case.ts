import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockTypeOrmEntity } from '@infrastructure/database/entities/stock.typeorm.entity';

export type ClientStockDto = {
  symbol: string;
  name: string;
  lastPrice: number;
  currency: 'EUR';
};

@Injectable()
export class ListClientStocksUseCase {
  constructor(
    @InjectRepository(StockTypeOrmEntity)
    private readonly stocks: Repository<StockTypeOrmEntity>,
  ) {}

  async execute(): Promise<ClientStockDto[]> {
    const rows = await this.stocks.find({
      where: { isAvailable: true },
      order: { symbol: 'ASC' },
    });
    return rows.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      lastPrice: s.lastPriceCents / 100,
      currency: 'EUR',
    }));
  }
}



