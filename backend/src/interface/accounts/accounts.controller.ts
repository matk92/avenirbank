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
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtAuthGuard } from '@interface/auth/jwt-auth.guard';
import { CreateAccountUseCase, CreateAccountRequest } from '@application/use-cases/accounts/create-account.use-case';
import { DepositMoneyUseCase, DepositMoneyRequest } from '@application/use-cases/accounts/deposit-money.use-case';
import { TransferMoneyUseCase, TransferMoneyRequest } from '@application/use-cases/accounts/transfer-money.use-case';
import { GetUserAccountsUseCase } from '@application/use-cases/accounts/get-user-accounts.use-case';
import { RenameAccountUseCase, RenameAccountRequest } from '@application/use-cases/accounts/rename-account.use-case';
import { CreateAccountDto } from '@interface/accounts/dto/create-account.dto';
import { DepositMoneyDto } from '@interface/accounts/dto/deposit-money.dto';
import { TransferMoneyDto } from '@interface/accounts/dto/transfer-money.dto';
import { RenameAccountDto } from '@interface/accounts/dto/rename-account.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly depositMoneyUseCase: DepositMoneyUseCase,
    private readonly transferMoneyUseCase: TransferMoneyUseCase,
    private readonly getUserAccountsUseCase: GetUserAccountsUseCase,
    private readonly renameAccountUseCase: RenameAccountUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getUserAccounts(@Req() req: AuthenticatedRequest) {
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
  async createAccount(
    @Body() createAccountDto: CreateAccountDto,
    @Req() req: AuthenticatedRequest,
  ) {
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
  async depositMoney(
    @Param('accountId') accountId: string,
    @Body() depositMoneyDto: DepositMoneyDto,
    @Req() req: AuthenticatedRequest,
  ) {
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
  async transferMoney(
    @Body() transferMoneyDto: TransferMoneyDto,
    @Req() req: AuthenticatedRequest,
  ) {
    try {
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
    } catch (error) {
      if (error.message === 'Insufficient funds in source account') {
        throw new BadRequestException('Insufficient funds in source account');
      }
      if (error.message === 'Source account not found' || error.message === 'Destination account not found') {
        throw new NotFoundException(error.message);
      }
      if (error.message.includes('Unauthorized')) {
        throw new UnauthorizedException(error.message);
      }
      if (error.message.includes('Transfer amount must be positive')) {
        throw new BadRequestException('Transfer amount must be positive');
      }
      if (error.message.includes('cannot exceed')) {
        throw new BadRequestException(error.message);
      }
      if (error.message.includes('inactive')) {
        throw new BadRequestException(error.message);
      }
      
      // Re-throw unknown errors as internal server errors
      throw new InternalServerErrorException('An unexpected error occurred during transfer');
    }
  }

  @Patch(':accountId/rename')
  @HttpCode(HttpStatus.OK)
  async renameAccount(
    @Param('accountId') accountId: string,
    @Body() renameAccountDto: RenameAccountDto,
    @Req() req: AuthenticatedRequest,
  ) {
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
}