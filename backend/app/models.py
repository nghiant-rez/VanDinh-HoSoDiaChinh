from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, BigInteger
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
