# Changelog

Dated log of applied fixes and changes. Open issues live in `security.md`; per-UC status in `feature-ownership.md`.

## 2026-07-18 — Map Interaction Baseline

- Map page now loads current parcels once on open and supports exact map-sheet/parcel-number search.
- MapLibre `feature-state` keeps click/search selection highlighted; popup includes core parcel fields, geometry provenance, and clear-selection behavior.
- Added parcel/label visibility, parcel opacity, and street/satellite basemap controls. Satellite remains disabled until a licensed XYZ template is configured.
- Added dependency-free temporary point and polygon sketch modes. Sketches are client-only and do not modify PostGIS.
- Removed `/map?test=1` automatic import. Opening map is now read-only; database import requires the existing explicit Admin action.
- Added optional `geometry_source` import/query support plus `backend/migrations/20260718_add_geometry_source.sql`. Migration is local/test only and is not run automatically, so shared database schema remains unchanged.

## 2026-07-17 — Cross-Machine Launcher Hardening

### Team Setup
- `backend/.env.example` — now tracked by Git; first launch can reliably create `backend/.env` on a clean clone. Database password remains a required per-machine value via the `CHANGE_ME` placeholder.
- `backend/.env.example` — leaves `DGN_SOURCE_PATH` empty so existing backend auto-detection scans `C:`, `D:`, `E:`, and `F:` for the local `Ban Do` dataset.
- `.gitignore` — keeps real `.env` files ignored while explicitly allowing `backend/.env.example`.

### Launcher Reliability
- `start.bat` — uses built-in Windows PowerShell directly and reports startup failures; PowerShell 7 (`pwsh`) is no longer required.
- `start.ps1` — reads PostgreSQL host and port from `DATABASE_URL`, starts a local PostGIS container or PostgreSQL service only when needed, then fails early when the configured endpoint stays unavailable.
- `start.ps1` — detects GDAL from configured, OSGeo4W, and common QGIS locations without changing the shared backend config.
- `start.ps1` — creates a Python 3.12 virtual environment, reinstalls Python dependencies when `requirements.txt` changes, and runs `npm ci` on a clean frontend clone.
- `start.ps1` — starts backend and frontend with the PowerShell edition already running the launcher, using encoded commands so paths containing spaces remain safe.

## 2026-07-01 — Map UX, Polygon Fallback, Startup Reliability, Auto-Detect Data Path

### Map Parcel Rendering
- `backend/app/services/gis_service.py` — lowered `PARCEL_MIN_M2` from 200 to 5 so small residential parcels (50-150 m2) get polygons. Was filtering out 64 of 70 dot-only parcels.
- `backend/app/services/gis_service.py` — added centroid-square fallback in `match_parcels_to_polygons`: parcels that fail polygonize (DGN line gaps) get an approximate square from recorded area. Eliminates remaining dot-only parcels. Result: 700/700 parcels with polygons (was 630/700).

### Map UI
- `src/components/map/MapView.tsx` — OSM basemap opacity set to 0.7 (user preference).
- `src/components/map/MapView.tsx` — capped `maxZoom: 19` to stop OSM zoom-20 tile fetch errors (OSM maxes at 19).
- `src/components/map/MapView.tsx` — custom compact popup with close button in corner. Disabled MapLibre default close button, removed default padding via `globals.css`.
- `src/components/map/MapView.tsx` — reduced popup padding/margins/font sizes for compact display.
- `src/app/(dashboard)/map/page.tsx` — auto-load test data via `/map?test=1` query param. Triggers 5-file import on page load.
- `src/components/map/MapToolsPanel.tsx` — fetches actual `source_path` from backend `/api/maps/status` instead of hardcoded `E:\Ban Do`.
- `src/components/map/MapToolsPanel.tsx` — shows yellow warning box with `.env` instructions when no data path found.
- `src/app/api/maps/status/route.ts` (new) — Next.js proxy for backend `/api/gis/status` endpoint.
- `src/components/map/MapLegend.tsx` + `MapToolsPanel.tsx` — fixed Vietnamese diacritics: Thua->Thua, Chu giai->Chu giai, all labels with full accents.

