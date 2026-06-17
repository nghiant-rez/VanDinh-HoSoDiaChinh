from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from typing import List

from app.dependencies import get_db, require_roles
from app.models import User, KhoLuuTru, KeLuuTru, TangLuuTru, HopSoLuuTru
from app.schemas import (
    KhoLuuTruTreeResponse, KhoLuuTruCreate,
    KeLuuTruCreate, KeLuuTruResponse,
    TangLuuTruCreate, TangLuuTruResponse,
    HopSoLuuTruCreate, HopSoLuuTruResponse
)

router = APIRouter(prefix="/api/storage", tags=["Physical Storage"])

# 1. API Xem cây: STAFF và ADMIN đều xem được
@router.get("/tree", response_model=List[KhoLuuTruTreeResponse])
def get_storage_tree(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"]))
):
    kho_list = (
        db.query(KhoLuuTru)
        .options(
            selectinload(KhoLuuTru.kes)
            .selectinload(KeLuuTru.tangs)
            .selectinload(TangLuuTru.hop_sos)
        )
        .all()
    )
    return kho_list

# ==========================
# KHO LƯU TRỮ (Chỉ ADMIN)
# ==========================
@router.post("/kho", response_model=KhoLuuTruTreeResponse)
def create_kho(
    kho_data: KhoLuuTruCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["ADMIN"]))
):
    new_kho = KhoLuuTru(makho=kho_data.makho, tenkho=kho_data.tenkho)
    db.add(new_kho)
    db.commit()
    db.refresh(new_kho)
    return new_kho

@router.delete("/kho/{kho_id}")
def delete_kho(
    kho_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["ADMIN"]))
):
    so_luong_ke = db.query(KeLuuTru).filter(KeLuuTru.kholuutruid == kho_id).count()
    if so_luong_ke > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa Kho lưu trữ vì đang chứa các Kệ bên trong."
        )
        
    kho = db.query(KhoLuuTru).filter(KhoLuuTru.id == kho_id).first()
    if not kho:
        raise HTTPException(status_code=404, detail="Kho không tồn tại")
        
    db.delete(kho)
    db.commit()
    return {"message": "Đã xóa kho thành công"}

# ==========================
# KỆ LƯU TRỮ (Chỉ ADMIN)
# ==========================
@router.post("/ke", response_model=KeLuuTruResponse)
def create_ke(
    ke_data: KeLuuTruCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["ADMIN"]))
):
    new_ke = KeLuuTru(kholuutruid=ke_data.kholuutruid, tenke=ke_data.tenke)
    db.add(new_ke)
    db.commit()
    db.refresh(new_ke)
    return new_ke

@router.delete("/ke/{ke_id}")
def delete_ke(
    ke_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["ADMIN"]))
):
    so_luong_tang = db.query(TangLuuTru).filter(TangLuuTru.keluutruid == ke_id).count()
    if so_luong_tang > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa Kệ lưu trữ vì đang chứa Tầng bên trong."
        )
        
    ke = db.query(KeLuuTru).filter(KeLuuTru.id == ke_id).first()
    if not ke:
        raise HTTPException(status_code=404, detail="Kệ không tồn tại")
        
    db.delete(ke)
    db.commit()
    return {"message": "Đã xóa kệ thành công"}

# ==========================
# TẦNG LƯU TRỮ (Chỉ ADMIN)
# ==========================
@router.post("/tang", response_model=TangLuuTruResponse)
def create_tang(
    tang_data: TangLuuTruCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["ADMIN"]))
):
    new_tang = TangLuuTru(keluutruid=tang_data.keluutruid, tentang=tang_data.tentang)
    db.add(new_tang)
    db.commit()
    db.refresh(new_tang)
    return new_tang

@router.delete("/tang/{tang_id}")
def delete_tang(
    tang_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["ADMIN"]))
):
    so_luong_hop = db.query(HopSoLuuTru).filter(HopSoLuuTru.tangluutruid == tang_id).count()
    if so_luong_hop > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Không thể xóa Tầng lưu trữ vì đang chứa Hộp số."
        )
        
    tang = db.query(TangLuuTru).filter(TangLuuTru.id == tang_id).first()
    if not tang:
        raise HTTPException(status_code=404, detail="Tầng không tồn tại")
        
    db.delete(tang)
    db.commit()
    return {"message": "Đã xóa tầng thành công"}

# ==========================
# HỘP SỐ LƯU TRỮ (Chỉ ADMIN)
# ==========================
@router.post("/hopso", response_model=HopSoLuuTruResponse)
def create_hopso(
    hopso_data: HopSoLuuTruCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["ADMIN"]))
):
    new_hopso = HopSoLuuTru(tangluutruid=hopso_data.tangluutruid, tenhopso=hopso_data.tenhopso)
    db.add(new_hopso)
    db.commit()
    db.refresh(new_hopso)
    return new_hopso

@router.delete("/hopso/{hopso_id}")
def delete_hopso(
    hopso_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["ADMIN"]))
):
    hopso = db.query(HopSoLuuTru).filter(HopSoLuuTru.id == hopso_id).first()
    if not hopso:
        raise HTTPException(status_code=404, detail="Hộp số không tồn tại")
        
    db.delete(hopso)
    db.commit()
    return {"message": "Đã xóa hộp số thành công"}
