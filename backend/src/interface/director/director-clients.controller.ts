import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { hash } from 'bcrypt';
import { JwtAuthGuard } from '@interface/auth/jwt-auth.guard';
import { RolesGuard } from '@interface/auth/roles.guard';
import { Roles } from '@interface/auth/roles.decorator';
import { UserRole } from '@domain/entities/user.entity';
import { IUserRepository } from '@domain/repositories/user.repository.interface';
import { IAccountRepository } from '@domain/repositories/account.repository.interface';
import { RegisterUseCase } from '@application/use-cases/auth/register.use-case';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('director/clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.DIRECTOR)
export class DirectorClientsController {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IAccountRepository')
    private readonly accountRepository: IAccountRepository,
    private readonly registerUseCase: RegisterUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async listClients(
    @Query('skip') skipRaw?: string,
    @Query('take') takeRaw?: string,
  ) {
    const skip = skipRaw ? Number(skipRaw) : 0;
    const take = takeRaw ? Number(takeRaw) : 200;

    const { users, total } = await this.userRepository.findByRole(UserRole.CLIENT, skip, take);

    return {
      data: users.map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        isBanned: u.isBanned,
        isEmailConfirmed: u.isEmailConfirmed,
        createdAt: u.createdAt,
      })),
      total,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createClient(@Body() dto: CreateClientDto) {
    try {
      const created = await this.registerUseCase.execute({
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: dto.password,
      });

      return created;
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Impossible de créer le client');
    }
  }

  @Patch(':clientId')
  @HttpCode(HttpStatus.OK)
  async updateClient(@Param('clientId') clientId: string, @Body() dto: UpdateClientDto) {
    const user = await this.userRepository.findById(clientId);
    if (!user || user.role !== UserRole.CLIENT) {
      throw new NotFoundException('Client introuvable');
    }

    if (dto.email && dto.email !== user.email) {
      const existing = await this.userRepository.findByEmail(dto.email);
      if (existing && existing.id !== user.id) {
        throw new BadRequestException('Un utilisateur avec cet email existe déjà');
      }
      user.email = dto.email;
    }

    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;

    if (dto.password) {
      user.passwordHash = await hash(dto.password, 10);
    }

    user.updatedAt = new Date();

    const saved = await this.userRepository.update(user);
    return {
      id: saved.id,
      firstName: saved.firstName,
      lastName: saved.lastName,
      email: saved.email,
      isBanned: saved.isBanned,
      isEmailConfirmed: saved.isEmailConfirmed,
      createdAt: saved.createdAt,
    };
  }

  @Patch(':clientId/ban')
  @HttpCode(HttpStatus.OK)
  async banClient(@Param('clientId') clientId: string) {
    const user = await this.userRepository.findById(clientId);
    if (!user || user.role !== UserRole.CLIENT) {
      throw new NotFoundException('Client introuvable');
    }

    try {
      user.ban();
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Impossible de bannir le client');
    }

    const saved = await this.userRepository.update(user);
    return {
      id: saved.id,
      isBanned: saved.isBanned,
    };
  }

  @Patch(':clientId/unban')
  @HttpCode(HttpStatus.OK)
  async unbanClient(@Param('clientId') clientId: string) {
    const user = await this.userRepository.findById(clientId);
    if (!user || user.role !== UserRole.CLIENT) {
      throw new NotFoundException('Client introuvable');
    }

    try {
      user.unban();
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Impossible de débannir le client');
    }

    const saved = await this.userRepository.update(user);
    return {
      id: saved.id,
      isBanned: saved.isBanned,
    };
  }

  @Delete(':clientId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteClient(@Param('clientId') clientId: string) {
    const user = await this.userRepository.findById(clientId);
    if (!user || user.role !== UserRole.CLIENT) {
      throw new NotFoundException('Client introuvable');
    }

    const accounts = await this.accountRepository.findByUserId(user.id);
    if (accounts.length > 0) {
      throw new BadRequestException('Impossible de supprimer un client qui possède des comptes');
    }

    await this.userRepository.delete(user.id);
  }
}