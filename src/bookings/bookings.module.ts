import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { BookingCronService } from './bookings.cron';
import { AuthModule } from '../auth/auth.module'; // Needed for JwtAuthGuard
import { PdfService } from './pdf.service';

@Module({
  imports: [AuthModule],
  controllers: [BookingsController],
  providers: [BookingsService, BookingCronService, PdfService],
  exports: [BookingsService]
})
export class BookingsModule {}