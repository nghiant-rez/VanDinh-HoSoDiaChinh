import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, Base, engine
from app.models import User, KhoLuuTru, KeLuuTru, TangLuuTru, HopSoLuuTru, HoSo, Role, UserRole

db = SessionLocal()

# 1. Create a dummy user
user = db.query(User).filter(User.id == 1).first()
if not user:
    user = User(id=1, username="admin_dummy", fullname="Admin Dummy", isactive=True)
    db.add(user)
    db.commit()

# 2. Add Kho, Ke, Tang, HopSo if they don't exist
kho = db.query(KhoLuuTru).filter(KhoLuuTru.id == 1).first()
if not kho:
    kho = KhoLuuTru(tenkho="Kho A", diachi="Phòng 101")
    db.add(kho)
    db.commit()

ke = db.query(KeLuuTru).filter(KeLuuTru.kholuutruid == kho.id).first()
if not ke:
    ke = KeLuuTru(tenke="Kệ 1", kholuutruid=kho.id)
    db.add(ke)
    db.commit()

tang = db.query(TangLuuTru).filter(TangLuuTru.keluutruid == ke.id).first()
if not tang:
    tang = TangLuuTru(tentang="Tầng 1", keluutruid=ke.id)
    db.add(tang)
    db.commit()

hopso = db.query(HopSoLuuTru).filter(HopSoLuuTru.tangluutruid == tang.id).first()
if not hopso:
    hopso = HopSoLuuTru(tenhopso="Hộp 1", tangluutruid=tang.id)
    db.add(hopso)
    db.commit()

# 3. Add sample HoSo records
samples = [
    {
        "mahoso": "HS-2023-001",
        "tenhoso": "Hồ sơ địa chính thửa đất số 42, tờ bản đồ số 5, thôn Đinh",
        "loaihosoid": 1, # Xử lý vi phạm
        "chusohuu": "Nguyễn Văn A",
        "kholuutruid": kho.id,
        "keluutruid": ke.id,
        "tangluutruid": tang.id,
        "hopsoluutruid": hopso.id,
        "createdbyuserid": 1,
        "trangthai": "Hoàn thành"
    },
    {
        "mahoso": "HS-2023-002",
        "tenhoso": "Đơn xin cấp lại sổ đỏ của hộ bà Lê Thị B",
        "loaihosoid": 2, # Đơn từ
        "chusohuu": "Lê Thị B",
        "kholuutruid": kho.id,
        "keluutruid": ke.id,
        "tangluutruid": tang.id,
        "hopsoluutruid": hopso.id,
        "createdbyuserid": 1,
        "trangthai": "Đang xử lý"
    },
    {
        "mahoso": "HS-2024-003",
        "tenhoso": "Dự án quy hoạch khu dân cư mới xóm Đồng",
        "loaihosoid": 3, # Dự án
        "chusohuu": "UBND Xã Vạn Đình",
        "kholuutruid": kho.id,
        "keluutruid": ke.id,
        "tangluutruid": tang.id,
        "hopsoluutruid": hopso.id,
        "createdbyuserid": 1,
        "trangthai": "Hoàn thành"
    },
    {
        "mahoso": "HS-TNMT-004",
        "tenhoso": "Báo cáo đánh giá tác động môi trường cơ sở dệt nhuộm",
        "loaihosoid": 7, # Tài nguyên môi trường
        "chusohuu": "Công ty TNHH Dệt May X",
        "kholuutruid": kho.id,
        "keluutruid": ke.id,
        "tangluutruid": tang.id,
        "hopsoluutruid": hopso.id,
        "createdbyuserid": 1,
        "trangthai": "Lưu trữ"
    }
]

for s in samples:
    h = db.query(HoSo).filter(HoSo.mahoso == s["mahoso"]).first()
    if not h:
        h = HoSo(**s)
        db.add(h)

db.commit()
db.close()
print("Thêm dữ liệu mẫu thành công!")
