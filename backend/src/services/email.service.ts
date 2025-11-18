import nodemailer from 'nodemailer';
import { config } from '../config';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendVerificationEmail(email: string, verificationToken: string) {
    const verificationUrl = `${config.frontendUrl}/verify-email?token=${verificationToken}`;

    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@animeshorts.com',
      to: email,
      subject: 'Verify your email - AnimeShorts',
      html: `
        <h1>Welcome to AnimeShorts!</h1>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;

    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@animeshorts.com',
      to: email,
      subject: 'Reset your password - AnimeShorts',
      html: `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });
  }

  async sendVideoProcessedEmail(email: string, videoId: string, videoTitle: string) {
    const videoUrl = `${config.frontendUrl}/video/${videoId}`;

    await this.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@animeshorts.com',
      to: email,
      subject: `Your video "${videoTitle}" is ready!`,
      html: `
        <h1>Video Processing Complete</h1>
        <p>Your video "${videoTitle}" has been processed and is now live!</p>
        <a href="${videoUrl}">View Video</a>
      `,
    });
  }
}

export const emailService = new EmailService();
