import { Test, TestingModule } from '@nestjs/testing';
import { SnapshotService } from './snapshot.service';

describe('SnapshotService', () => {
  let service: SnapshotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SnapshotService],
    }).compile();

    service = module.get<SnapshotService>(SnapshotService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
