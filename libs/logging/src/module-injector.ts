import { LoggerModule } from "nestjs-pino";
import { getPinoHttpConfig } from "./config/pino-http-config";
import { RootLoggerMeta } from "./types";

/**
 * Injects the LoggerModule.
 *
 * @param rootMeta - Metadata to be applied to all log events.
 * @returns void
 */
export function injectLoggerModule(rootMeta: RootLoggerMeta = {}) {
    return LoggerModule.forRoot({
        pinoHttp: getPinoHttpConfig(rootMeta)
    })
}