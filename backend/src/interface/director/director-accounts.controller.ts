import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { JwtAuthGuard } from '@interface/auth/jwt-auth.guard';
import { RolesGuard } from '@interface/auth/roles.guard';
import { Roles } from '@interface/auth/roles.decorator';
import { UserRole } from '@domain/entities/user.entity';
import { AccountType } from '@domain/entities/account.entity';
import { AccountTypeOrmEntity } from '@infrastructure/database/entities/account.typeorm.entity';
import { UserTypeOrmEntity, UserRoleEnum } from '@infrastructure/database/entities/user.typeorm.entity';
import { CreateDirectorAccountDto, DirectorAccountStatusDto, DirectorAccountTypeDto } from './dto/create-director-account.dto';

@Controller('director/accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DIRECTOR)
export class DirectorAccountsController {
  constructor(
    @InjectRepository(AccountTypeOrmEntity)
    private readonly accountRepository: Repository<AccountTypeOrmEntity>,
    @InjectRepository(UserTypeOrmEntity)
    private readonly userRepository: Repository<UserTypeOrmEntity>,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listAllAccounts() {
    const accounts = await this.accountRepository.find({ order: { createdAt: 'DESC' }, take: 2000 });
    const userIds = Array.from(new Set(accounts.map((a) => a.userId)));
    const users = userIds.length
      ? await this.userRepository.findBy({ id: In(userIds) })
      : [];

    const userById = new Map(users.map((u) => [u.id, u] as const));

    return accounts.map((a) => {
      const user = userById.get(a.userId);
      const clientName = user ? `${user.firstName} ${user.lastName}` : 'Client inconnu';
      const status = user?.isBanned
        ? 'banned'
        : a.isActive
          ? 'active'
          : 'suspended';

      const accountType = a.type === AccountType.SAVINGS ? 'savings' : 'checking';

      return {
        id: a.id,
        clientId: a.userId,
        clientName,
        accountNumber: a.iban,
        accountType,
        balance: Number(a.balance),
        status,
        createdAt: a.createdAt,
      };
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createAccount(@Body() dto: CreateDirectorAccountDto) {
    const clientId = await this.resolveClientId(dto);

    const user = await this.userRepository.findOne({ where: { id: clientId } });
    if (!user || user.role !== UserRoleEnum.CLIENT) {
      throw new NotFoundException('Client introuvable');
    }

    if (user.isBanned || dto.status === DirectorAccountStatusDto.BANNED) {
      user.isBanned = true;
      await this.userRepository.save(user);
    }

    const type = dto.accountType === DirectorAccountTypeDto.SAVINGS ? AccountType.SAVINGS : AccountType.CHECKING;

    const account = new AccountTypeOrmEntity();
    account.id = uuidv4();
    account.userId = clientId;
    account.iban = await this.generateUniqueIban();
    account.name = dto.name || (dto.accountType === DirectorAccountTypeDto.SAVINGS ? 'Compte épargne' : 'Compte courant');
    account.type = type;
    account.balance = dto.balance;
    account.currency = 'EUR';
    account.isActive = dto.status === DirectorAccountStatusDto.SUSPENDED ? false : true;

    const saved = await this.accountRepository.save(account);

    return {
      id: saved.id,
      clientId,
      clientName: `${user.firstName} ${user.lastName}`,
      accountNumber: saved.iban,
      accountType: dto.accountType,
      balance: Number(saved.balance),
      status: user.isBanned
        ? 'banned'
        : saved.isActive
          ? 'active'
          : 'suspended',
      createdAt: saved.createdAt,
      savingsRate: dto.accountType === DirectorAccountTypeDto.SAVINGS ? dto.savingsRate : undefined,
    };
  }

  @Patch(':accountId/suspend')
  @HttpCode(HttpStatus.OK)
  async suspend(@Param('accountId') accountId: string) {
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Compte introuvable');

    account.isActive = false;
    const saved = await this.accountRepository.save(account);

    return this.toDto(saved);
  }

  @Patch(':accountId/reactivate')
  @HttpCode(HttpStatus.OK)
  async reactivate(@Param('accountId') accountId: string) {
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Compte introuvable');

    account.isActive = true;

    const user = await this.userRepository.findOne({ where: { id: account.userId } });
    if (user?.isBanned) {
      user.isBanned = false;
      await this.userRepository.save(user);
    }

    const saved = await this.accountRepository.save(account);
    return this.toDto(saved, user || undefined);
  }

  @Patch(':accountId/ban')
  @HttpCode(HttpStatus.OK)
  async ban(@Param('accountId') accountId: string) {
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Compte introuvable');

    const user = await this.userRepository.findOne({ where: { id: account.userId } });
    if (!user) throw new NotFoundException('Client introuvable');

    user.isBanned = true;
    await this.userRepository.save(user);

    account.isActive = false;
    const saved = await this.accountRepository.save(account);
    return this.toDto(saved, user);
  }

  @Delete(':accountId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Param('accountId') accountId: string) {
    const account = await this.accountRepository.findOne({ where: { id: accountId } });
    if (!account) throw new NotFoundException('Compte introuvable');

    if (account.balance !== 0) {
      throw new BadRequestException('Impossible de supprimer un compte avec un solde non nul');
    }

    await this.accountRepository.delete(accountId);
  }

  private async resolveClientId(dto: CreateDirectorAccountDto): Promise<string> {
    if (dto.clientId) return dto.clientId;

    if (!dto.clientName) {
      throw new BadRequestException('clientId requis (ou clientName)');
    }

    const parts = dto.clientName.trim().split(/\s+/);
    if (parts.length < 2) {
      throw new BadRequestException('clientName doit contenir prénom et nom');
    }

    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');

    const users = await this.userRepository.find({ where: { firstName, lastName, role: UserRoleEnum.CLIENT } });
    if (users.length === 0) {
      throw new NotFoundException('Aucun client ne correspond à ce nom');
    }
    if (users.length > 1) {
      throw new BadRequestException('Nom ambigu: plusieurs clients correspondent, utilisez clientId');
    }

    return users[0].id;
  }

  private async generateUniqueIban(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt++) {
      const candidate = `FR76AVENIR${Math.floor(100000000000 + Math.random() * 900000000000)}`;
      const exists = await this.accountRepository.count({ where: { iban: candidate } });
      if (exists === 0) return candidate;
    }
    throw new BadRequestException('Impossible de générer un IBAN unique');
  }

  private async toDto(account: AccountTypeOrmEntity, user?: UserTypeOrmEntity) {
    const resolvedUser = user || (await this.userRepository.findOne({ where: { id: account.userId } }));
    const clientName = resolvedUser ? `${resolvedUser.firstName} ${resolvedUser.lastName}` : 'Client inconnu';
    const status = resolvedUser?.isBanned
      ? 'banned'
      : account.isActive
        ? 'active'
        : 'suspended';

    return {
      id: account.id,
      clientId: account.userId,
      clientName,
      accountNumber: account.iban,
      accountType: account.type === AccountType.SAVINGS ? 'savings' : 'checking',
      balance: Number(account.balance),
      status,
      createdAt: account.createdAt,
    };
  }
}