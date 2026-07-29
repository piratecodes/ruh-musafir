import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { OurStoriesService } from './our-stories.service';
import { CreateStoryDto, UpdateStoryDto } from './dto/our-stories.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';

const UPLOAD_DIR = './uploads/our-stories';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const multerOptions = {
  storage: diskStorage({
    destination: UPLOAD_DIR,
    filename: (req, file, cb) => {
      const uniqueSuffix = uuidv4();
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      return cb(new BadRequestException('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024, fieldSize: 50 * 1024 * 1024 }, // 5MB files, 50MB fields for base64
};

@Controller('our-stories')
export class OurStoriesController {
  constructor(private readonly ourStoriesService: OurStoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @UseInterceptors(FileInterceptor('coverImage', multerOptions))
  async create(@Body() body: any, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
    const authorId = req.user.sub || req.user.id;
    let createStoryDto: CreateStoryDto;
    
    // Parse the body back to DTO since we are using FormData
    try {
      createStoryDto = {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: body.content,
        category: body.category,
        isPublished: body.isPublished === 'true' || body.isPublished === true,
        faqs: body.faqs ? JSON.parse(body.faqs) : undefined,
        customAuthor: body.customAuthor,
        seoMetaTitle: body.seoMetaTitle,
        seoMetaDescription: body.seoMetaDescription,
        seoMetaKeywords: body.seoMetaKeywords,
        seoCanonicalUrl: body.seoCanonicalUrl,
        seoJsonLdSchema: body.seoJsonLdSchema,
        seoIsNoIndex: body.seoIsNoIndex === 'true' || body.seoIsNoIndex === true,
        coverImage: file ? `/uploads/our-stories/${file.filename}` : undefined,
      };
    } catch (e) {
      throw new BadRequestException('Invalid data format');
    }

    const story = await this.ourStoriesService.create(createStoryDto, authorId);
    return { success: true, message: 'Story created successfully', data: { blog: story } };
  }

  @Get()
  async findAll() {
    const stories = await this.ourStoriesService.findAll();
    return { success: true, data: { blogs: stories } };
  }

  @Get('categories')
  async getCategories() {
    const categories = await this.ourStoriesService.getCategories();
    return { success: true, data: { categories } };
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const story = await this.ourStoriesService.findOne(slug);
    return { success: true, data: { blog: story } };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @UseInterceptors(FileInterceptor('coverImage', multerOptions))
  async update(@Param('id') id: string, @Body() body: any, @UploadedFile() file: Express.Multer.File) {
    let updateStoryDto: UpdateStoryDto;
    
    try {
      updateStoryDto = {
        ...body,
        isPublished: body.isPublished === 'true' || body.isPublished === true,
        seoIsNoIndex: body.seoIsNoIndex === 'true' || body.seoIsNoIndex === true,
        faqs: body.faqs ? JSON.parse(body.faqs) : undefined,
      };
      if (file) {
        updateStoryDto.coverImage = `/uploads/our-stories/${file.filename}`;
      } else if (body.coverImage === 'null' || body.coverImage === '') {
        updateStoryDto.coverImage = null; // Explicitly deleted image
      } else if (body.coverImage) {
        updateStoryDto.coverImage = body.coverImage; // Retained existing image path
      }
    } catch (e) {
      throw new BadRequestException('Invalid data format');
    }

    const story = await this.ourStoriesService.update(id, updateStoryDto);
    return { success: true, message: 'Story updated successfully', data: { blog: story } };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async remove(@Param('id') id: string) {
    await this.ourStoriesService.remove(id);
    return { success: true, message: 'Story deleted successfully' };
  }
}
