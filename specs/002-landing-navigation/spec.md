# Feature Specification: Landing Page & Navigation

**Feature Branch**: `002-landing-navigation`
**Created**: 2026-10-05
**Status**: Approved
**Input**: User stories #3 ("Run skeleton application") and #4 ("Implement a landing page and navigation").

## User Scenarios & Testing _(mandatory)_

### User Story 1 - First impression and call to action (Priority: P1)

A visitor opens GiftLink and immediately understands what it does, then gets to the gifts.

**Independent Test**: open `/` and click **Get Started**; you land on `/app` with the gift list.

**Acceptance Scenarios**:

1. **Given** a visitor on `/`, **When** the page loads, **Then** they see the "GiftLink" heading, the "Share Gifts and Joy!" subheading, the community quote and a **Get Started** button.
2. **Given** the landing page, **When** the visitor clicks **Get Started**, **Then** they are taken to `/app`.

### User Story 2 - Consistent navigation (Priority: P1)

**Independent Test**: from any page, use the navbar to reach Home, Gifts and Search.

**Acceptance Scenarios**:

1. **Given** any page, **When** the user looks at the navbar, **Then** it shows the brand plus Home, Gifts and Search links, with the current page highlighted.
2. **Given** an anonymous user, **Then** the navbar shows **Login** and **Register**. **Given** a logged-in user, **Then** it shows "Welcome, {firstName}" (linking to the profile), **Post a gift** and **Logout**.
3. **Given** a narrow (mobile) viewport, **Then** the links collapse into a toggle menu that works by keyboard.

### User Story 3 - Unknown URLs (Priority: P3)

**Acceptance Scenarios**:

1. **Given** any unknown path, **When** it is opened, **Then** a "Page not found" view with a link back to the gifts is shown.

### Edge Cases

- A deep link to `/app/product/:id` refreshed in the browser must still work (SPA fallback in nginx and Vite).

## Requirements _(mandatory)_

- **FR-001**: The landing page MUST be a client-side route (no separate static HTML).
- **FR-002**: The navigation MUST reflect auth state from the shared `AuthContext`.
- **FR-003**: All navigation MUST be accessible (semantic `<nav>`, focusable links, `aria-current`).
- **FR-004**: The app MUST start locally with a single command (`make dev` / `make up`).

## Success Criteria _(mandatory)_

- **SC-001**: A new developer gets the app running with `make up && make seed`.
- **SC-002**: Component tests cover both navbar states, and E2E covers landing → gifts.
