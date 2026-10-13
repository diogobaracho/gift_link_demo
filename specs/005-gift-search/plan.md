# Implementation Plan: Gift Search

**Branch**: `005-gift-search` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

## Summary

A `search` module whose pure `buildSearchFilter(query)` turns validated query params into a
MongoDB filter. This fixes the skeleton's unescaped `$regex` (an injection/ReDoS risk). The
frontend `SearchPage` has controlled inputs, filter dropdowns, an age slider and a results
list.

## Technical Context

**Storage**: `gifts` with a compound index `{ category: 1, condition: 1 }`
**Testing**: unit (`search.service.test.ts`), integration (`search.test.ts`), component (`SearchPage.test.tsx`)

## Constitution Check

| Principle      | Status                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| IV. Secure     | ✅ `escapeRegex()` on user text; enum filters                             |
| VI. Simplicity | ✅ regex + indexed equality filters, no Atlas Search needed at this scale |

## Project Structure

```text
giftlink-backend/src/lib/escape-regex.ts
giftlink-backend/src/modules/search/{search.schema.ts, search.service.ts, search.routes.ts}
giftlink-frontend/src/components/SearchPage/{SearchPage.tsx, SearchPage.css}
```
