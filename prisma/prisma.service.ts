import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  // This automatically connects to PostgreSQL when the server starts
  async onModuleInit() {
    await this.$connect();
    console.log('📦 Database connection established via Prisma.');
  }
}