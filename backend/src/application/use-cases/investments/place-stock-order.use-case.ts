import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { StockTypeOrmEntity } from '@infrastructure/database/entities/stock.typeorm.entity';
import {
  StockOrderSideEnum,
  StockOrderStatusEnum,
  StockOrderTypeOrmEntity,
} from '@infrastructure/database/entities/stock-order.typeorm.entity';
import { StockHoldingTypeOrmEntity } from '@infrastructure/database/entities/stock-holding.typeorm.entity';
import { StockTradeTypeOrmEntity } from '@infrastructure/database/entities/stock-trade.typeorm.entity';
import { AccountTypeOrmEntity } from '@infrastructure/database/entities/account.typeorm.entity';
import { AccountType } from '@domain/entities/account.entity';

export type PlaceStockOrderInput = {
  stockSymbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  limitPrice: number;
};

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
export class PlaceStockOrderUseCase {
  private readonly feeCents = 100;
  private readonly maxInt32 = 2_147_483_647;
  private readonly maxPriceCentsInt32 = 2_000_000_000;

  constructor(private readonly dataSource: DataSource) {}

  private async findPrimaryAccount(
    accountsRepo: Repository<AccountTypeOrmEntity>,
    userId: string,
  ): Promise<AccountTypeOrmEntity> {
    const checking = await accountsRepo.findOne({
      where: { userId, isActive: true, type: AccountType.CHECKING },
      order: { createdAt: 'ASC' },
    });
    if (checking) return checking;

    const anyActive = await accountsRepo.findOne({
      where: { userId, isActive: true },
      order: { createdAt: 'ASC' },
    });
    if (anyActive) return anyActive;

    throw new BadRequestException("Aucun compte bancaire actif n'est disponible pour réaliser cette opération.");
  }

