import sys
import os
import bcrypt
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, Base, engine
from app.models import User, KhoLuuTru, KeLuuTru, TangLuuTru, HopSoLuuTru, HoSo, Role, UserRole

db = SessionLocal()
try:
    # 1. Create admin user with required fields
    user = db.query(User).filter(User.id == 1).first()
    if not user:
        pw_hash = bcrypt.hashpw(b"admin123", bcrypt.gensalt()).decode("utf-8")
        user = User(
            id=1,
            username="admin",
            email="admin@vandinh.local",
            passwordhash=pw_hash,
            fullname="Quan tri vien",
            isactive=True,
        )
        db.add(user)
        db.commit()

    # 2. Add ADMIN + STAFF roles
    admin_role = db.query(Role).filter(Role.rolecode == "ADMIN").first()
    if not admin_role:
        admin_role = Role(rolecode="ADMIN", name="Quan tri vien")
        db.add(admin_role)
        db.commit()
    staff_role = db.query(Role).filter(Role.rolecode == "STAFF").first()
    if not staff_role:
        staff_role = Role(rolecode="STAFF", name="Nhan vien")
        db.add(staff_role)
        db.commit()
    user_role = db.query(UserRole).filter(
        UserRole.userid == user.id, UserRole.roleid == admin_role.id
    ).first()
    if not user_role:
        user_role = UserRole(userid=user.id, roleid=admin_role.id)
        db.add(user_role)
        db.commit()

    # 3. Add Kho, Ke, Tang, HopSo
    kho = db.query(KhoLuuTru).filter(KhoLuuTru.id == 1).first()
    if not kho:
        kho = KhoLuuTru(makho="KHO-A", tenkho="Kho A")
        db.add(kho)
        db.commit()

    ke = db.query(KeLuuTru).filter(KeLuuTru.kholuutruid == kho.id).first()
    if not ke:
        ke = KeLuuTru(tenke="Ke 1", kholuutruid=kho.id)
        db.add(ke)
        db.commit()

    tang = db.query(TangLuuTru).filter(TangLuuTru.keluutruid == ke.id).first()
    if not tang:
        tang = TangLuuTru(tentang="Tang 1", keluutruid=ke.id)
        db.add(tang)
        db.commit()

    hopso = db.query(HopSoLuuTru).filter(HopSoLuuTru.tangluutruid == tang.id).first()
    if not hopso:
        hopso = HopSoLuuTru(tenhopso="Hop 1", tangluutruid=tang.id)
        db.add(hopso)
        db.commit()

    # 4. Add sample HoSo records
    samples = [
        {
            "mahoso": "HS-2023-001",
            "tenhoso": "Hồ sơ địa chính thửa đất số 42, tờ bản đồ số 5, thôn Đinh",
            "loaihosoid": 1,
            "chusohuu": "Nguyễn Văn A",
            "kholuutruid": kho.id,
            "keluutruid": ke.id,
            "tangluutruid": tang.id,
            "hopsoluutruid": hopso.id,
            "createdbyuserid": 1,
            "trangthai": "Hoàn thành",
        },
        {
            "mahoso": "HS-2023-002",
            "tenhoso": "Đơn xin cấp lại sổ đỏ của hộ bà Lê Thị B",
            "loaihosoid": 2,
            "chusohuu": "Lê Thị B",
            "kholuutruid": kho.id,
            "keluutruid": ke.id,
            "tangluutruid": tang.id,
            "hopsoluutruid": hopso.id,
            "createdbyuserid": 1,
            "trangthai": "Đang xử lý",
        },
        {
            "mahoso": "HS-2024-003",
            "tenhoso": "Dự án quy hoạch khu dân cư mới xóm Đồng",
            "loaihosoid": 3,
            "chusohuu": "UBND Xã Vạn Đình",
            "kholuutruid": kho.id,
            "keluutruid": ke.id,
            "tangluutruid": tang.id,
            "hopsoluutruid": hopso.id,
            "createdbyuserid": 1,
            "trangthai": "Hoàn thành",
        },
        {
            "mahoso": "HS-TNMT-004",
            "tenhoso": "Báo cáo đánh giá tác động môi trường cơ sở dệt nhuộm",
            "loaihosoid": 7,
            "chusohuu": "Công ty TNHH Dệt May X",
            "kholuutruid": kho.id,
            "keluutruid": ke.id,
            "tangluutruid": tang.id,
            "hopsoluutruid": hopso.id,
            "createdbyuserid": 1,
            "trangthai": "Lưu trữ",
        },
    ]

    for s in samples:
        h = db.query(HoSo).filter(HoSo.mahoso == s["mahoso"]).first()
        if not h:
            h = HoSo(**s)
            db.add(h)

    db.commit()
    print("Them du lieu mau thanh cong!")
except Exception as e:
    db.rollback()
    print(f"Loi khi seed du lieu: {e}")
    raise
finally:
    db.close()
