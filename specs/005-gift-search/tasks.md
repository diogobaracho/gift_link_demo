# Tasks: Gift Search

## Phase 1: Foundational

- [ ] T001 [P] `escapeRegex` + unit tests

## Phase 2: User Story 1 - By name (P1)

- [ ] T002 [US1] Unit tests for `buildSearchFilter` (name, escape, empty)
- [ ] T003 [US1] Integration tests: partial/case-insensitive match, metacharacters
- [ ] T004 [US1] `search.schema.ts`, `search.service.ts`, `GET /api/search`

## Phase 3: User Story 2 - Filters (P1)

- [ ] T005 [US2] Tests: category, condition, age_years, combination, 400 on invalid enum
- [ ] T006 [US2] `SearchPage.tsx`: dropdowns from shared constants, age slider with live value, results + empty state
- [ ] T007 [US2] Component tests with MSW (query string assertions)

## Phase 4: Polish

- [ ] T008 E2E `search.spec.ts`
