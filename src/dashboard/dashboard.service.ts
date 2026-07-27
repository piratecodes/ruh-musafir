import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getOverviewData(range: string) {
    const now = new Date();
    let startDate = new Date();

    // Determine the start date based on the requested range
    if (range === '7d') {
      startDate.setDate(now.getDate() - 6); // Go back 6 days + today = 7 days
    } else if (range === '1m') {
      startDate.setMonth(now.getMonth() - 1);
    } else {
      // Default to 6 months
      startDate.setMonth(now.getMonth() - 5);
      startDate.setDate(1); 
    }
    startDate.setHours(0, 0, 0, 0);

    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);

    // 1. TODAY'S ACTIVITY (Arriving vs Departing)
    const arrivingToday = await this.prisma.booking.count({ 
      where: { checkInDate: { gte: todayStart, lte: todayEnd }, status: { not: 'CANCELLED' } } 
    });
    const departingToday = await this.prisma.booking.count({ 
      where: { checkOutDate: { gte: todayStart, lte: todayEnd }, status: { not: 'CANCELLED' } } 
    });

    // 2. LIVE OCCUPANCY %
    const rooms = await this.prisma.room.findMany();
    const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);
    
    const activeBookings = await this.prisma.booking.findMany({ 
      where: { status: 'CHECKED_IN' } 
    });
    const currentGuests = activeBookings.reduce((sum, b) => sum + b.adults + b.children, 0);
    const occupancyPercent = totalCapacity > 0 ? Math.round((currentGuests / totalCapacity) * 100) : 0;

    // 3. PENDING ACTIONS
    const pendingBookings = await this.prisma.booking.count({ where: { status: 'PENDING' } });
    const pendingOrders = await this.prisma.cafeOrder.count({ where: { status: 'PENDING' } });

    // 4. BOOKING STATUS PIPELINE (For the Bar Chart)
    const statusCounts = await this.prisma.booking.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    const bookingStatus = statusCounts.map(s => ({
      status: s.status.toLowerCase(),
      count: s._count.status
    }));

    // 5. ROOM POPULARITY (For the Donut Chart)
    const roomBookings = await this.prisma.booking.findMany({
      where: { createdAt: { gte: startDate } },
      include: { room: true }
    });
    
    const popMap = new Map<string, number>();
    roomBookings.forEach(b => {
      const name = b.room.roomNumber; 
      popMap.set(name, (popMap.get(name) || 0) + 1);
    });
    const roomPopularity = Array.from(popMap, ([name, value]) => ({ name, value }));

    // 6. DYNAMIC FOOTFALL TREND (Replaces Revenue Chart)
    // We fetch all bookings that overlapped with our requested date range
    const trendBookings = await this.prisma.booking.findMany({
      where: { 
        checkOutDate: { gt: startDate }, 
        checkInDate: { lte: now }, 
        status: { not: 'CANCELLED' } 
      },
      select: { checkInDate: true, checkOutDate: true, adults: true, children: true }
    });

    const footfallMap = new Map<string, number>();
    
    // Build the timeline buckets depending on the range
    if (range === '6m') {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      // Create empty buckets for the last 6 months to ensure the chart looks full even with 0 data
      for (let i = 5; i >= 0; i--) {
        const d = new Date(); d.setMonth(d.getMonth() - i);
        footfallMap.set(`${monthNames[d.getMonth()]} ${d.getFullYear()}`, 0);
      }
      
      trendBookings.forEach(b => {
        const checkIn = new Date(b.checkInDate);
        const checkOut = new Date(b.checkOutDate);
        const guests = b.adults + b.children;
        
        // Add guests to every month they stayed in
        for (let m = new Date(checkIn); m < checkOut; m.setMonth(m.getMonth() + 1)) {
          if (m >= startDate && m <= now) {
            const key = `${monthNames[m.getMonth()]} ${m.getFullYear()}`;
            if (footfallMap.has(key)) footfallMap.set(key, footfallMap.get(key) + guests);
          }
        }
      });
    } else {
      // 7d or 1m: Group by Day
      const daysToLoop = range === '7d' ? 7 : 30;
      for (let i = daysToLoop - 1; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        footfallMap.set(d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }), 0);
      }

      trendBookings.forEach(b => {
        const checkIn = new Date(b.checkInDate);
        const checkOut = new Date(b.checkOutDate);
        const guests = b.adults + b.children;
        
        for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
          if (d >= startDate && d <= now) {
            const key = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
            if (footfallMap.has(key)) footfallMap.set(key, footfallMap.get(key) + guests);
          }
        }
      });
    }

    const footfallTrend = Array.from(footfallMap, ([date, footfall]) => ({ date, footfall }));

    // 7. RECENT UPDATES (Live Notification Feed)
    const latestBookings = await this.prisma.booking.findMany({
      take: 3, orderBy: { createdAt: 'desc' }, include: { room: true }
    });
    const latestOrders = await this.prisma.cafeOrder.findMany({
      take: 3, orderBy: { createdAt: 'desc' }
    });

    const notifications = [
      ...latestBookings.map(b => ({
        id: `b-${b.id}`,
        type: 'booking',
        title: 'New Room Booking',
        message: `${b.guestFirstName} ${b.guestLastName} booked ${b.room.name}`,
        time: b.createdAt
      })),
      ...latestOrders.map(o => ({
        id: `o-${o.id}`,
        type: 'order',
        title: 'Cafe POS Alert',
        message: `New Order placed for ₹${o.totalAmount}`,
        time: o.createdAt
      }))
    ].sort((a, b) => b.time.getTime() - a.time.getTime()).slice(0, 5); // Sort newest first, keep top 5

    // --- THE FIX: NEW OPERATIONAL QUERIES ---
    
    // Box A: Live Cafe Orders
    const activeOrders = await this.prisma.cafeOrder.findMany({
      where: { status: { in: ['PENDING', 'PREPARING'] } },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
      take: 5
    });

    // Box B: Room Readiness
    const allRooms = await this.prisma.room.findMany({
      include: {
        bookings: {
          where: { status: { in: ['CHECKED_IN', 'CONFIRMED'] } }
        }
      }
    });

    const roomStatuses = allRooms.map(room => {
      const isOccupied = room.bookings.find(b => b.status === 'CHECKED_IN');
      const isReserved = room.bookings.find(b => b.status === 'CONFIRMED' && b.checkInDate <= todayEnd);
      
      let state = 'AVAILABLE';
      if (isOccupied) state = 'OCCUPIED';
      else if (isReserved) state = 'RESERVED';
      else if (!room.isActive) state = 'MAINTENANCE';
      
      return {
        id: room.id,
        roomNumber: room.roomNumber,
        state: state
      };
    });

    // Return absolutely pure, unadulterated database records
    return {
      success: true,
      data: {
        stats: {
          activity: `${arrivingToday} In / ${departingToday} Out`, 
          occupancy: `${occupancyPercent}%`,         
          pending: pendingBookings + pendingOrders, 
        },
        trend: footfallTrend, // Renamed from revenue
        roomPopularity,
        bookingStatus,
        notifications,
        // Send the new operational data safely to the frontend
        activeOrders,
        roomStatuses
      }
    };
  }
}