import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static'; // <-- NEW
import { ScheduleModule } from '@nestjs/schedule'; // <-- THE FIX: Required for the Booking Sweeper Cron Job
import { join } from 'path'; // <-- NEW

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RoomsModule } from './rooms/rooms.module';
import { BookingsModule } from './bookings/bookings.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { TreasuryModule } from './treasury/treasury.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ExperiencesModule } from './experiences/experiences.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { SettingsModule } from './settings/settings.module';
import { MailModule } from './mail/mail.module';
import { OurStoriesModule } from './our-stories/our-stories.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    
    // Serve the 'uploads' folder statically so the frontend can see the images!
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    
    // THE FIX: Initialize the scheduler so @Cron() decorators actually run
    ScheduleModule.forRoot(), 
    
    PrismaModule,
    AuthModule,
    UsersModule,
    RoomsModule,
    BookingsModule,
    MenuModule,
    OrdersModule,
    TreasuryModule,
    DashboardModule,
    ExperiencesModule,
    InquiriesModule,
    SettingsModule,
    MailModule,
    OurStoriesModule,
  ],
  controllers: [AppController], 
  providers: [AppService],
})
export class AppModule {}