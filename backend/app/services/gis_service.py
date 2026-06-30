"""GIS service: dc*.txt attributes + dc*.dgn polygon geometry -> PostGIS.

Uses Huy's ThuaDat column names: tobando, sothua (String), dientich (Numeric).
"""
import os
import glob
import json
import logging
import tempfile
from subprocess import run
from dataclasses import dataclass, field
from typing import Optional

from shapely.geometry import shape, Point, LineString, mapping
from shapely.ops import polygonize, unary_union
from sqlalchemy.orm import Session
from sqlalchemy import text

SQ_DEG_TO_M2 = 12321000000.0
PARCEL_MIN_M2 = 5
PARCEL_MAX_M2 = 50000
MATCH_MAX_DIST_M = 50

from app.config import settings
from app.tcvn3_decoder import open_tcvn3, sanitize_text

logger = logging.getLogger(__name__)


@dataclass
class ParcelRecord:
    so_thua: int
    to_ban_do: str
    tam_x: float
    tam_y: float
    dien_tich: float
    loai_dat: str
    mdsd2003: str
    ten_chu: str
    dia_chi: str
    xu_dong: str
    lon: float = 0.0
    lat: float = 0.0
    polygon_geojson: Optional[str] = None


@dataclass
class ImportResult:
    total_txt_files: int = 0
    total_dgn_files: int = 0
    total_parcels: int = 0
    parcels_with_polygon: int = 0
    errors: list = field(default_factory=list)
    bbox: dict = field(default_factory=dict)
    center: dict = field(default_factory=dict)


def _gdal_env() -> dict:
    env = os.environ.copy()
    proj_lib = os.path.join(os.path.dirname(settings.gdal_bin_path), "share", "proj")
    if os.path.isdir(proj_lib):
        env["PROJ_LIB"] = proj_lib
        env["PROJ_DATA"] = proj_lib
    return env


def extract_sheet_number(filename: str) -> str:
    base = os.path.basename(filename).replace(".txt", "")
    return base.upper().replace("DC", "").replace("GN", "")


def parse_dc_txt(filepath: str) -> list[ParcelRecord]:
    sheet_num = extract_sheet_number(filepath)
    parcels = []

    with open_tcvn3(filepath, "r") as f:
        lines = f.readlines()

    for line in lines:
        parts = [p.strip() for p in line.split("|")]
        if len(parts) < 12:
            continue
        thua = parts[1]
        if not thua.isdigit():
            continue

        try:
            parcel = ParcelRecord(
                so_thua=int(thua),
                to_ban_do=sheet_num,
                tam_x=float(parts[2]),
                tam_y=float(parts[3]),
                dien_tich=float(parts[4]),
                loai_dat=sanitize_text(parts[6]),
                mdsd2003=parts[7],
                ten_chu=sanitize_text(parts[8]),
                dia_chi=sanitize_text(parts[9]),
                xu_dong=sanitize_text(parts[11]) if len(parts) > 11 else "",
            )
            parcels.append(parcel)
        except (ValueError, IndexError) as e:
            logger.warning("Failed to parse line in %s: %s", filepath, e)

    return parcels


def transform_centroids(parcels: list[ParcelRecord]) -> list[ParcelRecord]:
    if not parcels:
        return parcels

    gdaltransform = os.path.join(settings.gdal_bin_path, "gdaltransform.exe")
    if not os.path.exists(gdaltransform):
        gdaltransform = "gdaltransform"

    coords_input = "\n".join(f"{p.tam_x} {p.tam_y}" for p in parcels)

    result = run(
        [gdaltransform, "-s_srs", settings.source_proj, "-t_srs", "EPSG:4326"],
        input=coords_input + "\n",
        capture_output=True,
        text=True,
        env=_gdal_env(),
    )

    if result.returncode != 0:
        logger.error("gdaltransform failed: %s", result.stderr)
        raise RuntimeError(f"Coordinate transform failed: {result.stderr}")

    wgs84_lines = result.stdout.strip().split("\n")

    for parcel, wgs_line in zip(parcels, wgs84_lines):
        try:
            parts = wgs_line.split()
            parcel.lon = float(parts[0])
            parcel.lat = float(parts[1])
        except (ValueError, IndexError) as e:
            logger.warning(
                "Failed to transform coords for parcel %s-%s: %s",
                parcel.to_ban_do, parcel.so_thua, e
            )

    return parcels


