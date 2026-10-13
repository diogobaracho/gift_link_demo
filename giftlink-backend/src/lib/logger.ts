/**
 * Structured logging with pino.
 *
 * - production: newline-delimited JSON on stdout (ready for Loki/ELK/CloudWatch).
 * - development: human-friendly output through pino-pretty (a devDependency, so it is
 *   never required in the production image).
 * - test: callers pass `level: 'silent'` to keep test output clean.
 */
import { pino, type Logger, type LoggerOptions } from 'pino';

export type { Logger };

export interface CreateLoggerOptions {
  level: LoggerOptions['level'];
  pretty?: boolean;
  name?: string;
}

export function createLogger({
  level,
  pretty = false,
  name = 'giftlink-backend',
}: CreateLoggerOptions): Logger {
  return pino({
    name,
    level,
    // Never write credentials to the logs, even if a request body is logged by mistake.
    redact: {
      paths: ['req.headers.authorization', '*.password', '*.passwordHash', '*.token'],
      censor: '[REDACTED]',
    },
    ...(pretty && {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
      },
    }),
  });
}
