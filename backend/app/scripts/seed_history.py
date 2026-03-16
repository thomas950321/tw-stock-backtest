
import asyncio
import logging
from datetime import date, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.services.finmind_service import fetch_taiwan_stock_price

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_historical_prices(years=5):
    """抓取過去 N 年的歷史股價資料
    為避免打 API 太多次被鎖，這個腳本只針對「目前有在自選清單裡的股票」或是「第一檔策略有測到的股票」進行抓取。
    我們為了示範，先預設抓取 2330, 2454, 2317 等熱門權值股或第一份清單有的。
    """
    db = SessionLocal()
    try:
        # 1. 取得需要抓取歷史資料的標的 (這裡先抓自選清單裡的股票來當範例，如果不夠再手動加)
        watch_stocks_ids = db.query(models.WatchlistStock.stock_id).distinct().all()
        stock_ids = [s[0] for s in watch_stocks_ids]
        
        # 預設至少抓幾檔大盤權值股，讓使用者有東西測
        default_symbols = ["2330", "2454", "2317", "2308", "2881"]
        default_stocks = db.query(models.Stock).filter(models.Stock.symbol.in_(default_symbols)).all()
        
        target_stocks = db.query(models.Stock).filter(models.Stock.stock_id.in_(stock_ids)).all()
        
        # 合併目標
        targets = {s.symbol: s for s in target_stocks + default_stocks}

        if not targets:
            logger.warning("沒有找到任何目標股票，結束執行。")
            return

        today = date.today()
        start_date = today - timedelta(days=365 * years)
        
        logger.info(f"📅 開始抓取歷史股價資料 (從 {start_date} 到 {today})...")
        logger.info(f"預計抓取股票：{list(targets.keys())}")

        for symbol, stock in targets.items():
            try:
                logger.info(f"正在抓取 {symbol} ({stock.name})...")
                rows = await fetch_taiwan_stock_price(
                    stock_id   = symbol,
                    start_date = start_date,
                    end_date   = today,
                )
                
                if not rows:
                    logger.warning(f"  ⚠️ {symbol} 沒有回傳資料")
                    continue
                    
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
                            volume        = row.get("Trading_Volume", 0),
                        ))
                        inserted += 1
                
                db.commit()
                logger.info(f"  ✅ {symbol} 成功寫入 {inserted} 筆歷史資料")
                
                # FinMind API 限制，避免請求過快
                await asyncio.sleep(2)
                
            except Exception as e:
                db.rollback()
                logger.error(f"  ❌ {symbol} 抓取或寫入失敗：{e}")

    finally:
        db.close()
    
    logger.info("🎉 歷史股價資料抓取完成！")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='抓取歷史股價')
    parser.add_argument('--years', type=int, default=3, help='抓取幾年的歷史資料 (預設 3 年)')
    args = parser.parse_args()
    
    asyncio.run(seed_historical_prices(years=args.years))
