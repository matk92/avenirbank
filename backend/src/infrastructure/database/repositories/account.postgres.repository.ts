/**
 * Account PostgreSQL Repository - Infrastructure Layer
 * Implements IAccountRepository using TypeORM
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account, AccountType } from '@domain/entities/account.entity';
import { IAccountRepository } from '@domain/repositories/account.repository.interface';
import { AccountTypeOrmEntity } from '@infrastructure/database/entities/account.typeorm.entity';

@Injectable()
export class AccountPostgresRepository implements IAccountRepository {
  constructor(
    @InjectRepository(AccountTypeOrmEntity)
    private readonly accountRepository: Repository<AccountTypeOrmEntity>,
  ) {}

  async create(account: Account): Promise<Account> {
    const accountEntity = this.toTypeOrmEntity(account);
    const savedEntity = await this.accountRepository.save(accountEntity);
    return this.toDomainEntity(savedEntity);
  }

  async findById(id: string): Promise<Account | null> {
    const entity = await this.accountRepository.findOne({ where: { id } });
    return entity ? this.toDomainEntity(entity) : null;
  }

  async findByIban(iban: string): Promise<Account | null> {
    const entity = await this.accountRepository.findOne({ where: { iban } });
    return entity ? this.toDomainEntity(entity) : null;
  }

  async findByUserId(userId: string): Promise<Account[]> {
    const entities = await this.accountRepository.find({ 
      where: { userId },
      order: { createdAt: 'DESC' }
    });
    return entities.map(entity => this.toDomainEntity(entity));
  }

  async update(account: Account): Promise<Account> {
    const entity = this.toTypeOrmEntity(account);
    const savedEntity = await this.accountRepository.save(entity);
    return this.toDomainEntity(savedEntity);
  }

  async delete(id: string): Promise<void> {
    await this.accountRepository.delete(id);
  }

  async ibanExists(iban: string): Promise<boolean> {
    const count = await this.accountRepository.count({ where: { iban } });
    return count > 0;
  }

  async findAll(skip: number, take: number): Promise<{ accounts: Account[]; total: number }> {
    const [entities, total] = await this.accountRepository.findAndCount({
      skip,
      take,
      order: { createdAt: 'DESC' }
    });

    const accounts = entities.map(entity => this.toDomainEntity(entity));
    return { accounts, total };
  }

  private toDomainEntity(entity: AccountTypeOrmEntity): Account {
    const account = new Account(
      entity.id,
      entity.userId,
      entity.iban,
      entity.name,
      entity.type as AccountType,
    );

    // Set additional properties
    account.balance = entity.balance;
    account.currency = entity.currency;
    account.isActive = entity.isActive;
    account.createdAt = entity.createdAt;
    account.updatedAt = entity.updatedAt;

    return account;
  }

  private toTypeOrmEntity(account: Account): AccountTypeOrmEntity {
    const entity = new AccountTypeOrmEntity();
    entity.id = account.id;
    entity.userId = account.userId;
    entity.iban = account.iban;
    entity.name = account.name;
    entity.type = account.type;
    entity.balance = account.balance;
    entity.currency = account.currency;
    entity.isActive = account.isActive;
    entity.createdAt = account.createdAt;
    entity.updatedAt = account.updatedAt;
    return entity;
  }
}
