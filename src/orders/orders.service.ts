import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, CafeOrder } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findWalkInByPhone(phone: string) {
    const pastOrder = await this.prisma.cafeOrder.findFirst({
      where: { walkInPhone: phone, walkInFirstName: { not: null } },
      orderBy: { createdAt: 'desc' }
    });
    if (!pastOrder) return null;
    return { firstName: pastOrder.walkInFirstName, lastName: pastOrder.walkInLastName };
  }

  /**
   * 1. CREATE A NEW CAFE ORDER (Secured by Role)
   * Handles both Walk-in (Admin/Staff) and In-House Room Tab (Guest/Admin) orders.
   */
  async createOrder(
    // UPDATED PAYLOAD TO ACCEPT WALK-IN DETAILS AND PAYMENT METHOD
    data: { 
      items: { menuItemId: string; quantity: number }[], 
      bookingId?: string, 
      payment?: string, 
      walkInFirstName?: string, 
      walkInLastName?: string, 
      walkInPhone?: string 
    },
    userId: string,
    role: string
  ): Promise<CafeOrder> {
    
    let finalBookingId = data.bookingId || null;
    let finalFirstName = data.walkInFirstName || null;
    let finalLastName = data.walkInLastName || null;
    let finalPhone = data.walkInPhone || null;

    if (data.bookingId) {
      const booking = await this.prisma.booking.findUnique({ 
        where: { id: data.bookingId },
        include: { room: true } 
      });
      
      if (!booking || booking.status !== 'CHECKED_IN') throw new BadRequestException(`Cannot charge room tab.`);
      if (role === 'GUEST' && booking.userId !== userId) throw new NotFoundException('Unauthorized.');

      // THE FIX: ANTI-DOUBLE-CHARGE ARCHITECTURE
      // If an in-house guest pays immediately (CASH/UPI) instead of ROOM_TAB,
      // we detach this order from their final checkout ledger so they aren't double-charged.
      // But we map their Room Number into the Walk-In Name field so the kitchen still knows where to deliver it!
      if (data.payment && data.payment !== 'ROOM_TAB') {
        finalBookingId = null; 
        finalFirstName = `${booking.guestFirstName} (Room ${booking.room.roomNumber})`;
        finalLastName = booking.guestLastName;
        finalPhone = booking.guestPhone;
      }
    }

    let calculatedTotal = 0;
    const orderItemsData = [];

    for (const item of data.items) {
      const menuItem = await this.prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (!menuItem || !menuItem.isAvailable) throw new BadRequestException(`Item unavailable.`);
      calculatedTotal += menuItem.price * item.quantity;
      orderItemsData.push({ menuItemId: item.menuItemId, quantity: item.quantity, unitPrice: menuItem.price });
    }

    // Wrap the creation in a transaction to immediately log Walk-In/Instant payments to Treasury
    return this.prisma.$transaction(async (tx) => {
      // 1. Create the order
      const newOrder = await tx.cafeOrder.create({
        data: {
          totalAmount: calculatedTotal,
          bookingId: finalBookingId,
          walkInFirstName: finalFirstName, 
          walkInLastName: finalLastName,   
          walkInPhone: finalPhone,         
          status: 'PENDING', 
          items: { create: orderItemsData },
        },
        include: { items: true }
      });

      // 2. If it's a Walk-In OR an In-House guest who paid instantly, grab their money NOW and log it.
      // Room Tabs (where finalBookingId is still intact) skip this and are paid at final hotel checkout.
      if (!finalBookingId) {
        await tx.payment.create({
          data: {
            amount: calculatedTotal,
            method: data.payment && data.payment !== 'ROOM_TAB' ? data.payment : 'CASH', // Safely fallback to cash
            status: 'PAID',
            cafeOrderId: newOrder.id,
          }
        });
      }

      return newOrder;
    });
  }

  /**
   * 2. FETCH ACTIVE KITCHEN LEDGER
   * Pulls all unresolved tickets for the Barista/Kitchen display.
   */
  async findAllActiveOrders(): Promise<CafeOrder[]> {
    return this.prisma.cafeOrder.findMany({
      where: { 
        status: { not: 'PAID' } // Hide completely settled historical orders
      },
      include: {
        items: { include: { menuItem: true } },
        booking: { include: { room: true } }, // Pull room details so kitchen knows where to deliver!
      },
      orderBy: { createdAt: 'asc' }, // Oldest tickets first (First-In, First-Out)
    });
  }

  /**
   * 3. UPDATE TICKET STATUS
   * Allows the kitchen to mark food as PREPARING, SERVED, etc.
   * THE FIX: Securely captures the payment method and writes to the Treasury Payment table.
   */
  async updateStatus(id: string, status: any, method: string = 'CASH'): Promise<CafeOrder> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Update the cafe order status
      const updatedOrder = await tx.cafeOrder.update({
        where: { id },
        data: { status },
      });

      // 2. THE BRIDGE: If marked as PAID, lock the money into the Treasury Ledger
      if (status === 'PAID') {
        const existingPayment = await tx.payment.findUnique({ where: { cafeOrderId: id } });
        
        if (!existingPayment) {
          await tx.payment.create({
            data: {
              amount: updatedOrder.totalAmount,
              method: method, // Properly logs CASH, UPI, or CARD
              status: 'PAID', // Must match your Prisma enum exactly
              cafeOrderId: id,
            }
          });
        }
      }

      return updatedOrder;
    });
  }

    // 4. Cancel an Order
  async cancelOrder(id: string, role: string): Promise<CafeOrder> {
    const order = await this.prisma.cafeOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    // Security Check: Standard staff cannot cancel orders that are already in the kitchen or paid.
    if (role !== 'ADMIN' && order.status !== 'PENDING') {
      throw new BadRequestException('Security Alert: Only Admins can void active or paid tickets.');
    }

    return this.prisma.cafeOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  // 5. Update an Existing Order (Edit Ticket Flow)
  async updateOrder(id: string, data: any, role: string): Promise<CafeOrder> {
    const order = await this.prisma.cafeOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    // Security Check: Standard staff cannot alter an order once it is PREPARING, SERVED, or PAID.
    if (role !== 'ADMIN' && order.status !== 'PENDING') {
      throw new BadRequestException('Security Alert: Only Admins can modify active tickets to prevent shrinkage.');
    }

    await this.prisma.orderItem.deleteMany({ where: { orderId: id } });

    let calculatedTotal = 0;
    const orderItemsData = [];

    for (const item of data.items) {
      const menuItem = await this.prisma.menuItem.findUnique({ where: { id: item.menuItemId } });
      if (menuItem) {
        calculatedTotal += menuItem.price * item.quantity;
        orderItemsData.push({ menuItemId: item.menuItemId, quantity: item.quantity, unitPrice: menuItem.price });
      }
    }

    return this.prisma.cafeOrder.update({
      where: { id },
      data: { totalAmount: calculatedTotal, items: { create: orderItemsData } },
      include: { items: true }
    });
  }

  // 6. Delete an Order Permanently (Hard Delete)
  async deleteOrder(id: string, role: string): Promise<CafeOrder> {
    if (role !== 'ADMIN') {
      throw new BadRequestException('Security Alert: Only Admins have permission to hard-delete ledger records.');
    }
    await this.prisma.orderItem.deleteMany({ where: { orderId: id } });
    return this.prisma.cafeOrder.delete({ where: { id } });
  }

  // 7. Retrieve Ledger Orders
  async getLedgerOrders(timeRange?: string) {
    let dateFilter = {};
    const now = new Date();

    if (timeRange === 'today') {
      const startOfToday = new Date(now.setHours(0, 0, 0, 0));
      dateFilter = { gte: startOfToday };
    } else if (timeRange === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { gte: startOfMonth };
    } else if (timeRange === 'all') {
      dateFilter = {}; // THE FIX: Completely open the floodgates for "All Time"
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      dateFilter = { gte: thirtyDaysAgo };
    }

    return this.prisma.cafeOrder.findMany({
      where: { createdAt: dateFilter },
      include: { 
        items: { include: { menuItem: true } },
        booking: { select: { room: { select: { name: true, roomNumber: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}