### Startup Reliability
- `start.ps1` — replaced fixed `Start-Sleep` with TCP port poll (up to 30s) for PostgreSQL readiness. Service "Running" != accepting connections; PostgreSQL 18 takes 5-15s to initialize after service starts.
- `backend/app/database.py` — added 5-retry loop (2s apart) with `pool_pre_ping=True` for DB connection on startup. Prevents backend crash if PostgreSQL still initializing.

### Auto-Detect Data Path
- `backend/app/config.py` — auto-detect `dgn_source_path` by scanning drives (E:, D:, C:, F:) for `Ban Do` subfolder with 50+ `dc*.txt` files. Teammates no longer need to manually edit `.env`. Falls back to warning if not found.
- `backend/.env.example` (new) — documents all env vars (`DATABASE_URL`, `DGN_SOURCE_PATH`, `GDAL_BIN_PATH`) for teammate onboarding.

### Known Issue: DGNv8 Not Supported by Installed GDAL
- `E:\OSGeo4W\bin\ogr2ogr.exe` only has the DGN (V7) driver, not DGNv8.
- V8 DGN files (`E:\Ban Do\Ban do V8\BDDC TT Van Dinh\T*.dgn`) fail with: `recognized as a DGNv8 dataset, but the DGNv8 driver is not available in this GDAL build`.
- V7 DGN files (`E:\Ban Do\Ban do V7\BDDC TT Van Dinh\dc*.dgn`) parse correctly via the old DGN driver.
- Auto-detect prefers V7 over V8 (alphabetical `os.walk` order) — this is correct because V8 would fail.
- Fix options: install DGNv8 driver for GDAL (requires recompiling GDAL with libdgnv8), use ODA File Converter to batch-convert V8 to V7, or continue using V7 source files.

## 2026-06-29 — DGN Polygon Extraction + TCVN3 Decoder + UI Fixes

### DGN Polygon Extraction (UC-04 core fix)
- `backend/app/config.py` — `dgn_source_path` switched from V8 (DGNv8, unreadable by installed GDAL) to V7 folder.
- `backend/app/services/gis_service.py` — rewrote `parse_dgn_polygons` as `extract_parcel_polygons`: DGN line segments polygonized via `shapely.ops.polygonize` (DGN stores boundaries as lines, not pre-built polygons). Lines filtered to parcel centroid area, results filtered by area (200-50000 m2).
- `backend/app/services/gis_service.py` — replaced containment matching with greedy 1:1 nearest-distance matching. TXT `tam_x/tam_y` are label points, not geometric centroids.
- `backend/app/services/gis_service.py` — fixed execution order: `transform_centroids` now runs before polygon matching.
- `backend/app/services/gis_service.py` — `_gdal_env()` now sets `PROJ_DATA` alongside `PROJ_LIB`.
- `backend/app/services/gis_service.py` — ogr2ogr GeoJSON read uses `errors="replace"` for TCVN3 bytes.
- Result: 5-file demo import yields 700 parcels, 630 with unique polygon boundaries (90% match rate), 0 errors.

### TCVN3 Decoder
- `backend/app/tcvn3_decoder.py` (new) — rewrote `TCVN3_MAP` with 33 byte corrections verified from source file header row analysis. Added `sanitize_text()` and `open_tcvn3()`.

### Frontend Map Rendering
- `src/components/map/MapView.tsx` — added polygon fill + outline layers. Circle layer filtered to Point-only fallback. Styling: `fill-opacity: 0.4`, `line-width: 2`. Fixed `styledata` listener leak. Added `escapeHtml` for popup values. Fixed `maxZoom` 22 to 19.

### UI String Fixes
- "Van Dinh" corrected to "Van Dinh" in Sidebar, login, layout, seed_data.
- MapView popup label "Xu dung" corrected to "Xu dong".

### Bug Fix
- `backend/app/tcvn3_decoder.py` — `sanitize_text` crash on control-char-only fields (move `replace` before empty check).

### Resolved: DGNv8 Not Supported
- Previously recorded as a known issue (see 2026-06-18 entry). Resolved by switching to V7 source path and polygonizing line networks.

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
