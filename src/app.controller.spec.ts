import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('Gateway Check', () => {
    it('should return the gateway status', () => {
      const response = appController.getGateway();
      expect(response).toBeDefined();
      expect(response.system).toBe('Ruh Musafir Gateway');
      expect(response.status).toBe('online 🟢');
    });
  });

  describe('V1 Engine Check', () => {
    it('should return the detailed Straxcel signature', () => {
      const response = appController.getV1Engine();
      expect(response).toBeDefined();
      expect(response.system).toBe('Ruh Musafir Core API v1');
      expect(response.developer.agency).toBe('Straxcel Business Solutions');
    });
  });
});