def _ogr2ogr_to_geojson(filepath: str) -> dict | None:
    """Convert DGN to GeoJSON via ogr2ogr (VN-2000 -> WGS84). Returns parsed dict or None."""
    ogr2ogr = os.path.join(settings.gdal_bin_path, "ogr2ogr.exe")
    if not os.path.exists(ogr2ogr):
        ogr2ogr = "ogr2ogr"

    fd, temp_path = tempfile.mkstemp(suffix=".geojson")
    os.close(fd)
    os.unlink(temp_path)

    try:
        result = run(
            [ogr2ogr, "-f", "GeoJSON",
             "-s_srs", settings.source_proj,
             "-t_srs", "EPSG:4326",
             temp_path, filepath],
            capture_output=True, text=True, env=_gdal_env(),
        )
        if result.returncode != 0:
            logger.warning("ogr2ogr failed for %s: %s", filepath, result.stderr[:200])
            return None

        with open(temp_path, "r", encoding="utf-8", errors="replace") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Failed to parse DGN %s: %s", filepath, e)
        return None
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)


def extract_parcel_polygons(
    filepath: str,
    ref_lons: list[float],
    ref_lats: list[float],
) -> list[dict]:
    """Extract real parcel boundary polygons from a DGN file.

    DGN files store parcel boundaries as individual line segments, not
    pre-assembled polygons. This function:
      1. Converts DGN -> GeoJSON via ogr2ogr (VN-2000 -> WGS84)
      2. Filters LineStrings to the parcel centroid area (excludes title blocks, legends)
      3. Polygonizes the line network (shapely.ops.polygonize)
      4. Filters by reasonable parcel area (200-50000 m2)
    Returns a list of GeoJSON Polygon geometry dicts.
    """
    data = _ogr2ogr_to_geojson(filepath)
    if not data:
        return []

    if not ref_lons or not ref_lats:
        return []

    margin = 0.01
    min_lon, max_lon = min(ref_lons) - margin, max(ref_lons) + margin
    min_lat, max_lat = min(ref_lats) - margin, max(ref_lats) + margin

    lines: list[LineString] = []
    for feature in data.get("features", []):
        geom = feature.get("geometry", {})
        if geom.get("type") != "LineString":
            continue
        coords = geom.get("coordinates", [])
        if len(coords) < 2:
            continue
        mid = coords[len(coords) // 2]
        if min_lon <= mid[0] <= max_lon and min_lat <= mid[1] <= max_lat:
            lines.append(LineString(coords))

    if not lines:
        return []

    merged = unary_union(lines)
    polys = list(polygonize(merged))

    min_area = PARCEL_MIN_M2 / SQ_DEG_TO_M2
    max_area = PARCEL_MAX_M2 / SQ_DEG_TO_M2
    result = []
    for p in polys:
        if min_area < p.area < max_area:
            result.append(mapping(p))
    return result


def match_parcels_to_polygons(
    parcels: list[ParcelRecord],
    polygons: list[dict],
) -> None:
    """Assign each parcel the nearest polygon (within MATCH_MAX_DIST_M meters).

    Uses 1:1 greedy assignment: each polygon is assigned to at most one parcel.
    The TXT 'tam_x/tam_y' fields are label points, not geometric centroids, so
    we use nearest-distance matching instead of containment.
    """
    if not polygons:
        return

    shapely_polys = [shape(p) for p in polygons]
    max_dist_deg = MATCH_MAX_DIST_M / 111000.0

    # Build (distance, parcel_idx, poly_idx) triples for all candidates
    candidates = []
    for pi, parcel in enumerate(parcels):
        if parcel.lon == 0 or parcel.lat == 0:
            continue
        pt = Point(parcel.lon, parcel.lat)
        for gi, poly in enumerate(shapely_polys):
            if poly.contains(pt):
                candidates.append((0.0, pi, gi))
            else:
                d = pt.distance(poly)
                if d < max_dist_deg:
                    candidates.append((d, pi, gi))

    # Greedy 1:1 assignment: shortest distance first
    candidates.sort()
    assigned_parcels = set()
    assigned_polys = set()
    for dist, pi, gi in candidates:
        if pi in assigned_parcels or gi in assigned_polys:
            continue
        parcels[pi].polygon_geojson = json.dumps(polygons[gi])
        assigned_parcels.add(pi)
        assigned_polys.add(gi)

    # Fallback: parcels without a polygon get a square estimated from recorded area.
    # This handles DGN linework gaps (unclosed polygons) that polygonize misses.
    # ponytail: approximate square, not the real boundary — marked by geometry source
    for pi, parcel in enumerate(parcels):
        if pi in assigned_parcels or parcel.lon == 0 or parcel.lat == 0:
            continue
        if parcel.dien_tich <= 0:
            continue
        side_deg = (parcel.dien_tich ** 0.5) / 111000.0
        half = side_deg / 2.0
        poly = {
            "type": "Polygon",
            "coordinates": [[
                [parcel.lon - half, parcel.lat - half],
                [parcel.lon + half, parcel.lat - half],
                [parcel.lon + half, parcel.lat + half],
                [parcel.lon - half, parcel.lat + half],
                [parcel.lon - half, parcel.lat - half],
            ]],
        }
        parcel.polygon_geojson = json.dumps(poly)


def scan_all_txt_files() -> list[str]:
    txt_dir = settings.dgn_source_path
    files = glob.glob(os.path.join(txt_dir, "dc*.txt"))
    files += glob.glob(os.path.join(txt_dir, "DC*.txt"))
    seen = set()
    unique = []
    for f in files:
        key = f.lower()
        if key not in seen:
            seen.add(key)
            unique.append(f)
    return sorted(unique)


def ensure_geometry_columns(db: Session) -> None:
    r = db.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='thuadat' AND column_name='geom'"
    ))
    if not r.fetchone():
        db.execute(text("SELECT AddGeometryColumn('thuadat', 'geom', 4326, 'POLYGON', 2)"))

    r = db.execute(text(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='thuadat' AND column_name='centroid'"
    ))
    if not r.fetchone():
        db.execute(text("SELECT AddGeometryColumn('thuadat', 'centroid', 4326, 'POINT', 2)"))

    db.execute(text(
        "CREATE INDEX IF NOT EXISTS spidx_thuadat_geom ON thuadat USING GIST (geom)"
    ))
    db.execute(text(
        "CREATE INDEX IF NOT EXISTS spidx_thuadat_centroid ON thuadat USING GIST (centroid)"
    ))
    db.commit()


