# Feature Specification: Gift Listing & Details

**Feature Branch**: `004-gift-listing-details`
**Created**: 2026-10-05
**Status**: Approved
**Input**: User story #6 ("Gifts details page"), plus the listing page and the ability to give an item away.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Browse the catalogue (Priority: P1)

**Independent Test**: open `/app` and see paginated cards with image, name, condition, date and a **View Details** button.

**Acceptance Scenarios**:

1. **Given** seeded gifts, **When** a user opens `/app`, **Then** gifts are shown as cards, newest first, 12 per page, with pagination controls.
2. **Given** a gift without an image, **Then** the card shows a "No Image Available" placeholder.
3. **Given** the API is down, **Then** an error alert with a retry button is shown instead of a blank page.

### User Story 2 - View a gift (Priority: P1)

**Acceptance Scenarios**:

1. **Given** the list, **When** the user clicks **View Details**, **Then** `/app/product/:id` shows the name, image, category, condition, date added, age in years and description.
2. **Given** an unknown id, **Then** a "Gift not found" message is shown (API 404).
3. **Given** the details page, **When** the user clicks **Back**, **Then** they return to the previous page.

### User Story 3 - Give an item away (Priority: P2)

**Acceptance Scenarios**:

1. **Given** a logged-in user on `/app/new`, **When** they submit a valid form (name, category, condition, zipcode, age, description, optional image URL), **Then** the gift is created (201), owned by them, and they are redirected to its details page.
2. **Given** an anonymous request to `POST /api/gifts`, **Then** the API returns 401.
3. **Given** the owner viewing their gift, **When** they delete it, **Then** it is removed (204). Other users get 403.

### Edge Cases

- `page` beyond the last page returns an empty `items` array with the correct `total`.
- `limit` is clamped to 1–50.

## Requirements _(mandatory)_

- **FR-001**: `GET /api/gifts?page&limit` → `{ items, page, limit, total, totalPages }`.
- **FR-002**: `GET /api/gifts/:id` → gift or 404.
- **FR-003**: `POST /api/gifts` (auth) → 201 gift. The server sets `id`, `posted_by`, `date_added` and `age_days`.
- **FR-004**: `DELETE /api/gifts/:id` (auth, owner only) → 204. Also deletes the gift's comments.
- **FR-005**: The internal Mongo `_id` MUST NOT leak; the public identifier is `id`.

### Key Entities

- **Gift**: see feature 001.

## Success Criteria _(mandatory)_

- **SC-001**: List, details, create and delete are covered by API integration tests, component tests and E2E (browse + post a gift).
- **SC-002**: The listing renders the first page in under 1 s on the seeded dataset.
