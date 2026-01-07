import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockTypeOrmEntity } from '@infrastructure/database/entities/stock.typeorm.entity';
import { StockHoldingTypeOrmEntity } from '@infrastructure/database/entities/stock-holding.typeorm.entity';

@Injectable()
export class DeleteStockUseCase {
  constructor(
    @InjectRepository(StockTypeOrmEntity)
    private readonly stocks: Repository<StockTypeOrmEntity>,
    @InjectRepository(StockHoldingTypeOrmEntity)
    private readonly holdings: Repository<StockHoldingTypeOrmEntity>,
  ) {}

  async execute(stockId: string): Promise<void> {
    if (!stockId) {
      throw new BadRequestException('Stock id manquant');
    }

    const stock = await this.stocks.findOne({ where: { id: stockId } });
    if (!stock) {
      throw new NotFoundException('Action introuvable');
    }

    const ownersCountRaw = await this.holdings
      .createQueryBuilder('h')
      .select('COUNT(*)', 'count')
      .where('h.stockId = :stockId', { stockId })
      .andWhere('h.quantity > 0')
      .getRawOne<{ count: string }>();
    const ownersCount = Number(ownersCountRaw?.count ?? 0);
    if (ownersCount > 0) {
      throw new BadRequestException('Impossible de supprimer : des clients possèdent cette action');
    }

    await this.stocks.delete(stockId);
  }
}


