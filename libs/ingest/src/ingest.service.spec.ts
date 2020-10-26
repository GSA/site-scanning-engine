import { Test, TestingModule } from '@nestjs/testing';
import { IngestService } from './ingest.service';

describe('IngestService', () => {
  let service: IngestService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IngestService],
    }).compile();

    service = module.get<IngestService>(IngestService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
