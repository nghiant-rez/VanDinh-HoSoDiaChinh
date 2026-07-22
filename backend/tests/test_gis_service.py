import json
import unittest

from app.services.gis_service import ParcelRecord, match_parcels_to_polygons


def parcel(so_thua: int, lon: float, lat: float) -> ParcelRecord:
    return ParcelRecord(
        so_thua=so_thua,
        to_ban_do="27",
        tam_x=0,
        tam_y=0,
        dien_tich=100,
        loai_dat="LUC",
        mdsd2003="LUC",
        ten_chu="",
        dia_chi="",
        xu_dong="",
        lon=lon,
        lat=lat,
    )


class GeometrySourceTests(unittest.TestCase):
    def test_tracks_dgn_polygon_and_area_estimate(self) -> None:
        matched = parcel(1, 105.77, 20.73)
        unmatched = parcel(2, 105.78, 20.74)
        dgn_polygon = {
            "type": "Polygon",
            "coordinates": [[
                [105.7699, 20.7299],
                [105.7701, 20.7299],
                [105.7701, 20.7301],
                [105.7699, 20.7301],
                [105.7699, 20.7299],
            ]],
        }

        match_parcels_to_polygons([matched, unmatched], [dgn_polygon])

        self.assertEqual(matched.geometry_source, "dgn_polygon")
        self.assertEqual(json.loads(matched.polygon_geojson or "{}"), dgn_polygon)
        self.assertEqual(unmatched.geometry_source, "area_estimate")
        self.assertEqual(json.loads(unmatched.polygon_geojson or "{}")["type"], "Polygon")

    def test_no_geometry_stays_centroid_only(self) -> None:
        point_only = parcel(3, 105.79, 20.75)

        match_parcels_to_polygons([point_only], [])

        self.assertEqual(point_only.geometry_source, "centroid_only")
        self.assertIsNone(point_only.polygon_geojson)


if __name__ == "__main__":
    unittest.main()
