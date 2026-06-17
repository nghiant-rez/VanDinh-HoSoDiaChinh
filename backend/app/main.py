from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import storage
from app.database import engine, Base

# Tạo bảng CSDL (Nên dùng migration script trong thực tế)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Van Dinh Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(storage.router)

@app.get("/api/health")
def health():
    return {"status": "ok"}
