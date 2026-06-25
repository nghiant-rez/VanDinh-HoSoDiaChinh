# Changelog

Dated log of applied fixes and changes. Open issues live in `security.md`; per-UC status in `feature-ownership.md`.

## 2026-06-25 — DGN Polygon Extraction + TCVN3 Decoder + UI Fixes

### DGN Polygon Extraction (UC-04 core fix)
- `backend/app/config.py` — `dgn_source_path` switched from V8 (DGNv8, unreadable by installed GDAL) to V7 folder (`E:\Ban Do\Ban do V7\BDDC TT Van Dinh`).
- `backend/app/services/gis_service.py` — rewrote `parse_dgn_polygons` as `extract_parcel_polygons`: DGN line segments are polygonized via `shapely.ops.polygonize` (DGN stores boundaries as lines, not pre-built polygons). Lines filtered to parcel centroid area, results filtered by area (200-50000 m2).
- `backend/app/services/gis_service.py` — replaced containment matching with greedy 1:1 nearest-distance matching (`match_parcels_to_polygons`). TXT `tam_x/tam_y` are label points, not geometric centroids.
- `backend/app/services/gis_service.py` — fixed execution order: `transform_centroids` now runs before polygon matching (was after, causing all parcels to have lon=0/lat=0 at match time).
- `backend/app/services/gis_service.py` — `_gdal_env()` now sets `PROJ_DATA` alongside `PROJ_LIB` (PROJ 6+ prefers `PROJ_DATA`).
- `backend/app/services/gis_service.py` — ogr2ogr GeoJSON read uses `errors="replace"` for TCVN3 bytes in DGN attribute output.
- Result: 5-file demo import yields 700 parcels, 630 with unique polygon boundaries (90% match rate), 0 errors. Polygons have 5-21 vertices.

### TCVN3 Decoder
- `backend/app/tcvn3_decoder.py` (new) — rewrote `TCVN3_MAP` with 33 byte corrections verified from source file header row analysis. Added `sanitize_text()` for name casing and null byte removal. Added `open_tcvn3()` context manager.
- `backend/app/services/gis_service.py` — `parse_dc_txt` now uses `open_tcvn3` instead of `open(filepath, encoding="latin-1")`. Text fields wrapped in `sanitize_text`.
- Before: "Vuong Van Hung", "Thon Thanh am", "dong Quan Tien". After: "Vuong Van Hung", "Thon Thanh am", "Dong Quan Tien".

