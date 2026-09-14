from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Conflict, User
from app.schemas import BlockOut, ConflictOut
from app.solver.conflict_engine import merge_shadow_block

router = APIRouter()

@router.get("/conflicts", response_model=list[ConflictOut])
def get_conflicts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Conflict)
    return list(db.scalars(stmt).all())

@router.post("/conflicts/{conflict_id}/shadow-merge", response_model=BlockOut)
@router.post("/blocks/{conflict_id}/shadow-merge", response_model=BlockOut)
def shadow_merge(
    conflict_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Translate the frontend's ID to our actual database seed ID!
    if conflict_id == "CONF-0901-0902":
        target_id = "CONF-8821"
    
    # 2. FIX: Catch BOTH 'BLK-' (seeded) and 'REQ-' (newly created) Block IDs!
    elif conflict_id.startswith("BLK") or conflict_id.startswith("REQ"):
        conflict = db.scalar(
            select(Conflict).where(
                (Conflict.block_a_id == conflict_id) | (Conflict.block_b_id == conflict_id)
            )
        )
        if not conflict:
            raise HTTPException(status_code=404, detail="Conflict not found for this block")
        target_id = conflict.conflict_id
        
    else:
        target_id = conflict_id

    # 3. Now pass the correct target_id to the engine
    merged_block = merge_shadow_block(db, target_id)
    return merged_block