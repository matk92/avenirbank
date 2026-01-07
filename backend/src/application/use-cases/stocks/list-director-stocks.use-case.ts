import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockTypeOrmEntity } from '@infrastructure/database/entities/stock.typeorm.entity';
import { StockHoldingTypeOrmEntity } from '@infrastructure/database/entities/stock-holding.typeorm.entity';

export type DirectorStockDto = {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  isAvailable: boolean;
  createdAt: Date;
  lastModified: Date;
  ownedByClients: number;
};

@Injectable()
export class ListDirectorStocksUseCase {
  constructor(
    @InjectRepository(StockTypeOrmEntity)
    private readonly stocks: Repository<StockTypeOrmEntity>,
    @InjectRepository(StockHoldingTypeOrmEntity)
    private readonly holdings: Repository<StockHoldingTypeOrmEntity>,
  ) {}

  async execute(): Promise<DirectorStockDto[]> {
    const stocks = await this.stocks.find({ order: { createdAt: 'DESC' } });
    if (stocks.length === 0) {
      return [];
    }

    const stockIds = stocks.map((s) => s.id);
    const holdingCountsRaw = await this.holdings
      .createQueryBuilder('h')
      .select('h.stockId', 'stockId')
      .addSelect('COUNT(*)', 'count')
      .where('h.stockId IN (:...stockIds)', { stockIds })
      .andWhere('h.quantity > 0')
      .groupBy('h.stockId')
      .getRawMany<{ stockId: string; count: string }>();

    const counts = new Map<string, number>();
    for (const row of holdingCountsRaw) {
      counts.set(row.stockId, Number(row.count));
    }

    return stocks.map((s) => ({
      id: s.id,
      symbol: s.symbol,
      name: s.name,
      currentPrice: s.lastPriceCents / 100,
      isAvailable: s.isAvailable,
      createdAt: s.createdAt,
      lastModified: s.updatedAt,
      ownedByClients: counts.get(s.id) ?? 0,
    }));
  }
}



