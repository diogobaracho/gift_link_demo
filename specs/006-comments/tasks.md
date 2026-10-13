# Tasks: Comments with Replies & Sentiment

## Phase 1: Sentiment microservice

- [ ] T001 Port `sentiment/index.js` to TypeScript: `createApp()`, `analyze()` classifier, pino logger
- [ ] T002 [P] Tests: positive, negative, neutral, missing sentence (400), analyzer error (500), health

## Phase 2: Foundational (backend)

- [ ] T003 `SentimentClient` interface + HTTP implementation with timeout/fail-open + unit tests
- [ ] T004 `buildCommentTree` + unit tests (ordering, nesting, orphan safety)

## Phase 3: User Story 1 - Read (P1)

- [ ] T005 [US1] Tests: empty list, threaded list, 404 for an unknown gift
- [ ] T006 [US1] `GET /api/gifts/:id/comments`

## Phase 4: User Story 2 - Post/Reply (P1)

- [ ] T007 [US2] Tests: 201, 401 anonymous, 400 empty/too long, 400 foreign parentId
- [ ] T008 [US2] `POST /api/gifts/:id/comments`
- [ ] T009 [US2] `CommentList` (recursive), `CommentForm`, reply toggle + component tests

## Phase 5: User Story 3 - Sentiment (P3)

- [ ] T010 [US3] Tests: sentiment stored when up; `null` when down/slow
- [ ] T011 [US3] `SentimentBadge` + test

## Phase 6: Polish

- [ ] T012 E2E `comments.spec.ts` (comment + reply against the real sentiment service)
