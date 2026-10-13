# Feature Specifications (GitHub Spec Kit)

Each folder is one feature, produced with the Spec Kit flow
`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`, under the
principles in [`.specify/memory/constitution.md`](../.specify/memory/constitution.md).

| #   | Feature                                              | Source user story (`_user_story.md`) | Status   |
| --- | ---------------------------------------------------- | ------------------------------------ | -------- |
| 001 | [Database initialization & seed](001-database-seed/) | #2 Initialize and populate MongoDB   | Approved |
| 002 | [Landing page & navigation](002-landing-navigation/) | #3 Run skeleton, #4 Landing & nav    | Approved |
| 003 | [Authentication & profile](003-authentication/)      | #5 Authentication                    | Approved |
| 004 | [Gift listing & details](004-gift-listing-details/)  | #6 Gift details page                 | Approved |
| 005 | [Gift search](005-gift-search/)                      | #7 Search component                  | Approved |
| 006 | [Comments with replies & sentiment](006-comments/)   | #8 Comments feature                  | Approved |
| 007 | [Containerization](007-containerization/)            | #9 Containerize services             | Approved |
| 008 | [CI & deployment](008-ci-deployment/)                | #10 Deploy backend and frontend      | Approved |

User story #1 ("Finish user stories") is satisfied by the specs themselves.

Each folder contains:

- `spec.md`: **what** and **why**: prioritized user journeys, acceptance scenarios
  (Given/When/Then), functional requirements and measurable success criteria.
- `plan.md`: **how**: technical context, a constitution check and the source layout.
- `tasks.md`: ordered, testable tasks (`[P]` = can run in parallel), each mapped to files.

See [docs/how-to/spec-kit-workflow.md](../docs/how-to/spec-kit-workflow.md) for adding a new feature.
