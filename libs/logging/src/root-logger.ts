import pino from 'pino';
import { getPinoConfig } from "./config/pino-config";
import { RootLoggerMeta } from "./types";

let rootLoggerInstance: pino.Logger;

/**
 * Creates and returns the root-level pino logger.
 *
 * @param rootMeta - Metadata to be applied to all log events.
 * @param forceCreation - If true, a new logger instance is created even if one already exists.
 * @returns A configured pino logger instance.
 */
export function getRootLogger(rootMeta: RootLoggerMeta = {}, forceCreation = false): pino.Logger {
    if (rootLoggerInstance && !forceCreation) {
        return rootLoggerInstance;
    }
    const pinoConfig = getPinoConfig(rootMeta);
    rootLoggerInstance = pino(pinoConfig);
    return rootLoggerInstance;
}
