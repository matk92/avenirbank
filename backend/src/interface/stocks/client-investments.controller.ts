import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@interface/auth/jwt-auth.guard';
import type { Request } from 'express';
import { ListClientStocksUseCase } from '@application/use-cases/investments/list-client-stocks.use-case';
import { PlaceStockOrderUseCase } from '@application/use-cases/investments/place-stock-order.use-case';
import { ListClientOrdersUseCase } from '@application/use-cases/investments/list-client-orders.use-case';

@UseGuards(JwtAuthGuard)
@Controller()
export class ClientInvestmentsController {
  constructor(
    private readonly listStocks: ListClientStocksUseCase,
    private readonly placeOrder: PlaceStockOrderUseCase,
    private readonly listOrders: ListClientOrdersUseCase,
  ) {}

  @Get('client/stocks')
  async availableStocks() {
    return await this.listStocks.execute();
  }

  @Get('client/investments/orders')
  async orders(@Req() req: Request) {
    const userId = String((req as any).user?.id);
    return await this.listOrders.execute(userId);
  }

  @Post('client/investments/orders')
  async createOrder(@Req() req: Request, @Body() body: { stockSymbol: string; side: 'buy' | 'sell'; quantity: number; limitPrice: number }) {
    const userId = String((req as any).user?.id);
    return await this.placeOrder.execute(userId, body);
  }
}



