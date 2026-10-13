import { readFileSync } from 'node:fs';

import { MongoClient, type Db } from 'mongodb';
import { afterAll, beforeAll, beforeEach, describe, expect, inject, it } from 'vitest';
import { ZodError } from 'zod';

import { DEMO_USERS, seedDatabase } from '../../src/db/seed.js';
import { verifyPassword } from '../../src/lib/password.js';

const catalogue: unknown[] = JSON.parse(readFileSync('data/gifts.json', 'utf8'));

describe('seedDatabase', () => {
  let client: MongoClient;
  let db: Db;

  beforeAll(async () => {
    client = await MongoClient.connect(inject('mongoUri'));
    db = client.db('test_seed');
  });
  beforeEach(() => db.dropDatabase());
  afterAll(async () => {
    await db.dropDatabase();
    await client.close();
  });

  it('loads the catalogue, demo users and a sample thread into an empty database', async () => {
    const result = await seedDatabase(db, { gifts: catalogue });

    expect(result).toEqual({ gifts: 16, users: DEMO_USERS.length, comments: 4 });

    const demo = await db.collection('users').findOne({ email: 'demo@giftlink.dev' });
    expect(demo).not.toBeNull();
    await expect(verifyPassword('Demo@12345', demo!.passwordHash as string)).resolves.toBe(true);

    const reply = await db.collection('comments').findOne({ parentId: { $ne: null } });
    expect(reply).not.toBeNull();
  });

  it('assigns every gift to a demo user', async () => {
    await seedDatabase(db, { gifts: catalogue });
    const users = await db.collection('users').find().toArray();
    const userIds = users.map((u) => u._id.toHexString());

    const owners = await db.collection('gifts').distinct('posted_by');
    expect(owners.every((owner: string) => userIds.includes(owner))).toBe(true);
  });

  it('is idempotent across repeated runs', async () => {
    await seedDatabase(db, { gifts: catalogue });
    await seedDatabase(db, { gifts: catalogue });
    const result = await seedDatabase(db, { gifts: catalogue });

    expect(result).toEqual({ gifts: 16, users: 2, comments: 4 });
  });

  it('restores canonical data and removes extras with reset', async () => {
    await seedDatabase(db, { gifts: catalogue });
    await db.collection('gifts').updateOne({ id: '875' }, { $set: { name: 'Tampered' } });
    await db.collection('gifts').insertOne({ id: 'extra', name: 'Extra' });

    const result = await seedDatabase(db, { gifts: catalogue, reset: true });

    expect(result.gifts).toBe(16);
    expect(await db.collection('gifts').findOne({ id: '875' })).toMatchObject({ name: 'Lamp' });
    expect(await db.collection('gifts').findOne({ id: 'extra' })).toBeNull();
  });

  it('validates every record before writing anything', async () => {
    const broken = [...catalogue, { id: 'bad', name: 'X', category: 'Garage' }];

    await expect(seedDatabase(db, { gifts: broken })).rejects.toBeInstanceOf(ZodError);
    expect(await db.collection('gifts').countDocuments()).toBe(0);
  });

  it('rejects an empty dataset', async () => {
    await expect(seedDatabase(db, { gifts: [] })).rejects.toBeInstanceOf(ZodError);
  });
});

describe('seedDatabase with a sentiment client', () => {
  it('labels the sample comments', async () => {
    const client = await MongoClient.connect(inject('mongoUri'));
    const db = client.db('test_seed_sentiment');
    try {
      await seedDatabase(db, {
        gifts: catalogue,
        sentiment: { analyze: () => Promise.resolve({ label: 'positive', score: 1 }) },
      });
      const labelled = await db
        .collection('comments')
        .countDocuments({ 'sentiment.label': 'positive' });
      expect(labelled).toBe(4);
    } finally {
      await db.dropDatabase();
      await client.close();
    }
  });
});
