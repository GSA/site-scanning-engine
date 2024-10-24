// pino-config.ts
import { getPinoPrettyConfig } from "./pino-pretty-config";
import { LoggerOptions } from 'pino';
import { RootLoggerMeta } from "../types";
import { DEFAULT_APPLICATION_NAME } from "../constants";
import * as cuid from 'cuid';

const levelNames = {
    10: 'trace',
    20: 'debug',
    30: 'info',
    40: 'warn',
    50: 'error',
    60: 'fatal',
};

/**
 * Get the Pino configuration for logging.
 * Determines whether to use pino-pretty based on the environment.
 * In hosted environments, logs are in JSON format.
 *
 * @param rootMeta - Metadata to be applied to all log events.
 * @returns The Pino logger configuration object.
 */
export function getPinoConfig(rootMeta: RootLoggerMeta = {}): LoggerOptions {
    const rootMetaDefaults = getRootMetaDefaults();
    const finalRootMeta = { ...rootMetaDefaults, ...rootMeta };

    const config: LoggerOptions = {
        base: finalRootMeta,
        hooks: {
            logMethod(inputArgs, method, level) {
                const [firstArg, ...rest] = inputArgs;

                // Add `levelName` property to the log object or message, with fallback to 'info'
                const logObject = {
                    ...typeof firstArg === 'object' ? firstArg : { msg: firstArg },
                    levelName: levelNames[level] || 'info', // Fallback to 'info' if level not found
                };

                // Call the original log method with modified arguments
                method.apply(this, [logObject, ...rest]);
            },
        },
        level: 'debug',
        timestamp: () => `,"sseLogTime":"${generateISO8601WithNanoseconds()}"`,
    };

    if (usePinoPretty()) {
        config.transport = {
            options: getPinoPrettyConfig(),
            target: 'pino-pretty',
        };
    }

    return config;
}

/**
 * Get the default metadata for the root logger.
 */
function getRootMetaDefaults(): RootLoggerMeta {
    return {
        applicationName: DEFAULT_APPLICATION_NAME,
        executionId: cuid(),
        project: 'site-scanning',
    };
}

/**
 * Determine if the current environment is a hosted environment (e.g., production/staging).
 * @returns True if the environment is hosted, otherwise false.
 */
function isHostedEnvironment(): boolean {
    return process.env.NODE_ENV !== 'dev';
}

/**
 * Determine if pino-pretty should be used for logging.
 * @returns True if pino-pretty should be used, otherwise false.
 */
function usePinoPretty(): boolean {
    if(process.env.FORCE_JSON_LOG_OUTPUT === 'true') {
        return false;
    }
    return !isHostedEnvironment();
}

function generateISO8601WithNanoseconds(): string {
    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_seconds, nanoseconds] = process.hrtime();

    // Format the date to ISO 8601 with milliseconds
    const baseTimestamp = now.toISOString();

    // Extract the millisecond part and replace it with nanoseconds
    const millisPart = baseTimestamp.substring(20, 23); // Extracting the `.xxx` part for milliseconds
    const nanosPart = (parseInt(millisPart, 10) * 1e6 + nanoseconds % 1e9).toString().padStart(9, '0');

    // Combine to get ISO 8601 format with nanoseconds
    return `${baseTimestamp.substring(0, 19)}.${nanosPart}${baseTimestamp.substring(23)}`;
}

