# Feature Specification: Containerization

**Feature Branch**: `007-containerization`
**Created**: 2026-10-05
**Status**: Approved
**Input**: User story #9: "Containerize the services so the application runs consistently across environments."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - One-command stack (Priority: P1)

**Independent Test**: on a machine with only Docker and make, run `make up && make seed` and open http://localhost:8080.

**Acceptance Scenarios**:

1. **Given** Docker is installed, **When** `make up` runs, **Then** MongoDB, the backend, the sentiment service and the frontend start, each reaching `healthy` before its dependents start.
2. **Given** the stack is up, **When** `make seed` runs, **Then** the catalogue is loaded through a one-shot container.
3. **Given** the frontend container, **When** the browser calls `/api/*`, **Then** nginx proxies to the backend (same origin, so no CORS needed in production).

### User Story 2 - Developer hot reload (Priority: P2)

1. **Given** `make dev`, **When** a source file changes, **Then** the backend (tsx watch) and frontend (Vite HMR) reload without a rebuild.

### Edge Cases

- Containers run as a non-root user.
- Images contain no dev dependencies, tests or `.env` files (`.dockerignore`).
- MongoDB data survives `make down` (named volume). `make clean` removes it.

## Requirements _(mandatory)_

- **FR-001**: Multi-stage Dockerfile per service with a `HEALTHCHECK`.
- **FR-002**: `docker-compose.yml` with healthchecks and `depends_on: condition: service_healthy`.
- **FR-003**: All configuration via environment variables with documented defaults (`.env.example`).

## Success Criteria _(mandatory)_

- **SC-001**: Backend and sentiment images are under 250 MB each. The frontend image is under 60 MB.
- **SC-002**: CI builds all images and runs the Playwright suite against the composed stack.