  async execute(userId: string, input: PlaceStockOrderInput): Promise<ClientOrderDto> {
    const symbol = (input.stockSymbol ?? '').trim().toUpperCase();
    const quantity = Number(input.quantity);
    const limitPrice = Number(input.limitPrice);
    const side = input.side;

    if (!symbol) throw new BadRequestException('Action manquante');
    if (!Number.isInteger(quantity) || quantity <= 0) throw new BadRequestException('Quantité invalide');
    if (!Number.isFinite(limitPrice) || limitPrice <= 0) throw new BadRequestException('Prix limite invalide');
    if (side !== 'buy' && side !== 'sell') throw new BadRequestException('Sens invalide');

    if (quantity > this.maxInt32) {
      throw new BadRequestException('Quantité trop élevée');
    }

    const limitPriceCents = Math.round(limitPrice * 100);
    if (!Number.isSafeInteger(limitPriceCents) || limitPriceCents <= 0) {
      throw new BadRequestException('Prix limite invalide');
    }
    if (limitPriceCents > this.maxPriceCentsInt32) {
      throw new BadRequestException('Prix limite trop élevé');
    }
    const feeCents = this.feeCents;

    const formatCents = (cents: bigint) => {
      const sign = cents < 0n ? '-' : '';
      const abs = cents < 0n ? -cents : cents;
      const euros = abs / 100n;
      const rest = abs % 100n;
      return `${sign}${euros.toString()}.${rest.toString().padStart(2, '0')} €`;
    };

    return await this.dataSource.transaction(async (manager) => {
      const stocksRepo = manager.getRepository(StockTypeOrmEntity);
      const ordersRepo = manager.getRepository(StockOrderTypeOrmEntity);
      const accountsRepo = manager.getRepository(AccountTypeOrmEntity);
      const holdingsRepo = manager.getRepository(StockHoldingTypeOrmEntity);

      const stock = await stocksRepo.findOne({ where: { symbol } });
      if (!stock) throw new NotFoundException('Action introuvable');
      if (side === 'buy' && !stock.isAvailable) {
        throw new ForbiddenException("Cette action n'est pas disponible à l'achat");
      }

      const userAccount = await this.findPrimaryAccount(accountsRepo, userId);

      const orderId = uuidv4();
      const now = new Date();

      if (side === 'sell' && quantity * limitPriceCents < feeCents) {
        throw new BadRequestException('Ordre trop petit pour couvrir les frais');
      }

      let holding = await holdingsRepo.findOne({ where: { userId, stockId: stock.id } });
      if (!holding) {
        holding = holdingsRepo.create({ id: uuidv4(), userId, stockId: stock.id, quantity: 0 });
        holding = await holdingsRepo.save(holding);
      }

      const order = ordersRepo.create({
        id: orderId,
        userId,
        stockId: stock.id,
        side: side === 'buy' ? StockOrderSideEnum.BUY : StockOrderSideEnum.SELL,
        status: StockOrderStatusEnum.OPEN,
        quantity,
        remainingQuantity: quantity,
        limitPriceCents,
        feeCents,
        feeCharged: false,
        reservedCashCents: '0',
        reservedQuantity: 0,
        createdAt: now,
      });

      if (side === 'buy') {
        const reserved = BigInt(quantity) * BigInt(limitPriceCents);
        const required = reserved + BigInt(feeCents);
        const available = BigInt(Math.round(userAccount.balance * 100));
        if (available < required) {
          throw new BadRequestException(
            `Solde insuffisant pour placer cet ordre. Requis: ${formatCents(required)} (frais inclus), disponible: ${formatCents(available)}.`,
          );
        }

        userAccount.balance = Number(available - required) / 100;
        order.reservedCashCents = String(reserved);
        order.feeCharged = true;
        await accountsRepo.save(userAccount);
      } else {
        const available = BigInt(Math.round(userAccount.balance * 100));
        if (available < BigInt(feeCents)) {
          throw new BadRequestException(
            `Solde insuffisant pour payer les frais de vente (${formatCents(BigInt(feeCents))}). Disponible: ${formatCents(available)}.`,
          );
        }
        if (holding.quantity < quantity) {
          throw new BadRequestException("Vous ne possédez pas assez d'actions pour vendre");
        }

        userAccount.balance = Number(available - BigInt(feeCents)) / 100;
        order.feeCharged = true;
        await accountsRepo.save(userAccount);

        holding.quantity -= quantity;
        order.reservedQuantity = quantity;
        await holdingsRepo.save(holding);
      }

      let savedOrder = await ordersRepo.save(order);

      savedOrder = await this.match(savedOrder, stock, manager);

      return {
        id: savedOrder.id,
        side: savedOrder.side === StockOrderSideEnum.BUY ? 'buy' : 'sell',
        stockSymbol: symbol,
        quantity: savedOrder.quantity,
        limitPrice: savedOrder.limitPriceCents / 100,
        fees: savedOrder.feeCents / 100,
        status:
          savedOrder.status === StockOrderStatusEnum.CANCELLED
            ? 'cancelled'
            : savedOrder.status === StockOrderStatusEnum.FILLED
              ? 'executed'
              : 'pending',
        createdAt: savedOrder.createdAt.toISOString(),
      };
    });
  }

