import { User } from '@domain/entities/User';
import { IUserRepository } from '@domain/repositories/IUserRepository';

export interface GetCurrentUserRequest {
  userId: string;
}

export interface GetCurrentUserResponse {
  user: User;
}

export class GetCurrentUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(request: GetCurrentUserRequest): Promise<GetCurrentUserResponse> {
    // Find user by ID
    const user = await this.userRepository.findById(request.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      user
    };
  }
}
