/**
 * Sentiment service entry point.
 */
import { createApp } from './app.js';
import { createLogger } from './logger.js';

try {
  process.loadEnvFile();
} catch {
  /* no .env file: rely on the environment */
}

const logger = createLogger();
const port = Number(process.env.PORT ?? 3000);

const server = createApp({ logger }).listen(port, () => {
  logger.info(`Sentiment service listening on http://localhost:${port}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
};
process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
