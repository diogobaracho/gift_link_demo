# Implementation Plan: Database Initialization & Seed

**Branch**: `001-database-seed` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

## Summary

Replace the course's `util/import-mongo` script with a typed, validated, idempotent seeder
inside the backend workspace. It shares the zod schemas and Mongo client with the API.

## Technical Context

**Language/Version**: TypeScript 6 (strict), Node.js 24
**Primary Dependencies**: `mongodb` native driver 7, `zod` 4, `bcryptjs`
**Storage**: MongoDB 7, database `giftdb`
**Testing**: Vitest + `mongodb-memory-server`
**Project Type**: web service (backend workspace script)
**Constraints**: idempotent; safe to run on every container start; no partial writes on validation failure

## Constitution Check

| Principle       | Status                                                         |
| --------------- | -------------------------------------------------------------- |
| II. Type safety | ✅ JSON validated with the API's zod schemas before any write  |
| III. Test-first | ✅ `test/seed.test.ts` covers fresh, repeat, reset and invalid |
| V. Operable     | ✅ exits non-zero on failure; usable as a compose job          |
| VI. Simplicity  | ✅ native driver `bulkWrite` upserts, no ODM                   |

## Project Structure

```text
giftlink-backend/
├── data/gifts.json            # canonical catalogue (normalized categories)
├── scripts/seed.ts            # CLI entry: parses --reset, calls seedDatabase()
├── src/db/mongo.ts            # connect/close + ensureIndexes()
├── src/db/seed.ts             # seedDatabase(db, { reset }) – pure, testable
└── test/seed.test.ts
```

**Structure Decision**: the seeding logic lives in `src/db/seed.ts` so tests can call it
directly against an in-memory database. The CLI wrapper stays small.
