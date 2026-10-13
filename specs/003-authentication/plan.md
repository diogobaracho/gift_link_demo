# Implementation Plan: Authentication & Profile

**Branch**: `003-authentication` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

## Summary

Stateless JWT auth (see ADR-0005). The backend has an `auth` module (schemas, service and
routes) plus a `requireAuth` middleware. The frontend has an `AuthContext` that persists the
session in `sessionStorage`, a `ProtectedRoute`, and the Login, Register and Profile pages.

## Technical Context

**Primary Dependencies**: `jsonwebtoken`, `bcryptjs`, `zod`, `express-rate-limit`
**Storage**: `users` collection, unique index on `email`
**Testing**: supertest + in-memory Mongo; RTL + MSW on the frontend

## Constitution Check

| Principle       | Status                                                                  |
| --------------- | ----------------------------------------------------------------------- |
| II. Type safety | ✅ request bodies parsed by zod; `req.user` typed via declaration merge |
| III. Test-first | ✅ `auth.test.ts`, `require-auth.test.ts`, page tests                   |
| IV. Secure      | ✅ bcrypt, generic login error, rate limit, no hash in responses        |

## Project Structure

```text
giftlink-backend/src/
├── lib/password.ts, lib/jwt.ts
├── middleware/require-auth.ts
└── modules/auth/{auth.schema.ts, auth.service.ts, auth.routes.ts}
giftlink-frontend/src/
├── context/AuthContext.tsx
├── components/ProtectedRoute.tsx
└── components/{LoginPage,RegisterPage,Profile}/
```
