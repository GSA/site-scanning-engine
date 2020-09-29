import { Controller } from '@nestjs/common';
import { CoreScanner } from '../scanners/core/core.scanner';
import { InputCoreDto } from '../scanners/core/input-core.dto';
import { ResultCoreDto } from '../scanners/core/result-core.dto.interface';

@Controller('scan-engine')
export class ScanEngineController {
  constructor(private coreScanner: CoreScanner) {}

  async runCoreScanner(input: InputCoreDto): Promise<ResultCoreDto> {
    const result = await this.coreScanner.scan(input);
    return result;
  }
}
