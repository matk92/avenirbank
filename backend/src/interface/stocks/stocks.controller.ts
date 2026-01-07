import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@interface/auth/jwt-auth.guard';
import { Roles } from '@interface/auth/roles.decorator';
import { RolesGuard } from '@interface/auth/roles.guard';
import { UserRole } from '@domain/entities/user.entity';
import { CreateStockUseCase } from '@application/use-cases/stocks/create-stock.use-case';
import { ListDirectorStocksUseCase } from '@application/use-cases/stocks/list-director-stocks.use-case';
import { ToggleStockAvailabilityUseCase } from '@application/use-cases/stocks/toggle-stock-availability.use-case';
import { DeleteStockUseCase } from '@application/use-cases/stocks/delete-stock.use-case';

@Controller('director/stocks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DIRECTOR)
export class DirectorStocksController {
  constructor(
    private readonly createStock: CreateStockUseCase,
    private readonly listStocks: ListDirectorStocksUseCase,
    private readonly toggleAvailability: ToggleStockAvailabilityUseCase,
    private readonly deleteStock: DeleteStockUseCase,
  ) {}

  @Get()
  async list() {
    return await this.listStocks.execute();
  }

  @Post()
  async create(@Body() body: { symbol: string; name: string; currentPrice: number; isAvailable: boolean }) {
    return await this.createStock.execute(body);
  }

  @Patch(':stockId/availability')
  async setAvailability(@Param('stockId') stockId: string, @Body() body: { isAvailable: boolean }) {
    return await this.toggleAvailability.execute(stockId, Boolean(body?.isAvailable));
  }

  @Delete(':stockId')
  async remove(@Param('stockId') stockId: string) {
    await this.deleteStock.execute(stockId);
    return { ok: true };
  }
}



