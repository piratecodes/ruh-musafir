import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  
  // 1. The Lightweight Gateway Check (for /api)
  getGatewayStatus() {
    return {
      system: "Ruh Musafir Gateway",
      status: "online 🟢",
      message: "Watchdog is awake and secure.",
      developer: {
        agency: "Straxcel Business Solutions",
        website: "https://straxcel.com"
      },
      timestamp: new Date().toISOString(),
    };
  }

  // 2. The Detailed V1 Engine Check (for /api/v1)
  getV1EngineStatus() {
    return {
      success: true,
      system: "Ruh Musafir Core API v1",
      status: "operational 🟢",
      version: "1.0.0",
      message: "Watchdog is awake and secure.",
      developer: {
        agency: "Straxcel Business Solutions",
        website: "https://straxcel.com"
      },
      timestamp: new Date().toISOString(),
    };
  }
}