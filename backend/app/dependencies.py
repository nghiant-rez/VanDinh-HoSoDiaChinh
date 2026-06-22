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

# ponytail: X-User-Id header for demo auth. Replace with JWT in production.
def get_current_user(x_user_id: int = Header(1), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == x_user_id, User.isactive == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Phien dang nhap khong hop le. Vui long dang nhap lai.",
        )
    return user


def require_roles(allowed_roles: list[str]):
    def role_checker(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        user_roles_query = (
            db.query(Role.rolecode)
            .join(UserRole, Role.id == UserRole.roleid)
            .filter(UserRole.userid == current_user.id)
            .all()
        )

        user_role_codes = [role[0] for role in user_roles_query]

        if not any(role in allowed_roles for role in user_role_codes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Ban khong co quyen! Yeu cau: {', '.join(allowed_roles)}",
            )

        return current_user

    return role_checker
