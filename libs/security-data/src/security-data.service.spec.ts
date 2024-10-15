import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SecurityDataService } from './security-data.service';
import * as fs from 'fs';
import { ScanStatus } from 'entities/scan-status';
import { fetchSecurityData } from './fetch-security-data'; // Adjust the path accordingly


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
    jest.resetAllMocks();
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
      securityScan: {
        httpsEnforced: true,
        hsts: true,
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
      securityScan: {
        httpsEnforced: true,
        hsts: true,
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
      securityScan: {
        httpsEnforced: true,
        hsts: false,
      },
    });
  });

  it('should throw an error when CSV parsing fails', async () => {
    const errorMessage = 'an_error';
    const url = 'example.com';

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs.promises, 'readFile').mockImplementation(() => {
      throw new Error(errorMessage);
    });

    await expect(service.getSecurityResults(url)).rejects.toThrow(errorMessage);
  });

  it('should log and throw an error when fetchSecurityData fails', async () => {
    const url = 'example.com';
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest
      .spyOn(service, 'fetchAndSaveSecurityData')
      .mockRejectedValue(new Error('Failed to fetch data'));

    await expect(service.getSecurityResults(url)).rejects.toThrow();
  });

  it('should correctly save fetched data to file system', async () => {
    const exampleData = "example_data";

    jest.mock('./fetch-security-data', () => ({
      fetchSecurityData: jest.fn(),
    }));

    (fetchSecurityData as jest.Mock).mockResolvedValue(exampleData);

    const spyMkdir = jest.spyOn(fs.promises, 'mkdir'); //.mockImplementation();
    const spyWriteFile = jest.spyOn(fs.promises, 'writeFile'); //.mock();

    await service.fetchAndSaveSecurityData();

    expect(spyMkdir).toHaveBeenCalledWith(
      '/data', expect.anything(),
    );

    expect(spyWriteFile).toHaveBeenCalledWith(
      '/data/security-data.csv',
      exampleData,
      'utf8',
    );
  });
});
