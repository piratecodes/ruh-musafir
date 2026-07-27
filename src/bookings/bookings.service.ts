import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma, Booking, PaymentStatus, BookingStatus } from '@prisma/client';
import { PdfService } from './pdf.service';
import * as nodemailer from 'nodemailer';
import { generateInvoiceHtml } from '@/templates/invoice.template'; 

@Injectable()
export class BookingsService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService
  ) {}

  async findAllForAdmin(): Promise<any[]> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'NO_SHOW'] }
      },
      include: { room: true, beds: true }, 
      orderBy: { checkInDate: 'asc' }
    });
    
    const bookingIds = bookings.map(b => b.id);
    
    const unpaidCafeOrders = await this.prisma.cafeOrder.findMany({
      where: { bookingId: { in: bookingIds }, status: { not: 'PAID' }, NOT: { status: 'CANCELLED' } }
    });
    
    const unpaidAdjustments = await this.prisma.folioAdjustment.findMany({
      where: { bookingId: { in: bookingIds }, isPaid: false }
    });

    return bookings.map(b => {
      const cafeDues = unpaidCafeOrders.filter(o => o.bookingId === b.id).reduce((sum, o) => sum + o.totalAmount, 0);
      const adjDues = unpaidAdjustments.filter(a => a.bookingId === b.id).reduce((sum, a) => sum + a.amount, 0);
      
      const grandTotalDue = b.dueAmount + cafeDues + adjDues;

      return {
        id: b.id,
        guestFirstName: b.guestFirstName, 
        guestLastName: b.guestLastName,
        guestName: `${b.guestFirstName} ${b.guestLastName}`,
        guestPhone: b.guestPhone || '',
        guestEmail: b.guestEmail || '',
        roomId: b.roomId,
        roomName: b.room.name,
        roomNumber: b.room.roomNumber,
        bedIds: b.beds.map(bed => bed.id), 
        bedName: b.beds.map(bed => bed.name).join(', ') || null,
        checkIn: b.checkInDate.toISOString().split('T')[0],
        checkOut: b.checkOutDate.toISOString().split('T')[0],
        adults: b.adults,
        children: b.children,
        specialNotes: b.specialNotes || '', 
        totalAmount: b.totalAmount,
        amountPaid: b.amountPaid,
        dueAmount: grandTotalDue, 
        paymentStatus: b.paymentStatus,
        paymentMode: b.paymentMode,
        experiences: b.experiences,
        status: b.status 
      };
    });
  }

  async create(userId: string | null, data: any): Promise<Booking> {
    const room = await this.prisma.room.findUnique({ 
      where: { id: data.roomId },
      include: { beds: true } 
    });
    if (!room || !room.isActive) throw new NotFoundException('Room is not available');

    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    if (checkIn >= checkOut) throw new BadRequestException('Check-out must be after check-in');

    const now = new Date();
    
    const conflictingBookings = await this.prisma.booking.findMany({
      where: {
        roomId: data.roomId,
        status: { notIn: ['CANCELLED'] }, 
        AND: [
          { checkInDate: { lt: checkOut } }, 
          { checkOutDate: { gt: checkIn } }, 
        ],
        OR: [
          { status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
          { status: 'PENDING', holdExpiresAt: { gt: now } },
          { status: 'PENDING', holdExpiresAt: null }
        ]
      },
      include: { beds: true }
    });

    let bedsToConnect = [];

    if (room.type === 'PRIVATE') {
      if (conflictingBookings.length > 0) {
        throw new BadRequestException('This private room is already booked for the selected dates.');
      }
    } else if (room.type === 'DORM') {
      if (!data.bedIds || data.bedIds.length !== data.adults) {
        throw new BadRequestException(`Please select exactly ${data.adults} beds.`);
      }
      
      const bookedBedIds = new Set(conflictingBookings.flatMap(b => b.beds.map(bed => bed.id)));
      
      for (const bedId of data.bedIds) {
        if (bookedBedIds.has(bedId)) {
          throw new BadRequestException('One or more selected beds have just been booked by someone else! Please reselect.');
        }
      }
      bedsToConnect = data.bedIds.map(id => ({ id }));
    }

    let finalUserId = userId;
    if (!finalUserId && data.guestEmail) {
      const existingUser = await this.prisma.user.findUnique({ where: { email: data.guestEmail.toLowerCase() } });
      if (existingUser) finalUserId = existingUser.id; 
    }

    let holdExpiry = null;
    let initialStatus: BookingStatus = BookingStatus.PENDING;

    const minimumRequiredForConfirmation = data.totalAmount * 0.5;
    if (data.amountPaid >= minimumRequiredForConfirmation || data.holdExpiresAt === 'NO_HOLD') {
      initialStatus = BookingStatus.CONFIRMED;
    } else if (data.holdExpiresAt) {
      holdExpiry = new Date(data.holdExpiresAt);
    } else {
      holdExpiry = new Date();
      holdExpiry.setMinutes(holdExpiry.getMinutes() + 15); 
    }

    return this.prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          userId: finalUserId, 
          guestFirstName: data.guestFirstName, 
          guestLastName: data.guestLastName,   
          guestEmail: data.guestEmail?.toLowerCase(), 
          guestPhone: data.guestPhone,
          roomId: data.roomId,
          beds: { connect: bedsToConnect }, 
          checkInDate: checkIn,
          checkOutDate: checkOut,
          adults: data.adults,
          children: data.children || 0,
          specialNotes: data.specialNotes || null, 
          totalAmount: data.totalAmount,
          amountPaid: data.amountPaid,
          dueAmount: data.dueAmount,
          paymentStatus: data.paymentStatus,
          paymentMode: data.paymentMode,
          experiences: data.experiences || [],
          status: initialStatus, 
          holdExpiresAt: holdExpiry, 
        },
      });

      if (data.amountPaid && data.amountPaid > 0) {
        await tx.payment.create({
          data: {
            amount: data.amountPaid,
            method: data.paymentMode || 'UPI', 
            status: PaymentStatus.PAID,
            bookingId: newBooking.id, 
          }
        });
      }
      return newBooking;
    });
  }

  async findMyBookings(userId: string): Promise<Booking[]> {
    return this.prisma.booking.findMany({
      where: { userId },
      include: { room: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addFolioAdjustment(bookingId: string, amount: number, reason: string, userId: string | null) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (booking?.status === 'CHECKED_OUT') throw new BadRequestException('Security Lock: Cannot modify an audited and closed folio.');

    return this.prisma.folioAdjustment.create({
      data: { amount, reason, bookingId, addedById: userId }
    });
  }

  async getUnifiedLedger(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    const allCafeOrders = await this.prisma.cafeOrder.findMany({
      where: { bookingId: bookingId, NOT: { status: 'CANCELLED' } },
      include: { items: { include: { menuItem: true } } }
    });

    const allAdjustments = await this.prisma.folioAdjustment.findMany({
      where: { bookingId }, orderBy: { createdAt: 'asc' }
    });

    const experiences = await this.prisma.experience.findMany({
      where: { id: { in: booking.experiences } }
    });

    // Splitting the base room cost from the experiences
    const experiencesTotal = experiences.reduce((sum, exp) => sum + (exp.price * booking.adults), 0);
    const roomTotal = Math.max(0, booking.totalAmount - experiencesTotal);

    const unpaidCafeOrders = allCafeOrders.filter(o => o.status !== 'PAID');
    const unpaidAdjustments = allAdjustments.filter(a => !a.isPaid);

    const cafeDuesTotal = unpaidCafeOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const adjustmentsTotal = unpaidAdjustments.reduce((sum, adj) => sum + adj.amount, 0);
    
    const grandTotalDue = booking.dueAmount + cafeDuesTotal + adjustmentsTotal;

    const historicalCafeTotal = allCafeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const historicalAdjTotal = allAdjustments.reduce((sum, a) => sum + a.amount, 0);
    const grandTotalHistory = booking.totalAmount + historicalCafeTotal + historicalAdjTotal;

    return {
      bookingId: booking.id,
      roomTotal,
      experiencesTotal,
      roomDailyRate: roomTotal / (Math.ceil((booking.checkOutDate.getTime() - booking.checkInDate.getTime()) / (1000 * 3600 * 24)) || 1),
      nights: Math.ceil((booking.checkOutDate.getTime() - booking.checkInDate.getTime()) / (1000 * 3600 * 24)) || 1,
      roomDue: booking.dueAmount, 
      unpaidCafeOrders,
      adjustments: unpaidAdjustments,
      adjustmentsTotal,
      cafeDuesTotal,
      grandTotalDue,
      allCafeOrders,
      historicalCafeTotal,
      allAdjustments,
      historicalAdjTotal,
      grandTotalHistory,
      experiences
    };
  }

  // --- THE FIX: DETAILED ITEMIZED INVOICE PAYLOAD ---
  private async generateInvoicePayload(bookingId: string) {
    const ledger = await this.getUnifiedLedger(bookingId);
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId }, include: { room: true } });

    const invoiceItems = [];
    let slCounter = 1;

    // 1. Room Charge
    invoiceItems.push({
      slNo: slCounter++, description: `Accommodation: ${booking.room.name} (${booking.room.type})`,
      rate: ledger.roomDailyRate.toFixed(2), qty: ledger.nights, total: ledger.roomTotal
    });

    // 2. Individual Experiences
    if (ledger.experiences.length > 0) {
      ledger.experiences.forEach(exp => {
        invoiceItems.push({
          slNo: slCounter++, description: `Experience: ${exp.name}`,
          rate: exp.price, qty: booking.adults, total: exp.price * booking.adults
        });
      });
    }

    // 3. Individual Cafe Items (Flattened from all orders)
    if (ledger.allCafeOrders?.length > 0) {
      ledger.allCafeOrders.forEach(order => {
        order.items.forEach(item => {
          invoiceItems.push({
            slNo: slCounter++, description: `Cafe: ${item.menuItem?.name || 'Item'} (Tkt #${order.id.slice(-6).toUpperCase()})`,
            rate: item.unitPrice, qty: item.quantity, total: item.unitPrice * item.quantity
          });
        });
      });
    }

    // 4. Individual Adjustments
    if (ledger.allAdjustments?.length > 0) {
      ledger.allAdjustments.forEach(adj => {
        invoiceItems.push({
          slNo: slCounter++, description: `Adj: ${adj.reason}`,
          rate: adj.amount, qty: 1, total: adj.amount
        });
      });
    }

    return {
      invoiceId: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`,
      currentDate: new Date().toISOString().split('T')[0],
      guestName: `${booking.guestFirstName} ${booking.guestLastName}`,
      guestEmail: booking.guestEmail || 'N/A',
      adults: booking.adults, children: booking.children,
      bookingId: booking.id.split('-')[0], 
      checkIn: booking.checkInDate.toISOString().split('T')[0], checkOut: booking.checkOutDate.toISOString().split('T')[0],
      items: invoiceItems,
      subtotal: ledger.grandTotalHistory, grandTotal: ledger.grandTotalHistory,
      previouslyPaid: ledger.grandTotalHistory - ledger.grandTotalDue, paidNow: 0,          
      balanceDue: ledger.grandTotalDue, paymentMode: booking.paymentMode || 'Multiple'
    };
  }

  async downloadReceipt(id: string): Promise<string> {
    const invoiceData = await this.generateInvoicePayload(id);
    const html = generateInvoiceHtml(invoiceData);
    const buffer = await this.pdfService.generatePdfFromHtml(html);
    return buffer.toString('base64');
  }

  async emailReceipt(id: string): Promise<void> {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking || !booking.guestEmail) throw new BadRequestException('No email address on file for this guest.');

    const invoiceData = await this.generateInvoicePayload(id);
    const html = generateInvoiceHtml(invoiceData);
    const pdfBuffer = await this.pdfService.generatePdfFromHtml(html);

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com', port: 465, secure: true,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
    
    await transporter.sendMail({
      from: `"Ruh Musafir Accounts" <${process.env.GMAIL_USER}>`,
      to: booking.guestEmail,
      subject: `Copy of Invoice - Ruh Musafir`,
      html: `<p>Dear ${booking.guestFirstName},</p><p>As requested, please find a copy of your detailed invoice attached.</p>`,
      attachments: [{ filename: `Invoice_${invoiceData.invoiceId}.pdf`, content: pdfBuffer }]
    });
  }

  async updateStatus(id: string, status: any): Promise<Booking> {
    if (status === 'CHECKED_OUT') {
      const ledger = await this.getUnifiedLedger(id);
      
      if (ledger.grandTotalDue > 0) {
        throw new BadRequestException({ message: 'CHECKOUT_BLOCKED_UNPAID_DUES', ledgerData: ledger });
      }

      const invoiceData = await this.generateInvoicePayload(id);
      const booking = await this.prisma.booking.findUnique({ where: { id } });

      try {
        const html = generateInvoiceHtml(invoiceData);
        const pdfBuffer = await this.pdfService.generatePdfFromHtml(html);
        if (booking.guestEmail) {
          const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com', port: 465, secure: true,
            auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
          });
          transporter.sendMail({
            from: `"Ruh Musafir" <${process.env.GMAIL_USER}>`,
            to: booking.guestEmail,
            subject: `Your Final Invoice - Ruh Musafir`,
            html: `<p>Dear ${booking.guestFirstName},</p><p>Thank you for staying with us! Your folio is completely settled. Please find your final consolidated invoice attached.</p>`,
            attachments: [{ filename: `Final_Invoice_${invoiceData.invoiceId}.pdf`, content: pdfBuffer }]
          }).catch(err => console.error("SMTP Error:", err)); 
        }
      } catch (err) {
        console.error("PDF Generation Failed:", err);
      }
    }

    let updateData: any = { status };
    if (status === 'CONFIRMED' || status === 'CHECKED_IN') {
      updateData.holdExpiresAt = null; 
    }

    return this.prisma.booking.update({ where: { id }, data: updateData });
  }

  async updateDetails(id: string, userId: string | null, role: string, data: any): Promise<Booking> {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === 'CHECKED_OUT') throw new BadRequestException('Security Lock: Cannot modify an audited and closed folio.');
    if (role === 'GUEST' && booking.userId !== userId) throw new NotFoundException('Unauthorized');

    return this.prisma.booking.update({
      where: { id },
      data: {
        guestFirstName: data.guestFirstName, guestLastName: data.guestLastName,   
        guestEmail: data.guestEmail, guestPhone: data.guestPhone,
        checkInDate: new Date(data.checkIn), checkOutDate: new Date(data.checkOut),
        adults: data.adults, children: data.children || 0,
        specialNotes: data.specialNotes || null, 
        totalAmount: data.totalAmount, amountPaid: data.amountPaid, dueAmount: data.dueAmount,
        paymentStatus: data.paymentStatus, paymentMode: data.paymentMode, experiences: data.experiences || [],
      },
    });
  }

  async cancelBooking(id: string, userId: string | null, role: string): Promise<any> {
    const booking = await this.prisma.booking.findUnique({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    if (role === 'GUEST' && booking.userId !== userId) throw new NotFoundException('Unauthorized');
    if (role === 'ADMIN') return this.prisma.booking.delete({ where: { id } });
    if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') throw new BadRequestException(`Cannot cancel a booking that is currently: ${booking.status}`);

    if (role === 'GUEST') {
      const now = new Date();
      const checkIn = new Date(booking.checkInDate);
      const daysUntilCheckIn = (checkIn.getTime() - now.getTime()) / (1000 * 3600 * 24);
      if (daysUntilCheckIn < 7) throw new BadRequestException('Guests must cancel 7 days prior.');
    }

    return this.prisma.booking.update({ where: { id }, data: { status: BookingStatus.CANCELLED } });
  }

  async settlePayment(id: string, method: string = 'UPI', customAmount?: number): Promise<any> {
    const ledger = await this.getUnifiedLedger(id);
    const booking = await this.prisma.booking.findUnique({ where: { id }, include: { room: true } });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === 'CHECKED_OUT') throw new BadRequestException('Security Lock: Folio is audited and closed.');

    const paymentAmountNow = customAmount ? Number(customAmount) : ledger.grandTotalDue;

    if (paymentAmountNow <= 0) throw new BadRequestException('Payment amount must be greater than zero.');
    if (paymentAmountNow > ledger.grandTotalDue) throw new BadRequestException('Payment exceeds the remaining balance due.');

    const roomPortion = Math.min(paymentAmountNow, booking.dueAmount);
    const remainingAfterRoom = Math.max(0, paymentAmountNow - roomPortion);
    
    const cafePortion = Math.min(remainingAfterRoom, ledger.cafeDuesTotal);
    const adjustmentPortion = Math.max(0, remainingAfterRoom - cafePortion);

    await this.prisma.$transaction(async (tx) => {
      
      if (cafePortion >= ledger.cafeDuesTotal && ledger.unpaidCafeOrders.length > 0) {
        const orderIds = ledger.unpaidCafeOrders.map(o => o.id);
        await tx.cafeOrder.updateMany({ where: { id: { in: orderIds } }, data: { status: 'PAID' } });
      }

      if (adjustmentPortion >= ledger.adjustmentsTotal && ledger.adjustments.length > 0) {
        const adjIds = ledger.adjustments.map(a => a.id);
        await tx.folioAdjustment.updateMany({ where: { id: { in: adjIds } }, data: { isPaid: true } });
      }

      if (paymentAmountNow > 0) {
        await tx.payment.create({
          data: { amount: paymentAmountNow, method: method, status: PaymentStatus.PAID, bookingId: id }
        });
      }

      const newAmountPaid = booking.amountPaid + roomPortion;
      const newDueAmount = Math.max(0, booking.totalAmount - newAmountPaid);
      
      let newPaymentStatus: PaymentStatus = PaymentStatus.PARTIAL;
      if (newDueAmount === 0) newPaymentStatus = PaymentStatus.PAID;

      let newStatus: BookingStatus = booking.status;
      const minimumRequiredForConfirmation = booking.totalAmount * 0.5;
      if (booking.status === BookingStatus.PENDING && newAmountPaid >= minimumRequiredForConfirmation) {
        newStatus = BookingStatus.CONFIRMED;
      }

      await tx.booking.update({
        where: { id },
        data: { dueAmount: newDueAmount, amountPaid: newAmountPaid, paymentStatus: newPaymentStatus, status: newStatus }
      });
    });

    return { success: true, message: "Payment processed successfully." };
  }

  async getAvailableRooms(checkin: string, checkout: string, guests?: string, type?: string) {
    const checkInDate = new Date(checkin);
    const checkOutDate = new Date(checkout);
    const guestCount = guests ? parseInt(guests) : 1;

    const overlappingBookings = await this.prisma.booking.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'CHECKED_OUT'] }, 
        AND: [
          { checkInDate: { lt: checkOutDate } },   
          { checkOutDate: { gt: checkInDate } }    
        ]
      },
      include: { beds: true }
    });

    const bookedPrivateRoomIds = overlappingBookings.filter(b => b.beds.length === 0).map(b => b.roomId);

    const allRooms = await this.prisma.room.findMany({
      where: {
        isActive: true,
        id: { notIn: bookedPrivateRoomIds },
        ...(type && type !== 'all' && { type: type.toUpperCase() as any }),
      },
      include: { beds: { orderBy: { name: 'asc' } } }
    });

    const availableRooms = allRooms.filter(room => {
      if (room.type === 'PRIVATE') {
          return room.capacity >= guestCount;
      } else {
          const roomBookings = overlappingBookings.filter(b => b.roomId === room.id);
          const bookedBedIds = new Set(roomBookings.flatMap(b => b.beds.map(bed => bed.id)));
          const availableBeds = room.beds.filter(bed => !bookedBedIds.has(bed.id) && bed.status === 'AVAILABLE');
          (room as any).availableBeds = availableBeds;
          return availableBeds.length >= guestCount;
      }
    });

    return availableRooms;
  }
}