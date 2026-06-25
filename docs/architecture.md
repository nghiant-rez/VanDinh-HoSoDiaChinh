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

Source data lives at `E:\Ban Do` (machine-specific; configured via `dgn_source_path` in `config.py`). The current source path is `E:\Ban Do\Ban do V7\BDDC TT Van Dinh` (80 `dc*.txt` + 81 `dc*.dgn` files, V7 format).

Two paired formats per parcel sheet:

- **`.dgn`** (MicroStation DGN, V7 format) - parcel **geometry** (boundaries stored as line segments, polygonized at import time).
- **`dc*.txt`** (pipe-delimited, TCVN3-encoded) - parcel **attributes + centroids** (so_thua, to_ban_do, dien_tich, loai_dat, mdsd2003, ten_chu, dia_chi, xu_dong). Decoded via `tcvn3_decoder.py` before parsing.

Storage: PostgreSQL + PostGIS (`thuadat` table). Geometry columns:
- `geom` (POLYGON, SRID 4326) - parcel boundary from DGN (polygonized line network).
- `centroid` (POINT, SRID 4326) - label point from TXT (always available).
- GIST spatial indexes on both columns.

Import pipeline (`backend/app/services/gis_service.py`):
1. Scan `dc*.txt` files in `dgn_source_path`.
2. Parse pipe-delimited rows via `open_tcvn3` (TCVN3 decode) into `ParcelRecord` (centroid + attributes, sanitized).
3. Transform all centroids to WGS84 via `gdaltransform`.
4. For each TXT file, find corresponding `.dgn` file and run `extract_parcel_polygons`: ogr2ogr converts DGN to GeoJSON (VN-2000 to WGS84), LineStrings filtered to parcel centroid area, line network polygonized via `shapely.ops.polygonize`, results filtered by area (200-50000 m2).
5. Match TXT label points to polygons via greedy 1:1 nearest-distance assignment (`match_parcels_to_polygons`, within 50m).
6. Batch insert to PostGIS (`ST_GeomFromGeoJSON` for polygons, `ST_MakePoint` for centroids).
7. Calculate bbox and center via PostGIS aggregates.

Query: `ST_AsGeoJSON(COALESCE(geom, centroid))` - returns polygon if available, otherwise centroid point. Frontend renders polygon fill + outline layers for Polygon features, circle layer for Point fallback.

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