  private async match(
    order: StockOrderTypeOrmEntity,
    stock: StockTypeOrmEntity,
    manager: any,
  ): Promise<StockOrderTypeOrmEntity> {
    const ordersRepo: Repository<StockOrderTypeOrmEntity> = manager.getRepository(StockOrderTypeOrmEntity);
    const accountsRepo: Repository<AccountTypeOrmEntity> = manager.getRepository(AccountTypeOrmEntity);
    const holdingsRepo: Repository<StockHoldingTypeOrmEntity> = manager.getRepository(StockHoldingTypeOrmEntity);
    const tradesRepo: Repository<StockTradeTypeOrmEntity> = manager.getRepository(StockTradeTypeOrmEntity);
    const stocksRepo: Repository<StockTypeOrmEntity> = manager.getRepository(StockTypeOrmEntity);

    const accountCache = new Map<string, AccountTypeOrmEntity>();
    const getAccount = async (userId: string) => {
      const cached = accountCache.get(userId);
      if (cached) return cached;
      const account = await this.findPrimaryAccount(accountsRepo, userId);
      accountCache.set(userId, account);
      return account;
    };

    while (order.remainingQuantity > 0) {
      const isBuy = order.side === StockOrderSideEnum.BUY;

      const counterparty = await ordersRepo
        .createQueryBuilder('o')
        .where('o.stockId = :stockId', { stockId: stock.id })
        .andWhere('o.id != :orderId', { orderId: order.id })
        .andWhere('o.status IN (:...statuses)', { statuses: [StockOrderStatusEnum.OPEN, StockOrderStatusEnum.PARTIALLY_FILLED] })
        .andWhere('o.side = :side', { side: isBuy ? StockOrderSideEnum.SELL : StockOrderSideEnum.BUY })
        .andWhere(isBuy ? 'o.limitPriceCents <= :limit' : 'o.limitPriceCents >= :limit', { limit: order.limitPriceCents })
        .orderBy('o.limitPriceCents', isBuy ? 'ASC' : 'DESC')
        .addOrderBy('o.createdAt', 'ASC')
        .getOne();

      if (!counterparty) {
        break;
      }

      const buyOrder = isBuy ? order : counterparty;
      const sellOrder = isBuy ? counterparty : order;
      const qty = Math.min(order.remainingQuantity, counterparty.remainingQuantity);

      const tradePriceCents = Math.round((buyOrder.limitPriceCents + sellOrder.limitPriceCents) / 2);

      const trade = tradesRepo.create({
        id: uuidv4(),
        stockId: stock.id,
        buyOrderId: buyOrder.id,
        sellOrderId: sellOrder.id,
        buyerId: buyOrder.userId,
        sellerId: sellOrder.userId,
        quantity: qty,
        priceCents: tradePriceCents,
      });
      await tradesRepo.save(trade);

      const buyerHolding = await holdingsRepo.findOne({ where: { userId: buyOrder.userId, stockId: stock.id } });
      if (!buyerHolding) {
        await holdingsRepo.save(
          holdingsRepo.create({ id: uuidv4(), userId: buyOrder.userId, stockId: stock.id, quantity: qty }),
        );
      } else {
        buyerHolding.quantity += qty;
        await holdingsRepo.save(buyerHolding);
      }

      const reservedRelease = BigInt(qty) * BigInt(buyOrder.limitPriceCents);
      const actualCost = BigInt(qty) * BigInt(tradePriceCents);
      const refund = reservedRelease - actualCost;
      if (refund > 0n) {
        const buyerAccount = await getAccount(buyOrder.userId);
        const buyerCents = BigInt(Math.round(buyerAccount.balance * 100));
        buyerAccount.balance = Number(buyerCents + refund) / 100;
        await accountsRepo.save(buyerAccount);
      }

      buyOrder.remainingQuantity -= qty;
      buyOrder.reservedCashCents = String(BigInt(buyOrder.reservedCashCents) - reservedRelease);
      buyOrder.status = buyOrder.remainingQuantity === 0 ? StockOrderStatusEnum.FILLED : StockOrderStatusEnum.PARTIALLY_FILLED;

      sellOrder.remainingQuantity -= qty;
      sellOrder.reservedQuantity -= qty;
      sellOrder.status = sellOrder.remainingQuantity === 0 ? StockOrderStatusEnum.FILLED : StockOrderStatusEnum.PARTIALLY_FILLED;

      const proceeds = BigInt(qty) * BigInt(tradePriceCents);
      let credited = proceeds;
      if (!sellOrder.feeCharged) {
        // Backward-compat: older orders may not have been charged upfront.
        credited = proceeds - BigInt(this.feeCents);
        if (credited < 0n) credited = 0n;
        sellOrder.feeCharged = true;
      }

      if (credited > 0n) {
        const sellerAccount = await getAccount(sellOrder.userId);
        const sellerCents = BigInt(Math.round(sellerAccount.balance * 100));
        sellerAccount.balance = Number(sellerCents + credited) / 100;
        await accountsRepo.save(sellerAccount);
      }

      await ordersRepo.save([buyOrder, sellOrder]);

      stock.lastPriceCents = tradePriceCents;
      await stocksRepo.save(stock);

      order = order.id === buyOrder.id ? buyOrder : sellOrder;
    }

    return order;
  }
}


