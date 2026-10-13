# GiftLink Constitution

GiftLink connects people giving away household items they no longer need with people who
prefer to reuse rather than buy new. This constitution governs how every feature in this
repository is specified, built, tested and shipped.

## Core Principles

### I. Spec-Driven Delivery

Every user-facing feature starts as a specification in `specs/NNN-feature/spec.md`, written
from a user story in `_user_story.md`. The spec states what users need and why, never how.
A `plan.md` then picks the technical approach, and `tasks.md` breaks it into ordered,
testable steps. Code that has no spec behind it is a defect in the process.

### II. Type Safety End-to-End (NON-NEGOTIABLE)

All runtime code is TypeScript in `strict` mode with `noUncheckedIndexedAccess`.
Any data that crosses a trust boundary (HTTP bodies, query strings, environment variables,
seed files) is validated at runtime with `zod`, and the static type comes from the schema
(`z.infer`). `any` is not allowed; `unknown` plus narrowing is the rule.

### III. Test-First, Every Layer

- Each behaviour in a spec's acceptance scenarios maps to at least one automated test.
- Backend: integration tests through HTTP (supertest) against an in-memory MongoDB.
  Unit tests cover pure logic.
- Frontend: component tests with React Testing Library, with the network mocked by MSW.
  Tests assert on what the user sees (roles and labels), not on implementation details.
- End-to-end: Playwright covers each primary user journey against the containerized stack.
- Coverage gates are enforced in CI (backend/sentiment ≥ 85% lines, frontend ≥ 80%).

### IV. Secure by Default

Passwords are hashed with bcrypt and never returned. Auth uses short-lived signed JWTs.
User input is never interpolated into queries: regexes are escaped, ObjectIds are
validated. Responses carry security headers (helmet), CORS uses an allow-list, auth
endpoints are rate-limited, and secrets come only from the environment.

### V. Observable and Operable

Services emit structured JSON logs (pino) with a request id, and expose `/health`
(liveness) and `/ready` (dependency readiness). Configuration follows 12-factor: one image,
with behaviour changed by environment variables. Shutdown is graceful (SIGTERM drains and
closes the DB).

### VI. Simplicity

Prefer the platform and small libraries over frameworks: the native MongoDB driver over an
ODM, and fetch over HTTP client libraries. Any new dependency or service has to be justified
in an ADR (`docs/adr`).

## Technology Constraints

- Runtime: Node.js ≥ 22.12 (Docker images use Node 24 LTS), npm workspaces monorepo.
- Backend: Express 5, MongoDB 7 (native driver), zod, pino, JWT.
- Sentiment microservice: Express 5 + `natural` (AFINN). Callers treat it as optional and
  fail open.
- Frontend: React 19 + Vite + React Router + React Bootstrap. Must meet WCAG 2.1 AA basics:
  labelled form controls, keyboard navigation, alt text.
- Delivery: Docker multi-stage images (non-root), docker-compose for local and E2E runs.

## Development Workflow & Quality Gates

1. Conventional Commits, enforced by commitlint. Small, focused commits.
2. Pre-commit hook: ESLint + Prettier on staged files.
3. `make check` (lint, format check, typecheck, tests with coverage) must pass locally
   and is the same gate CI runs on every push and PR, followed by Docker builds and the
   Playwright suite.
4. Architecturally significant decisions are recorded as ADRs before or alongside the
   change that introduces them.

## Governance

This constitution supersedes ad-hoc conventions. Amendments are made through a pull request
that updates this file, bumps the version below (semantic versioning: MAJOR for removing or
redefining a principle, MINOR for adding one, PATCH for wording), and adds an ADR if the
change affects architecture. Reviewers verify compliance on every PR.

**Version**: 1.0.0 | **Ratified**: 2026-10-05 | **Last Amended**: 2026-10-05
