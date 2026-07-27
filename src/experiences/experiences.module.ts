import { Module } from '@nestjs/common';
import { ExperiencesService } from './experiences.service';
import { ExperiencesController } from './experiences.controller';
import { AuthModule } from '@/auth/auth.module'; // <-- Crucial for JwtAuthGuard!

@Module({
  imports: [AuthModule], 
  controllers: [ExperiencesController],
  providers: [ExperiencesService],
  exports: [ExperiencesService]
})
export class ExperiencesModule {}