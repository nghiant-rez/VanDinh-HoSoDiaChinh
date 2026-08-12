from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
import io
import os
import shutil
import pandas as pd
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from typing import List

from app.dependencies import get_db, require_roles
from app.models import HoSo, Attachments, ThuaDat, User
from app.schemas import HoSoSearchRequest, HoSoResponse, HoSoSearchResponse, HoSoCreate, HoSoUpdate, HoSoLineageResponse

router = APIRouter(
    prefix="/api/hoso",
    tags=["HoSo Dossier Search"]
)

@router.post("/search", response_model=HoSoSearchResponse)
def search_hoso(
    request: HoSoSearchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
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
            
    # Lọc theo chủ sở hữu
    if request.chusohuu:
        query = query.filter(HoSo.chusohuu.ilike(f"%{request.chusohuu}%"))
        
    # Lọc theo Năm
    if request.nam:
        query = query.filter(HoSo.nam == request.nam)
            
    # Lọc theo vị trí lưu trữ (Drill-down)
    if request.kholuutruid:
        query = query.filter(HoSo.kholuutruid == request.kholuutruid)
    if request.keluutruid:
        query = query.filter(HoSo.keluutruid == request.keluutruid)
    if request.tangluutruid:
        query = query.filter(HoSo.tangluutruid == request.tangluutruid)
    if request.hopsoluutruid:
        query = query.filter(HoSo.hopsoluutruid == request.hopsoluutruid)
        
    # Tìm kiếm theo Mã hồ sơ, Tên hồ sơ hoặc Nội dung OCR (Bảng Attachments)
    if request.query and request.query.strip():
        search_term = request.query.strip()
        
        # Tạo expression khớp với GIN Index đã định nghĩa: to_tsvector('simple', OcrExtractedText)
        tsvector_expr = func.to_tsvector('simple', Attachments.ocrextractedtext)
        tsquery_expr = func.websearch_to_tsquery('simple', search_term)
        
        # JOIN bảng Attachments để tìm những Hồ Sơ có chứa file scan thỏa mãn hoặc tên/mã hồ sơ khớp
        query = query.outerjoin(Attachments).filter(
            or_(
                HoSo.mahoso.ilike(f"%{search_term}%"),
                HoSo.tenhoso.ilike(f"%{search_term}%"),
                tsvector_expr.op('@@')(tsquery_expr)
            )
        ).distinct()
        
    total = query.count()
    items = query.offset(request.offset).limit(request.limit).all()
    
    return {"items": items, "total": total}

@router.get("/{hoso_id}", response_model=HoSoResponse)
def get_hoso(
    hoso_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
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
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
):
    user_id = current_user.id

    # Handle ThuaDat
    thuadat_id = None
    if request.tobando and request.sothua:
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
            try:
                db.flush()
            except IntegrityError:
                db.rollback()
                thuadat = db.query(ThuaDat).filter(
                    ThuaDat.tobando == request.tobando,
                    ThuaDat.sothua == request.sothua
                ).first()
                if not thuadat:
                    raise HTTPException(
                        status_code=500,
                        detail="Loi tao thua dat va khong tim thay ban ghi ton tai",
                    )

        thuadat_id = thuadat.id

    # Handle idcha from mahoso_cha
    idcha = None
    if request.mahoso_cha:
        parent_hoso = db.query(HoSo).filter(HoSo.mahoso == request.mahoso_cha).first()
        if not parent_hoso:
            raise HTTPException(status_code=400, detail=f"Không tìm thấy hồ sơ gốc có mã '{request.mahoso_cha}'")
        idcha = parent_hoso.id

    try:
        new_hoso = HoSo(
            idcha=idcha,
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
            thon=request.thon,
            trangthai=request.trangthai,
            ghichu=request.ghichu,
            nam=request.nam,
            createdbyuserid=user_id
        )
        db.add(new_hoso)
        db.commit()
        db.refresh(new_hoso)
        return new_hoso
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Mã hồ sơ đã tồn tại hoặc vi phạm ràng buộc dữ liệu.")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Lỗi hệ thống: {str(e)}")

