import os
from sqlalchemy import create_engine, text

db_url = os.getenv("DATABASE_URL", "postgresql://postgres:123456@localhost:5432/vandinh")
engine = create_engine(db_url)
with engine.connect() as conn:
    cols = [
        "thuadatid BIGINT REFERENCES thuadat(id)",
        "duanid INTEGER REFERENCES duan(id)",
        "kholuutruid INTEGER REFERENCES kholuutru(id)",
        "keluutruid INTEGER REFERENCES keluutru(id)",
        "tangluutruid INTEGER REFERENCES tangluutru(id)",
        "createdbyuserid BIGINT REFERENCES users(id)"
    ]
    for col_def in cols:
        col_name = col_def.split()[0]
        try:
            conn.execute(text(f"ALTER TABLE hoso ADD COLUMN {col_name} {col_def.split(' ', 1)[1]}"))
            print(f"Added {col_name}")
        except Exception as e:
            print(f"Skipped {col_def}: {e}")
    conn.commit()
