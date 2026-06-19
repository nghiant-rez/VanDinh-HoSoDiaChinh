from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
import bcrypt

from app.dependencies import get_db
from app.models import User, Role, UserRole

router = APIRouter(
    prefix="/api/auth",
    tags=["Auth"]
)

class LoginRequest(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    fullname: str
    role: str

class LoginResponse(BaseModel):
    success: bool
    user: UserResponse

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # 1. Check user exists
    user = db.query(User).filter(User.username == request.username).first()
    if not user or not user.isactive:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Tài khoản không tồn tại hoặc bị khóa"
        )
    
    # 2. Check password
    try:
        # bcrypt.checkpw requires bytes
        is_match = bcrypt.checkpw(
            request.password.encode('utf-8'), 
            user.passwordhash.encode('utf-8')
        )
    except ValueError:
        is_match = False
        
    if not is_match:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Mật khẩu không chính xác"
        )
        
    # 3. Get roles
    user_roles_query = (
        db.query(Role.rolecode)
        .join(UserRole, Role.id == UserRole.roleid)
        .filter(UserRole.userid == user.id)
        .all()
    )
    
    # Lấy role đầu tiên hoặc mặc định STAFF
    role_code = user_roles_query[0][0] if user_roles_query else "STAFF"
    
    # 4. Return success (no JWT yet, just for iron-session on frontend)
    return {
        "success": True,
        "user": {
            "id": user.id,
            "username": user.username,
            "fullname": user.fullname,
            "role": role_code
        }
    }