@router.put("/{hoso_id}", response_model=HoSoResponse)
def update_hoso(
    hoso_id: int,
    request: HoSoUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
):
    hoso = db.query(HoSo).filter(HoSo.id == hoso_id).first()
    if not hoso:
        raise HTTPException(status_code=404, detail="Hồ sơ không tồn tại")

    # Handle ThuaDat update if needed
    if request.tobando is not None or request.sothua is not None:
        tobando = request.tobando if request.tobando is not None else (hoso.thua_dat.tobando if hoso.thua_dat else None)
        sothua = request.sothua if request.sothua is not None else (hoso.thua_dat.sothua if hoso.thua_dat else None)
        dientich = request.dientich if request.dientich is not None else (hoso.thua_dat.dientich if hoso.thua_dat else 0)
        
        if tobando and sothua:
            thuadat = db.query(ThuaDat).filter(
                ThuaDat.tobando == tobando,
                ThuaDat.sothua == sothua
            ).first()
            if not thuadat:
                thuadat = ThuaDat(tobando=tobando, sothua=sothua, dientich=dientich)
                db.add(thuadat)
                db.flush()
            hoso.thuadatid = thuadat.id

    if request.mahoso_cha is not None:
        if request.mahoso_cha == "":
            hoso.idcha = None
        else:
            parent_hoso = db.query(HoSo).filter(HoSo.mahoso == request.mahoso_cha).first()
            if not parent_hoso:
                raise HTTPException(status_code=400, detail=f"Không tìm thấy hồ sơ gốc có mã '{request.mahoso_cha}'")
            hoso.idcha = parent_hoso.id

    update_data = request.dict(exclude_unset=True, exclude={'tobando', 'sothua', 'dientich', 'mahoso_cha'})
    for key, value in update_data.items():
        setattr(hoso, key, value)

    db.commit()
    db.refresh(hoso)
    return hoso

@router.delete("/{hoso_id}")
def delete_hoso(
    hoso_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_roles(["ADMIN", "STAFF"])),
):
    hoso = db.query(HoSo).filter(HoSo.id == hoso_id).first()
    if not hoso:
        raise HTTPException(status_code=404, detail="Hồ sơ không tồn tại")
    
    # Also delete attachments folder
    upload_dir = os.path.join("uploads", "hoso", str(hoso_id))
    if os.path.exists(upload_dir):
        shutil.rmtree(upload_dir)
        
    db.delete(hoso)
    db.commit()
    return {"message": "Đã xóa hồ sơ thành công"}

@router.get("/{hoso_id}/lineage", response_model=HoSoLineageResponse)
def get_hoso_lineage(
    hoso_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"])),
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

@router.post("/{hoso_id}/attachments")
def upload_attachments(
    hoso_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(["ADMIN", "STAFF"]))
):
    hoso = db.query(HoSo).filter(HoSo.id == hoso_id).first()
    if not hoso:
        raise HTTPException(status_code=404, detail="Hồ sơ không tồn tại")
        
    upload_dir = os.path.join("uploads", "hoso", str(hoso_id))
    os.makedirs(upload_dir, exist_ok=True)
    
    uploaded_records = []
    
    for file in files:
        filename = file.filename or "unknown"
        file_extension = os.path.splitext(filename)[1].lower()
        file_path = os.path.join(upload_dir, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        attachment = Attachments(
            hosoid=hoso_id,
            documentname=filename,
            extension=file_extension,
            storagepath=file_path.replace("\\", "/"),
            uploadedbyuserid=current_user.id
        )
        db.add(attachment)
        uploaded_records.append(attachment)
        
    db.commit()
    return {"message": f"Đã upload {len(files)} tệp thành công"}

