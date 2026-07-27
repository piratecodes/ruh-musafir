import { Controller, Post, Get, Patch, Delete, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ==========================================
  // PUBLIC ROUTES (No Login Required)
  // ==========================================
  
  @Get('check-availability')
  async checkAvailability(
    @Query('checkin') checkin: string,
    @Query('checkout') checkout: string,
    @Query('guests') guests?: string,
    @Query('type') type?: string
  ) {
    const availableRooms = await this.bookingsService.getAvailableRooms(checkin, checkout, guests, type);
    return { success: true, data: availableRooms };
  }

  // ==========================================
  // PROTECTED ROUTES (Login Required)
  // ==========================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  @Get()
  async getAllBookingsForAdmin() {
    return await this.bookingsService.findAllForAdmin(); 
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/ledger')
  async getBookingLedger(@Param('id') id: string) {
    const ledger = await this.bookingsService.getUnifiedLedger(id);
    return { success: true, data: ledger };
  }

  // --- NEW: RECEIPT RECOVERY ENDPOINTS ---
  @UseGuards(JwtAuthGuard)
  @Get(':id/download-receipt')
  async downloadReceipt(@Param('id') id: string) {
    // Sends the PDF securely as Base64 to bypass frontend download restrictions
    const base64Data = await this.bookingsService.downloadReceipt(id);
    return { success: true, data: base64Data };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/email-receipt')
  async emailReceipt(@Param('id') id: string) {
    await this.bookingsService.emailReceipt(id);
    return { success: true, message: 'Receipt re-sent to guest.' };
  }
  // ---------------------------------------

  @UseGuards(JwtAuthGuard)
  @Post(':id/settle')
  async settleAndCheckOut(
    @Param('id') id: string,
    @Body('method') method?: string,
    @Body('amount') amount?: number 
  ) {
    const result = await this.bookingsService.settlePayment(id, method || 'CASH', amount);
    return { success: true, message: 'Payment collected successfully!', data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createBooking(@Request() req, @Body() bookingData: any) {
    const userId = req.user?.sub || null; 
    const booking = await this.bookingsService.create(userId, bookingData);
    return { success: true, message: 'Booking successful!', data: booking };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-bookings')
  async getMyBookings(@Request() req) {
    const bookings = await this.bookingsService.findMyBookings(req.user.sub);
    return { success: true, count: bookings.length, data: bookings };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateBookingStatus(@Param('id') id: string, @Body('status') status: string) {
    const updated = await this.bookingsService.updateStatus(id, status);
    return { success: true, message: `Status updated to ${status}`, data: updated };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateBookingDetails(@Param('id') id: string, @Request() req, @Body() updateData: any) {
    const updated = await this.bookingsService.updateDetails(id, req.user?.sub || null, req.user.role, updateData);
    return { success: true, message: 'Booking details updated!', data: updated };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/adjustments')
  async addFolioAdjustment(
    @Param('id') id: string,
    @Request() req,
    @Body('amount') amount: number,
    @Body('reason') reason: string
  ) {
    const userId = req.user?.sub || null;
    const result = await this.bookingsService.addFolioAdjustment(id, amount, reason, userId);
    return { success: true, message: 'Adjustment added successfully', data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async cancelMyBooking(@Param('id') id: string, @Request() req) {
    const cancelledBooking = await this.bookingsService.cancelBooking(id, req.user?.sub || null, req.user.role);
    return { success: true, message: 'Booking has been successfully cancelled.', data: cancelledBooking };
  }
}