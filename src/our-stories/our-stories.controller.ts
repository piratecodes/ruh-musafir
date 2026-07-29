import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { OurStoriesService } from './our-stories.service';
import { CreateStoryDto, UpdateStoryDto } from './dto/our-stories.dto';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';

@Controller('our-stories')
export class OurStoriesController {
  constructor(private readonly ourStoriesService: OurStoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async create(@Body() createStoryDto: CreateStoryDto, @Req() req: any) {
    const authorId = req.user.id;
    const story = await this.ourStoriesService.create(createStoryDto, authorId);
    return { success: true, message: 'Story created successfully', data: { story } };
  }

  @Get()
  async findAll() {
    const stories = await this.ourStoriesService.findAll();
    return { success: true, data: { stories } };
  }

  @Get('categories')
  async getCategories() {
    const categories = await this.ourStoriesService.getCategories();
    return { success: true, data: { categories } };
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string) {
    const story = await this.ourStoriesService.findOne(slug);
    return { success: true, data: { story } };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async update(@Param('id') id: string, @Body() updateStoryDto: UpdateStoryDto) {
    const story = await this.ourStoriesService.update(id, updateStoryDto);
    return { success: true, message: 'Story updated successfully', data: { story } };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async remove(@Param('id') id: string) {
    await this.ourStoriesService.remove(id);
    return { success: true, message: 'Story deleted successfully' };
  }
}
