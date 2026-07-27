import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    // 1. Create a connection pool using the standard 'pg' driver
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL 
    });
    
    // 2. Wrap the pool in the Prisma Postgres Adapter
    const adapter = new PrismaPg(pool);
    
    // 3. Pass the adapter into the PrismaClient constructor
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('📦 Database connection established via Prisma v7 Adapter.');
  }
}