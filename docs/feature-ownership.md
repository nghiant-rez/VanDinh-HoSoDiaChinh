# Feature Ownership

Who owns which use case, which files implement it, and current status. Read before starting work to avoid conflicts. Use cases are defined in `use-cases.md`.

## Owners

| Owner | Branch | Assigned scope (UC) |
| --- | --- | --- |
| **Nghia** (Dev 1) | `Nghia` | UC-04 GIS import, UC-06 Map parcel search, UC-07 Map export, UC-09 Scan vs map comparison, Backend (OCR service, GIS service, DGN conversion) |
| **Huy** (Dev 2) | `Huy` | UC-03 Physical storage tree, DB models/schema, config. Also intended owner of UC-01/02/10 (see "Reassigned stopgap" below). |
| **Unassigned** | - | UC-05 Tra cuu, UC-08 Bien dong |

> [!NOTE]
> The "Assigned scope" column reflects the original Dev 1 / Dev 2 split. The "Current code" state below may differ - some UCs were built as stopgap by a non-assigned dev. See the "Reassigned stopgap" rows.

## Status by Use Case

Legend: Done | In progress | Not started

| UC | Name | Assigned owner | Built by | Status | Key files | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| UC-01 | Dang nhap he thong | Huy (intended) | Nghia (stopgap) | Done (stopgap) | `backend/app/routers/auth.py`, `backend/app/dependencies.py`, `src/app/login/page.tsx`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/me/route.ts`, `src/middleware.ts`, `src/lib/session.ts` | Built by Nghia outside assigned scope. Intended owner is Huy/other - handoff needed for the S2 auth-bypass fix. Header-based backend auth; see `security.md` S2. |
| UC-02 | Thiet lap tai khoan can bo | Huy (intended) | Nghia (stopgap) | In progress (stopgap) | `src/app/(dashboard)/accounts/page.tsx` | Read-only list page typed; no create/edit API yet. Built by Nghia outside assigned scope. |
| UC-03 | Luu ho so giay | Huy | Huy | Done | `backend/app/routers/storage.py`, `backend/app/models.py` (storage tables), `backend/app/schemas.py` (storage schemas), `src/app/storage/page.tsx`, `src/components/storage/StorageExplorer.tsx`, `src/components/storage/StorageModal.tsx` | Physical storage tree CRUD (`Kho -> Ke -> Tang -> HopSo`) with role guards and cascade-delete protection. Does not yet link to `HoSo` records. |
| UC-04 | Nhap ban do so | Nghia | Nghia | In progress | `backend/app/services/gis_service.py`, `backend/app/routers/gis.py`, `backend/app/config.py` (GIS settings), `backend/app/models.py` (ThuaDat), `src/app/api/maps/import/route.ts`, `src/app/(dashboard)/map/page.tsx`, `src/components/map/MapToolsPanel.tsx` | **Done**: `dc*.txt` attribute/centroid parser (80 files, 14,714 parcels), VN-2000 to WGS84 via gdaltransform, PostGIS persistence (replaces in-memory cache), GIST spatial indexes, bbox/so_thua/to_ban_do query. **Pending**: `.dgn` polygon geometry (V8 files are DGNv8 format, OSGeo4W GDAL only has old DGN driver; V7 files work but have fewer sheets). |
| UC-05 | Tra cuu ho so | Unassigned | - | Not started | `src/app/(dashboard)/search/page.tsx` (stub) | Page stub exists; no search API, no `HoSo` model yet. |
| UC-06 | Tim thua dat tren ban do | Nghia | Nghia | Done | `src/components/map/MapView.tsx`, `src/components/map/MapLegend.tsx`, `src/components/map/MapToolsPanel.tsx`, `src/app/api/parcels/route.ts` | MapLibre circles colored by land-use, click popups, search by so_thua/to_ban_do, legend, tools panel. |
| UC-07 | Xuat ban do | Nghia | Nghia | In progress | `src/app/api/maps/export/route.ts` | **Done**: GeoJSON export. **Pending**: image/map-image export (assigned scope). PDF/print and record-list export are UC-07 record-side, not map-side. |
| UC-08 | Ghi nhan bien dong ho so | Unassigned | - | Not started | - | No model, no router, no UI. Requires `HoSo` + old/new relationship model. |
| UC-09 | Doi chieu scan va ban do so | Nghia | - | Not started | - | Assigned to Nghia. No implementation yet. Depends on OCR service (Nghia's backend scope) + parcel data (UC-04). |
| UC-10 | Theo doi hoat dong he thong | Huy (intended) | Nghia (stopgap) | In progress (stopgap) | `src/app/(dashboard)/logs/page.tsx` | Logs list page typed; no log-writing backend, no dashboard stats. Built by Nghia outside assigned scope. |

## Cross-Cutting Work

| Area | Owner | Status | Notes |
| --- | --- | --- | --- |
| Prisma to FastAPI migration | Nghia | Done | Deleted `prisma/schema.prisma`, `prisma/seed.ts`, `src/lib/prisma.ts`. Backend now FastAPI + SQLAlchemy. |
| DB models (7 tables) | Huy | Done | `users`, `roles`, `userroles`, `kholuutru`, `keluutru`, `tangluutru`, `hopsoluutru`. Rich schema (`ThuaDat`, `HoSo`, etc.) pending. |
| OCR service (PaddleOCR) | Nghia | Not started | Listed in `backend/requirements.txt` but no router/service. Part of Nghia's assigned backend scope; needed for UC-09. |
| DGN geometry parsing | Nghia | Not started | 8967 `.dgn` files in `E:\Ban Do` (MicroStation format). The bulk of map geometry. Current code only handles paired `dc*.txt` attribute files. Part of UC-04 pending scope. |
| Convention files (`loading.tsx`, `error.tsx`) | Unassigned | Not started | Non-blocking Next.js App Router convention files. |
| TypeScript lint cleanup | Nghia | Done (uncommitted) | Removed `any`, unused imports/params; added `'use client'`. See `changelog.md`. |

## Reassigned Stopgap (UC-01, UC-02, UC-10)

UC-01 (auth), UC-02 (accounts), and UC-10 (logs) were built by Nghia as stopgap work but are **not part of Nghia's assigned Dev 1 scope** (Digital Maps & GIS). Intended owner is Huy/other.

- The stopgap code is functional and committed on the `Nghia` branch.
- The S2 auth-bypass fix (`security.md`) is an architectural change that should be driven by the intended auth owner, not Nghia, to avoid scope creep.
- Coordination needed: decide whether Huy adopts the stopgap code as-is or rewrites. If adopting, Huy takes over `backend/app/dependencies.py`, `src/middleware.ts`, `src/lib/session.ts`, and the `(dashboard)/accounts` + `(dashboard)/logs` pages.

## Coordination Notes

- Nghia's branch has merged in Huy's storage and DB model work. Huy's `config.py` (no hardcoded password) was NOT taken - Nghia's `config.py` keeps the password because it also carries GIS settings Huy's branch lacks. See `security.md` S3.
- Before touching `backend/app/dependencies.py` or `config.py`, coordinate - both branches have edits there.
- UC-05 and UC-08 are unassigned. Pick one by creating a feature branch off `main` (not off a personal branch) to keep future merges clean.
- Source data lives at `E:\Ban Do` (machine-specific). Subfolders include `Ban do V7` (dc*.txt + dc*.dgn pairs) and `Ban do V8\BDDC TT Van Dinh` (current `dgn_source_path` default).
