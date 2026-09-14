import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import Block, Conflict, User
from app.schemas import BlockCreate, BlockOut
from app.solver.conflict_engine import detect_conflicts

router = APIRouter()

@router.get("/blocks", response_model=list[BlockOut])
def get_blocks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(Block)
    return list(db.scalars(stmt).all())

@router.post("/blocks", response_model=BlockOut)
def create_block(
    payload: BlockCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prefix = (payload.department[:3] if len(payload.department) >= 3 else payload.department).upper()
    random_digits = f"{random.randint(1000, 9999)}"
    new_id = f"REQ-{prefix}-{random_digits}"

    start_dt = datetime.fromisoformat(payload.start_time)
    end_dt = datetime.fromisoformat(payload.end_time)
    time_window = f"{start_dt.strftime('%H:%M')} \u2013 {end_dt.strftime('%H:%M')}"

    is_power_cut = payload.ohe_power_cut.strip().upper() == "YES"
    formatted_duration = (
        payload.duration_hours
        if "hr" in payload.duration_hours.lower()
        else f"{payload.duration_hours} hrs"
    )

    new_block = Block(
        id=new_id,
        department=payload.department,
        section=payload.section,
        track=payload.track,
        work_type=payload.work_type,
        time_window=time_window,
        duration=formatted_duration,
        machine=payload.assigned_machine,
        tsr_speed=payload.speed_restriction,
        power_cut=is_power_cut,
        disruption_score=payload.disruption_score,
        status="PENDING_SANCTION",
        private_number=None,
        start_time=start_dt,
        end_time=end_dt,
    )

    db.add(new_block)
    db.flush()  # Flush so the new block is queryable by the conflict detector

    detected = detect_conflicts(db)
    for c in detected:
        if c["block_a_id"] == new_id or c["block_b_id"] == new_id:
            conflict_record = Conflict(
                conflict_id=f"CONF-{random.randint(1000, 9999)}",
                section=c["section"],
                track=c["track"],
                block_a=c["block_a"],
                block_b=c["block_b"],
                overlap_window=c["overlap_window"],
                severity=c["severity"],
                ai_recommendation=c["ai_recommendation"],
                block_a_id=c["block_a_id"],
                block_b_id=c["block_b_id"],
            )
            db.add(conflict_record)

            # Update statuses of both conflicting blocks
            block_a = db.scalar(select(Block).where(Block.id == c["block_a_id"]))
            block_b = db.scalar(select(Block).where(Block.id == c["block_b_id"]))
            if block_a:
                block_a.status = "CONFLICT_DETECTED"
            if block_b:
                block_b.status = "CONFLICT_DETECTED"

    db.commit()
    db.refresh(new_block)

    return new_block

@router.post("/blocks/{block_id}/sanction", response_model=BlockOut)
def sanction_block(
    block_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.portalType != "APPROVER" and current_user.role != "Approver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the Sr. DOM can sanction blocks",
        )

    block = db.scalar(select(Block).where(Block.id == block_id))
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Block not found",
        )

    if block.status == "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Block already sanctioned",
        )

    private_number = f"BPL-PN-{random.randint(1000, 9999)}"
    block.status = "APPROVED"
    block.private_number = private_number

    db.commit()
    db.refresh(block)

    return block

@router.post("/blocks/{block_id}/complete", response_model=BlockOut)
def complete_block(
    block_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("DEPT_TMS", "DEPT_TDMS", "DEPT_SMMS") and current_user.portalType != "DEPT":
        raise HTTPException(403, "Only department users can mark work as completed")

    block = db.get(Block, block_id)
    if not block:
        raise HTTPException(404, "Block not found")

    # --- STRICT SECURITY FIX: Fail Closed Authorization ---
    allowed_dept_keyword = None
    
    if current_user.role == "DEPT_TMS":
        allowed_dept_keyword = "civil"
    elif current_user.role == "DEPT_TDMS":
        allowed_dept_keyword = "traction"
    elif current_user.role == "DEPT_SMMS":
        allowed_dept_keyword = "signal"
        
    # FAIL CLOSED: If we don't explicitly know their department, block them immediately.
    if not allowed_dept_keyword:
        raise HTTPException(
            status_code=403, 
            detail=f"Access Denied: Unrecognized department role ({current_user.role})."
        )
        
    # Now execute the strict match
    if allowed_dept_keyword not in block.department.lower():
        raise HTTPException(
            status_code=403, 
            detail=f"Access Denied: Your role ({current_user.role}) cannot mark {block.department} work as complete."
        )
    # ------------------------------------------------------

    # FIX: Allow BOTH standard approved and shadow integrated approved blocks to be marked done
    valid_statuses = ["APPROVED", "INTEGRATED_SHADOW_APPROVED"]
    if block.status not in valid_statuses:
        raise HTTPException(400, f"Cannot complete a block with status '{block.status}' — only Approved blocks can be marked complete")

    block.status = "COMPLETED"
    db.commit()
    db.refresh(block)
    return block