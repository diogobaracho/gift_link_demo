/**
 * Test harness: a real Express app wired to an isolated MongoDB database.
 *
 * Each call creates a uniquely named database on the shared in-memory server, so
 * test files can run in parallel without seeing each other's data.
 */
import { randomUUID } from 'node:crypto';

import { MongoClient, type Db } from 'mongodb';
import { inject } from 'vitest';

import { createApp } from '../../src/app.js';
import { loadConfig, type AppConfig } from '../../src/config/env.js';
import { ensureIndexes } from '../../src/db/mongo.js';
import { createLogger } from '../../src/lib/logger.js';
import type { SentimentClient } from '../../src/lib/sentiment-client.js';

export const TEST_JWT_SECRET = 'test-secret-that-is-long-enough';

export function buildTestConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  const base = loadConfig({
    NODE_ENV: 'test',
    MONGO_URL: inject('mongoUri'),
    JWT_SECRET: TEST_JWT_SECRET,
    LOG_LEVEL: 'silent',
  });
  return { ...base, ...overrides };
}

export interface TestContext {
  app: ReturnType<typeof createApp>;
  db: Db;
  config: AppConfig;
  close: () => Promise<void>;
}

export async function createTestContext(
  options: { config?: Partial<AppConfig>; sentiment?: SentimentClient } = {},
): Promise<TestContext> {
  const config = buildTestConfig(options.config);
  const client = await MongoClient.connect(config.mongo.url);
  const db = client.db(`test_${randomUUID().slice(0, 8)}`);
  await ensureIndexes(db);

  const app = createApp({
    config,
    db,
    logger: createLogger({ level: 'silent' }),
    // Default to a stub so tests never depend on a running sentiment service.
    sentiment: options.sentiment ?? { analyze: () => Promise.resolve(null) },
  });

  return {
    app,
    db,
    config,
    close: async () => {
      await db.dropDatabase();
      await client.close();
    },
  };
}
