import { Test, TestingModule } from '@nestjs/testing';
import { HeadlessService } from './headless.service';

describe('HeadlessService', () => {
  let service: HeadlessService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HeadlessService],
    }).compile();

    service = module.get<HeadlessService>(HeadlessService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
