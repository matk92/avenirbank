import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { StockTypeOrmEntity } from '@infrastructure/database/entities/stock.typeorm.entity';
import {
  StockOrderSideEnum,
  StockOrderStatusEnum,
  StockOrderTypeOrmEntity,
} from '@infrastructure/database/entities/stock-order.typeorm.entity';
import { InvestmentWalletTypeOrmEntity } from '@infrastructure/database/entities/investment-wallet.typeorm.entity';
import { StockHoldingTypeOrmEntity } from '@infrastructure/database/entities/stock-holding.typeorm.entity';
import { StockTradeTypeOrmEntity } from '@infrastructure/database/entities/stock-trade.typeorm.entity';

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
      const walletsRepo = manager.getRepository(InvestmentWalletTypeOrmEntity);
      const holdingsRepo = manager.getRepository(StockHoldingTypeOrmEntity);

      const stock = await stocksRepo.findOne({ where: { symbol } });
      if (!stock) throw new NotFoundException('Action introuvable');
      if (side === 'buy' && !stock.isAvailable) {
        throw new ForbiddenException("Cette action n'est pas disponible à l'achat");
      }

      let wallet = await walletsRepo.findOne({ where: { userId } });
      if (!wallet) {
        wallet = walletsRepo.create({ userId, cashCents: '0' });
        wallet = await walletsRepo.save(wallet);
      }

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

      const walletCash = BigInt(wallet.cashCents);

      if (side === 'buy') {
        const reserved = BigInt(quantity) * BigInt(limitPriceCents);
        const required = reserved + BigInt(feeCents);
        if (walletCash < required) {
          throw new BadRequestException(
            `Solde insuffisant pour placer cet ordre. Requis: ${formatCents(required)} (frais inclus), disponible: ${formatCents(walletCash)}.`,
          );
        }

        wallet.cashCents = String(walletCash - required);
        order.reservedCashCents = String(reserved);
        order.feeCharged = true;
        await walletsRepo.save(wallet);
      } else {
        if (holding.quantity < quantity) {
          throw new BadRequestException("Vous ne possédez pas assez d'actions pour vendre");
        }
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
    const walletsRepo: Repository<InvestmentWalletTypeOrmEntity> = manager.getRepository(InvestmentWalletTypeOrmEntity);
    const holdingsRepo: Repository<StockHoldingTypeOrmEntity> = manager.getRepository(StockHoldingTypeOrmEntity);
    const tradesRepo: Repository<StockTradeTypeOrmEntity> = manager.getRepository(StockTradeTypeOrmEntity);
    const stocksRepo: Repository<StockTypeOrmEntity> = manager.getRepository(StockTypeOrmEntity);

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

      const buyerWallet = await walletsRepo.findOne({ where: { userId: buyOrder.userId } });
      if (!buyerWallet) {
        throw new Error('Wallet acheteur introuvable');
      }

      const reservedRelease = BigInt(qty) * BigInt(buyOrder.limitPriceCents);
      const actualCost = BigInt(qty) * BigInt(tradePriceCents);
      const refund = reservedRelease - actualCost;
      const buyerCash = BigInt(buyerWallet.cashCents);
      buyerWallet.cashCents = String(buyerCash + refund);
      await walletsRepo.save(buyerWallet);

      buyOrder.remainingQuantity -= qty;
      buyOrder.reservedCashCents = String(BigInt(buyOrder.reservedCashCents) - reservedRelease);
      buyOrder.status = buyOrder.remainingQuantity === 0 ? StockOrderStatusEnum.FILLED : StockOrderStatusEnum.PARTIALLY_FILLED;

      sellOrder.remainingQuantity -= qty;
      sellOrder.reservedQuantity -= qty;
      sellOrder.status = sellOrder.remainingQuantity === 0 ? StockOrderStatusEnum.FILLED : StockOrderStatusEnum.PARTIALLY_FILLED;

      const sellerWallet = await walletsRepo.findOne({ where: { userId: sellOrder.userId } });
      if (!sellerWallet) {
        throw new Error('Wallet vendeur introuvable');
      }
      const sellerCash = BigInt(sellerWallet.cashCents);
      const proceeds = BigInt(qty) * BigInt(tradePriceCents);
      let newSellerCash = sellerCash + proceeds;
      if (!sellOrder.feeCharged) {
        newSellerCash = newSellerCash - BigInt(this.feeCents);
        sellOrder.feeCharged = true;
      }
      sellerWallet.cashCents = String(newSellerCash);
      await walletsRepo.save(sellerWallet);

      await ordersRepo.save([buyOrder, sellOrder]);

      stock.lastPriceCents = tradePriceCents;
      await stocksRepo.save(stock);

      order = order.id === buyOrder.id ? buyOrder : sellOrder;
    }

    return order;
  }
}


