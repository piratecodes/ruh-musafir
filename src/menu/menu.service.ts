import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, MenuItem, MenuCategory } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // --- MENU ITEMS ---
  async findAllActive(): Promise<MenuItem[]> {
    return this.prisma.menuItem.findMany({
      orderBy: { category: 'asc' }, 
    });
  }

  async findOne(id: string): Promise<MenuItem | null> {
    return this.prisma.menuItem.findUnique({ where: { id } });
  }

  async create(data: Prisma.MenuItemCreateInput): Promise<MenuItem> {
    return this.prisma.menuItem.create({ data });
  }

  async update(id: string, data: Prisma.MenuItemUpdateInput): Promise<MenuItem> {
    return this.prisma.menuItem.update({ where: { id }, data });
  }

  async remove(id: string): Promise<MenuItem> {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    
    // If the item had an image, physically delete it from the server
    if (item && item.image) {
      const filePath = path.join(process.cwd(), 'uploads', item.image);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath); // Wipes the file from the disk
      }
    }

    return this.prisma.menuItem.delete({ where: { id } });
  }

  async toggleStock(id: string): Promise<MenuItem> {
    const item = await this.prisma.menuItem.findUnique({ where: { id } });
    return this.prisma.menuItem.update({
      where: { id },
      data: { isAvailable: !item.isAvailable }
    });
  }

  // --- PERSISTENT CATEGORY ENGINE ---

  async findAllCategories(): Promise<MenuCategory[]> {
    return this.prisma.menuCategory.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async createCategory(name: string): Promise<MenuCategory> {
    // Upsert ensures we don't crash if a category is accidentally created twice
    return this.prisma.menuCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  async toggleCategory(name: string): Promise<any> {
    const category = await this.prisma.menuCategory.findUnique({ where: { name } });
    if (!category) return { count: 0 };
    
    const newStatus = !category.isActive;
    
    // 1. Update the parent Category state
    await this.prisma.menuCategory.update({
      where: { name },
      data: { isActive: newStatus }
    });

    // 2. Cascade the state down to all child items
    return this.prisma.menuItem.updateMany({
      where: { category: name },
      data: { isAvailable: newStatus }
    });
  }

  async deleteCategory(name: string): Promise<any> {
    // 1. Hard Delete all menu items inside this category first
    await this.prisma.menuItem.deleteMany({
      where: { category: name }
    });

    // 2. Hard Delete the category wrapper itself
    return this.prisma.menuCategory.delete({
      where: { name }
    });
  }
}