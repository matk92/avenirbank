import { User, UserRole } from '@domain/entities/User';
import { Email } from '@domain/value-objects/Email';
import { IUserRepository } from '@domain/repositories/IUserRepository';
import { v4 as uuidv4 } from 'uuid';

export interface RegisterUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

export interface RegisterUserResponse {
  user: User;
  emailVerificationToken: string;
}

export class RegisterUserUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    // Validate email format
    const email = Email.create(request.email);
    
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email.getValue());
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Generate email verification token
    const emailVerificationToken = uuidv4();

    // Create user entity
    const user = User.create({
      email: email.getValue(),
      password: request.password, // Will be hashed in infrastructure layer
      firstName: request.firstName.trim(),
      lastName: request.lastName.trim(),
      role: request.role || UserRole.CLIENT,
      isEmailVerified: false,
      emailVerificationToken
    });

    // Save user
    const savedUser = await this.userRepository.create(user);

    return {
      user: savedUser,
      emailVerificationToken
    };
  }
}
