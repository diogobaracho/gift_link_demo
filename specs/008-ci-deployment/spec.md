# Feature Specification: CI & Deployment

**Feature Branch**: `008-ci-deployment`
**Created**: 2026-10-05
**Status**: Approved
**Input**: User story #10: "Deploy the backend and frontend so the application is accessible to users."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Every change is verified (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a push or PR to `main`, **When** CI runs, **Then** lint, format check, typecheck, unit/integration tests with coverage gates, Docker image builds and the Playwright E2E suite all run, and any failure blocks the merge.
2. **Given** a failing E2E run, **Then** the Playwright HTML report and traces are uploaded as artifacts.

### User Story 2 - Ship images (Priority: P2)

1. **Given** a tag `v*.*.*`, **When** the release workflow runs, **Then** the images are pushed to GitHub Container Registry (`ghcr.io/<owner>/giftlink-*`) tagged with the version and `latest`.
2. **Given** published images, **When** an operator follows `docs/how-to/deploy.md`, **Then** the stack can be deployed to any container host (Render, Fly.io, IBM Code Engine, a VM with compose) with a managed MongoDB (Atlas).

### Edge Cases

- Dependabot keeps npm, Docker base images and GitHub Actions up to date with weekly grouped PRs.

## Requirements _(mandatory)_

- **FR-001**: `.github/workflows/ci.yml` (quality, test, docker, e2e jobs with caching).
- **FR-002**: `.github/workflows/release.yml` (multi-image build and push on tags).
- **FR-003**: Deployment how-to with the environment variable reference.

## Success Criteria _(mandatory)_

- **SC-001**: CI runs in under 10 minutes on a cache hit.
- **SC-002**: `make check` reproduces the CI quality gate locally.
