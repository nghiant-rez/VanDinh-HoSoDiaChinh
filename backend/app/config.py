import os
import glob
import logging

from pydantic_settings import BaseSettings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _autodetect_dgn_path() -> str:
    """Scan drives for Ban Do subfolder with 50+ dc*.txt files."""
    for drive in ["E:", "D:", "C:", "F:"]:
        root = rf"{drive}\Ban Do"
        if not os.path.isdir(root):
            continue
        for dirpath, _dirs, _files in os.walk(root):
            txt_files = glob.glob(os.path.join(dirpath, "dc*.txt"))
            if len(txt_files) >= 50:
                logger.info("Auto-detected DGN source: %s (%d txt files)", dirpath, len(txt_files))
                return dirpath
    return ""


class Settings(BaseSettings):
    database_url: str = "postgresql://localhost:5432/vandinh"
    upload_dir: str = "data/uploads"
    ocr_lang: str = "vietnamese"

    # GIS / DGN data source
    dgn_source_path: str = r"E:\Ban Do\Ban do V7\BDDC TT Van Dinh"
    gdal_bin_path: str = r"E:\OSGeo4W\bin"

    # VN-2000 TM-3 with central meridian 105.00 degrees
    # No standard EPSG code; must use custom PROJ string
    source_proj: str = (
        "+proj=tmerc +lat_0=0 +lon_0=105.00 +k=0.9999 "
        "+x_0=500000 +y_0=0 +datum=WGS84 +units=m +no_defs"
    )

    model_config = {"env_file": ".env"}


settings = Settings()

# Auto-detect DGN source if the configured path doesn't exist
if not os.path.isdir(settings.dgn_source_path) or not glob.glob(
    os.path.join(settings.dgn_source_path, "dc*.txt")
):
    detected = _autodetect_dgn_path()
    if detected:
        settings.dgn_source_path = detected
    else:
        logger.warning(
            "DGN source path not found: %s. Set DGN_SOURCE_PATH in backend/.env",
            settings.dgn_source_path,
        )
