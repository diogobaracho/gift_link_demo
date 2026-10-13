/**
 * pino logger for the sentiment service. The course skeleton imported a `./logger`
 * module that did not exist; this provides it.
 */
import { pino, type Logger } from 'pino';

export type { Logger };

export function createLogger(level = process.env.LOG_LEVEL ?? 'info'): Logger {
  const pretty = process.env.NODE_ENV === 'development';
  return pino({
    name: 'sentiment',
    level,
    ...(pretty && { transport: { target: 'pino-pretty', options: { colorize: true } } }),
  });
}
