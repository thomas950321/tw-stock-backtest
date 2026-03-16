from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/strategies", tags=["Strategies"])


@router.get("", response_model=List[schemas.StrategyOut])
def get_strategies(db: Session = Depends(get_db)):
    return db.query(models.Strategy).order_by(models.Strategy.created_at.desc()).all()


@router.post("", response_model=schemas.StrategyOut, status_code=201)
def create_strategy(payload: schemas.StrategyCreate, db: Session = Depends(get_db)):
    strategy = models.Strategy(**payload.model_dump())
    db.add(strategy)
    db.commit()
    db.refresh(strategy)
    return strategy


@router.put("/{strategy_id}", response_model=schemas.StrategyOut)
def update_strategy(
    strategy_id: int,
    payload: schemas.StrategyUpdate,
    db: Session = Depends(get_db),
):
    strategy = db.query(models.Strategy).filter(models.Strategy.strategy_id == strategy_id).first()
    if not strategy:
        raise HTTPException(status_code=404, detail="策略不存在")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(strategy, field, value)
    db.commit()
    db.refresh(strategy)
    return strategy


@router.delete("/{strategy_id}", response_model=schemas.SuccessResponse)
def delete_strategy(strategy_id: int, db: Session = Depends(get_db)):
    strategy = db.query(models.Strategy).filter(models.Strategy.strategy_id == strategy_id).first()
    if not strategy:
        raise HTTPException(status_code=404, detail="策略不存在")
    db.delete(strategy)
    db.commit()
    return {"success": True, "message": "策略已刪除"}
