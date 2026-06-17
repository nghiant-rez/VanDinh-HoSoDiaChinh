from pydantic import BaseModel, Field
from typing import List, Optional

# ==========================
# Schema cho Hộp Số
# ==========================
class HopSoLuuTruBase(BaseModel):
    tenhopso: str

class HopSoLuuTruCreate(HopSoLuuTruBase):
    tangluutruid: int

class HopSoLuuTruResponse(HopSoLuuTruBase):
    id: int
    tangluutruid: int

    class Config:
        from_attributes = True

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
