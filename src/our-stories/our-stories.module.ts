import { Module } from '@nestjs/common';
import { AuthModule } from '@/auth/auth.module';
import { OurStoriesService } from './our-stories.service';
import { OurStoriesController } from './our-stories.controller';

@Module({
  imports: [AuthModule],
  controllers: [OurStoriesController],
  providers: [OurStoriesService]
})
export class OurStoriesModule {}
