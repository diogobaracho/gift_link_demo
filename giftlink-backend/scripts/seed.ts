/**
 * CLI wrapper around `seedDatabase`.
 *
 *   npm run seed            # idempotent upsert
 *   npm run seed:reset      # wipe gifts/users/comments, then seed
 *
 * The data file defaults to `data/gifts.json` relative to the working directory
 * (the backend package locally, `/app/giftlink-backend` in Docker). Override it with
 * SEED_FILE.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { loadConfig } from '../src/config/env.js';
import { closeDatabase, connectToDatabase } from '../src/db/mongo.js';
import { seedDatabase } from '../src/db/seed.js';
import { createLogger } from '../src/lib/logger.js';
import { createHttpSentimentClient } from '../src/lib/sentiment-client.js';

try {
  process.loadEnvFile();
} catch {
  /* no .env file: rely on the environment */
}

async function main(): Promise<void> {
  const config = loadConfig();
  const logger = createLogger({
    level: 'info',
    pretty: config.env === 'development',
    name: 'seed',
  });
  const reset = process.argv.includes('--reset');
  const file = path.resolve(process.env.SEED_FILE ?? 'data/gifts.json');

  // Accept both a bare array and the course's `{ "docs": [...] }` wrapper.
  const raw: unknown = JSON.parse(await readFile(file, 'utf8'));
  const gifts = Array.isArray(raw) ? raw : (raw as { docs?: unknown }).docs;

  const db = await connectToDatabase(config.mongo.url, config.mongo.dbName);
  try {
    const sentiment = config.sentiment.url
      ? createHttpSentimentClient({
          baseUrl: config.sentiment.url,
          timeoutMs: config.sentiment.timeoutMs,
          logger,
        })
      : undefined;
    const result = await seedDatabase(db, { gifts, reset, sentiment });
    logger.info({ ...result, reset, file }, 'Seed completed');
  } finally {
    await closeDatabase();
  }
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});
