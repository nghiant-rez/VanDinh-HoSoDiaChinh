# AGENTS.md - Coding Agent Guidelines

## Project Overview
- **Name**: Van Dinh Land Management System
- **Architecture**: Greenfield Web Application
- **Scope**: Local-first, single-PC offline deployment. Optimize for actual operator workflows (CAD-to-GIS conversion, parcel search, and scanned records display).

## Tech Stack
- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, MapLibre
- **Backend / Database**: Next.js API Routes (or separate API) + PostgreSQL with PostGIS for spatial data
- **Local OCR**: Python PaddleOCR (or similar) integrated locally

## Core Constraints & Directives
1. **Greenfield Implementation**: Start fresh. Do NOT edit or depend on compiled DLL/JS files from the old QLKHO project.
2. **Local-First**: Default toward local, free, open-source tooling. The system must run on a single Windows PC locally.
3. **Core Use Cases**: 
   - **UC-04**: Import digital maps
   - **UC-06**: Find parcel on map
   - **UC-09**: Compare scan vs map
4. **Design Aesthetic**: Premium, dynamic UI using Dark/Light mode, Glassmorphism, and Tailwind CSS. Avoid generic templates; implement rich micro-animations and cohesive tokens.

## AI Agent Integration (Codex -> Antigravity)
- Codex context is stored in docs/codex-context.md.
- Legacy use-case documentation is in docs/use-case-and-diagrams.md.
- Rollout summaries are in docs/codex-sessions/.
- Treat this workspace as the single source of truth for the project.
