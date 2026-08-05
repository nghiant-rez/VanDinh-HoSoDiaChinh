from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
import json
from io import BytesIO
from fastapi.responses import StreamingResponse

from app.dependencies import get_db, get_current_user
from app.models import HoSo, ThuaDat, KhoLuuTru, KeLuuTru, TangLuuTru, HopSoLuuTru, Attachments

router = APIRouter(
    prefix="/api/sync",
    tags=["Sync"],
)

class ExportRequest(BaseModel):
    hoso_ids: List[int] = [] # Empty means all

@router.post("/export-json")
def export_sync_data(request: ExportRequest, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # Build query
    query = select(HoSo)
    if request.hoso_ids:
        query = query.where(HoSo.id.in_(request.hoso_ids))
    
    hoso_list = db.execute(query).scalars().all()
    
    export_data = []
    
    for hs in hoso_list:
        # Get Thua Dat
        thua_dat = None
        if hs.thuadatid:
            td = db.query(ThuaDat).filter(ThuaDat.id == hs.thuadatid).first()
            if td:
                thua_dat = {
                    "tobando": td.tobando,
                    "sothua": td.sothua,
                    "dientich": float(td.dientich) if td.dientich else None,
                    "loai_dat": td.loai_dat,
                    "mdsd2003": td.mdsd2003,
                    "ten_chu": td.ten_chu,
                    "dia_chi": td.dia_chi,
                    "xu_dong": td.xu_dong
                }
                
        # Get Storage Info names instead of IDs
        storage_info = {
            "kho": hs.kho_luu_tru.tenkho if hs.kho_luu_tru else None,
            "ke": hs.ke_luu_tru.tenke if hs.ke_luu_tru else None,
            "tang": hs.tang_luu_tru.tentang if hs.tang_luu_tru else None,
            "hop": hs.hop_so.tenhopso if hs.hop_so else None,
        }
        
        # Get Attachments (metadata only)
        attachments = []
        for att in hs.attachments:
            attachments.append({
                "documentname": att.documentname,
                "extension": att.extension,
                "storagepath": att.storagepath,
                "ocrextractedtext": att.ocrextractedtext
            })
            
        export_data.append({
            "mahoso": hs.mahoso,
            "tenhoso": hs.tenhoso,
            "loaihosoid": hs.loaihosoid,
            "chusohuu": hs.chusohuu,
            "trangthai": hs.trangthai,
            "ghichu": hs.ghichu,
            "thua_dat": thua_dat,
            "storage_info": storage_info,
            "attachments": attachments
        })
        
    json_str = json.dumps(export_data, ensure_ascii=False, indent=2)
    file_bytes = BytesIO(json_str.encode("utf-8"))
    
    return StreamingResponse(
        iter([file_bytes.getvalue()]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=sync_data.json"}
    )


@router.post("/import-json")
async def import_sync_data(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="Chỉ chấp nhận file .json")
        
    try:
        content = await file.read()
        data = json.loads(content.decode("utf-8"))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File JSON không hợp lệ: {str(e)}")
        
    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="Định dạng file không đúng (yêu cầu mảng JSON)")
        
    success_count = 0
    error_count = 0
    errors = []
    
    for idx, item in enumerate(data):
        try:
            # Create Thua Dat if exists
            new_thuadat_id = None
            if item.get("thua_dat"):
                td_data = item["thua_dat"]
                new_td = ThuaDat(
                    tobando=td_data.get("tobando"),
                    sothua=td_data.get("sothua"),
                    dientich=td_data.get("dientich"),
                    loai_dat=td_data.get("loai_dat"),
                    mdsd2003=td_data.get("mdsd2003"),
                    ten_chu=td_data.get("ten_chu"),
                    dia_chi=td_data.get("dia_chi"),
                    xu_dong=td_data.get("xu_dong")
                )
                db.add(new_td)
                db.flush() # get ID
                new_thuadat_id = new_td.id
                
            # Map Storage Info (by exact name)
            new_kholuutruid = None
            new_keluutruid = None
            new_tangluutruid = None
            new_hopsoluutruid = None
            
            storage_info = item.get("storage_info", {})
            
            if storage_info.get("kho"):
                kho = db.query(KhoLuuTru).filter(KhoLuuTru.tenkho == storage_info["kho"]).first()
                if kho: new_kholuutruid = kho.id
            if storage_info.get("ke"):
                ke = db.query(KeLuuTru).filter(KeLuuTru.tenke == storage_info["ke"]).first()
                if ke: new_keluutruid = ke.id
            if storage_info.get("tang"):
                tang = db.query(TangLuuTru).filter(TangLuuTru.tentang == storage_info["tang"]).first()
                if tang: new_tangluutruid = tang.id
            if storage_info.get("hop"):
                hop = db.query(HopSoLuuTru).filter(HopSoLuuTru.tenhopso == storage_info["hop"]).first()
                if hop: new_hopsoluutruid = hop.id
            
            # Check for existing mahoso to avoid unique constraint error
            mahoso = item.get("mahoso")
            existing_hoso = db.query(HoSo).filter(HoSo.mahoso == mahoso).first()
            if existing_hoso:
                # Append a random string or counter to mahoso to avoid conflict
                import random, string
                suffix = ''.join(random.choices(string.ascii_letters + string.digits, k=4))
                mahoso = f"{mahoso}-{suffix}"
                
            # Create HoSo
            new_hoso = HoSo(
                mahoso=mahoso,
                tenhoso=item.get("tenhoso", "Hồ sơ không tên"),
                loaihosoid=item.get("loaihosoid"),
                thuadatid=new_thuadat_id,
                kholuutruid=new_kholuutruid,
                keluutruid=new_keluutruid,
                tangluutruid=new_tangluutruid,
                hopsoluutruid=new_hopsoluutruid,
                chusohuu=item.get("chusohuu"),
                thon=item.get("thon"),
                trangthai=item.get("trangthai", "Hoàn thành"),
                ghichu=item.get("ghichu"),
                createdbyuserid=current_user.get("user_id", 1) if isinstance(current_user, dict) else 1
            )
            db.add(new_hoso)
            db.flush()
            
            # Add Attachments metadata
            attachments = item.get("attachments", [])
            for att_data in attachments:
                new_att = Attachments(
                    hosoid=new_hoso.id,
                    documentname=att_data.get("documentname"),
                    extension=att_data.get("extension"),
                    storagepath=att_data.get("storagepath"),
                    ocrextractedtext=att_data.get("ocrextractedtext"),
                    uploadedbyuserid=current_user.get("user_id", 1) if isinstance(current_user, dict) else 1
                )
                db.add(new_att)
                
            success_count += 1
            
        except Exception as e:
            db.rollback()
            error_count += 1
            errors.append(f"Lỗi tại item {idx+1}: {str(e)}")
            continue
            
    db.commit()
    
    return {
        "success": True, 
        "message": f"Đã đồng bộ {success_count} hồ sơ.", 
        "success_count": success_count, 
        "error_count": error_count,
        "errors": errors
    }
