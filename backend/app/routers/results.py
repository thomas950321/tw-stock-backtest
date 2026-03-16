from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app import models, schemas

router = APIRouter(prefix="/results", tags=["Results"])


@router.get("", response_model=List[schemas.BacktestResultOut])
def get_results(
    sort: Optional[str] = Query("created_at"),
    db: Session = Depends(get_db),
):
    q = db.query(models.BacktestResult)
    if sort == "total_return":
        q = q.order_by(models.BacktestResult.total_return.desc())
    else:
        q = q.order_by(models.BacktestResult.created_at.desc())

    results = q.all()
    output = []
    for r in results:
        item = schemas.BacktestResultOut.model_validate(r)
        item.strategy_name = r.strategy.name if r.strategy else None
        item.stock_symbol  = r.stock.symbol   if r.stock else None
        item.stock_name    = r.stock.name     if r.stock else None
        output.append(item)
    return output


@router.get("/{result_id}", response_model=schemas.BacktestResultOut)
def get_result(result_id: int, db: Session = Depends(get_db)):
    r = db.query(models.BacktestResult).filter(
        models.BacktestResult.result_id == result_id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="回測結果不存在")
    item = schemas.BacktestResultOut.model_validate(r)
    item.strategy_name = r.strategy.name if r.strategy else None
    item.stock_symbol  = r.stock.symbol   if r.stock else None
    item.stock_name    = r.stock.name     if r.stock else None
    return item


@router.get("/{result_id}/trades", response_model=List[schemas.TradeRecordOut])
def get_trades(result_id: int, db: Session = Depends(get_db)):
    r = db.query(models.BacktestResult).filter(
        models.BacktestResult.result_id == result_id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="回測結果不存在")
    return r.trade_records


@router.get("/{result_id}/ai-analysis", tags=["AI"])
async def get_ai_analysis(result_id: int, db: Session = Depends(get_db)):
    from app.services.ai_service import analyze_strategy
    r = db.query(models.BacktestResult).filter(
        models.BacktestResult.result_id == result_id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="回測結果不存在")

    trades_data = [
        {
            "trade_date": str(t.trade_date),
            "action":     t.action,
            "price":      float(t.price),
            "quantity":   t.quantity,
        }
        for t in r.trade_records
    ]

    analysis = await analyze_strategy(
        strategy_name = r.strategy.name,
        parameters    = r.strategy.parameters or {},
        total_return  = float(r.total_return or 0),
        max_drawdown  = float(r.max_drawdown or 0),
        win_rate      = float(r.win_rate or 0),
        trades        = trades_data,
    )

    return {"result_id": result_id, "analysis": analysis}
