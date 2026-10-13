# Feature Specification: Database Initialization & Seed

**Feature Branch**: `001-database-seed`
**Created**: 2026-10-05
**Status**: Approved
**Input**: User story #2: "Initialize and populate MongoDB so the application has a structured and populated database to work with."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Seed a fresh database with one command (Priority: P1)

A developer clones the repository and wants realistic data (gifts, a demo account and a few
comments) without writing any queries by hand.

**Why this priority**: every other feature needs data to demo or test against.

**Independent Test**: run `make seed` against an empty MongoDB, then `GET /api/gifts`
returns the 16 catalogue gifts and the demo user can log in.

**Acceptance Scenarios**:

1. **Given** an empty `giftdb` database, **When** the seed runs, **Then** the `gifts`, `users` and `comments` collections exist with the catalogue gifts, two demo users and sample comments.
2. **Given** an already seeded database, **When** the seed runs again, **Then** no duplicates are created (the operation is idempotent).
3. **Given** a database with modified data, **When** the seed runs with `--reset`, **Then** all seeded collections are dropped and reloaded to the canonical state.

### User Story 2 - Data integrity and indexes (Priority: P2)

The API relies on unique and indexed fields for correctness and speed.

**Independent Test**: inspect `db.gifts.getIndexes()` and try to insert a duplicate user email.

**Acceptance Scenarios**:

1. **Given** the API starts, **When** it connects, **Then** it ensures unique indexes on `gifts.id` and `users.email`, plus query indexes for category/condition and `comments.giftId`.
2. **Given** the source JSON has an invalid record, **When** the seed runs, **Then** it fails with a validation error naming the record, and nothing is half-written.

### Edge Cases

- MongoDB is unreachable: the seed exits non-zero with a clear message and does not hang.
- The source data uses legacy category names (`Living Room`, `Office Furniture`): these are normalized to the canonical set.
- An image file referenced by the data does not exist: the record is stored with `image: null` and the UI shows a placeholder.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST provide a seed command runnable locally (`npm run seed`) and in Docker (`make seed`).
- **FR-002**: Seeding MUST be idempotent (upsert by natural key).
- **FR-003**: Seeding MUST support a `--reset` flag that restores the canonical dataset.
- **FR-004**: Each seed record MUST be validated against the same schema the API uses.
- **FR-005**: The API MUST create the required indexes on startup (idempotently).
- **FR-006**: Demo credentials MUST be documented in the README.

### Key Entities

- **Gift**: public `id`, name, category (`Living | Bedroom | Bathroom | Kitchen | Office`), condition (`New | Like New | Older`), owner (`posted_by`), zipcode, `date_added` (unix seconds), age in days/years, description, image path.
- **User**: id, email (unique, lowercase), first/last name, bcrypt password hash, createdAt.
- **Comment**: id, giftId, optional parentId, author, text, sentiment, createdAt.

## Success Criteria _(mandatory)_

- **SC-001**: From an empty database, `make up && make seed` gives a browsable catalogue in under 60 seconds.
- **SC-002**: Running the seed 3 times in a row leaves exactly 16 gifts.
- **SC-003**: The seed logic is covered by automated tests (idempotency, reset, validation).
