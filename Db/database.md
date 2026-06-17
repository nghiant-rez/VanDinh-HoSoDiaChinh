-- 0. KÍCH HOẠT EXTENSION BẢN ĐỒ SỐ (Chạy dòng này trước)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ==============================================================================
-- PHẦN 1: CORE SYSTEM & RBAC
-- ==============================================================================
CREATE TABLE Roles (
    Id SERIAL PRIMARY KEY,
    RoleCode VARCHAR(50) NOT NULL UNIQUE,
    Name VARCHAR(100) NOT NULL,
    Description VARCHAR(500),
    IsActive BOOLEAN DEFAULT TRUE
);

-- Khởi tạo sẵn 2 Roles theo yêu cầu: ADMIN và STAFF
INSERT INTO Roles (RoleCode, Name, Description) 
VALUES ('ADMIN', 'Quản trị viên', 'Toàn quyền hệ thống'), 
       ('STAFF', 'Nhân viên', 'Chỉ có quyền tìm kiếm và xem');

CREATE TABLE Permissions (
    Id SERIAL PRIMARY KEY,
    PermissionCode VARCHAR(100) NOT NULL UNIQUE,
    PermissionName VARCHAR(200) NOT NULL,
    Module VARCHAR(100)
);

CREATE TABLE RolePermissions (
    RoleId INT NOT NULL REFERENCES Roles(Id) ON DELETE CASCADE,
    PermissionId INT NOT NULL REFERENCES Permissions(Id) ON DELETE CASCADE,
    PRIMARY KEY (RoleId, PermissionId)
);

CREATE TABLE SystemConfigs (
    Id SERIAL PRIMARY KEY,
    KeyName VARCHAR(100) NOT NULL UNIQUE,
    Value TEXT,
    Description VARCHAR(500)
);

CREATE TABLE Users (
    Id BIGSERIAL PRIMARY KEY,
    Username VARCHAR(100) NOT NULL UNIQUE,
    Email VARCHAR(256) NOT NULL,
    PasswordHash TEXT NOT NULL,
    FullName VARCHAR(200) NOT NULL,
    DonViQuanLyId INT, 
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP
);

CREATE TABLE UserRoles (
    UserId BIGINT NOT NULL REFERENCES Users(Id) ON DELETE CASCADE,
    RoleId INT NOT NULL REFERENCES Roles(Id) ON DELETE CASCADE,
    PRIMARY KEY (UserId, RoleId)
);

-- ==============================================================================
-- PHẦN 2: DANH MỤC HÀNH CHÍNH & KHO LƯU TRỮ VẬT LÝ
-- ==============================================================================
CREATE TABLE TinhThanh (
    MaTinh VARCHAR(20) PRIMARY KEY,
    TenTinh VARCHAR(100) NOT NULL
);

CREATE TABLE QuanHuyen (
    MaHuyen VARCHAR(20) PRIMARY KEY,
    MaTinh VARCHAR(20) NOT NULL REFERENCES TinhThanh(MaTinh),
    TenHuyen VARCHAR(100) NOT NULL
);

CREATE TABLE PhuongXa (
    MaXa VARCHAR(20) PRIMARY KEY,
    MaHuyen VARCHAR(20) NOT NULL REFERENCES QuanHuyen(MaHuyen),
    TenXa VARCHAR(100) NOT NULL
);

CREATE TABLE KhoLuuTru (
    Id SERIAL PRIMARY KEY,
    MaKho VARCHAR(50) NOT NULL,
    TenKho VARCHAR(200) NOT NULL
);

CREATE TABLE KeLuuTru (
    Id SERIAL PRIMARY KEY,
    KhoLuuTruId INT NOT NULL REFERENCES KhoLuuTru(Id),
    TenKe VARCHAR(100) NOT NULL
);

CREATE TABLE TangLuuTru (
    Id SERIAL PRIMARY KEY,
    KeLuuTruId INT NOT NULL REFERENCES KeLuuTru(Id),
    TenTang VARCHAR(100) NOT NULL
);

CREATE TABLE HopSoLuuTru (
    Id SERIAL PRIMARY KEY,
    TangLuuTruId INT NOT NULL REFERENCES TangLuuTru(Id),
    TenHopSo VARCHAR(100) NOT NULL
);

