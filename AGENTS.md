# AGENTS.md — AI Agent Guidelines

## Project Identity
- Name: Van Dinh Land Management System (Hệ thống Quản lý Hồ sơ Đất đai Vạn Đình)
- Git: github.com/nghiant-rez/VanDinh-HoSoDiaChinh (private, main branch)
- Scope: Local-first, single-PC offline deployment for commune-level land records
- Design: Premium UI with Dark/Light mode, Glassmorphism, Tailwind CSS 4 tokens

## Tech Stack
- Frontend: Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, MapLibre GL
- Backend: Python 3.12+ (FastAPI) at localhost:8000
- Database: PostgreSQL 16+ with PostGIS extension
- ORM: Prisma (TypeScript models for Next.js CRUD), SQLAlchemy (Python for OCR/GIS)
- Auth: Iron Session (encrypted cookies) + bcryptjs
- OCR: Python PaddleOCR (via FastAPI backend)

## Project Structure
```
digital-archive-map-system/
├── backend/
│   ├── app/
│   │   ├── main.py           FastAPI app
│   │   ├── config.py         pydantic-settings
│   │   ├── routers/
│   │   │   ├── ocr.py        POST /api/ocr
│   │   │   └── gis.py        POST /api/gis/import
│   │   └── services/
│   │       ├── ocr_service.py
│   │       └── gis_service.py
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
│   └── lib/                  auth.ts, session.ts, prisma.ts
├── prisma/                   schema.prisma, seed.ts
├── docs/                     use-case-and-diagrams.md, codex-context.md, project-references.md
├── .opencode/skills/         Project-specific agent skills
├── AGENTS.md
├── CLAUDE.md                 -> @AGENTS.md
├── opencode.json             Local OpenCode config (gitignored)
└── package.json
```

## Commands
| Command | Description |
|---------|-------------|
| `npm run dev` | Next.js dev server (:3000) |
| `npm run build` | Standalone production build |
| `npm run lint` | ESLint check |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:push` | Push schema to PostgreSQL |
| `npm run db:seed` | Seed database |
| `cd backend && uvicorn app.main:app --reload --port 8000` | Python FastAPI server |

## Coding Conventions
- TypeScript strict mode. No `any` unless explicitly justified.
- Tailwind 4 with `@theme` tokens — use Figma tokens from `globals.css`.
- Vietnamese-first: UI labels in Vietnamese, code identifiers in English.
- No emojis in code, comments, or commit messages.
- Python: FastAPI async patterns, Pydantic v2 validation, type hints required.
- Prisma: raw SQL for PostGIS geometry columns, Prisma Client for standard CRUD.
- Next.js 16: middleware in `src/middleware.ts` — proxy.ts migration pending. See `frontend/AGENTS.md` for breaking changes.

## Agent Integration
- OpenCode: reads AGENTS.md, loads skills from `.opencode/skills/` and `~/.agents/skills/`
- Antigravity: reads project AGENTS.md + `~/.gemini/GEMINI.md`, loads skills from `~/.agents/skills/`
- Invoke skills with `@<skill-name>` or load with `skill({ name: "<name>" })`
- `@caveman` — ultra-compressed responses

## Key Reference Docs
- `docs/use-case-and-diagrams.md` — 10 use cases (UC-01 to UC-10)
- `docs/codex-context.md` — historical architectural decisions
- `docs/project-references.md` — Jira, Figma links
- `prisma/schema.prisma` — database model definitions
- `frontend/AGENTS.md` — Next.js 16 deprecation warnings

## Version Control
- Remote: https://github.com/nghiant-rez/VanDinh-HoSoDiaChinh.git
- Branch: main (single branch, no tags)
- Strategy: commit directly to main (local-only or single-dev workflow)
