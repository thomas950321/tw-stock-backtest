from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas
from app.services.backtest_engine import run_strategy, calculate_metrics
from app.services.discord_service import send_backtest_result

router = APIRouter(prefix="/backtest", tags=["Backtest"])


@router.post("", response_model=schemas.BacktestResponse, status_code=201)
async def run_backtest(
    payload: schemas.BacktestRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    strategy = db.query(models.Strategy).filter(
        models.Strategy.strategy_id == payload.strategy_id
    ).first()
    if not strategy:
        raise HTTPException(status_code=404, detail="策略不存在")

    stock = db.query(models.Stock).filter(
        models.Stock.stock_id == payload.stock_id
    ).first()
    if not stock:
        raise HTTPException(status_code=404, detail="股票不存在")

    print("Querying price rows...")
    price_rows = (
        db.query(models.Price)
        .filter(
            models.Price.stock_id      == payload.stock_id,
            models.Price.interval_type == "1d",
            models.Price.datetime      >= payload.start_date,
            models.Price.datetime      <= payload.end_date,
        )
        .order_by(models.Price.datetime.asc())
        .all()
    )
    print(f"Price rows loaded: {len(price_rows)}")

    if len(price_rows) < 2:
        print("Not enough price rows. Auto-fetching historical data...")
        try:
            from app.services.finmind_service import fetch_taiwan_stock_price
            from datetime import datetime
            new_data = await fetch_taiwan_stock_price(
                stock_id=stock.symbol,
                start_date=payload.start_date,
                end_date=payload.end_date,
                market=stock.market
            )
            if new_data:
                for row in new_data:
                    dt_obj = datetime.strptime(row["date"], "%Y-%m-%d")
                    exists = db.query(models.Price).filter(
                        models.Price.stock_id == stock.stock_id,
                        models.Price.datetime == dt_obj,
                        models.Price.interval_type == "1d",
                    ).first()
                    if not exists:
                        db.add(models.Price(
                            stock_id=stock.stock_id,
                            datetime=dt_obj,
                            interval_type="1d",
                            open=row.get("open"),
                            high=row.get("max"),
                            low=row.get("min"),
                            close=row.get("close"),
                            volume=row.get("Trading_Volume", 0),
                        ))
                db.commit()
                # Re-query
                price_rows = (
                    db.query(models.Price)
                    .filter(
                        models.Price.stock_id      == payload.stock_id,
                        models.Price.interval_type == "1d",
                        models.Price.datetime      >= payload.start_date,
                        models.Price.datetime      <= payload.end_date,
                    )
                    .order_by(models.Price.datetime.asc())
                    .all()
                )
                print(f"Auto-fetch complete. New price rows loaded: {len(price_rows)}")
        except Exception as e:
            print(f"Auto-fetch failed: {e}")

    if len(price_rows) < 2:
        print("Error: Still not enough price rows.")
        raise HTTPException(
            status_code=422,
            detail="系統嘗試向開放資料索取股價，但該區間內股價資料依然不足，請嘗試變更您的日期範圍！"
        )

    trades = run_strategy(price_rows, strategy.parameters or {})

    if not trades:
        raise HTTPException(
            status_code=422,
            detail="策略在此期間未產生任何交易訊號，請調整參數或擴大日期範圍"
        )

    print(f"Starting calculation... trades generated: {len(trades) if trades else 0}")
    total_return, max_drawdown, win_rate = calculate_metrics(trades)
    print(f"Metrics calculated: {total_return}, {max_drawdown}, {win_rate}")

    result = models.BacktestResult(
        strategy_id  = payload.strategy_id,
        stock_id     = payload.stock_id,
        start_date   = payload.start_date,
        end_date     = payload.end_date,
        total_return = total_return,
        max_drawdown = max_drawdown,
        win_rate     = win_rate,
    )
    db.add(result)
    db.flush()
    print("Database Result added")

    for t in trades:
        db.add(models.TradeRecord(
            result_id  = result.result_id,
            trade_date = t.trade_date,
            action     = t.action,
            price      = t.price,
            quantity   = t.quantity,
        ))

    db.commit()
    db.refresh(result)

    print("Sending background task...")
    background_tasks.add_task(
        send_backtest_result,
        strategy_name = strategy.name,
        stock_symbol  = stock.symbol,
        total_return  = float(total_return),
        max_drawdown  = float(max_drawdown),
        win_rate      = float(win_rate),
        result_id     = result.result_id,
    )
    print("Background task queued. API returning...")
    return {"result_id": result.result_id}
