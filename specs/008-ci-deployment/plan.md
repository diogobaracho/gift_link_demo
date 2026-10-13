# Implementation Plan: CI & Deployment

**Branch**: `008-ci-deployment` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

## Summary

GitHub Actions with four jobs: `quality` (lint, format, typecheck), `test` (Vitest with
coverage, artifacts uploaded), `docker` (build all images with the buildx cache) and `e2e`
(compose up + seed + Playwright). A tag-triggered release pushes images to GHCR.
Deployment is documented as a how-to rather than tied to one vendor.

## Constitution Check

| Principle     | Status                                   |
| ------------- | ---------------------------------------- |
| Quality gates | ✅ CI is `make check` + docker + e2e     |
| V. Operable   | ✅ same images in CI, E2E and production |

## Project Structure

```text
.github/workflows/ci.yml
.github/workflows/release.yml
.github/dependabot.yml
.github/pull_request_template.md
.github/ISSUE_TEMPLATE/user-story.md
docs/how-to/deploy.md
```
