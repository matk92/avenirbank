import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTypeOrmEntity } from '@infrastructure/database/entities/user.typeorm.entity';
import { compare } from 'bcrypt';

@Controller('auth')
export class AuthDiagnosticController {
  constructor(
    @InjectRepository(UserTypeOrmEntity)
    private readonly userRepository: Repository<UserTypeOrmEntity>,
  ) {}

  @Get('diagnostic')
  @HttpCode(HttpStatus.OK)
  async diagnostic(): Promise<any> {
    const results: any = {
      timestamp: new Date().toISOString(),
      checks: {},
    };

    try {
      // Test 1: Database connection
      results.checks.database_connection = await this.testDatabaseConnection();
      
      // Test 2: User table exists and accessible
      results.checks.user_table = await this.testUserTable();
      
      // Test 3: Environment variables
      results.checks.environment = this.testEnvironmentVariables();
      
      // Test 4: Bcrypt functionality
      results.checks.bcrypt = await this.testBcrypt();
      
      // Test 5: JWT configuration
      results.checks.jwt = this.testJwtConfig();
      
      // Test 6: Seed users exist
      results.checks.seed_users = await this.testSeedUsers();
      
    } catch (error) {
      results.error = error.message;
      results.stack = error.stack;
    }

    return results;
  }

  private async testDatabaseConnection(): Promise<any> {
    try {
      const result = await this.userRepository.query('SELECT 1 as test');
      return { status: 'success', result };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  private async testUserTable(): Promise<any> {
    try {
      const count = await this.userRepository.count();
      const sample = await this.userRepository.find({ take: 1 });
      return { 
        status: 'success', 
        user_count: count,
        has_users: count > 0,
        sample_user: sample.length > 0 ? {
          id: sample[0].id,
          email: sample[0].email,
          role: sample[0].role,
          isEmailConfirmed: sample[0].isEmailConfirmed
        } : null
      };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  private testEnvironmentVariables(): any {
    return {
      JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'missing',
      DATABASE_HOST: process.env.DATABASE_HOST || 'default',
      DATABASE_PORT: process.env.DATABASE_PORT || 'default',
      DATABASE_USER: process.env.DATABASE_USER || 'default',
      DATABASE_PASSWORD: process.env.DATABASE_PASSWORD ? 'set' : 'missing',
      DATABASE_NAME: process.env.DATABASE_NAME || 'default',
      NODE_ENV: process.env.NODE_ENV || 'undefined'
    };
  }

  private async testBcrypt(): Promise<any> {
    try {
      const testPassword = 'test123';
      const testHash = '$2b$10$example.hash.for.testing.purposes.only';
      // Just test that bcrypt compare function works
      await compare(testPassword, testHash);
      return { status: 'success', bcrypt_available: true };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }

  private testJwtConfig(): any {
    const secret = process.env.JWT_SECRET;
    return {
      secret_configured: !!secret,
      secret_length: secret ? secret.length : 0,
      using_default: secret === 'dev-jwt-secret'
    };
  }

  private async testSeedUsers(): Promise<any> {
    try {
      const seedEmails = [
        'director@avenir.test',
        'advisor@avenir.test', 
        'client1@avenir.test',
        'client2@avenir.test'
      ];
      
      const results: Record<string, any> = {};
      for (const email of seedEmails) {
        const user = await this.userRepository.findOne({ where: { email } });
        results[email] = user ? {
          exists: true,
          role: user.role,
          isEmailConfirmed: user.isEmailConfirmed,
          isBanned: user.isBanned
        } : { exists: false };
      }
      
      return { status: 'success', users: results };
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}
