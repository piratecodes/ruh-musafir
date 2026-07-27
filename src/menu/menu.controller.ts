import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import * as fs from 'fs';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

const UPLOAD_DIR = './uploads/menu';
if (!fs.existsSync(UPLOAD_DIR)) { fs.mkdirSync(UPLOAD_DIR, { recursive: true }); }


@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // --- CATEGORY ROUTES (Must go above /:id routes) ---
  @Get('categories')
  async getCategories() {
    const categories = await this.menuService.findAllCategories();
    return { success: true, data: categories };
  }

  @UseGuards(JwtAuthGuard)
  @Post('categories')
  async createCategory(@Body('name') name: string) {
    const newCat = await this.menuService.createCategory(name);
    return { success: true, message: 'Category added to database!', data: newCat };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('category/:name/toggle')
  async toggleCategory(@Param('name') name: string) {
    const res = await this.menuService.toggleCategory(name);
    return { success: true, message: `${name} stock toggled.`, affected: res.count };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('category/:name')
  async deleteCategory(@Param('name') name: string) {
    const res = await this.menuService.deleteCategory(name);
    return { success: true, message: `${name} category permanently deleted.` };
  }

  // --- MENU ITEM ROUTES ---
  @Get()
  async getMenu() {
    const items = await this.menuService.findAllActive();
    return { success: true, count: items.length, data: items };
  }

  @Get(':id')
  async getMenuItem(@Param('id') id: string) {
    const item = await this.menuService.findOne(id);
    if (!item) return { success: false, message: 'Menu item not found' };
    return { success: true, data: item };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: UPLOAD_DIR,
      filename: (req, file, cb) => cb(null, `${uuidv4()}${extname(file.originalname)}`),
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) cb(null, true);
      else cb(new BadRequestException('Only images allowed!'), false);
    }
  }))
  async saveMenuItem(@Body() body: any, @UploadedFile() file: Express.Multer.File) {
    const parsedData = JSON.parse(body.menuData);
    
    if (file) { parsedData.image = `menu/${file.filename}`; }

    if (parsedData.id) {
      const updatedItem = await this.menuService.update(parsedData.id, parsedData);
      return { success: true, message: 'Menu item updated!', data: updatedItem };
    } else {
      const newItem = await this.menuService.create(parsedData);
      return { success: true, message: 'Item added to menu!', data: newItem };
    }
  }

  @Patch(':id/toggle')
  async toggleStock(@Param('id') id: string) {
    const updated = await this.menuService.toggleStock(id);
    return { success: true, data: updated };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteMenuItem(@Param('id') id: string) {
    await this.menuService.remove(id);
    return { success: true, message: 'Menu item removed permanently.' };
  }
}