import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { StockTypeOrmEntity } from '@infrastructure/database/entities/stock.typeorm.entity';

export interface CreateStockInput {
  symbol: string;
  name: string;
  currentPrice: number;
  isAvailable: boolean;
}

export interface CreateStockOutput {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  isAvailable: boolean;
  createdAt: Date;
  lastModified: Date;
  ownedByClients: number;
}

@Injectable()
export class CreateStockUseCase {
  constructor(
    @InjectRepository(StockTypeOrmEntity)
    private readonly stocks: Repository<StockTypeOrmEntity>,
  ) {}

  async execute(input: CreateStockInput): Promise<CreateStockOutput> {
    const symbol = (input.symbol ?? '').trim().toUpperCase();
    const name = (input.name ?? '').trim();
    if (!symbol || symbol.length > 10) {
      throw new BadRequestException('Symbole invalide');
    }
    if (name.length < 3) {
      throw new BadRequestException('Nom invalide');
    }
    if (!Number.isFinite(input.currentPrice) || input.currentPrice <= 0) {
      throw new BadRequestException('Prix initial invalide');
    }

    const existing = await this.stocks.findOne({ where: { symbol } });
    if (existing) {
      throw new BadRequestException('Ce symbole existe déjà');
    }

    const cents = Math.round(input.currentPrice * 100);
    const entity = this.stocks.create({
      id: uuidv4(),
      symbol,
      name,
      isAvailable: Boolean(input.isAvailable),
      initialPriceCents: cents,
      lastPriceCents: cents,
    });
    const saved = await this.stocks.save(entity);

    return {
      id: saved.id,
      symbol: saved.symbol,
      name: saved.name,
      currentPrice: saved.lastPriceCents / 100,
      isAvailable: saved.isAvailable,
      createdAt: saved.createdAt,
      lastModified: saved.updatedAt,
      ownedByClients: 0,
    };
  }
}



