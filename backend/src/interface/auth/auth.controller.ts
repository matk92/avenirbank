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
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { LoginUseCase } from '@application/use-cases/auth/login.use-case';
import { ConfirmEmailUseCase } from '@application/use-cases/email-verification/confirm-email.use-case';
import { JwtAuthGuard } from './jwt-auth.guard';
import { HandleErrors } from '@interface/shared/decorators/handle-errors.decorator';
import { RegisterResponse, LoginResponse } from '@interface/shared/types/common-responses.interface';


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
  @HandleErrors('auth', 'registration')
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponse> {
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
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @HandleErrors('auth', 'login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
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
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async me(@Req() req: any): Promise<{ user: any }> {
    return { user: req.user };
  }
  
  @Get('verify-email/:token')
  @HttpCode(HttpStatus.OK)
  async verifyEmailGet(@Param('token') token: string): Promise<{ message: string }> {
    await this.confirmEmailUseCase.execute(token);
    return { message: 'Email verified successfully' };
  }
}
