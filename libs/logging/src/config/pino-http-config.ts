import { Options } from 'pino-http';
import { getRootLogger } from "../root-logger";
import { RootLoggerMeta } from "../types";
import { DEFAULT_APPLICATION_NAME } from "../constants";

/**
 * Builds and returns a configuration object for `pino-http`.
 *
 * @see https://github.com/pinojs/pino-http?tab=readme-ov-file#pinohttpopts-stream
 * @param rootMeta - Metadata to be applied to all log events.
 * @returns {Options} A pino-http configuration object.
 */
export function getPinoHttpConfig(rootMeta: RootLoggerMeta = {}): Options {
    const applicationName = rootMeta.applicationName || DEFAULT_APPLICATION_NAME;
    return {
        logger: getRootLogger(rootMeta),
        name: applicationName,
        useLevel: 'info',
    }
}
