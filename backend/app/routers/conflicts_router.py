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

# I added a second route decorator here to catch both URLs the frontend is trying!
@router.post("/conflicts/{conflict_id}/shadow-merge", response_model=BlockOut)
@router.post("/blocks/{conflict_id}/shadow-merge", response_model=BlockOut)
def shadow_merge(
    conflict_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # FIX: If the frontend sends a Block ID (e.g., BLK-2026-0902), 
    # we find the corresponding Conflict ID (CONF-8821) in the database first.
    if conflict_id.startswith("BLK"):
        conflict = db.scalar(
            select(Conflict).where(
                (Conflict.block_a_id == conflict_id) | (Conflict.block_b_id == conflict_id)
            )
        )
        if not conflict:
            raise HTTPException(status_code=404, detail="Conflict not found for this block")
        
        # We found the conflict! Swap out the BLK ID for the real CONF ID
        target_id = conflict.conflict_id
    else:
        target_id = conflict_id

    # Now pass the correct CONF ID to your engine
    merged_block = merge_shadow_block(db, target_id)
    return merged_block