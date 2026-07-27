// Add Version and VERSION_NEUTRAL to the import
import { Controller, Get, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // 1. The Gateway Check -> http://localhost:3001/api
  @Version(VERSION_NEUTRAL) // This bypasses the 'v1' rule!
  @Get()
  getGateway() {
    return this.appService.getGatewayStatus();
  }

  // 2. The Engine Check -> http://localhost:3001/api/v1
  // Because '1' is our default version in main.ts, we don't need to do anything special here.
  @Get() 
  getV1Engine() {
    return this.appService.getV1EngineStatus();
  }
}