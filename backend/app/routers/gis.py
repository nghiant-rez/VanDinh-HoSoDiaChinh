"""GIS router for import/export endpoints."""
import logging
from fastapi import APIRouter, HTTPException, Depends, Header
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.dependencies import get_db, require_roles
from app.models import User
from app.services.gis_service import (
    import_all_parcels,
    get_parcels_geojson,
    get_parcel_count,
    get_map_center,
    scan_all_txt_files,
)
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/gis", tags=["gis"])
GIS_IMPORT_CONFIRMATION = "NHAP LAI TOAN BO"


def is_import_confirmed(value: str | None) -> bool:
    return value is not None and value.strip().upper() == GIS_IMPORT_CONFIRMATION


class ImportResponse(BaseModel):
    total_txt_files: int
    total_dgn_files: int
    total_parcels: int
    parcels_with_polygon: int
    errors: list
    bbox: dict
    center: dict


@router.get("/status")
def import_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
):
    """Check import status and cached data in PostGIS."""
    count = get_parcel_count(db)
    return {
        "parcels_in_db": count,
        "source_path": settings.dgn_source_path,
        "txt_files_found": len(scan_all_txt_files()),
    }


@router.post("/import", response_model=ImportResponse)
def import_parcels(
    limit_files: int = 0,
    x_confirm_replace: str | None = Header(None, alias="X-Confirm-Replace"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"])),
):
    """Import parcels from dc*.txt + dc*.dgn files into PostGIS."""
    if limit_files < 0:
        raise HTTPException(status_code=400, detail="limit_files must be >= 0")
    if not is_import_confirmed(x_confirm_replace):
        raise HTTPException(
            status_code=400,
            detail=f"Missing destructive import confirmation: {GIS_IMPORT_CONFIRMATION}",
        )
    try:
        result = import_all_parcels(db, limit_files=limit_files)
        logger.info(
            "Imported %d parcels (%d with polygons) from %d TXT + %d DGN files",
            result.total_parcels, result.parcels_with_polygon,
            result.total_txt_files, result.total_dgn_files,
        )
        return ImportResponse(
            total_txt_files=result.total_txt_files,
            total_dgn_files=result.total_dgn_files,
            total_parcels=result.total_parcels,
            parcels_with_polygon=result.parcels_with_polygon,
            errors=result.errors,
            bbox=result.bbox,
            center=result.center,
        )
    except Exception as e:
        db.rollback()
        logger.error("Import failed: %s", e)
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/parcels")
def get_parcels(
    min_lon: float | None = None,
    min_lat: float | None = None,
    max_lon: float | None = None,
    max_lat: float | None = None,
    so_thua: int | None = None,
    to_ban_do: str | None = None,
    limit: int = 5000,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
):
    """Get parcels as GeoJSON from PostGIS, optionally filtered by bbox or search."""
    if limit < 1 or limit > 50000:
        raise HTTPException(status_code=400, detail="limit must be between 1 and 50000")
    for lat_val in (min_lat, max_lat):
        if lat_val is not None and not -90 <= lat_val <= 90:
            raise HTTPException(status_code=400, detail="lat must be between -90 and 90")
    for lon_val in (min_lon, max_lon):
        if lon_val is not None and not -180 <= lon_val <= 180:
            raise HTTPException(status_code=400, detail="lon must be between -180 and 180")

    count = get_parcel_count(db)
    if count == 0:
        raise HTTPException(
            status_code=404,
            detail="No parcels in database. Call POST /api/gis/import first."
        )

    return get_parcels_geojson(
        db,
        min_lon=min_lon,
        min_lat=min_lat,
        max_lon=max_lon,
        max_lat=max_lat,
        so_thua=so_thua,
        to_ban_do=to_ban_do,
        limit=limit,
    )


@router.get("/export")
def export_parcels(
    min_lon: float | None = None,
    min_lat: float | None = None,
    max_lon: float | None = None,
    max_lat: float | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
):
    """Export parcels as downloadable GeoJSON from PostGIS."""
    for lat_val in (min_lat, max_lat):
        if lat_val is not None and not -90 <= lat_val <= 90:
            raise HTTPException(status_code=400, detail="lat must be between -90 and 90")
    for lon_val in (min_lon, max_lon):
        if lon_val is not None and not -180 <= lon_val <= 180:
            raise HTTPException(status_code=400, detail="lon must be between -180 and 180")

    count = get_parcel_count(db)
    if count == 0:
        raise HTTPException(
            status_code=404,
            detail="No parcels in database. Call POST /api/gis/import first."
        )

    geojson = get_parcels_geojson(
        db,
        min_lon=min_lon,
        min_lat=min_lat,
        max_lon=max_lon,
        max_lat=max_lat,
        limit=100000,
    )

    return JSONResponse(
        content=geojson,
        headers={
            "Content-Disposition": 'attachment; filename="vandinh_parcels.geojson"',
        },
    )


@router.get("/center")
def get_center(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
):
    """Get the calculated center of all parcels from PostGIS."""
    return get_map_center(db)
