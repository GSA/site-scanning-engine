import { Test, TestingModule } from '@nestjs/testing';
import { MockProxy, mock } from 'jest-mock-extended';

import { SnapshotService } from '@app/snapshot';
import { SnapshotController } from './snapshot.controller';

describe('SnapshotController', () => {
  let snapshotController: SnapshotController;
  let mockSnapshotService: MockProxy<SnapshotService>;

  beforeEach(async () => {
    mockSnapshotService = mock<SnapshotService>();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [SnapshotController],
      providers: [
        {
          provide: SnapshotService,
          useValue: mockSnapshotService,
        },
      ],
    }).compile();
    snapshotController = app.get<SnapshotController>(SnapshotController);
  });

  it('creates snapshot', () => {
    snapshotController.weeklySnapshot();
    expect(mockSnapshotService.weeklySnapshot).toHaveBeenCalled();
  });
});
