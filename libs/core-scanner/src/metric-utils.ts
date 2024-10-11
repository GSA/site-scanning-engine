import { Logger } from 'pino';

export function logCount( logger: Logger, metadata: any, metricId: string, logMessage: string, metricValue = 1 ) {
  if( !metadata ) {
    metadata = {};
  }
  const metaDefaults = {
    metricValue,
    metricUnit: "count",
  };
  const finalMetadata = {
    ...metaDefaults,
    ...metadata,
    metricId,
  };
  logger.info( finalMetadata, logMessage );
};

export function logTimer( logger: Logger ) {
  const timer = {
    start: Date.now(),
    log: (metadata: any, metricId: string, logMessage: string, decimalPrecision = 0 ) => {
      const duration = Date.now() - timer.start;
      if( !metadata ) {
        metadata = {};
      }
      const finalMetadata = {
        ...metadata,
        metricUnit: "ms",
        metricValue: duration,
        metricId,
      };

      const finalMessage = logMessage
        .replace(/\{metricValue\}/g, duration.toString());
      
      logger.info( finalMetadata, finalMessage );
    }
  };
  return timer;
};

export function logScanResult( logger: Logger, metadata: any, name: string, value: any, message: string ) {
  if( !metadata ) {
    metadata = {};
  }
  const finalMetadata = {
    ...metadata,
    scanResult: {
      name,
      value: JSON.stringify( value ),
    },
  };
  logger.info( finalMetadata, message );
}