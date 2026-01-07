import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { EmailOptions, IEmailService } from '../../application/interfaces/email-service.interface';

@Injectable()
export class EmailService implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Create a transporter using Mailpit for development
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST', 'mailpit'),
      port: this.configService.get<number>('EMAIL_PORT', 1025),
      secure: false,
      // Remove auth for Mailpit as it doesn't require authentication
      tls: {
        rejectUnauthorized: false, // Accept self-signed certificates in development
      },
    });
  }

  /**
   * Send an email
   * @param options Email options including recipient, subject, and content
   */
  async sendEmail(options: EmailOptions): Promise<void> {
    const mailOptions = {
      from: this.configService.get<string>('EMAIL_FROM', 'noreply@avenirbank.com'),
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    await this.transporter.sendMail(mailOptions);
  }

  /**
   * Send an email verification email
   * @param to Recipient email address
   * @param token Verification token
   * @param name Recipient name
   */
  async sendVerificationEmail(to: string, token: string, name: string): Promise<void> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
    
    const subject = 'AVENIR Bank - Verify Your Email Address';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a365d;">Welcome to AVENIR Bank!</h2>
        <p>Hello ${name},</p>
        <p>Thank you for registering with AVENIR Bank. To complete your registration and access your account, please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #1a365d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email Address</a>
        </div>
        <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not create an account with AVENIR Bank, please ignore this email.</p>
        <p>Best regards,<br>The AVENIR Bank Team</p>
      </div>
    `;
    
    const text = `
      Welcome to AVENIR Bank!
      
      Hello ${name},
      
      Thank you for registering with AVENIR Bank. To complete your registration and access your account, please verify your email address by visiting the link below:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you did not create an account with AVENIR Bank, please ignore this email.
      
      Best regards,
      The AVENIR Bank Team
    `;
    
    await this.sendEmail({
      to,
      subject,
      text,
      html,
    });
  }
}