CREATE TABLE LoaiHoSo (
    Id SERIAL PRIMARY KEY,
    MaLoai VARCHAR(50) NOT NULL,
    TenLoai VARCHAR(200) NOT NULL,
    IdCha INT REFERENCES LoaiHoSo(Id)
);

CREATE TABLE DuAn (
    Id SERIAL PRIMARY KEY,
    MaDuAn VARCHAR(100) NOT NULL UNIQUE,
    TenDuAn VARCHAR(500) NOT NULL
);

-- ==============================================================================
-- PHẦN 3: MODULE ĐẤT ĐAI & BẢN ĐỒ SỐ
-- ==============================================================================
CREATE TABLE ChuSuDungDat (
    Id BIGSERIAL PRIMARY KEY,
    TenChuSuDung VARCHAR(200) NOT NULL,
    SoGiayTo VARCHAR(50) NOT NULL UNIQUE, 
    DiaChi VARCHAR(500)
);

CREATE TABLE ThuaDat (
    Id BIGSERIAL PRIMARY KEY,
    ToBanDo VARCHAR(50) NOT NULL,
    SoThua VARCHAR(50) NOT NULL,
    DienTich DECIMAL(18,2) NOT NULL,
    MaTinh VARCHAR(20) NOT NULL REFERENCES TinhThanh(MaTinh),
    MaHuyen VARCHAR(20) NOT NULL REFERENCES QuanHuyen(MaHuyen),
    MaXa VARCHAR(20) NOT NULL REFERENCES PhuongXa(MaXa),
    MapCoordinates GEOMETRY -- Yêu cầu cài PostGIS
);
-- Tạo chỉ mục không gian (Spatial Index) cho Thửa Đất
CREATE INDEX SPIDX_ThuaDat_MapCoordinates ON ThuaDat USING GIST (MapCoordinates);

CREATE TABLE ChuSoHuuThuaDat (
    ThuaDatId BIGINT NOT NULL REFERENCES ThuaDat(Id) ON DELETE CASCADE,
    ChuSuDungDatId BIGINT NOT NULL REFERENCES ChuSuDungDat(Id) ON DELETE CASCADE,
    PRIMARY KEY (ThuaDatId, ChuSuDungDatId)
);

