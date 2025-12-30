import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';

interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface RegisterResponse {
  message: string;
  user: UserResponse;
}

interface LoginResponse {
  access_token: string;
  role: string;
  user: UserResponse;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
    const result = await this.registerUseCase.execute({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      password: registerDto.password,
    });

    return {
      message: 'User registered successfully',
      user: {
        id: result.id,
        email: result.email,
        firstName: result.firstName,
        lastName: result.lastName,
      },
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    const result = await this.loginUseCase.execute({
      email: loginDto.email,
      password: loginDto.password,
    });

    return {
      access_token: 'jwt-token-' + result.user.id,
      role: result.user.role,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
    };
  }
}
