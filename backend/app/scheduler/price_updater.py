import asyncio
import logging
from datetime import date, timedelta
from sqlalchemy.orm import Session
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database import SessionLocal
from app import models
from app.services.finmind_service import fetch_taiwan_stock_price

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def update_prices_for_stock(db: Session, stock: models.Stock):
    today     = date.today()
    yesterday = today - timedelta(days=1)

    try:
        rows = await fetch_taiwan_stock_price(
            stock_id   = stock.symbol,
            start_date = yesterday,
            end_date   = today,
        )
        inserted = 0
        for row in rows:
            exists = db.query(models.Price).filter(
                models.Price.stock_id      == stock.stock_id,
                models.Price.datetime      == row["date"],
                models.Price.interval_type == "1d",
            ).first()
            if not exists:
                db.add(models.Price(
                    stock_id      = stock.stock_id,
                    datetime      = row["date"],
                    interval_type = "1d",
                    open          = row.get("open"),
                    high          = row.get("max"),
                    low           = row.get("min"),
                    close         = row.get("close"),
                    volume        = row.get("Trading_Volume"),
                ))
                inserted += 1
        db.commit()
        logger.info(f"✅ {stock.symbol} 更新完成，新增 {inserted} 筆")
    except Exception as e:
        db.rollback()
        logger.error(f"❌ {stock.symbol} 更新失敗：{e}")


async def run_daily_update():
    logger.info("📅 開始每日股價更新...")
    db = SessionLocal()
    try:
        stocks = db.query(models.Stock).all()
        logger.info(f"共 {len(stocks)} 支股票待更新")
        for i, stock in enumerate(stocks):
            await update_prices_for_stock(db, stock)
            if (i + 1) % 5 == 0:
                await asyncio.sleep(1)
    finally:
        db.close()
    logger.info("✅ 每日股價更新完成")


def create_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler(timezone="Asia/Taipei")
    scheduler.add_job(
        func             = run_daily_update,
        trigger          = CronTrigger(hour=18, minute=30),
        id               = "daily_price_update",
        name             = "每日股價更新",
        replace_existing = True,
    )
    return scheduler


if __name__ == "__main__":
    asyncio.run(run_daily_update())
