from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://localhost:5432/vandinh"
    upload_dir: str = "data/uploads"
    ocr_lang: str = "vietnamese"

    # GIS / DGN data source
    dgn_source_path: str = r"E:\Ban Do\Ban do V8\BDDC TT Van Dinh"
    gdal_bin_path: str = r"E:\OSGeo4W\bin"

    # VN-2000 TM-3 with central meridian 105.00 degrees
    # No standard EPSG code; must use custom PROJ string
    source_proj: str = (
        "+proj=tmerc +lat_0=0 +lon_0=105.00 +k=0.9999 "
        "+x_0=500000 +y_0=0 +datum=WGS84 +units=m +no_defs"
    )

    model_config = {"env_file": ".env"}


settings = Settings()
