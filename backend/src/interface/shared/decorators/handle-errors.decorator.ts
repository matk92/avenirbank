/**
 * Handle Errors Decorator - Interface Layer
 * Decorator for automatic error handling in controllers
 */

import { ErrorHandlerUtil } from '../utils/error-handler.util';

export type ErrorHandlerType = 'account' | 'auth' | 'generic';

/**
 * Decorator that automatically handles common errors in controller methods
 */
export function HandleErrors(type: ErrorHandlerType, context?: string) {
  return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]): Promise<any> {
      try {
        return await method.apply(this, args);
      } catch (error) {
        switch (type) {
          case 'account':
            ErrorHandlerUtil.handleAccountOperationError(error as Error);
            break;
          case 'auth':
            ErrorHandlerUtil.handleAuthError(error as Error, context || 'authentication');
            break;
          case 'generic':
            ErrorHandlerUtil.handleGenericError(error as Error, context || 'operation');
            break;
          default:
            throw error;
        }
      }
    };

    return descriptor;
  };
}
