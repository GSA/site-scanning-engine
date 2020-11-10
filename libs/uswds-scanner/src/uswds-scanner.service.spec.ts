import { Test, TestingModule } from '@nestjs/testing';
import { UswdsScannerService } from './uswds-scanner.service';

describe('UswdsScannerService', () => {
  let service: UswdsScannerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UswdsScannerService],
    }).compile();

    service = module.get<UswdsScannerService>(UswdsScannerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
