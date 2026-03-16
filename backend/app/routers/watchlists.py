from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/watchlists", tags=["Watchlists"])


@router.get("", response_model=List[schemas.WatchlistOut])
def get_watchlists(db: Session = Depends(get_db)):
    return db.query(models.Watchlist).all()


@router.post("", response_model=schemas.WatchlistOut, status_code=201)
def create_watchlist(payload: schemas.WatchlistCreate, db: Session = Depends(get_db)):
    wl = models.Watchlist(name=payload.name)
    db.add(wl)
    db.commit()
    db.refresh(wl)
    return wl


@router.delete("/{watchlist_id}", response_model=schemas.SuccessResponse)
def delete_watchlist(watchlist_id: int, db: Session = Depends(get_db)):
    wl = db.query(models.Watchlist).filter(models.Watchlist.watchlist_id == watchlist_id).first()
    if not wl:
        raise HTTPException(status_code=404, detail="清單不存在")
    db.delete(wl)
    db.commit()
    return {"success": True, "message": "清單已刪除"}


@router.get("/{watchlist_id}/stocks", response_model=List[schemas.StockOut])
def get_watchlist_stocks(watchlist_id: int, db: Session = Depends(get_db)):
    wl = db.query(models.Watchlist).filter(models.Watchlist.watchlist_id == watchlist_id).first()
    if not wl:
        raise HTTPException(status_code=404, detail="清單不存在")
    return [ws.stock for ws in wl.watchlist_stocks]


@router.post("/{watchlist_id}/stocks", response_model=schemas.SuccessResponse, status_code=201)
def add_stock_to_watchlist(
    watchlist_id: int,
    payload: schemas.WatchlistAddStock,
    db: Session = Depends(get_db),
):
    wl = db.query(models.Watchlist).filter(models.Watchlist.watchlist_id == watchlist_id).first()
    if not wl:
        raise HTTPException(status_code=404, detail="清單不存在")
    stock = db.query(models.Stock).filter(models.Stock.stock_id == payload.stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="股票不存在")
    exists = db.query(models.WatchlistStock).filter(
        models.WatchlistStock.watchlist_id == watchlist_id,
        models.WatchlistStock.stock_id == payload.stock_id,
    ).first()
    if exists:
        raise HTTPException(status_code=409, detail="股票已在清單中")
    ws = models.WatchlistStock(watchlist_id=watchlist_id, stock_id=payload.stock_id)
    db.add(ws)
    db.commit()
    return {"success": True, "message": "已加入清單"}


@router.delete("/{watchlist_id}/stocks/{stock_id}", response_model=schemas.SuccessResponse)
def remove_stock_from_watchlist(
    watchlist_id: int, stock_id: int, db: Session = Depends(get_db)
):
    ws = db.query(models.WatchlistStock).filter(
        models.WatchlistStock.watchlist_id == watchlist_id,
        models.WatchlistStock.stock_id == stock_id,
    ).first()
    if not ws:
        raise HTTPException(status_code=404, detail="找不到此關聯")
    db.delete(ws)
    db.commit()
    return {"success": True, "message": "已從清單移除"}
