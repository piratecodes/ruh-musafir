import { Controller, Get, Post, Patch, Param, Delete, Body, UseGuards, UseInterceptors, UploadedFiles, BadRequestException, NotFoundException } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import * as fs from 'fs';

import { RoomsService } from './rooms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// ==========================================
// FILE STORAGE SETUP FOR ROOM GALLERIES
// ==========================================
const UPLOAD_DIR = './uploads/rooms';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // ==========================================
  // PUBLIC ROUTES (No JWT Required)
  // ==========================================
  
  // Trigger: GET http://localhost:3001/api/v1/rooms/public
  // Use case: Your guest-facing booking website
  @Get('public')
  async getPublicRooms() {
    const rooms = await this.roomsService.findAllActive();
    return { success: true, count: rooms.length, data: rooms };
  }

  // ==========================================
  // PROTECTED ADMIN ROUTES (JWT Required)
  // ==========================================

  // Trigger: GET http://localhost:3001/api/v1/rooms
  // Use case: Admin Dashboard (needs to see deactivated rooms too)
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllRoomsAdmin() {
    return this.roomsService.findAllForAdmin();
  }

  // Trigger: GET http://localhost:3001/api/v1/rooms/public/:slug
  @Get('public/:slug')
  async getPublicRoomBySlug(@Param('slug') slug: string) {
    const room = await this.roomsService.findBySlug(slug);
    
    // If Prisma finds nothing, throw a 404 error so the frontend knows to redirect
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    
    return { success: true, data: room };
  }

  // Trigger: POST http://localhost:3001/api/v1/rooms
  // Use case: Create OR Update a room (handles the complex Dorm/Bed logic AND Multiple Images)
  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor('newImages', 10, { // Allow up to 10 images at once
    storage: diskStorage({
      destination: UPLOAD_DIR,
      filename: (req, file, cb) => {
        // Generate a random, secure filename so uploads don't overwrite each other
        const uniqueSuffix = uuidv4();
        cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per image
    fileFilter: (req, file, cb) => {
      // Security: Only allow image files
      if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Only image files are allowed!'), false);
      }
    }
  }))
  async saveRoom(
    @Body() body: any, 
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    // Because we are using FormData (for images), the JSON data comes in as a stringified field.
    const parsedData = JSON.parse(body.roomData);
    
    // Process the newly uploaded files and format their paths
    const newFileNames = files && files.length > 0 ? files.map(f => `rooms/${f.filename}`) : [];
    
    // Combine images the admin kept + newly uploaded images
    const finalImages = [...(parsedData.existingImages || []), ...newFileNames];
    
    // Attach the final images array to the data before sending to the service
    parsedData.images = finalImages;

    const savedRoom = await this.roomsService.saveRoom(parsedData);
    return { success: true, message: 'Inventory and Gallery saved securely!', data: savedRoom };
  }

  // Trigger: PATCH http://localhost:3001/api/v1/rooms/{id}/toggle-active
  // Use case: Soft Delete / Deactivate a room
  @UseGuards(JwtAuthGuard)
  @Patch(':id/toggle-active')
  async toggleActive(@Param('id') id: string) {
    const updatedRoom = await this.roomsService.toggleActive(id);
    return { success: true, message: 'Room status toggled successfully.', data: updatedRoom };
  }

  // Trigger: DELETE http://localhost:3001/api/v1/rooms/{id}
  // Use case: Hard Delete (Wipes room and all connected beds)
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteRoom(@Param('id') id: string) {
    await this.roomsService.hardDelete(id);
    return { success: true, message: 'Room permanently deleted.' };
  }
}