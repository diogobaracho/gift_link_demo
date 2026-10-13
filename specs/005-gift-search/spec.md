# Feature Specification: Gift Search

**Feature Branch**: `005-gift-search`
**Created**: 2026-10-05
**Status**: Approved
**Input**: User story #7: "Users can search for gifts based on criteria such as name, category, condition and age."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Search by name (Priority: P1)

**Independent Test**: type "desk" on `/app/search` and press **Search**; only desk-like gifts are listed.

**Acceptance Scenarios**:

1. **Given** the search page, **When** the user enters a partial, case-insensitive name and clicks **Search**, **Then** matching gifts are listed with image, name, a short description and a details link.
2. **Given** no matches, **Then** "No gifts found, please revise your filters." is shown.

### User Story 2 - Filter (Priority: P1)

**Acceptance Scenarios**:

1. **Given** the category and condition dropdowns (generated from the canonical lists), **When** the user selects values, **Then** only gifts matching all selected filters are returned.
2. **Given** the age slider (0–10 years), **When** the user moves it to N, **Then** the current value is displayed and only gifts with `age_years ≤ N` are returned.
3. **Given** no filters at all, **Then** the newest gifts are returned (capped at 50).

### Edge Cases

- Regex metacharacters in the name (`.*`, `(`) are treated literally and never cause a 500 or a ReDoS.
- Unknown category/condition values return 400 rather than silently returning nothing.
- `age_years` that is not a number returns 400.

## Requirements _(mandatory)_

- **FR-001**: `GET /api/search?name&category&condition&age_years` → `Gift[]`.
- **FR-002**: Query parameters MUST be validated with zod. User text MUST be regex-escaped.
- **FR-003**: Query building MUST be a pure function (`buildSearchFilter`) with unit tests.

## Success Criteria _(mandatory)_

- **SC-001**: Each filter and their combination is covered by integration tests. The UI is covered by component tests and an E2E search scenario.
