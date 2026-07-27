import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [forwardRef(() => AuthModule)], // Use forwardRef to avoid circular dependency
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService], // We export this so the Auth module can use it later!
})
export class UsersModule {}