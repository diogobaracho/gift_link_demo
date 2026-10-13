/**
 * MongoDB connection management (native driver; see ADR-0004).
 *
 * The `MongoClient` keeps its own connection pool, so one client per process is the
 * recommended pattern. `connectToDatabase` memoizes that client: this completes the
 * course skeleton's `models/db.js` Tasks 1-3 (connect, select `giftdb`, return the db).
 */
import { MongoClient, type Db } from 'mongodb';

import { COLLECTIONS } from './collections.js';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

/**
 * Connects once and returns the shared `Db` handle. Later calls reuse the connection.
 *
 * @param url - MongoDB connection string.
 * @param dbName - database name (created lazily by MongoDB on first write).
 */
export async function connectToDatabase(url: string, dbName: string): Promise<Db> {
  if (dbInstance) return dbInstance;

  client = new MongoClient(url, {
    // Fail fast when the server is unreachable instead of the 30 s driver default.
    serverSelectionTimeoutMS: 5_000,
    appName: 'giftlink-backend',
  });
  await client.connect();
  dbInstance = client.db(dbName);
  return dbInstance;
}

/** Closes the shared connection (graceful shutdown, end of scripts and tests). */
export async function closeDatabase(): Promise<void> {
  await client?.close();
  client = null;
  dbInstance = null;
}

/** Cheap round-trip used by the readiness probe. */
export async function pingDatabase(db: Db): Promise<boolean> {
  try {
    await db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Creates the indexes the API relies on. `createIndex` is idempotent, so this is safe
 * to call on every startup; MongoDB only builds an index that does not exist yet.
 */
export async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    // Public identifier used in URLs: must be unique.
    db.collection(COLLECTIONS.gifts).createIndex({ id: 1 }, { unique: true }),
    // Default listing sort (newest first).
    db.collection(COLLECTIONS.gifts).createIndex({ date_added: -1 }),
    // Search filters (equality on both fields, ESR rule).
    db.collection(COLLECTIONS.gifts).createIndex({ category: 1, condition: 1 }),
    // Login lookup + uniqueness. Emails are normalized to lowercase before writing.
    db.collection(COLLECTIONS.users).createIndex({ email: 1 }, { unique: true }),
    // Loading a gift's thread in chronological order.
    db.collection(COLLECTIONS.comments).createIndex({ giftId: 1, createdAt: 1 }),
  ]);
}
