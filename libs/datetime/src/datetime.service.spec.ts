import { Test, TestingModule } from '@nestjs/testing';
import { DatetimeService } from './datetime.service';

describe('DatetimeService', () => {
  let service: DatetimeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DatetimeService],
    }).compile();

    service = module.get<DatetimeService>(DatetimeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
