/**
 * Email Service Interface - Application Layer
 * Defines the contract for sending emails
 */

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface IEmailService {
  /**
   * Send an email
   * @param options Email options including recipient, subject, and content
   */
  sendEmail(options: EmailOptions): Promise<void>;
  
  /**
   * Send an email verification email
   * @param to Recipient email address
   * @param token Verification token
   * @param name Recipient name
   */
  sendVerificationEmail(to: string, token: string, name: string): Promise<void>;
}
