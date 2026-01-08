import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { MongoDBConnection } from '../database/mongodb/connection';
import { MongoUserRepository } from '../database/mongodb/repositories/MongoUserRepository';
import { MongoAccountRepository } from '../database/mongodb/repositories/MongoAccountRepository';
import { MongoTransactionRepository } from '../database/mongodb/repositories/MongoTransactionRepository';
import { BcryptPasswordService } from '../services/BcryptPasswordService';
import { JwtTokenService } from '../services/JwtTokenService';
import { RegisterUserUseCase } from '@application/use-cases/auth/RegisterUserUseCase';
import { LoginUserUseCase } from '@application/use-cases/auth/LoginUserUseCase';
import { VerifyEmailUseCase } from '@application/use-cases/auth/VerifyEmailUseCase';
import { GetCurrentUserUseCase } from '@application/use-cases/auth/GetCurrentUserUseCase';
import { CreateAccountUseCase } from '@application/use-cases/accounts/CreateAccountUseCase';
import { GetUserAccountsUseCase } from '@application/use-cases/accounts/GetUserAccountsUseCase';
import { DepositMoneyUseCase } from '@application/use-cases/accounts/DepositMoneyUseCase';
import { TransferMoneyUseCase } from '@application/use-cases/accounts/TransferMoneyUseCase';
import { RenameAccountUseCase } from '@application/use-cases/accounts/RenameAccountUseCase';
import { CloseAccountUseCase } from '@application/use-cases/accounts/CloseAccountUseCase';
import { AuthRoutes } from '../../interface/routes/authRoutes';
import { AccountRoutes } from '../../interface/routes/accountRoutes';
import { SavingsRateRoutes } from '../../interface/routes/savingsRateRoutes';
import { AuthMiddleware } from '../../interface/middleware/authMiddleware';
import { errorHandler, notFoundHandler } from '../../interface/middleware/errorHandler';

export class ExpressApp {
  private app: Application;
  private mongoConnection: MongoDBConnection;

  constructor() {
    this.app = express();
    this.mongoConnection = MongoDBConnection.getInstance();
  }

  public async initialize(): Promise<Application> {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/avenirbank';
    await this.mongoConnection.connect(mongoUri);

    // Setup middleware
    this.setupMiddleware();

    // Setup routes
    this.setupRoutes();

    // Setup error handlers
    this.setupErrorHandlers();

    return this.app;
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.app.use(cors({
      origin: frontendUrl,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10), // 1000 requests per minute
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later',
        error: 'Too Many Requests'
      }
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (_req, res) => {
      res.status(200).json({
        success: true,
        message: 'Express backend is healthy',
        data: {
          status: 'ok',
          timestamp: new Date().toISOString(),
          database: this.mongoConnection.getConnectionStatus() ? 'connected' : 'disconnected'
        }
      });
    });

    // Initialize repositories
    const userRepository = new MongoUserRepository();
    const accountRepository = new MongoAccountRepository();
    const transactionRepository = new MongoTransactionRepository();

    // Initialize services
    const passwordService = new BcryptPasswordService();
    const jwtSecret = process.env.JWT_SECRET || 'dev-jwt-secret';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
    const tokenService = new JwtTokenService(jwtSecret, jwtExpiresIn);

    // Initialize middleware
    const authMiddleware = new AuthMiddleware(tokenService);

    // Initialize auth use cases
    const registerUserUseCase = new RegisterUserUseCase(userRepository);
    const loginUserUseCase = new LoginUserUseCase(userRepository, passwordService, tokenService);
    const verifyEmailUseCase = new VerifyEmailUseCase(userRepository);
    const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);

    // Initialize account use cases
    const createAccountUseCase = new CreateAccountUseCase(accountRepository, userRepository);
    const getUserAccountsUseCase = new GetUserAccountsUseCase(accountRepository, userRepository);
    const depositMoneyUseCase = new DepositMoneyUseCase(accountRepository, transactionRepository);
    const transferMoneyUseCase = new TransferMoneyUseCase(accountRepository, transactionRepository);
    const renameAccountUseCase = new RenameAccountUseCase(accountRepository);
    const closeAccountUseCase = new CloseAccountUseCase(accountRepository);

    // Initialize routes
    const authRoutes = new AuthRoutes(
      registerUserUseCase,
      loginUserUseCase,
      verifyEmailUseCase,
      getCurrentUserUseCase,
      authMiddleware,
      passwordService
    );

    const accountRoutes = new AccountRoutes(
      createAccountUseCase,
      getUserAccountsUseCase,
      depositMoneyUseCase,
      transferMoneyUseCase,
      renameAccountUseCase,
      closeAccountUseCase,
      authMiddleware
    );

    const savingsRateRoutes = new SavingsRateRoutes();

    // Mount routes
    this.app.use('/auth', authRoutes.getRouter());
    this.app.use('/accounts', accountRoutes.getRouter());
    this.app.use('/director/savings-rate', authMiddleware.authenticate.bind(authMiddleware), savingsRateRoutes.router);
  }

  private setupErrorHandlers(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public getApp(): Application {
    return this.app;
  }

  public async shutdown(): Promise<void> {
    await this.mongoConnection.disconnect();
  }
}
