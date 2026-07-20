import unittest
from unittest.mock import Mock, patch

from fastapi import HTTPException

from app.routers.gis import import_parcels


class GisImportConfirmationTests(unittest.TestCase):
    def test_route_rejects_before_import_service_runs(self) -> None:
        with patch("app.routers.gis.import_all_parcels") as import_mock:
            with self.assertRaises(HTTPException) as raised:
                import_parcels(
                    limit_files=0,
                    x_confirm_replace=None,
                    db=Mock(),
                    current_user=Mock(),
                )

        self.assertEqual(raised.exception.status_code, 400)
        import_mock.assert_not_called()


if __name__ == "__main__":
    unittest.main()
