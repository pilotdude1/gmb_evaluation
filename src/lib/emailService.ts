import { createClient } from '@supabase/supabase-js';

// Mailgun configuration
const MAILGUN_API_KEY = import.meta.env.VITE_MAILGUN_API_KEY;
const MAILGUN_DOMAIN = import.meta.env.VITE_MAILGUN_DOMAIN;
const MAILGUN_REGION = import.meta.env.VITE_MAILGUN_REGION || 'us';

// Mailgun API endpoint
const MAILGUN_URL = `https://api.${
  MAILGUN_REGION === 'eu' ? 'eu' : 'us'
}.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`;

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export class EmailService {
  private static async sendMailgunEmail(
    options: EmailOptions
  ): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('from', options.from || `noreply@${MAILGUN_DOMAIN}`);
      formData.append('to', options.to);
      formData.append('subject', options.subject);
      formData.append('html', options.html);

      if (options.text) {
        formData.append('text', options.text);
      }

      if (options.replyTo) {
        formData.append('h:Reply-To', options.replyTo);
      }

      const response = await fetch(MAILGUN_URL, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`api:${MAILGUN_API_KEY}`)}`,
        },
        body: formData,
      });

      if (!response.ok) {
        console.error(
          'Mailgun API error:',
          response.status,
          response.statusText
        );
        return false;
      }

      console.log('Email sent successfully via Mailgun');
      return true;
    } catch (error) {
      console.error('Error sending email via Mailgun:', error);
      return false;
    }
  }

  // Send welcome email
  static async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Welcome to LocalSocialMax!</h2>
        <p>Hi ${name},</p>
        <p>Thank you for joining LocalSocialMax. We're excited to have you on board!</p>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <br>
        <p>Best regards,<br>The LocalSocialMax Team</p>
      </div>
    `;

    return this.sendMailgunEmail({
      to: email,
      subject: 'Welcome to LocalSocialMax!',
      html,
    });
  }

  // Send password reset email
  static async sendPasswordResetEmail(
    email: string,
    resetUrl: string
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Password Reset Request</h2>
        <p>You requested a password reset for your LocalSocialMax account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Reset Password</a>
        <p>If you didn't request this reset, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <br>
        <p>Best regards,<br>The LocalSocialMax Team</p>
      </div>
    `;

    return this.sendMailgunEmail({
      to: email,
      subject: 'Password Reset - LocalSocialMax',
      html,
    });
  }

  // Send email verification
  static async sendEmailVerification(
    email: string,
    verificationUrl: string
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Verify Your Email</h2>
        <p>Please verify your email address to complete your LocalSocialMax registration.</p>
        <a href="${verificationUrl}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Verify Email</a>
        <p>If you didn't create an account, you can safely ignore this email.</p>
        <br>
        <p>Best regards,<br>The LocalSocialMax Team</p>
      </div>
    `;

    return this.sendMailgunEmail({
      to: email,
      subject: 'Verify Your Email - LocalSocialMax',
      html,
    });
  }

  // Send magic link email
  static async sendMagicLinkEmail(
    email: string,
    magicLink: string
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Your Magic Link</h2>
        <p>Click the button below to sign in to LocalSocialMax:</p>
        <a href="${magicLink}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">Sign In</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this link, you can safely ignore this email.</p>
        <br>
        <p>Best regards,<br>The LocalSocialMax Team</p>
      </div>
    `;

    return this.sendMailgunEmail({
      to: email,
      subject: 'Your Magic Link - LocalSocialMax',
      html,
    });
  }

  // Generic email sender
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    return this.sendMailgunEmail(options);
  }
}
