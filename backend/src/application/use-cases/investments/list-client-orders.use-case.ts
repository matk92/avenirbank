import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { StockOrderStatusEnum, StockOrderTypeOrmEntity } from '@infrastructure/database/entities/stock-order.typeorm.entity';
import { StockTypeOrmEntity } from '@infrastructure/database/entities/stock.typeorm.entity';

export type ClientOrderDto = {
  id: string;
  side: 'buy' | 'sell';
  stockSymbol: string;
  quantity: number;
  limitPrice: number;
  fees: number;
  status: 'pending' | 'executed' | 'cancelled';
  createdAt: string;
};

@Injectable()
export class ListClientOrdersUseCase {
  constructor(
    @InjectRepository(StockOrderTypeOrmEntity)
    private readonly orders: Repository<StockOrderTypeOrmEntity>,
    @InjectRepository(StockTypeOrmEntity)
    private readonly stocks: Repository<StockTypeOrmEntity>,
  ) {}

  async execute(userId: string): Promise<ClientOrderDto[]> {
    const rows = await this.orders.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    if (rows.length === 0) return [];

    const stockIds = Array.from(new Set(rows.map((o) => o.stockId)));
    const stocks = await this.stocks.find({ where: { id: In(stockIds) } });
    const symbolById = new Map(stocks.map((s) => [s.id, s.symbol]));

    return rows.map((o) => ({
      id: o.id,
      side: o.side === 'BUY' ? 'buy' : 'sell',
      stockSymbol: symbolById.get(o.stockId) ?? 'UNK',
      quantity: o.quantity,
      limitPrice: o.limitPriceCents / 100,
      fees: o.feeCents / 100,
      status:
        o.status === StockOrderStatusEnum.CANCELLED
          ? 'cancelled'
          : o.status === StockOrderStatusEnum.FILLED
            ? 'executed'
            : 'pending',
      createdAt: o.createdAt.toISOString(),
    }));
  }
}


