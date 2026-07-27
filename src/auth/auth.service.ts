import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '@/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/prisma/prisma.service'; // <-- NEW
import * as bcrypt from 'bcryptjs';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

import { getWelcomeEmail } from '@/templates/welcome.template';
import { getResetPasswordEmail } from '@/templates/reset-password.template';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService, // <-- INJECTED PRISMA
  ) {}

  async register(data: any, device: string, ipAddress: string) {
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) throw new BadRequestException('Email already in use');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await this.usersService.create({
      email: data.email,
      passwordHash: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    });

    await this.prisma.booking.updateMany({
      where: { 
        guestEmail: user.email,
        userId: null 
      },
      data: { userId: user.id }
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const { passwordHash, ...safeUser } = user;
    const access_token = await this.jwtService.signAsync(payload);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: access_token,
        device: device || 'Unknown Device',
        ipAddress: ipAddress || 'Unknown IP',
      }
    });

    // --- NEW: SEND THE WELCOME EMAIL ---
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `"Ruh Musafir Sanctuary" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: 'Welcome to your Sanctuary - Ruh Musafir',
        html: getWelcomeEmail(user.firstName),
      });
    } catch (emailError) {
      console.error("Welcome email failed to send, but account was created:", emailError);
    }

    return { success: true, data: safeUser, access_token };
  }

  async login(email: string, pass: string, device: string, ipAddress: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email, role: user.role };
    const { passwordHash, ...safeUser } = user;
    const access_token = await this.jwtService.signAsync(payload);

    // --- NEW: Record the Session ---
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: access_token,
        device: device || 'Unknown Device',
        ipAddress: ipAddress || 'Unknown IP',
      }
    });

    return { success: true, data: safeUser, access_token };
  }

  // --- NEW: Session Management Methods ---
  async getActiveSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, isRevoked: false },
      orderBy: { lastActive: 'desc' },
      // We only select what we need so we don't accidentally leak data
      select: { id: true, device: true, ipAddress: true, lastActive: true, token: true }
    });
  }

  async revokeSession(sessionId: string, userId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { isRevoked: true }
    });
  }

  async revokeAllOtherSessions(userId: string, currentToken: string) {
    await this.prisma.session.updateMany({
      where: {
        userId,
        token: { not: currentToken }, // Revoke everything EXCEPT the current session
        isRevoked: false
      },
      data: { isRevoked: true }
    });
  }

  async updatePassword(userId: string, currentPass: string, newPass: string) {
    // 1. Fetch the user to get their current hashed password
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // 2. Verify their current password is correct
    const isMatch = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Incorrect current password');
    }

    // 3. Hash the new password
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPass, salt);

    // 4. Save the new password to the database
    await this.usersService.update(userId, {
      passwordHash: newHashedPassword,
    });

    return { success: true, message: 'Password updated successfully' };
  }

  async logout(token: string) {
    if (!token) return;
    await this.prisma.session.updateMany({
      where: { token },
      data: { isRevoked: true }
    });
  }


  async forgotPassword(email: string) {
    console.log(`\n--- [FORGOT PASSWORD INITIATED] ---`);
    console.log(`Target Email: ${email}`);

    const user = await this.usersService.findByEmail(email);
    
    // 1. Log if the user actually exists in the database
    if (!user) {
      console.log(`Result: FAILED - No user found in database with this email.`);
      console.log(`-----------------------------------\n`);
      return { success: true, message: 'If an account exists, a reset link has been sent.' };
    }

    console.log(`Result: SUCCESS - User found. Generating secure token...`);

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 15 * 60 * 1000);

    // Save to database
    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpires }
    });

    console.log(`Token successfully saved to database. Connecting to Gmail SMTP...`);

    // 2. Try/Catch block to explicitly catch and log Gmail errors
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.GMAIL_USER, 
          pass: process.env.GMAIL_APP_PASSWORD, 
        },
      });

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      await transporter.sendMail({
        from: `"Ruh Musafir Sanctuary" <${process.env.GMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset Request - Ruh Musafir',
        html: getResetPasswordEmail(user.firstName, resetUrl),
      });

      console.log(`Result: SUCCESS - Email dispatched to ${user.email}!`);
      console.log(`-----------------------------------\n`);
      
      return { success: true, message: 'Reset link sent to your email.' };

    } catch (error) {
      console.error(`\n[NODEMAILER ERROR]: Failed to send email!`);
      console.error(error);
      console.log(`-----------------------------------\n`);
      throw new BadRequestException('Email configuration failed. Please check backend logs.');
    }
  }

  async verifyResetToken(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() }
      }
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    return { success: true, message: 'Token is valid' };
  }

async resetPassword(token: string, newPassword: string) {
  // 1. Find user with this token that HAS NOT expired
  const user = await this.prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpires: { gt: new Date() } // Ensures current time is less than expiration
    }
  });

  if (!user) throw new BadRequestException('Invalid or expired reset token. Please request a new one.');

  // 2. Hash the new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // 3. Update password and INVALIDATE the token
  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashedPassword,
      resetToken: null,        // Invalidates the link instantly
      resetTokenExpires: null  
    }
  });

  return { success: true, message: 'Password has been successfully reset.' };
}
}