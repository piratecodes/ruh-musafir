import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ExperiencesService {
  constructor(private prisma: PrismaService) {}

  async findAllActive() {
    return this.prisma.experience.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAllForAdmin() {
    return this.prisma.experience.findMany({
      orderBy: { createdAt: 'desc' }
    });
  }

  async saveExperience(data: any) {
    if (!data.id) {
      return this.prisma.experience.create({
        data: {
          name: data.name,
          description: data.description,
          timePeriod: data.timePeriod,
          price: data.price,
          images: data.images,
        }
      });
    }

    return this.prisma.experience.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        timePeriod: data.timePeriod,
        price: data.price,
        images: data.images,
      }
    });
  }

  async toggleActive(id: string) {
    const exp = await this.prisma.experience.findUnique({ where: { id } });
    if (!exp) throw new NotFoundException('Experience not found');
    return this.prisma.experience.update({ where: { id }, data: { isActive: !exp.isActive } });
  }

  // --- THE FIX: PHYSICAL FILE DELETION ADDED ---
  async hardDelete(id: string) {
    const exp = await this.prisma.experience.findUnique({ where: { id } });
    
    // If the experience has images, map through the array and physically delete each one
    if (exp && exp.images && exp.images.length > 0) {
      exp.images.forEach(img => {
        const filePath = path.join(process.cwd(), 'uploads', img);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath); // Wipes the file from the server disk
        }
      });
    }

    await this.prisma.experience.delete({ where: { id } });
    return { success: true };
  }
}