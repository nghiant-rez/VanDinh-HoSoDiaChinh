# Project References

External links and tools for the Van Dinh Land Management

---

## Jira

- **Project Key**: VH
- **Board**: Board 1

| View | URL |
| --- | --- |
| Timeline | https://fpt-vandinh.atlassian.net/jira/software/projects/VH/boards/1/timeline |
| Backlog | https://fpt-vandinh.atlassian.net/jira/software/projects/VH/boards/1/backlog |
| Board | https://fpt-vandinh.atlassian.net/jira/software/projects/VH/boards/1 |

> [!NOTE]
> Jira is the living source of truth for sprint planning,
> task assignment, and progress tracking. Content changes
> frequently -- do not cache snapshots as ground truth.

---

## Figma

| Resource | URL |
| --- | --- |
| Design File | https://www.figma.com/make/FulVhQi6cecmb5S1RxmowM/Digital-Archive-Map-System--Copy- |

**Screens designed (as of 2026-06-15):**

- `home` -- Dashboard with stats, storage tree, activity feed
- `search` -- Record search with filters and results table
- `map` -- Digital map with import/export and parcel legend
- `logs` -- System activity log with date/user/action filters

**Screens not yet designed:**

- Login (UC-01)
- Account management (UC-02)
- Record entry form (UC-03)
- Record detail / scan viewer (UC-05 detail, UC-09)
- Export preview (UC-07)
- Mutation history (UC-08)

---

## Internal Docs

See `docs/README.md` for the full doc map. Key links:

| Document | Path |
| --- | --- |
| Use Case Spec | `docs/use-cases.md` |
| Architecture | `docs/architecture.md` |
| Feature Ownership | `docs/feature-ownership.md` |
| Security | `docs/security.md` |
| Changelog | `docs/changelog.md` |
| References | `docs/references.md` (this file) |

---

## Notes

- Jira requires Atlassian authentication.
  Agent cannot read board data directly.
  Export CSV or paste issue tables when syncing.
- Figma was built using Figma Make (AI-assisted).
  Viewable without login.
