import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get('invoice/:bookingId')
  async getInvoice(@Param('bookingId') bookingId: string) {
    const invoice = await this.treasuryService.generateInvoice(bookingId);
    return { success: true, data: invoice };
  }

  @Post('checkout/:bookingId')
  async checkoutGuest(
    @Param('bookingId') bookingId: string,
    @Body('paymentMethod') paymentMethod: string,
    @Request() req
  ) {
    const receipt = await this.treasuryService.processCheckout(
      bookingId, 
      paymentMethod || 'CASH', 
      req.user.sub
    );
    return receipt;
  }

  // --- NEW: DASHBOARD ANALYTICS ---
  @Get('metrics')
  async getMetrics() {
    const metrics = await this.treasuryService.getDashboardMetrics();
    return { success: true, data: metrics };
  }

  // --- NEW: SHIFT MANAGEMENT ---
  @Post('shift/open')
  async openShift(@Body('startingCash') startingCash: number, @Request() req) {
    const shift = await this.treasuryService.openShift(req.user.sub, startingCash || 0);
    return { success: true, message: 'Register opened successfully.', data: shift };
  }

  @Post('shift/close')
  async closeShift(@Body('actualCash') actualCash: number, @Request() req) {
    const shift = await this.treasuryService.closeShift(req.user.sub, actualCash);
    return { success: true, message: 'Register closed securely.', data: shift };
  }

  // --- NEW: EXPENSE TRACKING ---
  // Trigger: GET http://localhost:3001/api/v1/treasury/audit-logs
  @Get('audit-logs')
  async getAuditLogs() {
    const logs = await this.treasuryService.getAuditLogs();
    return { success: true, data: logs };
  }

  // Trigger: POST http://localhost:3001/api/v1/treasury/expenses
  @Post('expenses')
  async logPettyCash(@Body() expenseData: any, @Request() req) {
    const expense = await this.treasuryService.logExpense(req.user.sub, expenseData);
    return { success: true, message: 'Expense logged.', data: expense };
  }
}