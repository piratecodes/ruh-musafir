import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service'; // Adjust path

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getMaintenanceStatus() {
    let settings = await this.prisma.systemSettings.findUnique({ where: { id: 'global' } });
    if (!settings) {
      settings = await this.prisma.systemSettings.create({ data: { id: 'global' } });
    }
    return settings;
  }

  async updateMaintenanceStatus(isMaintenanceMode: boolean, maintenanceMessage: string) {
    return this.prisma.systemSettings.upsert({
      where: { id: 'global' },
      update: { isMaintenanceMode, maintenanceMessage },
      create: { id: 'global', isMaintenanceMode, maintenanceMessage },
    });
  }
}