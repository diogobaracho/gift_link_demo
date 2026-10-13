# Tasks: Gift Listing & Details

## Phase 1: Foundational

- [ ] T001 `giftSchema`, `createGiftSchema` and `paginationSchema` in `gift.schema.ts`
- [ ] T002 Error handling: `HttpError`, `errorHandler` (ZodError → 400), `notFound`

## Phase 2: User Story 1 - Browse (P1)

- [ ] T003 [US1] Tests: pagination meta, ordering, limit clamping, page past the end
- [ ] T004 [US1] `GET /api/gifts`
- [ ] T005 [US1] `GiftCard` + `MainPage` with pagination, loading/error/empty states + tests

## Phase 3: User Story 2 - Details (P1)

- [ ] T006 [US2] Tests: 200 with no `_id` leak, 404 unknown id
- [ ] T007 [US2] `GET /api/gifts/:id`
- [ ] T008 [US2] `DetailsPage` + tests (renders fields, not found, back button)

## Phase 4: User Story 3 - Give away (P2)

- [ ] T009 [US3] Tests: 201 create (auth), 401 anonymous, 400 invalid, 204 owner delete, 403 non-owner
- [ ] T010 [US3] `POST /api/gifts`, `DELETE /api/gifts/:id`
- [ ] T011 [US3] `NewGiftPage` form + tests; delete button on details for the owner

## Phase 5: Polish

- [ ] T012 E2E `browse.spec.ts` and `post-gift.spec.ts`
