# AGENTS.md — AI Agent Guidelines

## Project Identity
- Name: Van Dinh Land Management System (Hệ thống Quản lý Hồ sơ Đất đai Vân Đình)
- Git: github.com/nghiant-rez/VanDinh-HoSoDiaChinh (private, main branch)
- Scope: Local-first, single-PC offline deployment for commune-level land records
- Design: Premium UI with Dark/Light mode, Glassmorphism, Tailwind CSS 4 tokens

## Tech Stack
- Frontend: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, MapLibre GL
- Backend: Python 3.12+ (FastAPI) at localhost:8000
- Database: PostgreSQL 18 with PostGIS extension
- ORM: SQLAlchemy (Python, all DB operations via FastAPI)
- Auth: Iron Session (encrypted cookies) + bcryptjs
- OCR: Python PaddleOCR (via FastAPI backend)

## Project Structure
```
digital-archive-map-system/
├── backend/
│   ├── app/
│   │   ├── main.py           FastAPI app
│   │   ├── config.py         pydantic-settings
│   │   ├── database.py       SQLAlchemy engine + session
│   │   ├── models.py         SQLAlchemy models (User, Role, KhoLuuTru...)
│   │   ├── schemas.py        Pydantic schemas
│   │   ├── dependencies.py   get_db, get_current_user, require_roles
│   │   ├── tcvn3_decoder.py  TCVN3 (ABC) to Unicode decoder + sanitize_text
│   │   ├── routers/
│   │   │   ├── auth.py       POST /api/auth/login
│   │   │   ├── gis.py        POST /api/gis/import
│   │   │   ├── ocr.py        POST /api/ocr
│   │   │   └── storage.py    CRUD kholuutru tree
│   │   └── services/
│   │       ├── gis_service.py
│   │       └── ocr_service.py
│   ├── data/                 Uploads, temp files
│   └── requirements.txt
├── src/
│   ├── app/                  Next.js App Router
│   │   ├── (dashboard)/      Protected routes (accounts, logs, map, records, search)
│   │   ├── api/              API routes (auth, records, parcels, maps, exports, logs, users)
│   │   ├── login/            Login page
│   │   └── globals.css       Figma tokens + Tailwind 4
│   ├── components/
│   │   ├── layout/           AppShell, Sidebar, Header
│   │   ├── map/              MapView, MapToolsPanel, MapLegend
│   │   └── ui/               Badge, DataTable, FilterPanel, StatCard
│   └── lib/                  auth.ts, session.ts
├── docs/                     README.md (index), architecture.md, use-cases.md, feature-ownership.md, security.md, changelog.md, references.md
├── .opencode/skills/         Project-specific agent skills
├── AGENTS.md
├── opencode.json             Local OpenCode config (gitignored)
└── package.json
```

## Commands
| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server (:3000) |
| `npm run build` | Standalone production build |
| `npm run lint` | ESLint check |
| `cd backend && uvicorn app.main:app --reload --port 8000` | Python FastAPI server |

## Coding Conventions
- TypeScript strict mode. No `any` unless explicitly justified.
- Tailwind 4 with `@theme` tokens — use Figma tokens from `globals.css`.
- Vietnamese-first: UI labels in Vietnamese, code identifiers in English.
- No emojis in code, comments, or commit messages.
- Python: FastAPI async patterns, Pydantic v2 validation, type hints required.
- SQLAlchemy: raw SQL for PostGIS geometry columns, ORM for standard CRUD.
- Next.js 16: middleware in `src/middleware.ts` — proxy.ts migration pending.

## Agent Integration
- OpenCode: reads AGENTS.md, loads skills from `.opencode/skills/` and `~/.agents/skills/`
- Antigravity: reads project AGENTS.md + `~/.gemini/GEMINI.md`, loads skills from `~/.agents/skills/`
- Invoke skills with `@<skill-name>` or load with `skill({ name: "<name>" })`

## Available Skills

### Project Skills (`.opencode/skills/`)
- `@ui-glassmorphism` — Tailwind 4 glassmorphism + Figma tokens
- `@python-backend` — FastAPI patterns (OCR, GIS, async)
- `@map-parcel` — MapLibre + PostGIS parcel interaction
- `@db-operations` — PostgreSQL + PostGIS workflow
- `@caveman` — ultra-compressed responses (also: `@caveman-review`, `@caveman-commit`, `@caveman-compress`, `@caveman-help`)

### Global Skills (`~/.agents/skills/`)
- `@caveman` — also available globally (same skill, project copy ensures availability)
- `@find-skills` — discover and install new agent skills

## Key Reference Docs
- `docs/README.md` — docs index + ownership quick-ref (read first)
- `docs/architecture.md` — system split, auth flow, database, GIS module
- `docs/use-cases.md` — 10 use cases (UC-01 to UC-10)
- `docs/feature-ownership.md` — per-UC owner, files, status (Nghia vs Huy)
- `docs/security.md` — open security issues and fix plan
- `docs/changelog.md` — dated log of applied fixes
- `docs/references.md` — Jira, Figma links
- `Db/database.md` — full PostgreSQL schema reference

## Before Coding
1. **Read `docs/feature-ownership.md`** — check who owns the UC, avoid conflicts
2. **Read `docs/security.md`** — check open issues for files you're touching
3. **Coordinate in team chat** before editing `backend/app/dependencies.py` or `backend/app/config.py` (conflict hotspots)

## Context Maintenance

After completing a material task, audit project context and update only affected canonical files before commit/push:

- Architecture or system design changed → `docs/architecture.md`
- Feature status or ownership changed → `docs/feature-ownership.md`
- Security issue or status changed → `docs/security.md`
- User-visible behavior or code changed → `docs/changelog.md`
- Agent workflow or project instructions changed → `AGENTS.md`

If no context file needs changes, state `Context unchanged` in the handoff. Do not create session-only recap noise or edit docs merely because a task/session ended.

## Version Control

### Branch Strategy
- Format: `<owner>/<type>/<description>` (e.g., `nghia/fix/dgn-polygon`, `huy/feat/storage-tree`)
- Personal branches (`Nghia`, `Huy`) deprecated — use feature branches off `main`
- Unassigned work (UC-05, UC-08): branch from `main`, not personal branches

### Git Workflow
- Remote: https://github.com/nghiant-rez/VanDinh-HoSoDiaChinh.git
- Base branch: always `main`
- Strategy: feature branch → PR → review → squash merge to main
- **Review required:** tag other dev before merge
- **Merge method:** squash preferred (keeps `main` history clean for changelog)
- **NEVER push or merge to remote without explicit user permission.** Stage and commit locally, then ask for review before any `git push` or merge operation.

