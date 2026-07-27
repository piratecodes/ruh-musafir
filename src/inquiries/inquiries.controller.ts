import { Controller, Post, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { InquiriesService } from './inquiries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('inquiries')
export class InquiriesController {
  constructor(private readonly inquiriesService: InquiriesService) {}

  // PUBLIC: Next.js website visitors post their contact forms here
  @Post()
  async createInquiry(@Body() data: any) {
    const inquiry = await this.inquiriesService.createInquiry(data);
    return { success: true, message: 'Inquiry received!', data: inquiry };
  }

  // ADMIN ONLY: Dashboard fetching all inquiries
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllInquiries() {
    const inquiries = await this.inquiriesService.findAll();
    return { success: true, data: inquiries };
  }

  // ADMIN ONLY: Updating status (Pending -> Contacted -> Resolved)
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: any) {
    const updated = await this.inquiriesService.updateStatus(id, status);
    return { success: true, data: updated };
  }
}