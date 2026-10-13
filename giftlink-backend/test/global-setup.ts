/**
 * Starts a single throwaway MongoDB (mongodb-memory-server) for the whole test run and
 * hands its URI to the test files through Vitest's provide/inject channel.
 *
 * Despite the name, MongoDB 7+ always uses WiredTiger on disk. Creating a collection or
 * index costs a file create + fsync (~500 ms each on a regular disk). On Linux the data
 * directory goes in tmpfs (`/dev/shm`), which makes index creation ~200x faster.
 */
import { existsSync, mkdtempSync, rmSync } from 'node:fs';

import { MongoMemoryServer } from 'mongodb-memory-server';
import type { TestProject } from 'vitest/node';

declare module 'vitest' {
  export interface ProvidedContext {
    mongoUri: string;
  }
}

export default async function setup(project: TestProject) {
  const dbPath = existsSync('/dev/shm') ? mkdtempSync('/dev/shm/giftlink-test-') : undefined;
  const mongod = await MongoMemoryServer.create({ instance: dbPath ? { dbPath } : {} });
  project.provide('mongoUri', mongod.getUri());

  return async () => {
    await mongod.stop();
    if (dbPath) rmSync(dbPath, { recursive: true, force: true });
  };
}
