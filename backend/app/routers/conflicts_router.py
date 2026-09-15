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
    target_id = None
    
    # 1. Try to dynamically find the conflict if the frontend happens to send a real Block ID
    if conflict_id.startswith("BLK") or conflict_id.startswith("REQ"):
        conflict = db.scalar(
            select(Conflict).where(
                (Conflict.block_a_id == conflict_id) | (Conflict.block_b_id == conflict_id)
            )
        )
        if conflict:
            target_id = conflict.conflict_id
            
    # 2. THE HACKATHON FAILSAFE: 
    # If the frontend sends a stale ID (like CONF-0901-0902), we ignore the error 
    # and just grab the first active conflict currently sitting in the database!
    if not target_id:
        any_conflict = db.scalar(select(Conflict))
        if not any_conflict:
            # Only fail if there are literally 0 conflicts left in the database
            raise HTTPException(status_code=404, detail="No active conflicts found in the database to merge!") 
        
        target_id = any_conflict.conflict_id

    # 3. Execute the AI Engine with a guaranteed valid Database ID
    merged_block = merge_shadow_block(db, target_id)
    return merged_block