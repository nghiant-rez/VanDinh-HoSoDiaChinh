import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, storage, hoso
from app.routers import gis
from app.database import engine, Base
from app import models  # ensure all models registered before create_all

Base.metadata.create_all(bind=engine)

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Hồ Sơ Địa Chính API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(storage.router)
app.include_router(hoso.router)
app.include_router(gis.router)

@app.get("/api/health")
def health():
    return {"status": "ok"}
