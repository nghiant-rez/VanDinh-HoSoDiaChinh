# Data Directory

## Sample Dataset

**`sample_parcels.geojson`** - 100 parcel samples from Van Dinh commune for testing/development.

- Source: First 5 cadastral map files (`dc*.txt`) from `E:\Ban Do`
- Coordinate system: WGS84 (EPSG:4326), transformed from VN-2000 TM-3
- Geometry: Point centroids only (DGNv8 polygon import not yet supported)
- Size: ~48 KB
- Use case: Load this into PostGIS for frontend testing without running the full 80-file import

## Import Source Files

Raw cadastral data files (`dc*.txt`, `dc*.dgn`) are **not** tracked in git—they're site-specific and stored locally in `E:\Ban Do`.

## Uploads

User-uploaded files (scanned documents, attachments) go in `uploads/` subdirectory (gitignored).
