import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// The @Global() decorator means we don't have to import this module 
// into every single other feature (like Rooms, Bookings, etc). It's everywhere.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}