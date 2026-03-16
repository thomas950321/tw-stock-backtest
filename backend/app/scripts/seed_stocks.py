import asyncio
import logging
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.services.finmind_service import fetch_taiwan_stock_info

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_stocks():
    db = SessionLocal()
    try:
        logger.info("📅 開始抓取台股基本資訊 (FinMind)...")
        # 1. 抓取 FinMind List
        stock_list = await fetch_taiwan_stock_info()
        logger.info(f"API 回傳 {len(stock_list)} 筆資料")

        # 2. 過濾並只保留上市 (TSE) / 上櫃 (OTC) 的「股票」(不含權證、ETF 等可視需求調整)
        inserted = 0
        for item in stock_list:
            # item 範例: {'industry_category': '半導體業', 'stock_id': '2330', 'stock_name': '台積電', 'type': 'twse'}
            symbol = str(item.get("stock_id", ""))
            
            # 簡單過濾：只抓純數字代號（台股股票代號通常是 4 碼）
            if not symbol.isdigit() or len(symbol) != 4:
                continue

            name = item.get("stock_name", "")
            market = item.get("type", "").upper()
            industry = item.get("industry_category", "")

            # 3. 檢查是否存在
            exists = db.query(models.Stock).filter(models.Stock.symbol == symbol).first()
            if not exists:
                db.add(models.Stock(
                    symbol=symbol,
                    name=name,
                    market=market,
                    industry=industry
                ))
                inserted += 1

        db.commit()
        logger.info(f"✅ 成功寫入 {inserted} 筆新的股票基本資料")

    except Exception as e:
        db.rollback()
        logger.error(f"❌ 寫入失敗: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(seed_stocks())
