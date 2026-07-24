"""Read-only smoke test for 10 real parcels in configured PostGIS."""

from pathlib import Path
import sys

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import settings
from app.services.gis_service import get_parcels_geojson


def main() -> None:
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    with Session(engine) as db:
        db.execute(text("SET TRANSACTION READ ONLY"))
        known = db.execute(text(
            "SELECT id, tobando, sothua FROM thuadat "
            "WHERE sothua ~ '^[0-9]+$' ORDER BY id LIMIT 10"
        )).all()
        if len(known) != 10:
            raise AssertionError(f"Expected 10 known parcels, found {len(known)}")

        for row in known:
            result = get_parcels_geojson(
                db,
                to_ban_do=row.tobando,
                so_thua=int(row.sothua),
                limit=100,
            )
            matches = [
                feature for feature in result["features"]
                if feature["properties"]["id"] == row.id
            ]
            if len(matches) != 1:
                raise AssertionError(
                    f"Parcel {row.tobando}/{row.sothua} id={row.id} returned {len(matches)} matches"
                )
            if matches[0]["geometry"]["type"] not in {"Point", "Polygon", "MultiPolygon"}:
                raise AssertionError(f"Parcel id={row.id} has unsupported geometry")

        db.rollback()
    engine.dispose()
    print("Verified 10 live parcels through read-only GeoJSON search.")


if __name__ == "__main__":
    main()
