# Implementation Plan: Containerization

**Branch**: `007-containerization` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

## Summary

Multi-stage builds from the monorepo root as the build context, so the npm workspaces
lockfile is used. `npm ci -w <pkg>` installs, `tsc` builds, and the runtime stage has only
production dependencies on `node:24-bookworm-slim` (running as user `node`). The frontend builds
static assets and serves them from `nginx:alpine`, with a SPA fallback and an `/api`
reverse proxy (ADR-0009).

## Constitution Check

| Principle   | Status                                                  |
| ----------- | ------------------------------------------------------- |
| IV. Secure  | ✅ non-root, no secrets baked in, minimal base images   |
| V. Operable | ✅ HEALTHCHECKs, graceful SIGTERM, 12-factor env config |

## Project Structure

```text
giftlink-backend/Dockerfile
sentiment/Dockerfile
giftlink-frontend/Dockerfile, giftlink-frontend/nginx.conf
docker-compose.yml          # production-like stack
docker-compose.dev.yml      # overrides: bind mounts + watch mode
.dockerignore, .env.example, Makefile
```
