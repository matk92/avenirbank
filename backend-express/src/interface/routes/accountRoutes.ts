import { Router, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { CreateAccountUseCase } from '@application/use-cases/accounts/CreateAccountUseCase';
import { GetUserAccountsUseCase } from '@application/use-cases/accounts/GetUserAccountsUseCase';
import { DepositMoneyUseCase } from '@application/use-cases/accounts/DepositMoneyUseCase';
import { TransferMoneyUseCase } from '@application/use-cases/accounts/TransferMoneyUseCase';
import { RenameAccountUseCase } from '@application/use-cases/accounts/RenameAccountUseCase';
import { CloseAccountUseCase } from '@application/use-cases/accounts/CloseAccountUseCase';
import { AuthMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';
import { AccountType } from '@domain/entities/Account';

export class AccountRoutes {
  private router: Router;

  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly getUserAccountsUseCase: GetUserAccountsUseCase,
    private readonly depositMoneyUseCase: DepositMoneyUseCase,
    private readonly transferMoneyUseCase: TransferMoneyUseCase,
    private readonly renameAccountUseCase: RenameAccountUseCase,
    private readonly closeAccountUseCase: CloseAccountUseCase,
    private readonly authMiddleware: AuthMiddleware
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // All routes require authentication
    this.router.use(this.authMiddleware.authenticate);

    // GET /accounts - Get user accounts
    this.router.get('/', this.getUserAccounts.bind(this));

    // POST /accounts - Create new account
    this.router.post(
      '/',
      [
        body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Account name must be between 2 and 100 characters'),
        body('type').isIn(Object.values(AccountType)).withMessage('Invalid account type')
      ],
      this.createAccount.bind(this)
    );

    // POST /accounts/:id/deposit - Deposit money
    this.router.post(
      '/:id/deposit',
      [
        param('id').isString().notEmpty().withMessage('Account ID is required'),
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
        body('description').optional().isString()
      ],
      this.depositMoney.bind(this)
    );

    // POST /accounts/transfer - Transfer money between accounts
    this.router.post(
      '/transfer',
      [
        body('fromAccountId').isString().notEmpty().withMessage('Source account ID is required'),
        body('toAccountId').isString().notEmpty().withMessage('Destination account ID is required'),
        body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
        body('description').optional().isString()
      ],
      this.transferMoney.bind(this)
    );

    // PUT /accounts/:id/rename - Rename account
    this.router.put(
      '/:id/rename',
      [
        param('id').isString().notEmpty().withMessage('Account ID is required'),
        body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Account name must be between 2 and 100 characters')
      ],
      this.renameAccount.bind(this)
    );

    // DELETE /accounts/:id - Close account
    this.router.delete(
      '/:id',
      [
        param('id').isString().notEmpty().withMessage('Account ID is required')
      ],
      this.closeAccount.bind(this)
    );
  }

  private async getUserAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'Unauthorized'
        });
        return;
      }

      const result = await this.getUserAccountsUseCase.execute({
        userId: req.user.userId
      });

      res.status(200).json({
        success: true,
        data: {
          accounts: result.accounts.map(account => account.toPlainObject())
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

  private async createAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'Unauthorized'
        });
        return;
      }

      const { name, type } = req.body as { name: string; type: AccountType };

      const result = await this.createAccountUseCase.execute({
        userId: req.user.userId,
        name,
        type
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: {
          account: result.account.toPlainObject()
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

  private async depositMoney(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { id } = req.params as { id: string };
      const { amount, description } = req.body as { amount: number; description?: string };

      const result = await this.depositMoneyUseCase.execute({
        accountId: id,
        amount,
        description
      });

      res.status(200).json({
        success: true,
        message: 'Deposit successful',
        data: {
          account: result.account.toPlainObject(),
          transaction: result.transaction.toPlainObject()
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

  private async transferMoney(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { fromAccountId, toAccountId, amount, description } = req.body as { fromAccountId: string; toAccountId: string; amount: number; description?: string };

      const result = await this.transferMoneyUseCase.execute({
        fromAccountId,
        toAccountId,
        amount,
        description
      });

      res.status(200).json({
        success: true,
        message: 'Transfer successful',
        data: {
          fromAccount: result.fromAccount.toPlainObject(),
          toAccount: result.toAccount.toPlainObject(),
          transaction: result.transaction.toPlainObject()
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

  private async renameAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'Unauthorized'
        });
        return;
      }

      const { id } = req.params as { id: string };
      const { name } = req.body as { name: string };

      const result = await this.renameAccountUseCase.execute({
        accountId: id,
        userId: req.user.userId,
        newName: name
      });

      res.status(200).json({
        success: true,
        message: 'Account renamed successfully',
        data: {
          account: result.account.toPlainObject()
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

  private async closeAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'Unauthorized'
        });
        return;
      }

      const { id } = req.params as { id: string };

      const result = await this.closeAccountUseCase.execute({
        accountId: id,
        userId: req.user.userId
      });

      res.status(200).json({
        success: true,
        message: result.message
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

  public getRouter(): Router {
    return this.router;
  }
}
