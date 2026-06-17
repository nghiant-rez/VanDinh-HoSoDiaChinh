from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, Role, UserRole

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Giả lập lấy current_user từ Header X-User-Id cho mục đích demo
# Trong thực tế sẽ thay bằng JWT Token
def get_current_user(x_user_id: int = Header(1), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == x_user_id, User.isactive == True).first()
    if not user:
        # Nếu chưa có user trong DB (lúc mới tạo), ta trả về dummy object để không bị block API
        dummy_user = User(id=x_user_id, username="admin_dummy", fullname="Admin Dummy")
        return dummy_user
    return user

def require_roles(allowed_roles: list[str]):
    def role_checker(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        # Nếu là dummy user, bypass cho phép truy cập
        if current_user.username == "admin_dummy":
            return current_user
            
        user_roles_query = (
            db.query(Role.rolecode)
            .join(UserRole, Role.id == UserRole.roleid)
            .filter(UserRole.userid == current_user.id)
            .all()
        )
        
        user_role_codes = [role[0] for role in user_roles_query]
        
        has_permission = any(role in allowed_roles for role in user_role_codes)
        
        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Bạn không có quyền! Yêu cầu: {', '.join(allowed_roles)}"
            )
            
        return current_user
        
    return role_checker
