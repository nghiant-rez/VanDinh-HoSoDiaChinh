from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func
from typing import List

from app.dependencies import get_db, require_roles
from app.models import HoSo, Attachments, ThuaDat
from app.schemas import HoSoSearchRequest, HoSoResponse, HoSoCreate, HoSoLineageResponse

router = APIRouter(
    prefix="/api/hoso",
    tags=["HoSo Dossier Search"]
)

@router.post("/search", response_model=List[HoSoResponse])
def search_hoso(
    request: HoSoSearchRequest,
    db: Session = Depends(get_db),
    user_roles: list = Depends(require_roles(["ADMIN", "STAFF"]))
):
    query = db.query(HoSo).options(
        selectinload(HoSo.attachments),
        selectinload(HoSo.thua_dat),
        selectinload(HoSo.kho_luu_tru),
        selectinload(HoSo.ke_luu_tru),
        selectinload(HoSo.tang_luu_tru),
        selectinload(HoSo.hop_so)
    )
    
    # Lọc theo nhiều Loại hồ sơ cùng lúc (checkbox tree)
    if request.loaihosoids:
        query = query.filter(HoSo.loaihosoid.in_(request.loaihosoids))
    elif request.loaihosoid:
        query = query.filter(HoSo.loaihosoid == request.loaihosoid)
        
    # Lọc theo tờ bản đồ & số thửa
    if request.tobando or request.sothua:
        query = query.join(HoSo.thua_dat)
        if request.tobando:
            query = query.filter(ThuaDat.tobando.ilike(f"%{request.tobando}%"))
        if request.sothua:
            query = query.filter(ThuaDat.sothua.ilike(f"%{request.sothua}%"))
            
    # Lọc theo vị trí lưu trữ (Drill-down)
    if request.kholuutruid:
        query = query.filter(HoSo.kholuutruid == request.kholuutruid)
    if request.keluutruid:
        query = query.filter(HoSo.keluutruid == request.keluutruid)
    if request.tangluutruid:
        query = query.filter(HoSo.tangluutruid == request.tangluutruid)
    if request.hopsoluutruid:
        query = query.filter(HoSo.hopsoluutruid == request.hopsoluutruid)
        
    # Full-Text Search trên nội dung OCR (Bảng Attachments) sử dụng PostgreSQL GIN Index
    if request.query and request.query.strip():
        search_term = request.query.strip()
        
        # Tạo expression khớp với GIN Index đã định nghĩa: to_tsvector('simple', OcrExtractedText)
        tsvector_expr = func.to_tsvector('simple', Attachments.ocrextractedtext)
        tsquery_expr = func.websearch_to_tsquery('simple', search_term)
        
        # JOIN bảng Attachments để tìm những Hồ Sơ có chứa file scan thỏa mãn
        query = query.join(Attachments).filter(
            tsvector_expr.op('@@')(tsquery_expr)
        )
        
    query = query.offset(request.offset).limit(request.limit)
    
    return query.all()

@router.get("/{hoso_id}", response_model=HoSoResponse)
def get_hoso(
    hoso_id: int,
    db: Session = Depends(get_db),
    user_roles: list = Depends(require_roles(["ADMIN", "STAFF"]))
):
    hoso = db.query(HoSo).options(
        selectinload(HoSo.attachments),
        selectinload(HoSo.thua_dat),
        selectinload(HoSo.kho_luu_tru),
        selectinload(HoSo.ke_luu_tru),
        selectinload(HoSo.tang_luu_tru),
        selectinload(HoSo.hop_so)
    ).filter(HoSo.id == hoso_id).first()
    if not hoso:
        raise HTTPException(status_code=404, detail="Hồ sơ không tồn tại")
    return hoso

@router.post("", response_model=HoSoResponse)
def create_hoso(
    request: HoSoCreate,
    db: Session = Depends(get_db),
    user_roles: list = Depends(require_roles(["ADMIN", "STAFF"]))
):
    # Retrieve current user ID from somewhere. Since require_roles doesn't directly return the user in this setup easily without changing dependencies, we hardcode to 1 for demo or extract from header.
    # We will just use 1 as createdbyuserid for now.
    user_id = 1
    
    # Handle ThuaDat
    thuadat_id = None
    if request.tobando and request.sothua:
        # Check if ThuaDat exists
        thuadat = db.query(ThuaDat).filter(
            ThuaDat.tobando == request.tobando,
            ThuaDat.sothua == request.sothua
        ).first()
        
        if not thuadat:
            thuadat = ThuaDat(
                tobando=request.tobando,
                sothua=request.sothua,
                dientich=request.dientich or 0
            )
            db.add(thuadat)
            db.flush() # flush to get ID
        
        thuadat_id = thuadat.id

    new_hoso = HoSo(
        idcha=request.idcha,
        mahoso=request.mahoso,
        tenhoso=request.tenhoso,
        loaihosoid=request.loaihosoid,
        thuadatid=thuadat_id,
        duanid=request.duanid,
        kholuutruid=request.kholuutruid,
        keluutruid=request.keluutruid,
        tangluutruid=request.tangluutruid,
        hopsoluutruid=request.hopsoluutruid,
        chusohuu=request.chusohuu,
        trangthai=request.trangthai,
        createdbyuserid=user_id
    )
    db.add(new_hoso)
    db.commit()
    db.refresh(new_hoso)
    
    return new_hoso

@router.get("/{hoso_id}/lineage", response_model=HoSoLineageResponse)
def get_hoso_lineage(
    hoso_id: int,
    db: Session = Depends(get_db),
    user_roles: list = Depends(require_roles(["ADMIN", "STAFF"]))
):
    current_hoso = db.query(HoSo).filter(HoSo.id == hoso_id).first()
    if not current_hoso:
        raise HTTPException(status_code=404, detail="Hồ sơ không tồn tại")
        
    parent = None
    if current_hoso.idcha:
        parent = db.query(HoSo).filter(HoSo.id == current_hoso.idcha).first()
        
    children = db.query(HoSo).filter(HoSo.idcha == hoso_id).all()
    
    return {
        "parent": parent,
        "children": children
    }

