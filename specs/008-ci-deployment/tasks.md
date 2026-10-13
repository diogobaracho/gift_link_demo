# Tasks: CI & Deployment

- [ ] T001 `ci.yml` quality job (npm cache, lint, format:check, typecheck)
- [ ] T002 `ci.yml` test job (coverage thresholds, upload coverage artifact)
- [ ] T003 `ci.yml` docker job (buildx, gha cache) for the 3 images
- [ ] T004 `ci.yml` e2e job (compose up --wait, seed, Playwright, upload report)
- [ ] T005 [P] `release.yml` (GHCR push on `v*` tags)
- [ ] T006 [P] `dependabot.yml`, PR template, user-story issue template
- [ ] T007 `docs/how-to/deploy.md` (Atlas + container host, env reference)
