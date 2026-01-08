import { Account } from '@domain/entities/Account';
import { IAccountRepository } from '@domain/repositories/IAccountRepository';
import { IUserRepository } from '@domain/repositories/IUserRepository';

export interface GetUserAccountsRequest {
  userId: string;
}

export interface GetUserAccountsResponse {
  accounts: Account[];
}

export class GetUserAccountsUseCase {
  constructor(
    private readonly accountRepository: IAccountRepository,
    private readonly userRepository: IUserRepository
  ) {}

  public async execute(request: GetUserAccountsRequest): Promise<GetUserAccountsResponse> {
    // Verify user exists
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user accounts
    const accounts = await this.accountRepository.findByUserId(request.userId);

    return {
      accounts
    };
  }
}
