from sqlalchemy import create_engine, text
engine = create_engine('postgresql://postgres:123@localhost:5432/vandinh')
with engine.connect() as conn:
    cols = [
        "thuadatid BIGINT REFERENCES thuadat(id)",
        "duanid INTEGER REFERENCES duan(id)",
        "kholuutruid INTEGER REFERENCES kholuutru(id)",
        "keluutruid INTEGER REFERENCES keluutru(id)",
        "tangluutruid INTEGER REFERENCES tangluutru(id)",
        "createdbyuserid BIGINT REFERENCES users(id)"
    ]
    for c in cols:
        try:
            col_name = c.split()[0]
            conn.execute(text(f"ALTER TABLE hoso ADD COLUMN {c};"))
            print(f"Added {col_name}")
        except Exception as e:
            print(f"Skipped {c}: {e}")
    conn.commit()
