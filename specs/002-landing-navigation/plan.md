# Implementation Plan: Landing Page & Navigation

**Branch**: `002-landing-navigation` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

## Summary

Migrate the frontend from Create React App to Vite + TypeScript. Turn the static
`public/home.html` into a `LandingPage` route and build a responsive React Bootstrap navbar
that reads `AuthContext`.

## Technical Context

**Language/Version**: TypeScript 6, React 19
**Primary Dependencies**: Vite 8, React Router 7 (`react-router-dom`), React Bootstrap 2, Bootstrap 5
**Testing**: Vitest + React Testing Library + user-event
**Target Platform**: evergreen browsers, mobile-first

## Constitution Check

| Principle       | Status                                                       |
| --------------- | ------------------------------------------------------------ |
| II. Type safety | ✅ `.tsx` everywhere, strict mode                            |
| III. Test-first | ✅ `Navbar.test.tsx`, `LandingPage.test.tsx`, `App.test.tsx` |
| VI. Simplicity  | ✅ Vite replaces deprecated CRA (see ADR-0007)               |

## Project Structure

```text
giftlink-frontend/
├── index.html
├── vite.config.ts
└── src/
    ├── main.tsx, App.tsx
    ├── components/Navbar/Navbar.tsx (+ test)
    ├── components/LandingPage/LandingPage.tsx (+ .css, test)
    └── components/NotFound/NotFound.tsx
```