def import_all_parcels(db: Session, limit_files: int = 0) -> ImportResult:
    ensure_geometry_columns(db)

    # Nullify FK references then clear parcels in single transaction
    db.execute(text("UPDATE hoso SET thuadatid = NULL WHERE thuadatid IS NOT NULL"))
    db.execute(text("DELETE FROM thuadat"))
    # ponytail: no intermediate commit — whole import is atomic

    txt_files = scan_all_txt_files()
    if limit_files > 0:
        txt_files = txt_files[:limit_files]
    result = ImportResult(total_txt_files=len(txt_files))

    all_parcels = []
    dgn_paths = []
    for txt_path in txt_files:
        try:
            parcels = parse_dc_txt(txt_path)
            all_parcels.extend(parcels)

            dgn_path = txt_path.replace(".txt", ".dgn")
            if os.path.exists(dgn_path):
                result.total_dgn_files += 1
                dgn_paths.append((parcels, dgn_path))
        except Exception as e:
            result.errors.append({"file": os.path.basename(txt_path), "error": str(e)})
            logger.error("Failed to parse %s: %s", txt_path, e)

    all_parcels = transform_centroids(all_parcels)

    ref_lons = [p.lon for p in all_parcels if p.lon != 0]
    ref_lats = [p.lat for p in all_parcels if p.lat != 0]
    for parcels, dgn_path in dgn_paths:
        try:
            polygons = extract_parcel_polygons(dgn_path, ref_lons, ref_lats)
            match_parcels_to_polygons(parcels, polygons)
        except Exception as e:
            result.errors.append({"file": os.path.basename(dgn_path), "error": str(e)})
            logger.error("Failed to extract polygons from %s: %s", dgn_path, e)

    result.total_parcels = len(all_parcels)
    result.parcels_with_polygon = sum(1 for p in all_parcels if p.polygon_geojson)

    for parcel in all_parcels:
        if parcel.lon == 0 or parcel.lat == 0:
            continue
        db.execute(text(
            "INSERT INTO thuadat (tobando, sothua, dientich, loai_dat, mdsd2003, "
            "ten_chu, dia_chi, xu_dong, geom, centroid) "
            "VALUES (:tobando, :sothua, :dientich, :loai_dat, :mdsd2003, "
            ":ten_chu, :dia_chi, :xu_dong, "
            "CASE WHEN :geom_json IS NOT NULL "
            "  THEN ST_SetSRID(ST_GeomFromGeoJSON(:geom_json), 4326) ELSE NULL END, "
            "ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))"
        ), {
            "tobando": parcel.to_ban_do,
            "sothua": str(parcel.so_thua),
            "dientich": parcel.dien_tich,
            "loai_dat": parcel.loai_dat,
            "mdsd2003": parcel.mdsd2003,
            "ten_chu": parcel.ten_chu,
            "dia_chi": parcel.dia_chi,
            "xu_dong": parcel.xu_dong,
            "geom_json": parcel.polygon_geojson,
            "lon": parcel.lon,
            "lat": parcel.lat,
        })

    db.commit()

    r = db.execute(text(
        "SELECT ST_XMin(ST_Collect(centroid)), ST_YMin(ST_Collect(centroid)), "
        "ST_XMax(ST_Collect(centroid)), ST_YMax(ST_Collect(centroid)), "
        "ST_X(ST_Centroid(ST_Collect(centroid))), "
        "ST_Y(ST_Centroid(ST_Collect(centroid))) FROM thuadat"
    ))
    row = r.fetchone()
    if row and row[0] is not None:
        result.bbox = {
            "min_lon": row[0], "min_lat": row[1],
            "max_lon": row[2], "max_lat": row[3],
        }
        result.center = {"lon": row[4], "lat": row[5]}

    return result


