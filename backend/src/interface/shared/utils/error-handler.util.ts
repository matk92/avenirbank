/**
 * Error Handler Utility - Interface Layer
 * Centralized error handling for controllers
 */

import {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

export class ErrorHandlerUtil {
  /**
   * Handle common account operation errors
   */
  static handleAccountOperationError(error: Error): never {
    const message = error.message;

    // Insufficient funds
    if (message === 'Insufficient funds in source account') {
      throw new BadRequestException('Insufficient funds in source account');
    }

    // Not found errors
    if (message === 'Source account not found' || message === 'Destination account not found') {
      throw new NotFoundException(message);
    }
    if (message === 'Account not found') {
      throw new NotFoundException('Account not found');
    }
    if (message === 'Target account not found') {
      throw new NotFoundException('Target account not found');
    }
    if (message === 'Recipient not found') {
      throw new NotFoundException('Recipient not found');
    }

    // Authorization errors
    if (message.includes('Unauthorized')) {
      throw new UnauthorizedException(message);
    }

    // Validation errors
    if (message.includes('Transfer amount must be positive')) {
      throw new BadRequestException('Transfer amount must be positive');
    }
    if (message.includes('cannot exceed')) {
      throw new BadRequestException(message);
    }
    if (message.includes('inactive')) {
      throw new BadRequestException(message);
    }
    if (message.includes('Account has balance')) {
      throw new BadRequestException(message);
    }
    if (message.includes('Target account')) {
      throw new BadRequestException(message);
    }

    // Transfer-specific errors
    if (message === 'Recipient has no active account') {
      throw new BadRequestException('Recipient has no active account');
    }
    if (message.includes('Currency mismatch')) {
      throw new BadRequestException(message);
    }
    if (message.includes('Cannot transfer')) {
      throw new BadRequestException(message);
    }

    // Default to internal server error for unknown errors
    throw new InternalServerErrorException('An unexpected error occurred');
  }

  /**
   * Handle authentication-related errors
   */
  static handleAuthError(error: Error, operation: string = 'operation'): never {
    const message = error.message;

    // User already exists
    if (message === 'User with this email already exists') {
      throw new BadRequestException('User with this email already exists');
    }

    // Validation errors
    if (message === 'All fields are required') {
      throw new BadRequestException('All fields are required');
    }
    if (message === 'Email is too long') {
      throw new BadRequestException('Email is too long');
    }
    if (message === 'Password must be at least 8 characters') {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    if (message.includes('must be between 2 and 100 characters')) {
      throw new BadRequestException(message);
    }

    // Default to internal server error
    throw new InternalServerErrorException(`An unexpected error occurred during ${operation}`);
  }

  /**
   * Handle generic operation errors with custom context
   */
  static handleGenericError(error: Error, context: string): never {
    const message = error.message;

    // Common not found patterns
    if (message.includes('not found')) {
      throw new NotFoundException(message);
    }

    // Common unauthorized patterns
    if (message.includes('Unauthorized') || message.includes('unauthorized')) {
      throw new UnauthorizedException(message);
    }

    // Common validation patterns
    if (message.includes('required') || message.includes('invalid') || message.includes('must')) {
      throw new BadRequestException(message);
    }

    // Default to internal server error with context
    throw new InternalServerErrorException(`An unexpected error occurred during ${context}`);
  }
}
