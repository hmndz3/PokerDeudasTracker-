from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.core.deps import get_current_user, require_admin
from app.core.security import hash_password, verify_password
from app.schemas.auth import UserOut
from app.schemas.users import UsernameUpdate, PasswordUpdate, AdminPasswordReset

router = APIRouter(prefix="/users", tags=["users"])


# ===== Rutas del propio jugador =====

@router.patch("/me/username", response_model=UserOut)
def change_my_username(
    payload: UsernameUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    exists = db.query(User).filter(User.username == payload.username).first()
    if exists and exists.id != current_user.id:
        raise HTTPException(status_code=400, detail="Username ya existe")

    current_user.username = payload.username
    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/me/password", response_model=UserOut)
def change_my_password(
    payload: PasswordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")

    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    db.refresh(current_user)
    return current_user


# ===== Rutas de admin =====

@router.get("", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    return db.query(User).order_by(User.id).all()


@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user


@router.patch("/{user_id}/deactivate", response_model=UserOut)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="No puedes desactivarte a ti mismo")

    user.is_active = False
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/activate", response_model=UserOut)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.is_active = True
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/reset-password", response_model=UserOut)
def admin_reset_password(
    user_id: int,
    payload: AdminPasswordReset,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.password_hash = hash_password(payload.new_password)
    db.commit()
    db.refresh(user)
    return user