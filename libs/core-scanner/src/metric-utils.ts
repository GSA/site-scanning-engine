import { Logger } from 'pino';

export function logCount( logger: Logger, metadata: any, metricId: string, logMessage: string ) {
    if( !metadata ) {
        metadata = {};
    }
    const metaDefaults = {
        metricValue: 1,
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