# Feature Specification: Authentication & Profile

**Feature Branch**: `003-authentication`
**Created**: 2026-10-05
**Status**: Approved
**Input**: User story #5: "Users should be able to register, log in, and access their personal data and features securely."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Register (Priority: P1)

**Independent Test**: submit the register form with new details; the user ends up logged in on `/app`.

**Acceptance Scenarios**:

1. **Given** a visitor on `/app/register`, **When** they submit first name, last name, email and a password of at least 8 characters, **Then** an account is created, they are logged in and redirected to `/app`.
2. **Given** an email that is already registered, **When** they submit, **Then** they see "Email is already registered" (HTTP 409) and stay on the form.
3. **Given** invalid input (bad email, short password, empty names), **Then** field-level errors are shown and no request is sent.

### User Story 2 - Log in and log out (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a registered user, **When** they log in with correct credentials, **Then** a JWT is stored for the browser session and the navbar greets them by first name.
2. **Given** wrong credentials, **Then** a generic "Invalid email or password" is shown (no account enumeration) with HTTP 401.
3. **Given** a logged-in user, **When** they click **Logout**, **Then** the token is cleared and they are redirected to the login page.
4. **Given** an anonymous user opening a protected page (`/app/profile`, `/app/new`), **Then** they are redirected to login and sent back afterwards.

### User Story 3 - Edit profile (Priority: P2)

**Acceptance Scenarios**:

1. **Given** a logged-in user on `/app/profile`, **When** they edit their name and save, **Then** the change persists (`PUT /api/auth/update`), the navbar greeting updates and a success message is shown.
2. **Given** an expired or tampered token, **When** any protected API is called, **Then** it returns 401 and the UI logs the user out.

### Edge Cases

- Email addresses are case-insensitive (`Jane@X.com` equals `jane@x.com`).
- The password hash is never returned by any endpoint.
- Repeated login attempts are rate-limited (HTTP 429).
- Password recovery (mentioned in the story) is **out of scope** for v1 because it needs an email provider. It is tracked on the roadmap.

## Requirements _(mandatory)_

- **FR-001**: `POST /api/auth/register` → 201 `{ token, user }`.
- **FR-002**: `POST /api/auth/login` → 200 `{ token, user }`.
- **FR-003**: `GET /api/auth/me` (Bearer) → 200 `{ user }`.
- **FR-004**: `PUT /api/auth/update` (Bearer) `{ firstName?, lastName? }` → 200 `{ user }`.
- **FR-005**: Passwords MUST be hashed with bcrypt (cost ≥ 10).
- **FR-006**: JWTs MUST be signed (HS256) with a secret from the environment and expire (default 1 h).
- **FR-007**: All inputs MUST be validated with zod. Errors use the shape `{ error: { code, message, details? } }`.

### Key Entities

- **User**: `{ _id, email, firstName, lastName, passwordHash, createdAt, updatedAt }`
- **AuthToken** (JWT claims): `{ sub: userId, email, iat, exp }`

## Success Criteria _(mandatory)_

- **SC-001**: Every acceptance scenario above has an automated test (API integration + component), and the register → login → profile → logout flow is covered E2E.
- **SC-002**: No endpoint response contains `passwordHash` (asserted in tests).
