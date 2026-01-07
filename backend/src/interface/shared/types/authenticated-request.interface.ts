/**
 * Authenticated Request Interface - Interface Layer
 * Centralized type definition for authenticated requests
 */

import type { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
