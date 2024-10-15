import pino from 'pino';
import { logCount, logTimer } from './metric-utils';


const mockLogger = pino();

describe('Metric Utilities', () => {

  describe('logCount()', () => {
    afterAll(() => {
      jest.resetAllMocks();
    });
    it('should call mockLogger.info with default metadata when no metadata is provided', async () => {
      const metricId = 'test-id';
      const logMessage = 'test message';
      logCount(mockLogger, null, metricId, logMessage);

      const expectedMetadata = {
        metricValue: 1,
        metricUnit: 'count',
        metricId,
      };
      expect(mockLogger.info).toHaveBeenCalledWith(expectedMetadata, logMessage);
    });

    it('should call mockLogger.info with provided metadata merged with defaults', () => {
      const metricId = 'metric2';
      const logMessage = 'Another log message';
      const metadata = {
        metricValue: 5,
        additionalInfo: 'Extra data'
      };
      logCount(mockLogger, metadata, metricId, logMessage);

      const expectedMetadata = {
        metricValue: 5,
        metricUnit: 'count',
        metricId,
        additionalInfo: 'Extra data'
      };
      expect(mockLogger.info).toHaveBeenCalledWith(expectedMetadata, logMessage);
    });
  });

  describe('logTimer()', () => {
    let timer;
    beforeEach(() => {
      timer = logTimer(mockLogger);
    });

    it('should create a timer with a start time', () => {
      expect(timer.start).toBeDefined();
      expect(timer.start).toBeGreaterThan(0);
    });

    it('should call mockLogger.info with correct metadata and message after log is called', () => {
      const metricId = 'timer1';
      const logMessage = 'Duration: Any ms';
      const metadata = { additionalInfo: 'test' };

      timer.log(metadata, metricId, logMessage);

      // Calculate the expected duration
      const expectedDuration = expect.any(Number);
      const expectedMetadata = {
        ...metadata,
        metricValue: expectedDuration,
        metricUnit: 'ms',
        metricId,
      };

      // The log message should replace {metricValue} with the duration
      const expectedMessage = `Duration: ${expectedDuration} ms`;

      expect(mockLogger.info).toHaveBeenCalledWith(expectedMetadata, expectedMessage);
    });

  });

});