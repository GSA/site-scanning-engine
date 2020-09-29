import { Test, TestingModule } from '@nestjs/testing';
import { ScanEngineController } from './scan-engine.controller';
import { CoreScanner } from '../scanners/core/core.scanner';
import { ResultCoreDto } from '../scanners/core/result-core.dto.interface';
import { InputCoreDto } from '../scanners/core/input-core.dto';
import { mock, mockReset, MockProxy } from 'jest-mock-extended';
import { Scanner } from '../scanners/scanner.interface';

describe('ScanEngineController', () => {
  let controller: ScanEngineController;
  let module: TestingModule;
  let mockCoreScanner: MockProxy<Scanner<InputCoreDto, ResultCoreDto>>;

  beforeEach(async () => {
    mockCoreScanner = mock<Scanner<InputCoreDto, ResultCoreDto>>();
    module = await Test.createTestingModule({
      controllers: [ScanEngineController],
      providers: [
        {
          provide: CoreScanner,
          useValue: mockCoreScanner,
        },
      ],
    }).compile();

    controller = module.get<ScanEngineController>(ScanEngineController);
  });

  afterEach(async () => {
    mockReset(mockCoreScanner);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return a CoreResultDto when the CoreScanner is called', async () => {
    const input: InputCoreDto = {
      url: 'https://18f.gov',
      agency: 'GSA',
      branch: 'Executive',
    };

    const expected: ResultCoreDto = {
      targetUrl: input.url,
      agency: input.agency,
      branch: input.branch,
      finalUrl: 'https://18f.gov',
    };

    mockCoreScanner.scan.calledWith(input).mockResolvedValue(expected);
    const result = await controller.runCoreScanner(input);
    expect(result).toStrictEqual(expected);
  });
});
