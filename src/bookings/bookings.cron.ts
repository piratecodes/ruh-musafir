import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class BookingCronService {
  private readonly logger = new Logger(BookingCronService.name);

  constructor(private prisma: PrismaService) {}

  // 1. The 15-Minute Sweeper (Runs every minute)
  @Cron(CronExpression.EVERY_MINUTE)
  async releaseExpiredHolds() {
    const now = new Date();
    const result = await this.prisma.booking.updateMany({
      where: {
        status: 'PENDING',
        holdExpiresAt: { lte: now } 
      },
      data: { status: 'CANCELLED' }
    });

    if (result.count > 0) {
      this.logger.log(`Released ${result.count} expired PENDING holds.`);
    }
  }

  // 2. THE FIX: The 2:00 AM No-Show Sweeper (Runs daily at 2:00 AM)
  @Cron('0 2 * * *') 
  async processNoShows() {
    // We look for any CONFIRMED booking where the checkInDate was before midnight today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const result = await this.prisma.booking.updateMany({
      where: {
        status: 'CONFIRMED',
        checkInDate: { lt: startOfToday } // They missed their check-in day!
      },
      data: {
        status: 'NO_SHOW' // Freezes the advance payment, releases the room
      }
    });

    if (result.count > 0) {
      this.logger.log(`Processed ${result.count} NO_SHOW bookings from yesterday.`);
    }
  }
}