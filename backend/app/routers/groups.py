from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Group, GroupMember
from app.core.deps import get_current_user, require_admin
from app.schemas.groups import GroupCreate, GroupOut, GroupDetailOut, GroupMemberOut, AddMemberRequest

router = APIRouter(prefix="/groups", tags=["groups"])


def _serialize_group(g: Group) -> dict:
    return {
        "id": g.id,
        "name": g.name,
        "created_by": g.created_by,
        "created_at": g.created_at,
        "member_count": len(g.members),
    }


def _serialize_member(m: GroupMember) -> dict:
    return {
        "id": m.id,
        "user_id": m.user_id,
        "real_name": m.user.real_name,
        "username": m.user.username,
        "joined_at": m.joined_at,
    }


@router.get("", response_model=list[GroupOut])
def list_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role.value == "admin":
        groups = db.query(Group).order_by(Group.created_at.desc()).all()
    else:
        memberships = db.query(GroupMember).filter(GroupMember.user_id == current_user.id).all()
        group_ids = [m.group_id for m in memberships]
        groups = db.query(Group).filter(Group.id.in_(group_ids)).order_by(Group.created_at.desc()).all()
    return [_serialize_group(g) for g in groups]


@router.post("", response_model=GroupOut, status_code=201)
def create_group(
    payload: GroupCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    group = Group(name=payload.name, created_by=admin.id)
    db.add(group)
    db.commit()
    db.refresh(group)
    return _serialize_group(group)


@router.get("/{group_id}", response_model=GroupDetailOut)
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    if current_user.role.value != "admin":
        is_member = db.query(GroupMember).filter(
            GroupMember.group_id == group_id,
            GroupMember.user_id == current_user.id,
        ).first()
        if not is_member:
            raise HTTPException(status_code=403, detail="No perteneces a este grupo")

    return {
        "id": group.id,
        "name": group.name,
        "created_by": group.created_by,
        "created_at": group.created_at,
        "members": [_serialize_member(m) for m in group.members],
    }


@router.post("/{group_id}/members", response_model=GroupMemberOut, status_code=201)
def add_member(
    group_id: int,
    payload: AddMemberRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    group = db.query(Group).filter(Group.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")

    user = db.query(User).filter(User.id == payload.user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    existing = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == payload.user_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="El usuario ya es miembro")

    member = GroupMember(group_id=group_id, user_id=payload.user_id)
    db.add(member)
    db.commit()
    db.refresh(member)
    return _serialize_member(member)


@router.delete("/{group_id}/members/{user_id}", status_code=204)
def remove_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Miembro no encontrado")
    db.delete(member)
    db.commit()
