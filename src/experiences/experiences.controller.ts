import { Controller, Get, Post, Patch, Param, Delete, Body, UseGuards, UseInterceptors, UploadedFiles, BadRequestException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import * as fs from 'fs';

import { ExperiencesService } from './experiences.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Create a dedicated folder for experience images
const UPLOAD_DIR = './uploads/experiences';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  // Public route for the guest-facing website
  @Get('public')
  async getPublicExperiences() {
    const data = await this.experiencesService.findAllActive();
    return { success: true, count: data.length, data };
  }

  // Admin route to see everything (including deactivated ones)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllAdmin() {
    return this.experiencesService.findAllForAdmin();
  }

  // Create or Update with Multiple Image Uploads
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('newImages', 5, { // Max 5 images per experience
    storage: diskStorage({
      destination: UPLOAD_DIR,
      filename: (req, file, cb) => {
        cb(null, `${uuidv4()}${extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) cb(null, true);
      else cb(new BadRequestException('Only image files are allowed!'), false);
    }
  }))
  async saveExperience(@Body() body: any, @UploadedFiles() files: Array<Express.Multer.File>) {
    const parsedData = JSON.parse(body.experienceData);
    
    const newFileNames = files && files.length > 0 ? files.map(f => `experiences/${f.filename}`) : [];
    parsedData.images = [...(parsedData.existingImages || []), ...newFileNames];

    const saved = await this.experiencesService.saveExperience(parsedData);
    return { success: true, message: 'Experience saved securely!', data: saved };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/toggle-active')
  async toggleActive(@Param('id') id: string) {
    const updated = await this.experiencesService.toggleActive(id);
    return { success: true, message: 'Status toggled successfully.', data: updated };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteExperience(@Param('id') id: string) {
    await this.experiencesService.hardDelete(id);
    return { success: true, message: 'Experience permanently deleted.' };
  }
}