import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import auth, storage, hoso
from app.routers import gis, dashboard, sync
from app.database import engine, Base
from app import models  # ensure all models registered before create_all

Base.metadata.create_all(bind=engine)

os.makedirs("uploads", exist_ok=True)

logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Hồ Sơ Địa Chính API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(storage.router)
app.include_router(hoso.router)
app.include_router(gis.router)
app.include_router(dashboard.router)
app.include_router(sync.router)

app.mount("/static/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.get("/api/health")
def health():
    return {"status": "ok"}
