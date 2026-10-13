# Implementation Plan: Comments with Replies & Sentiment

**Branch**: `006-comments` | **Date**: 2026-10-05 | **Spec**: [spec.md](spec.md)

## Summary

Comments live in their own collection (not embedded in gifts) so threads can grow without
bloating gift documents (see `docs/_studies_and_interview/04-mongodb.md`). Replies use the
adjacency-list pattern (`parentId`). The tree is assembled in memory in O(n) per gift. A
`SentimentClient` port wraps `fetch` with an `AbortSignal.timeout` and fails open, and it is
injected into `createApp` so tests can stub it (ADR-0010).

## Technical Context

**Primary Dependencies**: backend: native `fetch`; sentiment service: Express 5 + `natural` (AFINN-165, Porter stemmer)
**Storage**: `comments`, index `{ giftId: 1, createdAt: 1 }`
**Testing**: unit (`buildCommentTree`), integration with stub clients, sentiment service tests, RTL

## Constitution Check

| Principle       | Status                                                          |
| --------------- | --------------------------------------------------------------- |
| III. Test-first | ✅ up/down/slow sentiment scenarios covered with injected stubs |
| IV. Secure      | ✅ text length limits, rendered as text, auth required to post  |
| V. Operable     | ✅ timeout + structured warning log on fail-open                |

## Project Structure

```text
sentiment/src/{app.ts, analyzer.ts, logger.ts, server.ts}
giftlink-backend/src/modules/comments/{comment.schema.ts, comment.service.ts, comment.routes.ts, comment-tree.ts}
giftlink-backend/src/lib/sentiment-client.ts
giftlink-frontend/src/components/Comments/{CommentList.tsx, CommentForm.tsx, SentimentBadge.tsx}
```
