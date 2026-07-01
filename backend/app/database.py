from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import time

from app.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Retry DB connection on startup — PostgreSQL service may still be initializing
for _attempt in range(5):
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
            conn.commit()
        break
    except Exception:
        print(f"DB not ready, retrying in 2s... (attempt {_attempt + 1}/5)")
        time.sleep(2)
else:
    raise RuntimeError("Cannot connect to PostgreSQL after 5 retries. Is the service running?")
