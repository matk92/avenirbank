import { Request, Response, NextFunction } from 'express';
import { JwtTokenService } from '@infrastructure/services/JwtTokenService';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export class AuthMiddleware {
  constructor(private readonly tokenService: JwtTokenService) {}

  public authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'No token provided',
          error: 'Unauthorized'
        });
        return;
      }

      const token = authHeader.substring(7);
      const payload = await this.tokenService.verifyAccessToken(token);

      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role
      };

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: 'Unauthorized'
      });
    }
  };

  public requireRole = (allowedRoles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: 'Unauthorized'
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
          error: 'Forbidden'
        });
        return;
      }

      next();
    };
  };
}
