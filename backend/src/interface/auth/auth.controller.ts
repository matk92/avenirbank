import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  UseGuards,
  Req,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';
import { ConfirmEmailUseCase } from '@application/use-cases/email-verification/confirm-email.use-case';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { Request } from 'express';

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
    private readonly jwtService: JwtService,
    private readonly confirmEmailUseCase: ConfirmEmailUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
    try {
      const result = await this.registerUseCase.execute({
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        email: registerDto.email,
        password: registerDto.password,
      });

      return {
        message: 'User registered successfully. Please check your email for a verification link.',
        user: {
          id: result.id,
          email: result.email,
          firstName: result.firstName,
          lastName: result.lastName,
        },
      };
    } catch (error) {
      if (error.message === 'User with this email already exists') {
        throw new BadRequestException('User with this email already exists');
      }
      if (error.message === 'All fields are required') {
        throw new BadRequestException('All fields are required');
      }
      if (error.message === 'Email is too long') {
        throw new BadRequestException('Email is too long');
      }
      if (error.message === 'Password must be at least 8 characters') {
        throw new BadRequestException('Password must be at least 8 characters');
      }
      if (error.message.includes('must be between 2 and 100 characters')) {
        throw new BadRequestException(error.message);
      }
      
      // Re-throw unknown errors as internal server errors
      throw new InternalServerErrorException('An unexpected error occurred during registration');
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    try {
      const result = await this.loginUseCase.execute({
        email: loginDto.email,
        password: loginDto.password,
      });

      const token = await this.jwtService.signAsync({
        sub: result.user.id,
        role: result.user.role,
        email: result.user.email,
      });

      return {
        access_token: token,
        role: result.user.role,
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
      };
    } catch (error) {
      if (error.message === 'Invalid email or password') {
        throw new UnauthorizedException('Invalid email or password');
      }
      if (error.message === 'Please verify your email before logging in') {
        throw new BadRequestException('Please verify your email before logging in');
      }
      if (error.message === 'All fields are required') {
        throw new BadRequestException('All fields are required');
      }
      if (error.message === 'Email is too long') {
        throw new BadRequestException('Email is too long');
      }
      if (error.message === 'Password must be at least 8 characters') {
        throw new BadRequestException('Password must be at least 8 characters');
      }
      
      // Re-throw unknown errors as internal server errors
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async me(@Req() req: Request) {
    return { user: (req as any).user };
  }
  
  @Get('verify-email/:token')
  @HttpCode(HttpStatus.OK)
  async verifyEmailGet(@Param('token') token: string): Promise<{ message: string }> {
    await this.confirmEmailUseCase.execute(token);
    return { message: 'Email verified successfully' };
  }
}
