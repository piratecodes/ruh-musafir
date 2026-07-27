import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'; // Adjust path

@Controller('settings/maintenance')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getStatus() {
    return this.settingsService.getMaintenanceStatus();
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async updateStatus(@Body() data: { isMaintenanceMode: boolean; maintenanceMessage: string }) {
    return this.settingsService.updateMaintenanceStatus(data.isMaintenanceMode, data.maintenanceMessage);
  }
}