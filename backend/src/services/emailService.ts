import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.username,
        pass: config.email.password,
      },
    });
  }

  
  async sendVerificationEmail(email: string, token: string, firstName: string): Promise<void> {
    const verifyUrl = `${config.clientUrl}/verify-email/${token}`;

    const message = {
      from: `${config.email.fromName} <${config.email.fromEmail}>`,
      to: email,
      subject: 'Verify Your Email - Crypto Monitor',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333; text-align: center;">Welcome to Crypto Monitor!</h2>
          <p>Hi ${firstName},</p>
          <p>Thank you for signing up! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>Or copy and paste this URL into your browser:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            Crypto Monitor - Real-time cryptocurrency price monitoring
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(message);
      logger.info(`Verification email sent to: ${email}`);
    } catch (error) {
      logger.error('Error sending verification email:', error);
      throw error;
    }
  }

  
  async sendPasswordResetEmail(email: string, token: string, firstName: string): Promise<void> {
    const resetUrl = `${config.clientUrl}/reset-password/${token}`;

    const message = {
      from: `${config.email.fromName} <${config.email.fromEmail}>`,
      to: email,
      subject: 'Password Reset - Crypto Monitor',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p>Hi ${firstName},</p>
          <p>You requested a password reset for your Crypto Monitor account. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this URL into your browser:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            Crypto Monitor - Real-time cryptocurrency price monitoring
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(message);
      logger.info(`Password reset email sent to: ${email}`);
    } catch (error) {
      logger.error('Error sending password reset email:', error);
      throw error;
    }
  }

  
  async sendAlertEmail(email: string, firstName: string, alert: any, currentPrice: number): Promise<void> {
    const message = {
      from: `${config.email.fromName} <${config.email.fromEmail}>`,
      to: email,
      subject: `Price Alert: ${alert.symbol} - Crypto Monitor`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #333; text-align: center;">🚨 Price Alert Triggered!</h2>
          <p>Hi ${firstName},</p>
          <p>Your price alert for <strong>${alert.symbol}</strong> has been triggered:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Symbol:</strong> ${alert.symbol}</p>
            <p><strong>Condition:</strong> ${alert.condition}</p>
            <p><strong>Current Price:</strong> $${currentPrice.toLocaleString()}</p>
            ${alert.targetPrice ? `<p><strong>Target Price:</strong> $${alert.targetPrice.toLocaleString()}</p>` : ''}
            ${alert.percentageChange ? `<p><strong>Percentage Change:</strong> ${alert.percentageChange}%</p>` : ''}
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${config.clientUrl}/dashboard" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Dashboard
            </a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666; text-align: center;">
            Crypto Monitor - Real-time cryptocurrency price monitoring
          </p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(message);
      logger.info(`Alert email sent to: ${email}`);
    } catch (error) {
      logger.error('Error sending alert email:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();