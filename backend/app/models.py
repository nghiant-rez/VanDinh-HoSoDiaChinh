from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, BigInteger, Numeric, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(Integer, primary_key=True, index=True)
    rolecode = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(String(500))
    isactive = Column(Boolean, default=True)

class UserRole(Base):
    __tablename__ = "userroles"
    
    userid = Column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    roleid = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)

class User(Base):
    __tablename__ = "users"
    
    id = Column(BigInteger, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    email = Column(String(256), nullable=False)
    passwordhash = Column(String, nullable=False)
    fullname = Column(String(200), nullable=False)
    isactive = Column(Boolean, default=True)
    
    roles = relationship("Role", secondary="userroles", backref="users")

class KhoLuuTru(Base):
    __tablename__ = "kholuutru"
    
    id = Column(Integer, primary_key=True, index=True)
    makho = Column(String(50), nullable=False)
    tenkho = Column(String(200), nullable=False)
    
    kes = relationship("KeLuuTru", back_populates="kho", cascade="all, delete-orphan")

class KeLuuTru(Base):
    __tablename__ = "keluutru"
    
    id = Column(Integer, primary_key=True, index=True)
    kholuutruid = Column(Integer, ForeignKey("kholuutru.id"), nullable=False)
    tenke = Column(String(100), nullable=False)
    
    kho = relationship("KhoLuuTru", back_populates="kes")
    tangs = relationship("TangLuuTru", back_populates="ke", cascade="all, delete-orphan")

class TangLuuTru(Base):
    __tablename__ = "tangluutru"
    
    id = Column(Integer, primary_key=True, index=True)
    keluutruid = Column(Integer, ForeignKey("keluutru.id"), nullable=False)
    tentang = Column(String(100), nullable=False)
    
    ke = relationship("KeLuuTru", back_populates="tangs")
    hop_sos = relationship("HopSoLuuTru", back_populates="tang", cascade="all, delete-orphan")

class HopSoLuuTru(Base):
    __tablename__ = "hopsoluutru"
    
    id = Column(Integer, primary_key=True, index=True)
    tangluutruid = Column(Integer, ForeignKey("tangluutru.id"), nullable=False)
    tenhopso = Column(String(100), nullable=False)
    
    tang = relationship("TangLuuTru", back_populates="hop_sos")
    ho_sos = relationship("HoSo", back_populates="hop_so", cascade="all, delete-orphan")

class DuAn(Base):
    __tablename__ = "duan"
    id = Column(Integer, primary_key=True, index=True)
    maduan = Column(String(100), unique=True, nullable=False)
    tenduan = Column(String(500), nullable=False)

class ThuaDat(Base):
    __tablename__ = "thuadat"
    id = Column(BigInteger, primary_key=True, index=True)
    tobando = Column(String(50), nullable=False)
    sothua = Column(String(50), nullable=False)
    dientich = Column(Numeric(18, 2))
    loai_dat = Column(String(50))
    mdsd2003 = Column(String(50))
    ten_chu = Column(String(200))
    dia_chi = Column(String(500))
    xu_dong = Column(String(100))
    # geom (POLYGON, SRID 4326) and centroid (POINT, SRID 4326)
    # managed via raw SQL — see gis_service.py

class HoSo(Base):
    __tablename__ = "hoso"
    
    id = Column(BigInteger, primary_key=True, index=True)
    idcha = Column(BigInteger, ForeignKey("hoso.id"))
    mahoso = Column(String(100), unique=True, nullable=False)
    tenhoso = Column(String(500), nullable=False)
    loaihosoid = Column(Integer) # ForeignKey("loaihoso.id")
    
    thuadatid = Column(BigInteger, ForeignKey("thuadat.id"))
    duanid = Column(Integer, ForeignKey("duan.id"))
    
    kholuutruid = Column(Integer, ForeignKey("kholuutru.id"))
    keluutruid = Column(Integer, ForeignKey("keluutru.id"))
    tangluutruid = Column(Integer, ForeignKey("tangluutru.id"))
    hopsoluutruid = Column(Integer, ForeignKey("hopsoluutru.id"))
    
    # MapCoordinates omitted
    
    chusohuu = Column(String(200), nullable=True)
    trangthai = Column(String(50), default="Hoàn thành")
    ghichu = Column(Text, nullable=True)
    
    createdbyuserid = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    
    hop_so = relationship("HopSoLuuTru", back_populates="ho_sos")
    attachments = relationship("Attachments", back_populates="hoso", cascade="all, delete-orphan")
    thua_dat = relationship("ThuaDat")
    du_an = relationship("DuAn")
    kho_luu_tru = relationship("KhoLuuTru")
    ke_luu_tru = relationship("KeLuuTru")
    tang_luu_tru = relationship("TangLuuTru")

class Attachments(Base):
    __tablename__ = "attachments"
    id = Column(BigInteger, primary_key=True, index=True)
    hosoid = Column(BigInteger, ForeignKey("hoso.id", ondelete="CASCADE"), nullable=False)
    documentname = Column(String(500), nullable=False)
    extension = Column(String(20), nullable=False)
    storagepath = Column(String(1000), nullable=False)
    ocrextractedtext = Column(String) # For GIN index search
    uploadedbyuserid = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    
    hoso = relationship("HoSo", back_populates="attachments")

class LienKetHoSo(Base):
    __tablename__ = "lienkethoso"
    hosogocid = Column(BigInteger, ForeignKey("hoso.id"), primary_key=True)
    hosodichid = Column(BigInteger, ForeignKey("hoso.id"), primary_key=True)
    loailienket = Column(String(100), primary_key=True)
