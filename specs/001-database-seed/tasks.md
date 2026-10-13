# Tasks: Database Initialization & Seed

**Input**: [spec.md](spec.md), [plan.md](plan.md)

## Phase 1: Setup

- [ ] T001 Move the catalogue to `giftlink-backend/data/gifts.json` and normalize legacy categories and missing images
- [ ] T002 [P] Typed environment config in `src/config/env.ts` (MONGO_URL, MONGO_DB_NAME)

## Phase 2: Foundational

- [ ] T003 Mongo client singleton with `connectToDatabase()` / `closeDatabase()` in `src/db/mongo.ts`
- [ ] T004 `ensureIndexes()` for gifts, users and comments in `src/db/mongo.ts`

## Phase 3: User Story 1 - Seed with one command (P1) 🎯 MVP

- [ ] T005 [US1] Write failing tests: fresh seed, idempotent re-seed, `--reset` in `test/seed.test.ts`
- [ ] T006 [US1] Implement `seedDatabase()` with `bulkWrite` upserts in `src/db/seed.ts`
- [ ] T007 [US1] CLI wrapper `scripts/seed.ts` + `npm run seed` / `seed:reset`
- [ ] T008 [US1] Demo users (bcrypt-hashed) and sample comments

## Phase 4: User Story 2 - Integrity (P2)

- [ ] T009 [US2] Validate every record with `giftSchema` before writing; test the invalid-record path
- [ ] T010 [US2] Test that indexes exist and that a duplicate email is rejected

## Phase 5: Polish

- [ ] T011 [P] `make seed` / `make seed-reset` targets and a compose `seed` job
- [ ] T012 [P] How-to: `docs/how-to/seed-data.md`
