import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TreasuryService {
  constructor(private prisma: PrismaService) {}

  // 1. Generate Final Invoice (Preview the bill before paying)
  async generateInvoice(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { room: true },
    });

    if (!booking) throw new NotFoundException('Booking not found');

    const unpaidCafeOrders = await this.prisma.cafeOrder.findMany({
      where: { 
        bookingId: bookingId,
        status: { not: 'PAID' } 
      },
      include: { items: { include: { menuItem: true } } }
    });

    const cafeTotal = unpaidCafeOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const grandTotal = booking.totalAmount + cafeTotal;

    return {
      bookingDetails: {
        roomNumber: booking.room.roomNumber,
        checkIn: booking.checkInDate,
        checkOut: booking.checkOutDate,
        nightsTotal: booking.totalAmount, 
      },
      cafeTab: {
        unpaidOrdersCount: unpaidCafeOrders.length,
        orders: unpaidCafeOrders,
        cafeTotal: cafeTotal,
      },
      summary: {
        grandTotal: grandTotal,
        status: booking.status
      }
    };
  }

  // 2. Process Manual Checkout
  async processCheckout(bookingId: string, paymentMethod: string, staffId: string) {
    return this.prisma.$transaction(async (tx) => {
      
      const invoice = await this.generateInvoice(bookingId);
      if (invoice.summary.status !== 'CHECKED_IN') {
        throw new BadRequestException('Cannot checkout a room that is not currently checked in.');
      }

      await tx.cafeOrder.updateMany({
        where: { 
          bookingId: bookingId,
          status: { not: 'PAID' } 
        },
        data: { status: 'PAID' }
      });

      const completedBooking = await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CHECKED_OUT' }
      });

      // Record the actual Payment to feed our analytics
      await tx.payment.create({
        data: {
          amount: invoice.summary.grandTotal,
          method: paymentMethod,
          status: 'PAID',
          bookingId: bookingId,
        }
      });

      return {
        success: true,
        message: 'Checkout successful. All tabs cleared.',
        settledAmount: invoice.summary.grandTotal,
        paymentMethod: paymentMethod,
        processedBy: staffId
      };
    });
  }

  // --- NEW: ANALYTICS & DASHBOARD METRICS ---
  
  async getDashboardMetrics() {
    // 1. Fetch all PAID payments to calculate overall KPIs and Distribution
    const allPayments = await this.prisma.payment.findMany({
      where: { status: 'PAID' }
    });

    // THE FIX: Fetch all expenses to feed the new KPI Card
    const allExpenses = await this.prisma.expense.findMany();
    const totalExpenses = allExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    // --- INCIDENTALS FIX: Fetch all unpaid folio adjustments across the property ---
    const unpaidIncidentals = await this.prisma.folioAdjustment.aggregate({
      where: { isPaid: false },
      _sum: { amount: true }
    });
    const totalUnpaidIncidentals = unpaidIncidentals._sum.amount || 0;
    
    const activeBookings = await this.prisma.booking.findMany({
      where: {
        NOT: { paymentStatus: 'PAID' },
        status: { not: 'CANCELLED' }
      },
      include: {
        cafeOrders: {
          where: { status: { not: 'PAID' }, NOT: { status: 'CANCELLED' } }
        }
      }
    });
    
    // Sum the Room dueAmount AND the sum of all unpaid cafe orders for each guest
    // --- INCIDENTALS FIX: Added totalUnpaidIncidentals to the final calculation ---
    const pendingDues = activeBookings.reduce((sum, b) => {
      const cafeTab = b.cafeOrders.reduce((cSum, o) => cSum + o.totalAmount, 0);
      return sum + b.dueAmount + cafeTab;
    }, 0) + totalUnpaidIncidentals;

    const totalRevenue = allPayments.reduce((acc, curr) => acc + curr.amount, 0);
    const cashTotal = allPayments.filter(p => p.method === 'CASH').reduce((acc, curr) => acc + curr.amount, 0);
    const digitalTotal = totalRevenue - cashTotal;

    // 2. REAL 30-DAY TIMELINE CALCULATION
    const timeline = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      
      const dayRevenue = allPayments
        .filter(p => p.createdAt >= startOfDay && p.createdAt <= endOfDay)
        .reduce((sum, p) => sum + p.amount, 0);
        
      timeline.push({ 
        date: startOfDay.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }), 
        revenue: dayRevenue 
      });
    }

    // 3. Exact Distribution for Pie Chart
    // const distribution = [
    //   { name: 'CASH', value: cashTotal },
    //   { name: 'UPI', value: allPayments.filter(p => p.method === 'UPI').reduce((acc, curr) => acc + curr.amount, 0) },
    //   { name: 'CARD', value: allPayments.filter(p => p.method === 'CARD').reduce((acc, curr) => acc + curr.amount, 0) },
    //   { name: 'NETBANKING', value: allPayments.filter(p => p.method === 'NETBANKING').reduce((acc, curr) => acc + curr.amount, 0) },
    // ];
    const distribution = [
      { name: 'Revenue', value: totalRevenue },
      { name: 'Expenses', value: totalExpenses },
      { name: 'Dues', value: pendingDues },
    ];

    return {
      // THE FIX: Passed totalExpenses to the frontend KPIs
      kpis: { totalRevenue, cashTotal, digitalTotal, pendingDues, totalExpenses },
      timeline,
      distribution: distribution.filter(d => d.value > 0)
    };
  }

  // --- NEW: SHIFT & EXPENSE ENGINE ---

  async openShift(userId: string, startingCash: number) {
    const activeShift = await this.prisma.shift.findFirst({ where: { status: 'OPEN' } });
    if (activeShift) throw new BadRequestException('A shift is already open. Close it first.');

    return this.prisma.shift.create({
      data: { openedById: userId, startingCash }
    });
  }

  async closeShift(userId: string, actualCash: number) {
    const shift = await this.prisma.shift.findFirst({ where: { status: 'OPEN' }, include: { expenses: true } });
    if (!shift) throw new BadRequestException('No active shift found.');

    // Sum all CASH payments recorded during this shift's timeframe
    const cashPayments = await this.prisma.payment.aggregate({
      where: {
        method: 'CASH',
        status: 'PAID',
        createdAt: { gte: shift.openedAt }
      },
      _sum: { amount: true }
    });

    // THE FIX: Only subtract expenses paid physically with CASH from the drawer count
    const totalCashExpenses = shift.expenses
      .filter(exp => exp.method === 'CASH')
      .reduce((acc, exp) => acc + exp.amount, 0);

    const expectedCash = shift.startingCash + (cashPayments._sum.amount || 0) - totalCashExpenses;
    const discrepancy = actualCash - expectedCash;

    return this.prisma.shift.update({
      where: { id: shift.id },
      data: {
        closedAt: new Date(),
        closedById: userId,
        status: 'CLOSED',
        expectedCash,
        actualCash,
        discrepancy
      }
    });
  }

  async logExpense(userId: string, data: { amount: number, reason: string, paidTo?: string, method?: string }) {
    const shift = await this.prisma.shift.findFirst({ where: { status: 'OPEN' } });
    
    return this.prisma.expense.create({
      data: {
        amount: data.amount,
        reason: data.reason,
        paidTo: data.paidTo,
        method: data.method || 'CASH', // THE FIX: Securely saves UPI or CASH
        loggedById: userId,
        shiftId: shift?.id || null // Attach to shift if one is active
      }
    });
  }

  async getAuditLogs() {
    const shifts = await this.prisma.shift.findMany({
      orderBy: { openedAt: 'desc' },
      include: { openedBy: { select: { firstName: true, lastName: true } }, closedBy: { select: { firstName: true, lastName: true } } },
      take: 10 // Show last 10 shifts
    });

    const payments = await this.prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { 
        booking: { select: { guestFirstName: true, guestLastName: true, room: { select: { roomNumber: true } } } },
        cafeOrder: { select: { walkInFirstName: true } }
      },
      take: 20 // Show last 20 payments
    });

    // --- THE FIX: ADDED EXPENSES FETCH SO THE UI CAN RENDER THE DEBIT TAB ---
    const expenses = await this.prisma.expense.findMany({
      orderBy: { createdAt: 'desc' },
      include: { loggedBy: { select: { firstName: true, lastName: true } } },
      take: 20 // Show last 20 expenses
    });

    return { shifts, payments, expenses }; // Returns all three to the frontend
  }
}