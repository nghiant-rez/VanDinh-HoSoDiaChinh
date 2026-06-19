# Van Dinh Land Management System - Docs

Entry point for developers and AI agents. Read this first.

## Quick Ownership

| Owner | Assigned scope |
| --- | --- |
| **Nghia** (Dev 1) | UC-04 GIS import, UC-06 Map search, UC-07 Map export, UC-09 Scan vs map, Backend (OCR, GIS, DGN conversion) |
| **Huy** (Dev 2) | UC-03 Storage tree, DB models/schema, config. Intended owner of UC-01/02/10 (currently stopgap by Nghia). |
| **Unassigned** | UC-05 Tra cuu, UC-08 Bien dong |

Detail: `feature-ownership.md`.

## Doc Map

| Doc | Purpose | When to read |
| --- | --- | --- |
| `README.md` | This index. Ownership quick-ref. | First. |
| `architecture.md` | System split, auth flow, database, GIS module. Single source of truth for "how it works". | Before touching backend/auth/map. |
| `use-cases.md` | UC-01 to UC-10 specifications + diagram guide + role matrix. | Before scoping a feature. |
| `feature-ownership.md` | Per-UC: who owns it, which files, current status. | Before starting work; to avoid conflicts. |
| `security.md` | Open security issues, severity, owners, fix plan. | Before deploy; when touching auth/config. |
| `changelog.md` | Dated log of applied fixes and changes. | To see what changed and when. |
| `references.md` | Jira board, Figma file, external links. | For sprint planning and design lookup. |

## Conventions for Agents

- Do not duplicate status lists across docs. `security.md` owns open issues; `changelog.md` owns applied changes; `feature-ownership.md` owns per-UC status.
- Vietnamese-first UI labels, English code identifiers, no emojis in code or commits.
- Branch strategy: feature branches (Nghia, Huy) -> PR -> main.
