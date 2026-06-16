from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "postgresql://localhost:5432/vandinh"
    upload_dir: str = "data/uploads"
    ocr_lang: str = "vietnamese"

    model_config = {"env_file": ".env"}


settings = Settings()
