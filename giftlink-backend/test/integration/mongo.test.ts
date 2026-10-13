import { afterAll, describe, expect, it } from 'vitest';
import { inject } from 'vitest';

import {
  closeDatabase,
  connectToDatabase,
  ensureIndexes,
  pingDatabase,
} from '../../src/db/mongo.js';

describe('mongo connection helpers', () => {
  afterAll(() => closeDatabase());

  it('memoizes the database handle', async () => {
    const first = await connectToDatabase(inject('mongoUri'), 'test_memo');
    const second = await connectToDatabase(inject('mongoUri'), 'ignored');

    expect(second).toBe(first);
    expect(first.databaseName).toBe('test_memo');
    expect(await pingDatabase(first)).toBe(true);
  });

  it('creates the expected indexes idempotently', async () => {
    const db = await connectToDatabase(inject('mongoUri'), 'test_memo');
    await ensureIndexes(db);
    await ensureIndexes(db); // second run must be a no-op, not an error

    const giftIndexes = await db.collection('gifts').indexes();
    const userIndexes = await db.collection('users').indexes();

    expect(giftIndexes.find((i) => i.name === 'id_1')?.unique).toBe(true);
    expect(giftIndexes.map((i) => i.name)).toEqual(
      expect.arrayContaining(['date_added_-1', 'category_1_condition_1']),
    );
    expect(userIndexes.find((i) => i.name === 'email_1')?.unique).toBe(true);
    await db.dropDatabase();
  });

  it('reports an unreachable database as not ready', async () => {
    const db = await connectToDatabase(inject('mongoUri'), 'test_memo');
    await closeDatabase();
    expect(await pingDatabase(db)).toBe(false);
  });
});
