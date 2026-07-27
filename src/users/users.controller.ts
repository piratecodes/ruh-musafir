import { Controller, Get, Param, Patch, Delete, Body, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import * as fs from 'fs';

import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Prisma } from '@prisma/client';

const UPLOAD_DIR = './uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Patch('me/profile')
  @UseInterceptors(FileInterceptor('photo', {
    storage: diskStorage({
      destination: UPLOAD_DIR,
      filename: (req, file, cb) => {
        const uniqueSuffix = uuidv4();
        const ext = extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only image files are allowed!'), false);
      }
    }
  }))
  async updateMyProfile(
    @Request() req, 
    @Body() body: any, 
    @UploadedFile() file: Express.Multer.File
  ) {
    const userId = req.user.sub;
    const currentUser = await this.usersService.findById(userId);

    // THE FIX: Ensure currentUser exists to prevent 500 crashes
    if (!currentUser) {
      throw new BadRequestException('User profile not found.');
    }

    const updateData: any = {
      ...(body.firstName && { firstName: body.firstName }),
      ...(body.lastName && { lastName: body.lastName }),
      ...(body.phone && { phone: body.phone }),
      ...(body.designation && { designation: body.designation }),
      ...(body.bio && { bio: body.bio }),
    };

    if (file) {
      updateData.profilePic = file.filename;
      if (currentUser.profilePic) {
        this.usersService.deleteOldProfilePic(currentUser.profilePic);
      }
    }

    // THE FIX: Prevent Prisma from throwing a 500 error on an empty object
    if (Object.keys(updateData).length === 0) {
      const { passwordHash, ...safeUser } = currentUser;
      return { success: true, message: 'No changes detected.', data: safeUser };
    }

    const updatedUser = await this.usersService.update(userId, updateData);
    const { passwordHash, ...safeUser } = updatedUser;
    
    return { success: true, message: 'Profile updated successfully!', data: safeUser };
  }

  @Get(':email')
  async getUserByEmail(@Param('email') email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return { success: false, message: 'User not found' };
    const { passwordHash, ...safeUser } = user;
    return { success: true, data: safeUser };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (user && user.profilePic) {
      this.usersService.deleteOldProfilePic(user.profilePic);
    }
    await this.usersService.remove(id);
    return { success: true, message: 'User permanently deleted.' };
  }
}