### Frontend Map Rendering
- `src/components/map/MapView.tsx` — added `parcels-fill` + `parcels-fill-outline` layers (filtered to Polygon/MultiPolygon). Circle layer now filtered to Point-only fallback.
- Styling: `fill-opacity: 0.4`, `line-color: #1e293b`, `line-width: 2`.
- Fixed `styledata` listener leak with cleanup return.
- Added `escapeHtml` for all popup values. Added `getFeatureCenter` for polygon popup positioning.
- Fixed `maxZoom` 22 to 19 (OSM tiles don't exist above z19).

### UI String Fixes
- `src/components/layout/Sidebar.tsx`, `src/app/login/page.tsx`, `src/app/layout.tsx`, `backend/seed_data.py` — "Van Dinh" corrected to "Van Dinh" (commune name typo).
- `src/components/map/MapView.tsx` — popup label "Xu dung" corrected to "Xu dong" (cadastral term for field-area name).

### Infrastructure
- `.gitignore` — added `venv/` (was only `.venv/`).
- `start.bat`/`start.ps1` — launch services in separate windows, exit launcher.

### Resolved: DGNv8 Not Supported
- Previously recorded as a known issue (see 2026-06-18 entry below). Resolved by switching to V7 source path and polygonizing line networks instead of relying on native polygon features.

## 2026-06-18 - DeepSeek Fixes Pass

### Frontend (TypeScript/React)
- `src/components/storage/StorageExplorer.tsx` - `int` -> `number` (compilation breaker); typed all `any` props; fixed optional callback calls.
- `src/components/ui/FilterPanel.tsx` - added `'use client'` (runtime breaker).
- `src/components/ui/DataTable.tsx` - removed `any` cast.
- `src/components/storage/StorageModal.tsx` - typed `editData` prop.
- `src/app/storage/page.tsx` - fixed `useEffect` setState-in-effect lint error; now fetches real `userId` from `/api/auth/me` instead of hardcoded `'1'`.
- `src/app/(dashboard)/accounts/page.tsx` - typed `AccountRow` interface, removed `any`.
- `src/app/(dashboard)/logs/page.tsx` - typed `LogRow` interface, removed `any`, removed unused import.
- `src/app/(dashboard)/search/page.tsx` - typed row, removed unused `useState`.
- `src/app/login/page.tsx` - removed unused `err` catch param.
- `src/app/api/auth/me/route.ts` - removed unused `requireAuth` import.
- `src/app/api/maps/export/route.ts` - removed unused `error` catch param.
- `src/app/api/maps/import/route.ts` - removed unused `_error` catch param.
- `src/app/api/parcels/route.ts` - removed unused `_error` catch param.
- `src/middleware.ts` - removed unused `defaultSession` import.

### Backend (Python)
- `backend/app/dependencies.py` - removed `Header(1)` default (was auto-auth as user 1); removed dummy user bypass in `require_roles`; added SECURITY NOTE comment.
- `backend/app/routers/auth.py` - deleted duplicate `get_db()`, imports from `dependencies.py` instead.
- `backend/app/services/gis_service.py` - column check `< 10` -> `< 12` (was crash on files with 10-11 columns).
- `backend/app/routers/gis.py` - all 5 `async def` -> `def` (were blocking event loop with sync code); removed unused `format` param.

### Config/Docs
- `README.md` - rewritten: Prisma + Next.js API Routes -> Python FastAPI + SQLAlchemy.
- `.gitignore` - added `__pycache__/`, `*.py[cod]`, `.venv/`, `backend/data/`.
- `next.config.ts` - added `turbopack.root` to silence lockfile warning.

### Git
- Dropped stale stash `stash@{0}` (obsolete AGENTS.md changes on main).

### Verification
- `npm run lint`: 0 errors, 0 warnings.
- `npx tsc --noEmit`: 0 errors.
- `npm run build`: passes (7.4s, 20 pages).

## 2026-06-19 - Docs Reorganization

- Renamed `use-case-and-diagrams.md` -> `use-cases.md`.
- Renamed `project-references.md` -> `references.md`.
- Rewrote `project-context.md` -> `architecture.md` (removed duplicated fix/status lists).
- Rewrote `security-issues.md` -> `security.md` (updated for post-Huy-merge state; S3 now partially resolved).
- Rewrote `fixes-deepseek-2026-06-18.md` -> `changelog.md` (dated changelog format).
- Added `README.md` (docs index + ownership quick-ref).
- Added `feature-ownership.md` (per-UC owner/files/status table).

## 2026-06-19 - UC-04 PostGIS Persistence

### Backend (Python)
- `backend/app/models.py` - added `ThuaDat` model (so_thua, to_ban_do, dien_tich, loai_dat, mdsd2003, ten_chu, dia_chi, xu_dong; geom + centroid columns managed via raw SQL).
- `backend/app/database.py` - auto-enable PostGIS extension on startup.
- `backend/app/config.py` - `dgn_source_path` set to `E:\Ban Do\Ban do V8\BDDC TT Van Dinh` (80 dc*.txt + 81 dc*.dgn files).
- `backend/app/services/gis_service.py` - full rewrite:
  - `parse_dgn_polygons()` - uses ogr2ogr subprocess to convert DGN -> GeoJSON with VN-2000 to WGS84 coordinate transform, filters Polygon/MultiPolygon features.
  - `match_parcels_to_polygons()` - uses shapely `contains` to match TXT centroids to DGN polygons by spatial containment.
  - `import_all_parcels(db)` - orchestrates: parse TXT + DGN, transform coordinates, match polygons, batch insert to PostGIS. Replaces in-memory cache.
  - `get_parcels_geojson(db, filters)` - queries PostGIS with `ST_AsGeoJSON(COALESCE(geom, centroid))`, supports bbox/so_thua/to_ban_do filtering.
  - `get_parcel_count(db)`, `get_map_center(db)` - PostGIS aggregate queries.
  - `ensure_geometry_columns(db)` - adds PostGIS geometry columns + GIST spatial indexes if not present.
- `backend/app/routers/gis.py` - rewritten to use PostGIS via `get_db` dependency instead of in-memory cache. Import endpoint requires ADMIN role. All endpoints query PostGIS.

### Frontend (TypeScript)
- `src/app/api/maps/import/route.ts` - forwards `X-User-Id` header to FastAPI for role-based auth on import.

### Infrastructure
- PostgreSQL 18 + PostGIS 3.6 running in Docker container `vandinh-postgis` (local PostgreSQL 18 installation has broken DLL dependencies).
- 14,714 parcels imported to PostGIS from 80 dc*.txt files (31.2s import time).
- All parcels have centroid POINT geometry in WGS84 (EPSG:4326).

### Known Issue: DGNv8 Not Supported
- V8 DGN files are DGNv8 format; OSGeo4W's GDAL build only has the old DGN driver.
- V7 DGN files (old format) parse correctly (28 files, 482 polygons per file).
- Parcel polygon geometry is NULL for all V8-sourced parcels (centroids still available).
- Fix options: install DGNv8 driver for GDAL, use ODA File Converter, or use V7 DGN files as fallback.

### Verification
- `npm run lint`: 0 errors.
- `npx tsc --noEmit`: 0 errors.
- `npm run build`: passes.
- Import self-test: 14,714 parcels in DB, bbox/center/search all working.

Triggered by comparing the original Dev 1 / Dev 2 assignment against the codebase.

- `feature-ownership.md`: UC-09 owner corrected from "TBD" to Nghia (was always assigned to Nghia per Dev 1 scope). Split "owner" into "Assigned owner" vs "Built by" to expose stopgap work.
- `feature-ownership.md`: UC-01 (auth), UC-02 (accounts), UC-10 (logs) relabeled as stopgap built by Nghia outside assigned scope; intended owner is Huy/other. Added "Reassigned stopgap" section.
- `feature-ownership.md`: UC-04 status corrected from "Done" to "In progress" - `.dgn` geometry parsing (8967 files, the bulk) and PostGIS persistence are pending; only `dc*.txt` attribute parsing is done.
- `feature-ownership.md`: UC-07 clarified as map-side export (GeoJSON done, image pending); PDF/print is record-side, not map-side.
- `architecture.md`: GIS section rewritten. Original docs said "DXF/Shapefile" (copied from the assignment spec); actual `E:\Ban Do` data is `.dgn` (MicroStation, 8967 files) + `dc*.txt` (attributes, 189 files). No `.dxf` or `.shp` files exist in the source. Added note about the format mismatch.
- `architecture.md`: Added GIS limitations section (in-memory cache, no DGN geometry, no indexing).
- `docs/README.md`: ownership quick-ref updated to match the corrected Dev 1 / Dev 2 split.

## 2026-06-22 — Backend Bug Fixes + Auth Hardening

### Critical Auth Fix
- `backend/app/dependencies.py` — removed dummy user bypass; removed `Header(1)` default (was auto-auth as user 1); `Header(...)` now requires X-User-Id to be sent; missing user returns 401.
- `backend/app/routers/gis.py` — added `require_roles` to all 5 endpoints (was 4 unauthenticated).
- `backend/app/routers/hoso.py` — `createdbyuserid` now uses `current_user.id` from auth dependency instead of hardcoded `1`.
- `src/app/api/parcels/route.ts` — now forwards `X-User-Id` header from session (was missing, would 422 after Header(...) change).
- `src/app/api/maps/export/route.ts` — same X-User-Id fix.

### Multi-Role Bug (new finding)
- `backend/app/routers/auth.py:68` — login returns only first role (`user_roles_query[0][0]`). A user with `[STAFF, ADMIN]` gets only STAFF, locking them out of admin pages. Needs `list[str]` return.

### Input Validation
- `backend/app/routers/gis.py` — added bounds on `limit` (1-50000), lat (-90 to 90), lon (-180 to 180) for both `/parcels` and `/export`.
- `backend/app/routers/gis.py` — added `limit_files >= 0` validation on import.
- `backend/app/routers/auth.py` — added `Field(min_length=1, max_length=100)` on username/password.

### Seed Script Fix
- `backend/seed_data.py` — fixed: User now includes email + bcrypt passwordhash; KhoLuuTru uses `makho` not fake `diachi`; added ADMIN/STAFF roles + UserRole link; wraps in try/finally; repairs existing user if email/passwordhash missing.

### CORS
- `backend/app/main.py` — restricted `allow_methods` from `["*"]` to `["GET","POST","PUT","DELETE"]`.

### Transaction Safety
- `backend/app/services/gis_service.py` — removed intermediate `db.commit()` between DELETE and INSERT (now single atomic transaction). Added explicit `db.rollback()` on import failure in gis.py.
- `backend/app/routers/hoso.py` — added IntegrityError catch on ThuaDat flush race; guard against NoneType after rollback.

### Other
- `backend/app/routers/auth.py` — added `logger.error()` on bcrypt ValueError (was silent).
- `backend/test_cols.py` — reads DB URL from `DATABASE_URL` env var instead of hardcoded `postgresql://postgres:123@localhost:5432/vandinh`.
- `AGENTS.md` — added policy: never push/merge to remote without explicit user permission.

### Remaining Notes (from GLM review)
- Multi-role truncation in login (see above, not yet fixed).
- No unique constraint on `ThuaDat(tobando, sothua)` — duplicates possible.
- Duplicate `Content-Disposition` header in maps/export (frontend + backend both set).
- `test_cols.py` still has hardcoded fallback password `123456`.
