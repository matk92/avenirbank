/**
 * Create Account Use Case - Application Layer
 * Handles account creation business logic
 */

import { v4 as uuidv4 } from 'uuid';
import { Account, AccountType } from '@domain/entities/account.entity';
import { IBAN } from '@domain/value-objects/iban.value-object';
import { IAccountRepository } from '@domain/repositories/account.repository.interface';
import { IUserRepository } from '@domain/repositories/user.repository.interface';

export interface CreateAccountRequest {
  userId: string;
  name: string;
  type: AccountType;
  initialDeposit?: number;
}

export interface CreateAccountResponse {
  account: {
    id: string;
    iban: string;
    name: string;
    type: AccountType;
    balance: number;
    currency: string;
    createdAt: Date;
  };
}

export class CreateAccountUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: CreateAccountRequest): Promise<CreateAccountResponse> {
    // Validate user exists
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate account name
    if (!request.name || request.name.trim().length === 0) {
      throw new Error('Account name is required');
    }

    if (request.name.trim().length > 100) {
      throw new Error('Account name cannot exceed 100 characters');
    }

    // Validate initial deposit
    if (request.initialDeposit !== undefined && request.initialDeposit < 0) {
      throw new Error('Initial deposit cannot be negative');
    }

    // Generate unique IBAN
    let iban: IBAN;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      iban = IBAN.generate();
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique IBAN after multiple attempts');
      }
    } while (await this.accountRepository.ibanExists(iban.getValue()));

    // Create account
    const accountId = uuidv4();
    const account = new Account(
      accountId,
      request.userId,
      iban.getValue(),
      request.name.trim(),
      request.type,
    );

    // Add initial deposit if provided
    if (request.initialDeposit && request.initialDeposit > 0) {
      account.credit(request.initialDeposit);
    }

    // Save account
    const savedAccount = await this.accountRepository.create(account);

    return {
      account: {
        id: savedAccount.id,
        iban: savedAccount.iban,
        name: savedAccount.name,
        type: savedAccount.type,
        balance: savedAccount.balance,
        currency: savedAccount.currency,
        createdAt: savedAccount.createdAt,
      },
    };
  }
}
