import { DatabaseModule } from '@app/database';
import { LoggerModule } from '@app/logger';
import { StorageModule } from '@app/storage';
import { Test, TestingModule } from '@nestjs/testing';
import { SnapshotService } from './snapshot.service';

describe('SnapshotService', () => {
  let service: SnapshotService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [StorageModule, LoggerModule, DatabaseModule],
      providers: [SnapshotService],
    }).compile();

    service = module.get<SnapshotService>(SnapshotService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
