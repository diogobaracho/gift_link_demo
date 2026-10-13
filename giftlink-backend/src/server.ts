/**
 * Process entry point: load config, connect to MongoDB, start HTTP, shut down gracefully.
 *
 * Kept deliberately thin. Everything testable lives in `createApp` and the modules.
 */
import { createApp } from './app.js';
import { ConfigError, loadConfig } from './config/env.js';
import { closeDatabase, connectToDatabase, ensureIndexes } from './db/mongo.js';
import { createLogger } from './lib/logger.js';

// Load a local `.env` file when present (Node ≥ 21.7). Containers inject real env vars.
try {
  process.loadEnvFile();
} catch {
  /* no .env file: rely on the environment */
}

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger({ level: config.logLevel, pretty: config.env === 'development' });

  const db = await connectToDatabase(config.mongo.url, config.mongo.dbName);
  await ensureIndexes(db);
  logger.info({ db: config.mongo.dbName }, 'Connected to MongoDB');

  const app = createApp({ config, db, logger });
  const server = app.listen(config.port, () => {
    logger.info(`GiftLink API listening on http://localhost:${config.port}`);
  });

  // Orchestrators (Docker, Kubernetes) send SIGTERM and wait before SIGKILL: stop
  // accepting connections, let in-flight requests finish, then close the DB pool.
  const shutdown = (signal: NodeJS.Signals) => {
    logger.info({ signal }, 'Shutting down');
    server.close(() => {
      void closeDatabase().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

main().catch((err: unknown) => {
  // The logger may not exist yet (bad config), so fall back to stderr.
  // eslint-disable-next-line no-console
  console.error(err instanceof ConfigError ? err.message : err);
  process.exit(1);
});
