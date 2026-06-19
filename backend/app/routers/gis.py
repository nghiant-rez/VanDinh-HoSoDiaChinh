"""GIS router for import/export endpoints."""
import logging
from fastapi import APIRouter, HTTPException, Depends
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


class ImportResponse(BaseModel):
    total_txt_files: int
    total_dgn_files: int
    total_parcels: int
    parcels_with_polygon: int
    errors: list
    bbox: dict
    center: dict


@router.get("/status")
def import_status(db: Session = Depends(get_db)):
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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN"])),
):
    """Import parcels from dc*.txt + dc*.dgn files into PostGIS.

    Set limit_files > 0 to import only the first N files (for testing).
    Default 0 = import all files.
    """
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
):
    """Get parcels as GeoJSON from PostGIS, optionally filtered by bbox or search."""
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
):
    """Export parcels as downloadable GeoJSON from PostGIS."""
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
def get_center(db: Session = Depends(get_db)):
    """Get the calculated center of all parcels from PostGIS."""
    return get_map_center(db)
