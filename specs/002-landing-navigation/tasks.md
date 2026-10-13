# Tasks: Landing Page & Navigation

## Phase 1: Setup

- [ ] T001 Replace react-scripts with Vite + `@vitejs/plugin-react`; move `index.html` to the project root
- [ ] T002 [P] TypeScript configs (`tsconfig.app.json`, `tsconfig.node.json`) and `src/vite-env.d.ts`
- [ ] T003 [P] Vitest + jsdom + Testing Library setup in `src/test/setup.ts`

## Phase 2: User Story 1 - Landing (P1)

- [ ] T004 [US1] Test: heading, quote and Get Started link in `LandingPage.test.tsx`
- [ ] T005 [US1] Port `public/home.html` + `static/home.css` into `LandingPage.tsx`

## Phase 3: User Story 2 - Navigation (P1)

- [ ] T006 [US2] Tests for the anonymous and authenticated navbar states
- [ ] T007 [US2] Responsive `Navbar.tsx` with `NavLink` active states and a logout action
- [ ] T008 [US2] Route table in `App.tsx` (`/`, `/app`, `/app/search`, `/app/product/:id`, auth pages)

## Phase 4: User Story 3 - 404 (P3)

- [ ] T009 [US3] `NotFound.tsx` + catch-all route and a test

## Phase 5: Polish

- [ ] T010 E2E: landing → Get Started → gift list (`e2e/tests/browse.spec.ts`)
