/**
 * Common Validators - Interface Layer
 * Standardized validation patterns for DTOs
 */

import { ValidationOptions, registerDecorator, ValidationArguments } from 'class-validator';

/**
 * Custom validator for strong passwords
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string): void {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments): boolean {
          if (typeof value !== 'string') return false;
          if (value.length < 8) return false;
          if (value.length > 100) return false;
          return true;
        },
        defaultMessage(_args: ValidationArguments): string {
          return 'Password must be between 8 and 100 characters';
        },
      },
    });
  };
}

/**
 * Custom validator for person names
 */
export function IsPersonName(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string): void {
    registerDecorator({
      name: 'isPersonName',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments): boolean {
          if (typeof value !== 'string') return false;
          if (value.trim().length < 2) return false;
          if (value.trim().length > 50) return false;
          return true;
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be between 2 and 50 characters`;
        },
      },
    });
  };
}

/**
 * Custom validator for account names
 */
export function IsAccountName(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string): void {
    registerDecorator({
      name: 'isAccountName',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments): boolean {
          if (typeof value !== 'string') return false;
          if (value.trim().length < 1) return false;
          if (value.trim().length > 100) return false;
          return true;
        },
        defaultMessage(_args: ValidationArguments): string {
          return 'Account name must be between 1 and 100 characters';
        },
      },
    });
  };
}