CREATE TABLE LichSuSoHuu (
    Id BIGSERIAL PRIMARY KEY,
    ThuaDatId BIGINT NOT NULL REFERENCES ThuaDat(Id),
    ChuSuDungCuId BIGINT,
    ChuSuDungMoiId BIGINT NOT NULL,
    NgayChuyenNhuong TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE TranhChap (
    Id BIGSERIAL PRIMARY KEY,
    ThuaDatId BIGINT NOT NULL REFERENCES ThuaDat(Id),
    NoiDungTranhChap TEXT NOT NULL,
    TrangThai VARCHAR(100) DEFAULT 'Đang giải quyết'
);

CREATE TABLE ThuHoiDat (
    Id BIGSERIAL PRIMARY KEY,
    ThuaDatId BIGINT NOT NULL REFERENCES ThuaDat(Id),
    DuAnId INT REFERENCES DuAn(Id),
    MucDichThuHoi VARCHAR(200) NOT NULL, 
    LyDoThuHoi TEXT NOT NULL,
    NgayThuHoi TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- PHẦN 4: HỒ SƠ LÕI & LIÊN KẾT (CORE DOSSIER)
-- ==============================================================================
CREATE TABLE HoSo (
    Id BIGSERIAL PRIMARY KEY,
    IdCha BIGINT REFERENCES HoSo(Id),
    MaHoSo VARCHAR(100) NOT NULL UNIQUE,
    TenHoSo VARCHAR(500) NOT NULL,
    LoaiHoSoId INT NOT NULL REFERENCES LoaiHoSo(Id),
    
    ThuaDatId BIGINT REFERENCES ThuaDat(Id),
    DuAnId INT REFERENCES DuAn(Id),

    KhoLuuTruId INT REFERENCES KhoLuuTru(Id),
    KeLuuTruId INT REFERENCES KeLuuTru(Id),       
    TangLuuTruId INT REFERENCES TangLuuTru(Id), 
    HopSoLuuTruId INT REFERENCES HopSoLuuTru(Id),

    MapCoordinates GEOMETRY,
    AdditionalInfo JSONB, -- Sử dụng JSONB siêu tốc của PostgreSQL thay vì kiểm tra ISJSON
    CreatedByUserId BIGINT NOT NULL REFERENCES Users(Id),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tạo chỉ mục không gian cho Hồ sơ
CREATE INDEX SPIDX_HoSo_MapCoordinates ON HoSo USING GIST (MapCoordinates);

CREATE TABLE LienKetHoSo (
    HoSoGocId BIGINT NOT NULL REFERENCES HoSo(Id),
    HoSoDichId BIGINT NOT NULL REFERENCES HoSo(Id),
    LoaiLienKet VARCHAR(100) NOT NULL,
    PRIMARY KEY (HoSoGocId, HoSoDichId, LoaiLienKet)
);

-- ==============================================================================
-- PHẦN 5: ATTACHMENTS & VERSIONS & OCR
-- ==============================================================================
CREATE TABLE Attachments (
    Id BIGSERIAL PRIMARY KEY,
    HoSoId BIGINT NOT NULL REFERENCES HoSo(Id) ON DELETE CASCADE,
    DocumentName VARCHAR(500) NOT NULL,
    Extension VARCHAR(20) NOT NULL,
    StoragePath VARCHAR(1000) NOT NULL,
    OcrExtractedText TEXT,
    UploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UploadedByUserId BIGINT NOT NULL REFERENCES Users(Id)
);

-- Kích hoạt FullText Search cho file OCR trong PostgreSQL
CREATE INDEX IDX_Attachments_OcrText ON Attachments USING GIN (to_tsvector('simple', OcrExtractedText));

CREATE TABLE AttachmentVersions (
    Id BIGSERIAL PRIMARY KEY,
    AttachmentId BIGINT NOT NULL REFERENCES Attachments(Id) ON DELETE CASCADE,
    VersionNumber INT NOT NULL,
    StoragePath VARCHAR(1000) NOT NULL,
    UploadedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UploadedByUserId BIGINT NOT NULL REFERENCES Users(Id)
);

-- ==============================================================================
-- PHẦN 6: LỊCH SỬ BIẾN ĐỘNG (AUDIT LOG)
-- ==============================================================================
CREATE TABLE LichSuHoSo (
    Id BIGSERIAL PRIMARY KEY,
    HoSoId BIGINT NOT NULL REFERENCES HoSo(Id) ON DELETE CASCADE,
    Action VARCHAR(100) NOT NULL, 
    OldValue JSONB,   
    NewValue JSONB,   
    PerformedByUserId BIGINT NOT NULL REFERENCES Users(Id),
    PerformedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- PHẦN 7: TRIGGER AUDIT LOG BẰNG PL/pgSQL
-- ==============================================================================
CREATE OR REPLACE FUNCTION trg_hoso_auditlog_func()
RETURNS TRIGGER AS $$
DECLARE
    action_name VARCHAR(100);
    old_val JSONB := NULL;
    new_val JSONB := NULL;
    performed_user_id BIGINT;
BEGIN
    -- Trong PostgreSQL, chúng ta sử dụng NEW và OLD để truy cập dữ liệu theo dòng
    IF TG_OP = 'INSERT' THEN
        action_name := 'INSERT';
        new_val := row_to_json(NEW)::jsonb;
        performed_user_id := NEW.CreatedByUserId; -- Hoặc lấy từ biến session ở tầng ứng dụng (FastAPI)

        INSERT INTO LichSuHoSo (HoSoId, Action, OldValue, NewValue, PerformedByUserId, PerformedAt)
        VALUES (NEW.Id, action_name, old_val, new_val, performed_user_id, CURRENT_TIMESTAMP);

    ELSIF TG_OP = 'UPDATE' THEN
        action_name := 'UPDATE';
        old_val := row_to_json(OLD)::jsonb;
        new_val := row_to_json(NEW)::jsonb;
        performed_user_id := NEW.CreatedByUserId;

        INSERT INTO LichSuHoSo (HoSoId, Action, OldValue, NewValue, PerformedByUserId, PerformedAt)
        VALUES (NEW.Id, action_name, old_val, new_val, performed_user_id, CURRENT_TIMESTAMP);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER TRG_HoSo_AuditLog
AFTER INSERT OR UPDATE ON HoSo
FOR EACH ROW
EXECUTE FUNCTION trg_hoso_auditlog_func();