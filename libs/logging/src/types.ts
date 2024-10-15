export type RootLoggerMeta = {
    applicationName?: string;
    executionId?: string;
    project?: string;
};

export type DurationLogTimer = {
    start: number,
    log: (metadata: any, metricId: string, logMessage: string, decimalPrecision?: number) => void
};