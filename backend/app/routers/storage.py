from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from typing import List

from app.dependencies import get_db, require_roles
from app.models import User, KhoLuuTru, KeLuuTru, TangLuuTru, HopSoLuuTru, HoSo
from app.schemas import (
    KhoLuuTruTreeResponse, KhoLuuTruCreate, KhoLuuTruUpdate,
    KeLuuTruCreate, KeLuuTruResponse, KeLuuTruUpdate,
    TangLuuTruCreate, TangLuuTruResponse, TangLuuTruUpdate,
    HopSoLuuTruCreate, HopSoLuuTruResponse, HopSoLuuTruUpdate
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
            .selectinload(HopSoLuuTru.ho_sos)
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
    # Tạo kho mới
    new_kho = KhoLuuTru(makho=kho_data.makho, tenkho=kho_data.tenkho)
    db.add(new_kho)
    db.flush() # Flush để lấy id của kho mới
    
    # Khởi tạo 4 kệ mặc định, mỗi kệ 4 tầng
    for i in range(1, 5):
        new_ke = KeLuuTru(kholuutruid=new_kho.id, tenke=f"Kệ {i}")
        db.add(new_ke)
        db.flush() # Lấy id của kệ vừa tạo
        for j in range(1, 5):
            db.add(TangLuuTru(keluutruid=new_ke.id, tentang=f"Tầng {j}"))
        
    db.commit()
    db.refresh(new_kho)
    return new_kho

@router.put("/kho/{kho_id}", response_model=KhoLuuTruTreeResponse)
def update_kho(
    kho_id: int,
    kho_data: KhoLuuTruUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["ADMIN"]))
):
    kho = db.query(KhoLuuTru).filter(KhoLuuTru.id == kho_id).first()
    if not kho:
        raise HTTPException(status_code=404, detail="Kho không tồn tại")
        
    if kho_data.makho is not None:
        kho.makho = kho_data.makho
    if kho_data.tenkho is not None:
        kho.tenkho = kho_data.tenkho
        
    db.commit()
    db.refresh(kho)
    return kho


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
    db.flush()
    
    # Khởi tạo 4 tầng mặc định cho kệ mới
    for j in range(1, 5):
        db.add(TangLuuTru(keluutruid=new_ke.id, tentang=f"Tầng {j}"))
        
    db.commit()
    db.refresh(new_ke)
    return new_ke

@router.put("/ke/{ke_id}", response_model=KeLuuTruResponse)
def update_ke(
    ke_id: int,
    ke_data: KeLuuTruUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["ADMIN"]))
):
    ke = db.query(KeLuuTru).filter(KeLuuTru.id == ke_id).first()
    if not ke:
        raise HTTPException(status_code=404, detail="Kệ không tồn tại")
        
    if ke_data.tenke is not None:
        ke.tenke = ke_data.tenke
        
    db.commit()
    db.refresh(ke)
    return ke


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

@router.put("/tang/{tang_id}", response_model=TangLuuTruResponse)
def update_tang(
    tang_id: int,
    tang_data: TangLuuTruUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["ADMIN"]))
):
    tang = db.query(TangLuuTru).filter(TangLuuTru.id == tang_id).first()
    if not tang:
        raise HTTPException(status_code=404, detail="Tầng không tồn tại")
        
    if tang_data.tentang is not None:
        tang.tentang = tang_data.tentang
        
    db.commit()
    db.refresh(tang)
    return tang


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

@router.put("/hopso/{hopso_id}", response_model=HopSoLuuTruResponse)
def update_hopso(
    hopso_id: int,
    hopso_data: HopSoLuuTruUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["ADMIN"]))
):
    hopso = db.query(HopSoLuuTru).filter(HopSoLuuTru.id == hopso_id).first()
    if not hopso:
        raise HTTPException(status_code=404, detail="Hộp số không tồn tại")
        
    if hopso_data.tenhopso is not None:
        hopso.tenhopso = hopso_data.tenhopso
        
    db.commit()
    db.refresh(hopso)
    return hopso


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
