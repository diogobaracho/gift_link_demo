# Tasks: Authentication & Profile

## Phase 1: Foundational

- [ ] T001 [P] `lib/password.ts` (bcrypt hash/verify) with unit tests
- [ ] T002 [P] `lib/jwt.ts` (sign/verify) with unit tests
- [ ] T003 `middleware/require-auth.ts` + `types/express.d.ts` (typed `req.user`)

## Phase 2: User Story 1 - Register (P1)

- [ ] T004 [US1] Tests: 201 success, 409 duplicate (case-insensitive), 400 validation
- [ ] T005 [US1] `registerSchema` + `AuthService.register` + `POST /api/auth/register`
- [ ] T006 [US1] `RegisterPage.tsx` with client validation + tests

## Phase 3: User Story 2 - Login/Logout (P1)

- [ ] T007 [US2] Tests: 200 success, 401 wrong password, 401 unknown email (same message)
- [ ] T008 [US2] `POST /api/auth/login`, `GET /api/auth/me`, rate limit on `/api/auth`
- [ ] T009 [US2] `AuthContext` (sessionStorage persistence), `ProtectedRoute`, `LoginPage` + tests

## Phase 4: User Story 3 - Profile (P2)

- [ ] T010 [US3] Tests: update name, 401 without a token, 400 on an empty body
- [ ] T011 [US3] `PUT /api/auth/update` + `Profile.tsx` edit mode + tests

## Phase 5: Polish

- [ ] T012 E2E `e2e/tests/auth.spec.ts`: register → logout → login → edit profile
