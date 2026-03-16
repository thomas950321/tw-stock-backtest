import asyncio
from datetime import date, datetime
from app.database import SessionLocal
from app import models
from app.services.finmind_service import fetch_taiwan_stock_price

async def test_insert():
    db = SessionLocal()
    stock = db.query(models.Stock).filter(models.Stock.symbol == "3629").first()
    if not stock:
        print("Stock 3629 not found!")
        return
        
    start_date = date(2025, 3, 12)
    end_date = date(2026, 3, 12)
    
    new_data = await fetch_taiwan_stock_price(stock.symbol, start_date, end_date)
    print(f"Fetched {len(new_data)} rows")
    
    try:
        inserted = 0
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
                inserted += 1
        db.commit()
        print(f"Inserted {inserted} rows")
        
        # Query it back
        price_rows = (
            db.query(models.Price)
            .filter(
                models.Price.stock_id == stock.stock_id,
                models.Price.interval_type == "1d",
                models.Price.datetime >= start_date,
                models.Price.datetime <= end_date,
            )
            .order_by(models.Price.datetime.asc())
            .all()
        )
        print(f"Query returned {len(price_rows)} rows")
    except Exception as e:
        db.rollback()
        print(f"Error during insert: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_insert())