def get_parcels_geojson(
    db: Session,
    min_lon: float | None = None,
    min_lat: float | None = None,
    max_lon: float | None = None,
    max_lat: float | None = None,
    so_thua: int | None = None,
    to_ban_do: str | None = None,
    limit: int = 5000,
) -> dict:
    where_parts: list[str] = []
    params: dict = {}

    if all(v is not None for v in [min_lon, min_lat, max_lon, max_lat]):
        where_parts.append(
            "ST_Intersects(centroid, ST_MakeEnvelope(:min_lon, :min_lat, :max_lon, :max_lat, 4326))"
        )
        params.update({"min_lon": min_lon, "min_lat": min_lat, "max_lon": max_lon, "max_lat": max_lat})

    if so_thua is not None:
        where_parts.append("sothua = :sothua")
        params["sothua"] = str(so_thua)

    if to_ban_do is not None:
        where_parts.append("tobando = :tobando")
        params["tobando"] = to_ban_do

    where_clause = " AND ".join(where_parts) if where_parts else "TRUE"

    query = text(
        f"SELECT id, tobando, sothua, dientich, loai_dat, mdsd2003, "
        f"ten_chu, dia_chi, xu_dong, "
        f"ST_AsGeoJSON(COALESCE(geom, centroid)) as geojson "
        f"FROM thuadat WHERE {where_clause} LIMIT :limit"
    )
    params["limit"] = limit

    r = db.execute(query, params)

    features = []
    for row in r:
        geom = json.loads(row.geojson) if row.geojson else None
        if geom is None:
            continue
        features.append({
            "type": "Feature",
            "geometry": geom,
            "properties": {
                "id": row.id,
                "so_thua": row.sothua,
                "to_ban_do": row.tobando,
                "dien_tich": float(row.dientich) if row.dientich else 0,
                "loai_dat": row.loai_dat,
                "mdsd2003": row.mdsd2003,
                "ten_chu": row.ten_chu,
                "dia_chi": row.dia_chi,
                "xu_dong": row.xu_dong,
            },
        })

    return {"type": "FeatureCollection", "features": features}


def get_parcel_count(db: Session) -> int:
    r = db.execute(text("SELECT COUNT(*) FROM thuadat"))
    return r.fetchone()[0]


def get_map_center(db: Session) -> dict:
    r = db.execute(text(
        "SELECT ST_X(ST_Centroid(ST_Collect(centroid))), "
        "ST_Y(ST_Centroid(ST_Collect(centroid))) FROM thuadat"
    ))
    row = r.fetchone()
    if row and row[0] is not None:
        return {"lon": row[0], "lat": row[1]}
    return {"lon": 105.764167, "lat": 20.734079}
