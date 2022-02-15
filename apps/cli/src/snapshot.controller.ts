import { Controller } from '@nestjs/common';

import { SnapshotService } from '@app/snapshot';

@Controller()
export class SnapshotController {
  constructor(private readonly snapshotService: SnapshotService) {}

  async weeklySnapshot() {
    await this.snapshotService.weeklySnapshot();
  }
}
