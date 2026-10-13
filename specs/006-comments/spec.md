# Feature Specification: Comments with Replies & Sentiment

**Feature Branch**: `006-comments`
**Created**: 2026-10-05
**Status**: Approved
**Input**: User story #8: "Users should be able to post comments, reply to other comments, and view all comments for a gift." The course's sentiment microservice is reused to label each comment.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Read the conversation (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a gift with comments, **When** anyone opens its details page, **Then** all comments are listed oldest first, with replies nested under their parent, each showing the author name and relative time.
2. **Given** a gift with no comments, **Then** "No comments yet. Be the first!" is shown.

### User Story 2 - Comment and reply (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a logged-in user, **When** they submit a comment (1–500 chars), **Then** it appears at once in the list (201).
2. **Given** a logged-in user, **When** they click **Reply** on a comment and submit, **Then** the reply appears nested under it.
3. **Given** an anonymous user, **Then** the form is replaced by "Log in to join the conversation", and `POST` returns 401.
4. **Given** a `parentId` that does not belong to the same gift, **Then** the API returns 400.

### User Story 3 - Sentiment insight (Priority: P3)

**Acceptance Scenarios**:

1. **Given** the sentiment service is up, **When** a comment is posted, **Then** it is stored with `sentiment: { label: positive | neutral | negative, score }` and a coloured badge is shown.
2. **Given** the sentiment service is down or slow (> 1.5 s), **When** a comment is posted, **Then** the comment is still created with `sentiment: null` (fail-open) and a warning is logged.

### Sentiment service contract

- `POST /sentiment { sentence }` → 200 `{ sentimentScore, sentiment }`. Rule: score < 0 → `negative`; 0 ≤ score ≤ 0.33 → `neutral`; > 0.33 → `positive`.
- Missing sentence → 400 `{ error: 'No sentence provided' }`. Analyzer failure → 500 `{ message: 'Error performing sentiment analysis' }`.

## Requirements _(mandatory)_

- **FR-001**: `GET /api/gifts/:id/comments` → threaded `Comment[]` (each with `replies`). 404 for an unknown gift.
- **FR-002**: `POST /api/gifts/:id/comments` (auth) `{ text, parentId? }` → 201 `Comment`.
- **FR-003**: Comment text MUST be stored as plain text and rendered escaped (React default). No HTML.
- **FR-004**: The sentiment call MUST have a timeout and MUST NOT block comment creation on failure.

### Key Entities

- **Comment**: `{ id, giftId, parentId | null, authorId, authorName, text, sentiment | null, createdAt, replies[] }`

## Success Criteria _(mandatory)_

- **SC-001**: Tree building is unit tested. The API is integration tested with sentiment up, down and slow. The UI is tested for anonymous and authenticated users. E2E posts a comment and a reply.
