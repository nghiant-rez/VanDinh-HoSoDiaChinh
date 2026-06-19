# Architecture

Single source of truth for how the system is built. Status of each part lives in `feature-ownership.md`; open security issues in `security.md`; applied changes in `changelog.md`.

## Frontend to Backend Split

- **Frontend**: Next.js 16 (App Router) at localhost:3000. React 19, TypeScript 5 strict, Tailwind CSS 4, MapLibre GL.
- **Backend**: Python 3.12+ FastAPI at localhost:8000. SQLAlchemy ORM, Pydantic v2.

Two call patterns:

1. **Direct calls** - Frontend `'use client'` components call FastAPI directly. Example: storage explorer hits `http://localhost:8000/api/storage/...`.
2. **Proxied calls** - Next.js API routes (`/api/...`) validate the iron-session, then forward to FastAPI. Examples: `/api/parcels`, `/api/maps/import`, `/api/maps/export`, `/api/auth/login`.

## Auth Flow

- **Frontend session**: iron-session encrypted cookie (`vds_session`), created by `/api/auth/login`.
- **Backend auth**: header-based (`X-User-Id`) - temporary for local-first dev.
- **Flow**: Login -> POST `/api/auth/login` (Next.js) -> forwards to FastAPI POST `/api/auth/login` -> FastAPI returns user + roles -> Next.js creates iron-session cookie.
- **Middleware**: `src/middleware.ts` guards `(dashboard)` routes, redirects unauthenticated users to `/login`.

> [!WARNING]
> Header-based backend auth is insecure. See `security.md` S2. Replacement (session/JWT validation on FastAPI) is an open architectural item.

## Database

- PostgreSQL 18 with PostGIS extension.
- Full schema reference: `Db/database.md` (20+ tables).
- SQLAlchemy models in `backend/app/models.py`. Currently 7 tables implemented: `users`, `roles`, `userroles`, `kholuutru`, `keluutru`, `tangluutru`, `hopsoluutru`.
- Rich schema (`ThuaDat`, `HoSo`, `Attachments`, etc.) not yet implemented as models.
- Convention: SQLAlchemy raw SQL for PostGIS geometry columns, ORM for standard CRUD.

## GIS Module

Source data lives at `E:\Ban Do` (machine-specific; configured via `dgn_source_path` in `config.py`). The current source path is `E:\Ban Do\Ban do V8\BDDC TT Van Dinh` (80 `dc*.txt` + 81 `dc*.dgn` files).

Two paired formats per parcel sheet:

- **`.dgn`** (MicroStation DGN) - the bulk: parcel **geometry** (polygons). V8 files are DGNv8 format (not supported by OSGeo4W GDAL; V7 files use old DGN format and parse correctly).
- **`dc*.txt`** (pipe-delimited) - parcel **attributes + centroids** (so_thua, to_ban_do, dien_tich, loai_dat, mdsd2003, ten_chu, dia_chi, xu_dong). **Currently parsed and stored in PostGIS.**

Storage: PostgreSQL + PostGIS (`thuadat` table). Geometry columns:
- `geom` (POLYGON, SRID 4326) - parcel boundary from DGN (NULL when DGNv8 parsing unavailable).
- `centroid` (POINT, SRID 4326) - centroid from TXT (always available).
- GIST spatial indexes on both columns.

Import pipeline (`backend/app/services/gis_service.py`):
1. Scan `dc*.txt` files in `dgn_source_path`.
2. Parse pipe-delimited rows into `ParcelRecord` (centroid + attributes).
3. For each TXT file, find corresponding `.dgn` file and parse polygons via `ogr2ogr` (DGN -> GeoJSON with VN-2000 to WGS84 transform).
4. Match TXT centroids to DGN polygons by spatial containment (shapely `contains`).
5. Transform all centroids to WGS84 via `gdaltransform`.
6. Batch insert to PostGIS (`ST_GeomFromGeoJSON` for polygons, `ST_MakePoint` for centroids).
7. Calculate bbox and center via PostGIS aggregates.

Query: `ST_AsGeoJSON(COALESCE(geom, centroid))` - returns polygon if available, otherwise centroid point.

Limitations:
- DGNv8 files (V8 folder) cannot be parsed - OSGeo4W GDAL only has the old DGN driver. All V8-sourced parcels have centroid only (no polygon geometry).
- Map shows centroid points, not parcel polygons, until DGNv8 support is added.
- Fix options: install DGNv8 driver for GDAL, use ODA File Converter, or use V7 DGN files as fallback.

> [!NOTE]
> The original Dev 1 assignment mentioned "DXF/Shapefile" import. The actual source data contains no `.dxf` or `.shp` files - it is `.dgn` + `.txt`. Scope is corrected to DGN + TXT in `feature-ownership.md`.

## Physical Storage Model

- Hierarchy: `Kho -> Ke -> Tang -> HopSo` (Archive -> Shelf -> Tier -> Box).
- CRUD in `backend/app/routers/storage.py` with role guards (ADMIN write, ADMIN+STAFF read tree).
- Cascade-delete protection: cannot delete a node that still contains children.
- Frontend: `StorageExplorer.tsx` (tree view) + `StorageModal.tsx` (create/edit).

## Decisions

- Local-first, single-PC deployment (not cloud, no external service costs).
- Vietnamese-first: UI labels in Vietnamese, code identifiers in English.
- No emojis in code, comments, or commit messages.
- TypeScript strict mode, no `any` unless justified.
- Tailwind 4 with `@theme` tokens from `globals.css` (Figma tokens).
- Feature branches (Nghia, Huy) -> PR -> main workflow.
