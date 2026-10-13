# Implementation Plan: Gift Listing & Details

**Branch**: `004-gift-listing-details` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

## Summary

A `gifts` backend module (zod schemas, service on the native driver, Express routes) with
offset pagination. The frontend has `MainPage` (grid + pagination), `DetailsPage` and
`NewGiftPage`, all going through the typed `api` client.

## Technical Context

**Primary Dependencies**: Express 5, `mongodb`, `zod`; React Router, React Bootstrap
**Storage**: `gifts` collection. Indexes: `{ id: 1 }` unique, `{ date_added: -1 }`, `{ category: 1, condition: 1 }`
**Testing**: supertest + in-memory Mongo; RTL + MSW

## Constitution Check

| Principle       | Status                                                              |
| --------------- | ------------------------------------------------------------------- |
| II. Type safety | ✅ `Gift` type inferred from `giftSchema`, shared shape in frontend |
| III. Test-first | ✅ `gifts.test.ts`, `MainPage.test.tsx`, `DetailsPage.test.tsx`     |
| IV. Secure      | ✅ ownership check on delete; `_id` projected out                   |

## Project Structure

```text
giftlink-backend/src/modules/gifts/{gift.schema.ts, gift.service.ts, gift.routes.ts}
giftlink-frontend/src/components/{MainPage,DetailsPage,NewGiftPage,GiftCard}/
giftlink-frontend/src/api/client.ts
```
