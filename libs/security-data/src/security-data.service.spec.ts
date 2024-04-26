import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SecurityDataService } from './security-data.service';
import * as fs from 'fs';
import { ScanStatus } from 'entities/scan-status';

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
  },
  existsSync: jest.fn(),
}));

jest.mock('./fetch-security-data');

describe('SecurityDataService', () => {
  let service: SecurityDataService;
  let mockConfigService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityDataService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'securityDataCsvUrl')
                return 'http://example.com/security.csv';
              if (key === 'dirPath') return '/data';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SecurityDataService>(SecurityDataService);
    mockConfigService = module.get<ConfigService>(ConfigService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should fetch and save security data if file does not exist', async () => {
    const url = 'example.com';
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const spyFetchAndSave = jest
      .spyOn(service, 'fetchAndSaveSecurityData')
      .mockResolvedValue();

    try {
      await service.getSecurityResults(url);
    } catch (e) {}

    expect(spyFetchAndSave).toHaveBeenCalled();
  });

  it('should return correct security results for a matching domain with hsts_base_domain_preloaded set to "true"', async () => {
    const url = 'example.com';
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest
      .spyOn(fs.promises, 'readFile')
      .mockResolvedValue(
        `domain,domain_enforces_https,domain_uses_strong_hsts,hsts_base_domain_preloaded\n${url},true,false,true`,
      );

    const result = await service.getSecurityResults(url);

    expect(result).toEqual({
      status: ScanStatus.Completed,
      result: {
        securityScan: {
          httpsEnforced: true,
          hsts: true,
        },
      },
    });
  });

  it('should return correct security results for a matching domain with domain_uses_strong_hsts set to "true"', async () => {
    const url = 'example.com';
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest
      .spyOn(fs.promises, 'readFile')
      .mockResolvedValue(
        `domain,domain_enforces_https,domain_uses_strong_hsts,hsts_base_domain_preloaded\n${url},true,true,false`,
      );

    const result = await service.getSecurityResults(url);

    expect(result).toEqual({
      status: ScanStatus.Completed,
      result: {
        securityScan: {
          httpsEnforced: true,
          hsts: true,
        },
      },
    });
  });

  it('should return correct security results for a matching domain with both hsts fields set to "false"', async () => {
    const url = 'example.com';
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest
      .spyOn(fs.promises, 'readFile')
      .mockResolvedValue(
        `domain,domain_enforces_https,domain_uses_strong_hsts,hsts_base_domain_preloaded\n${url},true,false,false`,
      );

    const result = await service.getSecurityResults(url);

    expect(result).toEqual({
      status: ScanStatus.Completed,
      result: {
        securityScan: {
          httpsEnforced: true,
          hsts: false,
        },
      },
    });
  });

  it('should handle CSV parsing errors', async () => {
    const url = 'example.com';
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockImplementation(() => {
      throw new Error('Failed to read file');
    });

    const result = await service.getSecurityResults(url);

    expect(result.status).toEqual(ScanStatus.UnknownError);
  });

  it('should log an error and return an error status when fetchSecurityData fails', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const errorSpy = jest.spyOn(service['logger'], 'error');
    jest
      .spyOn(service, 'fetchAndSaveSecurityData')
      .mockRejectedValue(new Error('Failed to fetch data'));

    const result = await service.getSecurityResults('example.com');

    expect(errorSpy).toHaveBeenCalledWith(
      'An error occurred fetching security data: Failed to fetch data',
    );
    expect(result.status).toEqual(ScanStatus.UnknownError);
  });

  it('should correctly save fetched data to file system', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest
      .spyOn(service, 'fetchAndSaveSecurityData')
      .mockImplementation(async () => {
        await fs.promises.mkdir('/data', { recursive: true });
        await fs.promises.writeFile(
          '/data/security-data.csv',
          'some,csv,data',
          'utf8',
        );
      });

    await service.getSecurityResults('example.com');

    expect(fs.promises.writeFile).toHaveBeenCalledWith(
      '/data/security-data.csv',
      expect.any(String),
      'utf8',
    );
  });
});
