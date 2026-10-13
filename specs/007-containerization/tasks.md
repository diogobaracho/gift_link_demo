# Tasks: Containerization

- [ ] T001 [P] `giftlink-backend/Dockerfile` (deps → build → runtime, HEALTHCHECK on `/health`)
- [ ] T002 [P] `sentiment/Dockerfile`
- [ ] T003 [P] `giftlink-frontend/Dockerfile` + `nginx.conf` (gzip, cache headers, SPA fallback, `/api` proxy)
- [ ] T004 `.dockerignore` at the build-context root
- [ ] T005 `docker-compose.yml`: mongo (volume, healthcheck), backend, sentiment, frontend, `seed` (profile `tools`)
- [ ] T006 `docker-compose.dev.yml` with hot reload
- [ ] T007 `Makefile` targets: up, down, logs, ps, build, dev, seed, seed-reset, db-shell, clean
- [ ] T008 Verify: `docker compose config`, `make up`, health endpoints, `make seed` twice → 16 gifts
