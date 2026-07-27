import { Body, Controller, HttpCode, HttpStatus, BadRequestException, Post, Get, Delete, Param, Patch, Res, Request, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service'; // <-- IMPORTED USERS SERVICE
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService // <-- INJECTED HERE
  ) {}

  @Post('register')
  async register(@Body() body: any, @Res({ passthrough: true }) res: Response, @Request() req) {
    const device = req.headers['user-agent'] || 'Unknown Device';
    const ip = req.ip || req.connection?.remoteAddress || 'Unknown IP';
    
    const result = await this.authService.register(body, device, ip);
    const { access_token, ...userData } = result;

    // THE FIX: Assign specific cookie name based on Role (Isolation)
    const cookieName = (userData.data.role === 'ADMIN' || userData.data.role === 'STAFF') ? 'ruh_admin_token' : 'ruh_auth_token';

    res.cookie(cookieName, access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return { success: true, data: userData.data };
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: any, @Res({ passthrough: true }) res: Response, @Request() req) {
    const device = req.headers['user-agent'] || 'Unknown Device';
    const ip = req.ip || req.connection?.remoteAddress || 'Unknown IP';

    const result = await this.authService.login(body.email, body.password, device, ip);
    const { access_token, ...userData } = result;

    // THE FIX: Assign specific cookie name based on Role (Isolation)
    const cookieName = (userData.data.role === 'ADMIN' || userData.data.role === 'STAFF') ? 'ruh_admin_token' : 'ruh_auth_token';

    res.cookie(cookieName, access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });

    return { success: true, data: userData.data };
  }

  // --- FIX: FETCH FULL USER DATA ---
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req) {
    // req.user only has the token payload {sub, email}. We fetch the full database row here!
    const fullUser = await this.usersService.findById(req.user.sub);
    
    if (!fullUser) {
      return { success: false, message: 'User not found' };
    }

    // Strip the password hash before sending to the frontend
    const { passwordHash, ...safeUser } = fullUser;
    return { success: true, data: safeUser };
  }

  // --- SESSION ENDPOINTS ---
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@Request() req) {
    const sessions = await this.authService.getActiveSessions(req.user.sub);
    const currentToken = req.cookies?.['ruh_admin_token'] || req.cookies?.['ruh_auth_token'];
    
    const safeSessions = sessions.map(s => ({
      id: s.id,
      device: s.device,
      ipAddress: s.ipAddress,
      lastActive: s.lastActive,
      isCurrent: s.token === currentToken 
    }));
    
    return { success: true, data: safeSessions };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:id')
  async revokeSession(@Param('id') id: string, @Request() req) {
    await this.authService.revokeSession(id, req.user.sub);
    return { success: true, message: 'Session revoked successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions')
  async revokeAllOtherSessions(@Request() req) {
    const currentToken = req.cookies?.['ruh_admin_token'] || req.cookies?.['ruh_auth_token'];
    await this.authService.revokeAllOtherSessions(req.user.sub, currentToken);
    return { success: true, message: 'All other sessions revoked successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  async updatePassword(@Request() req, @Body() body: any) {
    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('Current and new passwords are required');
    }
    
    // req.user.sub is the ID extracted securely from the HttpOnly cookie
    return this.authService.updatePassword(
      req.user.sub, 
      body.currentPassword, 
      body.newPassword
    );
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response, @Request() req) {
    // Check both possible tokens and revoke them securely
    const adminToken = req.cookies?.['ruh_admin_token'];
    const guestToken = req.cookies?.['ruh_auth_token'];
    
    if (adminToken) {
      await this.authService.logout(adminToken);
      res.clearCookie('ruh_admin_token');
    }
    if (guestToken) {
      await this.authService.logout(guestToken);
      res.clearCookie('ruh_auth_token');
    }
    return { success: true, message: 'Logged out successfully' };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: any) {
    // 1. Set a trap to catch the exact moment the frontend knocks on the door
    console.log('\n🚨 [API ROUTE HIT]: /auth/forgot-password');
    console.log('📦 Raw Incoming Payload:', body);
    
    // 2. Check if the email was stripped or missing
    if (!body || !body.email) {
      console.log('❌ ERROR: The email field is empty or was stripped by ValidationPipe!');
      throw new BadRequestException('Email is required');
    }

    // 3. Pass the exact email string to the service
    return this.authService.forgotPassword(body.email);
  }

  @Get('verify-reset-token/:token')
  async verifyResetToken(@Param('token') token: string) {
    return this.authService.verifyResetToken(token);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: any) {
    if (!body.token || !body.password) {
      throw new BadRequestException('Token and new password are required');
    }
    return this.authService.resetPassword(body.token, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-account')
  async deleteMyAccount(@Res({ passthrough: true }) res: Response, @Request() req) {
    // THE FIX: Changed .delete() to .remove() to match your users.service.ts
    await this.usersService.remove(req.user.sub); 

    // 2. Clear both secure HttpOnly cookies so they are fully logged out
    res.clearCookie('ruh_auth_token');
    res.clearCookie('ruh_admin_token');
    
    return { success: true, message: 'Account permanently deleted' };
  }
}