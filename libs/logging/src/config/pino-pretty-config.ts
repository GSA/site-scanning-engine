/**
 * Get the configuration for pino-pretty.
 * This configuration is used to format logs in a human-readable way during local development.
 *
 * @see https://github.com/pinojs/pino-pretty
 * @returns The configuration object for pino-pretty.
 */
export function getPinoPrettyConfig() {
    return {
        colorize: true,
        ignore: 'pid,hostname',
        singleLine: true,
        timestampKey: 'sseLogTime',
    };
}