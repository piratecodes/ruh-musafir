import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  attachments?: any[];
}

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: Number(process.env.EMAIL_PORT) === 465, // true for 465 (SSL), false for 25/587 (TLS)
      
      // PRO FIX: Only pass the 'auth' object if BOTH EMAIL_USER and EMAIL_PASS exist
      // This is absolutely critical for VPS environments using localhost Postfix/Sendmail on port 25 without auth
      ...(process.env.EMAIL_USER && process.env.EMAIL_PASS ? {
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        }
      } : {}),
      
      tls: {
        // Prevents blocking due to self-signed certificates
        rejectUnauthorized: false 
      }
    });
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    const fromName = process.env.EMAIL_FROM_NAME || 'Ruh Musafir Sanctuary';
    const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@ruhmusafir.com';

    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`📧 Email sent successfully! Response: ${info.response}`);
    } catch (error) {
      this.logger.error(`❌ NODEMAILER ERROR: ${error.message}`, error.stack);
      throw error;
    }
  }
}
