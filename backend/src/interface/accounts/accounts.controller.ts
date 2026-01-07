/**
 * Accounts Controller - Interface Layer
 * Handles HTTP requests for account management
 */

import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  HttpCode, 
  HttpStatus, 
  UseGuards, 
  Req,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from '@interface/auth/jwt-auth.guard';
import { AuthenticatedRequest } from '@interface/shared/types/authenticated-request.interface';
import { HandleErrors } from '@interface/shared/decorators/handle-errors.decorator';
import { ApiSuccessResponse } from '@interface/shared/types/common-responses.interface';
import { CreateAccountUseCase, CreateAccountRequest } from '@application/use-cases/accounts/create-account.use-case';
import { DepositMoneyUseCase, DepositMoneyRequest } from '@application/use-cases/accounts/deposit-money.use-case';
import { TransferMoneyUseCase, TransferMoneyRequest } from '@application/use-cases/accounts/transfer-money.use-case';
import { GetUserAccountsUseCase } from '@application/use-cases/accounts/get-user-accounts.use-case';
import { RenameAccountUseCase, RenameAccountRequest } from '@application/use-cases/accounts/rename-account.use-case';
import { CloseAccountUseCase, CloseAccountRequest } from '@application/use-cases/accounts/close-account.use-case';
import { CreateAccountDto } from '@interface/accounts/dto/create-account.dto';
import { DepositMoneyDto } from '@interface/accounts/dto/deposit-money.dto';
import { TransferMoneyDto } from '@interface/accounts/dto/transfer-money.dto';
import { TransferToClientMainDto } from '@interface/accounts/dto/transfer-to-client-main.dto';
import { RenameAccountDto } from '@interface/accounts/dto/rename-account.dto';
import { TransferToClientMainUseCase, TransferToClientMainRequest } from '@application/use-cases/accounts/transfer-to-client-main.use-case';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly depositMoneyUseCase: DepositMoneyUseCase,
    private readonly transferMoneyUseCase: TransferMoneyUseCase,
    private readonly transferToClientMainUseCase: TransferToClientMainUseCase,
    private readonly getUserAccountsUseCase: GetUserAccountsUseCase,
    private readonly renameAccountUseCase: RenameAccountUseCase,
    private readonly closeAccountUseCase: CloseAccountUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @HandleErrors('generic', 'getting user accounts')
  async getUserAccounts(@Req() req: AuthenticatedRequest): Promise<ApiSuccessResponse> {
    const request = {
      userId: req.user.id,
    };

    const result = await this.getUserAccountsUseCase.execute(request);
    return {
      success: true,
      data: result,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @HandleErrors('generic', 'creating account')
  async createAccount(
    @Body() createAccountDto: CreateAccountDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiSuccessResponse> {
    const request: CreateAccountRequest = {
      userId: req.user.id,
      name: createAccountDto.name,
      type: createAccountDto.type,
      initialDeposit: createAccountDto.initialDeposit,
    };

    const result = await this.createAccountUseCase.execute(request);
    return {
      success: true,
      message: 'Account created successfully',
      data: result,
    };
  }

  @Post(':accountId/deposit')
  @HttpCode(HttpStatus.OK)
  @HandleErrors('account')
  async depositMoney(
    @Param('accountId') accountId: string,
    @Body() depositMoneyDto: DepositMoneyDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiSuccessResponse> {
    const request: DepositMoneyRequest = {
      accountId,
      amount: depositMoneyDto.amount,
      userId: req.user.id,
    };

    const result = await this.depositMoneyUseCase.execute(request);
    return {
      success: true,
      message: 'Deposit completed successfully',
      data: result,
    };
  }

  @Post('transfer')
  @HttpCode(HttpStatus.OK)
  @HandleErrors('account')
  async transferMoney(
    @Body() transferMoneyDto: TransferMoneyDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiSuccessResponse> {
    const request: TransferMoneyRequest = {
      fromAccountId: transferMoneyDto.fromAccountId,
      toAccountId: transferMoneyDto.toAccountId,
      amount: transferMoneyDto.amount,
      reference: transferMoneyDto.reference,
      userId: req.user.id,
    };

    const result = await this.transferMoneyUseCase.execute(request);
    return {
      success: true,
      message: 'Transfer completed successfully',
      data: result,
    };
  }

  @Post('transfer-to-client-main')
  @HttpCode(HttpStatus.OK)
  @HandleErrors('account')
  async transferToClientMain(
    @Body() dto: TransferToClientMainDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiSuccessResponse> {
    const request: TransferToClientMainRequest = {
      fromAccountId: dto.fromAccountId,
      recipientEmail: dto.recipientEmail,
      amount: dto.amount,
      reference: dto.reference,
      userId: req.user.id,
    };

    const result = await this.transferToClientMainUseCase.execute(request);
    return {
      success: true,
      message: 'Transfer completed successfully',
      data: result,
    };
  }

  @Patch(':accountId/rename')
  @HttpCode(HttpStatus.OK)
  @HandleErrors('account')
  async renameAccount(
    @Param('accountId') accountId: string,
    @Body() renameAccountDto: RenameAccountDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiSuccessResponse> {
    const request: RenameAccountRequest = {
      accountId,
      newName: renameAccountDto.name,
      userId: req.user.id,
    };

    const result = await this.renameAccountUseCase.execute(request);
    return {
      success: true,
      message: 'Account renamed successfully',
      data: result,
    };
  }

  @Post(':accountId/close')
  @HttpCode(HttpStatus.OK)
  @HandleErrors('account')
  async closeAccount(
    @Param('accountId') accountId: string,
    @Body() body: { transferToAccountId?: string },
    @Req() req: AuthenticatedRequest,
  ): Promise<ApiSuccessResponse> {
    const request: CloseAccountRequest = {
      accountId,
      userId: req.user.id,
      transferToAccountId: body.transferToAccountId,
    };

    const result = await this.closeAccountUseCase.execute(request);
    return {
      success: true,
      message: 'Account closed successfully',
      data: result,
    };
  }
}