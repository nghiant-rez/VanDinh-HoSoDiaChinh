---
name: python-backend
description: Python FastAPI backend patterns for this project (OCR, GIS, async routes)
---

Patterns for Python `backend/`:
- Routers in `app/routers/`, services in `app/services/`
- Async endpoints for OCR (PaddleOCR blocks, wrap in `run_in_executor`)
- Pydantic v2 models for request/response validation
- CORS: allow origin localhost:3000 only
- Config via `pydantic-settings`, `.env` file
- Run: `uvicorn app.main:app --reload --port 8000` from `backend/`
