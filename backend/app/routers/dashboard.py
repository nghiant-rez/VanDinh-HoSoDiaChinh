from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import desc

from app.dependencies import get_db, require_roles
from app.models import HoSo, ThuaDat, KhoLuuTru, KeLuuTru, TangLuuTru, HopSoLuuTru, User
from app.schemas import DashboardStatsResponse, StorageStats

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard"]
)

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"]))
):
    total_hoso = db.query(HoSo).count()
    total_thuadat = db.query(ThuaDat).count()
    
    storage_kho = db.query(KhoLuuTru).count()
    storage_ke = db.query(KeLuuTru).count()
    storage_tang = db.query(TangLuuTru).count()
    storage_hop = db.query(HopSoLuuTru).count()
    
    recent_activities = db.query(HoSo).options(
        selectinload(HoSo.attachments),
        selectinload(HoSo.thua_dat),
        selectinload(HoSo.kho_luu_tru),
        selectinload(HoSo.ke_luu_tru),
        selectinload(HoSo.tang_luu_tru),
        selectinload(HoSo.hop_so)
    ).order_by(desc(HoSo.id)).limit(5).all()
    
    return {
        "total_hoso": total_hoso,
        "total_thuadat": total_thuadat,
        "storage_stats": {
            "kho": storage_kho,
            "ke": storage_ke,
            "tang": storage_tang,
            "hop": storage_hop
        },
        "recent_activities": recent_activities
    }
