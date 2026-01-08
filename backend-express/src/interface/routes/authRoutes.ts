import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { RegisterUserUseCase } from '@application/use-cases/auth/RegisterUserUseCase';
import { LoginUserUseCase } from '@application/use-cases/auth/LoginUserUseCase';
import { VerifyEmailUseCase } from '@application/use-cases/auth/VerifyEmailUseCase';
import { GetCurrentUserUseCase } from '@application/use-cases/auth/GetCurrentUserUseCase';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { BcryptPasswordService } from '@infrastructure/services/BcryptPasswordService';

export class AuthRoutes {
  private router: Router;

  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly verifyEmailUseCase: VerifyEmailUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly authMiddleware: AuthMiddleware,
    private readonly passwordService: BcryptPasswordService
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // POST /auth/register - Register new user
    this.router.post(
      '/register',
      [
        body('email').isEmail().withMessage('Invalid email format'),
        body('password')
          .isLength({ min: 8 })
          .withMessage('Password must be at least 8 characters')
          .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
          .withMessage('Password must contain uppercase, lowercase, number and special character'),
        body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
        body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters')
      ],
      this.register.bind(this)
    );

    // POST /auth/login - Login user
    this.router.post(
      '/login',
      [
        body('email').isEmail().withMessage('Invalid email format'),
        body('password').notEmpty().withMessage('Password is required')
      ],
      this.login.bind(this)
    );

    // GET /auth/verify-email/:token - Verify email
    this.router.get('/verify-email/:token', this.verifyEmail.bind(this));

    // GET /auth/me - Get current user
    this.router.get('/me', this.authMiddleware.authenticate, this.getCurrentUser.bind(this));
  }

  private async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { email, password, firstName, lastName } = req.body as { email: string; password: string; firstName: string; lastName: string };

      // Hash password before creating user
      const hashedPassword = await this.passwordService.hash(password);

      const result = await this.registerUserUseCase.execute({
        email,
        password: hashedPassword,
        firstName,
        lastName
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        data: {
          user: result.user.toPublicObject()
        }
      });
    } catch (error) {
      const err = error as Error;
      res.status(400).json({
        success: false,
        message: err.message,
        error: 'Bad Request'
      });
    }
  }

  private async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { email, password } = req.body as { email: string; password: string };

      const result = await this.loginUserUseCase.execute({
        email,
        password
      });

      res.status(200).json({
        success: true,
        data: {
          access_token: result.accessToken,
          user: result.user.toPublicObject()
        }
      });
    } catch (error) {
      const err = error as Error;
      res.status(401).json({
        success: false,
        message: err.message,
        error: 'Unauthorized'
      });
    }
  }

  private async verifyEmail(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { token } = req.params as { token: string };

      const result = await this.verifyEmailUseCase.execute({ token });

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          user: result.user.toPublicObject()
        }
      });
    } catch (error) {
      const err = error as Error;
      res.status(400).json({
        success: false,
        message: err.message,
        error: 'Bad Request'
      });
    }
  }

  private async getCurrentUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'Unauthorized'
        });
        return;
      }

      const result = await this.getCurrentUserUseCase.execute({
        userId: req.user.userId
      });

      res.status(200).json({
        success: true,
        data: {
          user: result.user.toPublicObject()
        }
      });
    } catch (error) {
      const err = error as Error;
      res.status(404).json({
        success: false,
        message: err.message,
        error: 'Not Found'
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
