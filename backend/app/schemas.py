from pydantic import BaseModel, Field
from typing import List, Optional

# ==========================
# Schema cho Hộp Số
# ==========================
class HopSoLuuTruBase(BaseModel):
    tenhopso: str

class HopSoLuuTruCreate(HopSoLuuTruBase):
    tangluutruid: int

class HoSoCreate(BaseModel):
    idcha: Optional[int] = None
    mahoso: str
    tenhoso: str
    loaihosoid: Optional[int] = None
    
    tobando: Optional[str] = None
    sothua: Optional[str] = None
    dientich: Optional[int] = None
    
    duanid: Optional[int] = None
    kholuutruid: Optional[int] = None
    keluutruid: Optional[int] = None
    tangluutruid: Optional[int] = None
    hopsoluutruid: Optional[int] = None
    
    chusohuu: Optional[str] = None
    trangthai: Optional[str] = "Hoàn thành"

class HoSoSearchRequest(BaseModel):
    query: Optional[str] = None # For OCR Full-Text Search
    loaihosoid: Optional[int] = None
    loaihosoids: Optional[List[int]] = None
    tobando: Optional[str] = None
    sothua: Optional[str] = None
    kholuutruid: Optional[int] = None
    keluutruid: Optional[int] = None
    tangluutruid: Optional[int] = None
    hopsoluutruid: Optional[int] = None
    limit: int = 50
    offset: int = 0

class AttachmentResponse(BaseModel):
    id: int
    documentname: str
    extension: str
    storagepath: str
    ocrextractedtext: Optional[str] = None
    
    class Config:
        from_attributes = True

class ThuaDatResponse(BaseModel):
    id: int
    tobando: str
    sothua: str
    dientich: float

    class Config:
        from_attributes = True

class KhoLuuTruSimple(BaseModel):
    id: int
    tenkho: str

    class Config:
        from_attributes = True

class KeLuuTruSimple(BaseModel):
    id: int
    tenke: str

    class Config:
        from_attributes = True

class TangLuuTruSimple(BaseModel):
    id: int
    tentang: str

    class Config:
        from_attributes = True

class HopSoLuuTruSimple(BaseModel):
    id: int
    tenhopso: str

    class Config:
        from_attributes = True

class HoSoResponse(BaseModel):
    id: int
    mahoso: str
    tenhoso: str
    loaihosoid: Optional[int] = None
    kholuutruid: Optional[int] = None
    keluutruid: Optional[int] = None
    tangluutruid: Optional[int] = None
    hopsoluutruid: Optional[int] = None
    chusohuu: Optional[str] = None
    trangthai: Optional[str] = None
    attachments: List[AttachmentResponse] = Field(default_factory=list)
    thua_dat: Optional[ThuaDatResponse] = None
    kho_luu_tru: Optional[KhoLuuTruSimple] = None
    ke_luu_tru: Optional[KeLuuTruSimple] = None
    tang_luu_tru: Optional[TangLuuTruSimple] = None
    hop_so: Optional[HopSoLuuTruSimple] = None

    class Config:
        from_attributes = True

class HoSoLineageResponse(BaseModel):
    parent: Optional[HoSoResponse] = None
    children: List[HoSoResponse] = Field(default_factory=list)

class HopSoLuuTruResponse(HopSoLuuTruBase):
    id: int
    tangluutruid: int
    ho_sos: List[HoSoResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

class HopSoLuuTruUpdate(BaseModel):
    tenhopso: Optional[str] = None

# ==========================
# Schema cho Tầng Lưu Trữ
# ==========================
class TangLuuTruBase(BaseModel):
    tentang: str

class TangLuuTruCreate(TangLuuTruBase):
    keluutruid: int

class TangLuuTruResponse(TangLuuTruBase):
    id: int
    keluutruid: int
    hop_sos: List[HopSoLuuTruResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

class TangLuuTruUpdate(BaseModel):
    tentang: Optional[str] = None

# ==========================
# Schema cho Kệ Lưu Trữ
# ==========================
class KeLuuTruBase(BaseModel):
    tenke: str

class KeLuuTruCreate(KeLuuTruBase):
    kholuutruid: int

class KeLuuTruResponse(KeLuuTruBase):
    id: int
    kholuutruid: int
    tangs: List[TangLuuTruResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True

class KeLuuTruUpdate(BaseModel):
    tenke: Optional[str] = None

# ==========================
# Schema cho Kho Lưu Trữ
# ==========================
class KhoLuuTruBase(BaseModel):
    makho: str
    tenkho: str

class KhoLuuTruCreate(KhoLuuTruBase):
    pass

class KhoLuuTruUpdate(BaseModel):
    makho: Optional[str] = None
    tenkho: Optional[str] = None

class KhoLuuTruTreeResponse(KhoLuuTruBase):
    id: int
    kes: List[KeLuuTruResponse] = Field(default_factory=list)

    class Config:
        from_attributes = True
