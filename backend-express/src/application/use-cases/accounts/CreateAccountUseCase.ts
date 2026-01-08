import { Account, AccountType } from '@domain/entities/Account';
import { IBAN } from '@domain/value-objects/IBAN';
import { IAccountRepository } from '@domain/repositories/IAccountRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';

export interface CreateAccountRequest {
  userId: string;
  name: string;
  type: AccountType;
}

export interface CreateAccountResponse {
  account: Account;
}

export class CreateAccountUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly userRepository: IUserRepository
  ) {}

  public async execute(request: CreateAccountRequest): Promise<CreateAccountResponse> {
    // Verify user exists
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Validate account name
    if (!request.name || request.name.trim().length < 2) {
      throw new Error('Account name must be at least 2 characters long');
    }
    if (request.name.trim().length > 100) {
      throw new Error('Account name must be less than 100 characters');
    }

    // Generate unique IBAN
    let iban: IBAN;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      iban = IBAN.generate();
      attempts++;
      
      if (attempts > maxAttempts) {
        throw new Error('Failed to generate unique IBAN after multiple attempts');
      }
    } while (await this.accountRepository.existsByIban(iban.getValue()));

    // Create account entity
    const account = Account.create({
      userId: request.userId,
      name: request.name.trim(),
      iban: iban.getValue(),
      balance: 0,
      type: request.type
    });

    // Save account
    const savedAccount = await this.accountRepository.create(account);

    return {
      account: savedAccount
    };
  }
}
