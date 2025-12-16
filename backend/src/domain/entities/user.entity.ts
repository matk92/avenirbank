/**
 * User Entity - Domain Layer
 * Pure business logic, no framework dependencies
 */

export enum UserRole {
  CLIENT = 'CLIENT',
  ADVISOR = 'ADVISOR',
  DIRECTOR = 'DIRECTOR',
}

export class User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  passwordHash: string;
  role: UserRole;
  isEmailConfirmed: boolean;
  emailConfirmationToken?: string;
  emailConfirmationTokenExpiry?: Date;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(
    id: string,
    email: string,
    firstName: string,
    lastName: string,
    passwordHash: string,
    role: UserRole,
  ) {
    this.id = id;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.passwordHash = passwordHash;
    this.role = role;
    this.isEmailConfirmed = false;
    this.isBanned = false;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Confirm user email
   */
  confirmEmail(): void {
    if (this.isEmailConfirmed) {
      throw new Error('Email already confirmed');
    }
    this.isEmailConfirmed = true;
    this.emailConfirmationToken = undefined;
    this.emailConfirmationTokenExpiry = undefined;
  }

  /**
   * Ban user
   */
  ban(): void {
    if (this.isBanned) {
      throw new Error('User already banned');
    }
    this.isBanned = true;
  }

  /**
   * Unban user
   */
  unban(): void {
    if (!this.isBanned) {
      throw new Error('User is not banned');
    }
    this.isBanned = false;
  }

  /**
   * Check if user can perform action (not banned, email confirmed)
   */
  canPerformAction(): boolean {
    return !this.isBanned && this.isEmailConfirmed;
  }

  /**
   * Check if user is director
   */
  isDirector(): boolean {
    return this.role === UserRole.DIRECTOR;
  }

  /**
   * Check if user is advisor
   */
  isAdvisor(): boolean {
    return this.role === UserRole.ADVISOR;
  }

  /**
   * Check if user is client
   */
  isClient(): boolean {
    return this.role === UserRole.CLIENT;
  }
}
