import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { SetSavingsRateUseCase } from '@application/use-cases/savings/SetSavingsRateUseCase';
import { GetCurrentSavingsRateUseCase } from '@application/use-cases/savings/GetCurrentSavingsRateUseCase';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { UserRole } from '@domain/entities/User';

export class SavingsRateRoutes {
  public router: Router;
  private setSavingsRateUseCase: SetSavingsRateUseCase;
  private getCurrentSavingsRateUseCase: GetCurrentSavingsRateUseCase;

  constructor() {
    this.router = Router();
    this.setSavingsRateUseCase = new SetSavingsRateUseCase();
    this.getCurrentSavingsRateUseCase = new GetCurrentSavingsRateUseCase();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.get(
      '/',
      this.getCurrentRate.bind(this)
    );

    this.router.post(
      '/',
      [
        body('rate').isFloat({ min: 0, max: 100 }).withMessage('Rate must be between 0 and 100'),
        body('effectiveDate').optional().isISO8601().withMessage('Invalid date format')
      ],
      this.setSavingsRate.bind(this)
    );
  }

  private async getCurrentRate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.DIRECTOR) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Director role required.',
          error: 'Forbidden'
        });
        return;
      }

      const rate = await this.getCurrentSavingsRateUseCase.execute();

      if (!rate) {
        res.status(200).json({
          success: true,
          data: {
            rate: null,
            message: 'No savings rate has been set yet'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: rate.toPublicObject()
      });
    } catch (error) {
      const err = error as Error;
      res.status(500).json({
        success: false,
        message: err.message,
        error: 'Internal Server Error'
      });
    }
  }

  private async setSavingsRate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user || req.user.role !== UserRole.DIRECTOR) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Director role required.',
          error: 'Forbidden'
        });
        return;
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
        return;
      }

      const { rate, effectiveDate } = req.body as { rate: number; effectiveDate?: string };
      const parsedEffectiveDate = effectiveDate ? new Date(effectiveDate) : new Date();

      const savingsRate = await this.setSavingsRateUseCase.execute({
        rate,
        effectiveDate: parsedEffectiveDate,
        setBy: req.user.userId
      });

      res.status(201).json({
        success: true,
        data: {
          ...savingsRate.toPublicObject(),
          message: `Savings rate set to ${savingsRate.rate}%. All clients with savings accounts have been notified.`
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
}
