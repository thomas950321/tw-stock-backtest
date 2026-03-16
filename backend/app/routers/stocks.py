from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/stocks", tags=["Stocks"])


@router.get("", response_model=List[schemas.StockOut])
def get_stocks(
    search: Optional[str] = Query(None),
    market: Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(models.Stock)
    if search:
        q = q.filter(
            models.Stock.symbol.contains(search) |
            models.Stock.name.contains(search)
        )
    if market:
        q = q.filter(models.Stock.market == market)
    if industry:
        q = q.filter(models.Stock.industry == industry)
    return q.all()


@router.get("/{stock_id}", response_model=schemas.StockOut)
def get_stock(stock_id: int, db: Session = Depends(get_db)):
    stock = db.query(models.Stock).filter(models.Stock.stock_id == stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="股票不存在")
    return stock


@router.get("/{stock_id}/price", response_model=List[schemas.PriceOut])
def get_stock_price(
    stock_id: int,
    interval: str = Query("1d"),
    start: Optional[date] = Query(None),
    end: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(models.Price).filter(
        models.Price.stock_id == stock_id,
        models.Price.interval_type == interval,
    )
    if start:
        q = q.filter(models.Price.datetime >= start)
    if end:
        q = q.filter(models.Price.datetime <= end)
    return q.order_by(models.Price.datetime.asc()).all()


@router.post("", response_model=schemas.StockOut, status_code=201)
def create_stock(payload: schemas.StockCreate, db: Session = Depends(get_db)):
    stock = models.Stock(**payload.model_dump())
    db.add(stock)
    db.commit()
    db.refresh(stock)
    return stock
