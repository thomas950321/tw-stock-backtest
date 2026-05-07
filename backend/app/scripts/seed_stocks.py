import asyncio
import logging
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models
from app.services.finmind_service import fetch_taiwan_stock_info

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def seed_stocks():
    from app.database import Base, engine
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        logger.info("📅 開始抓取台股基本資訊 (FinMind)...")
        # 1. 抓取 FinMind List
        stock_list = await fetch_taiwan_stock_info()
        logger.info(f"API 回傳 {len(stock_list)} 筆資料")

        # 2. 過濾並只保留上市 (TSE) / 上櫃 (OTC) 的「股票」
        logger.info("正在篩選資料...")
        existing_symbols = set(row[0] for row in db.query(models.Stock.symbol).all())
        
        to_add = []
        for item in stock_list:
            symbol = str(item.get("stock_id", ""))
            if not symbol.isdigit() or len(symbol) != 4:
                continue
            
            if symbol not in existing_symbols:
                to_add.append(models.Stock(
                    symbol=symbol,
                    name=item.get("stock_name", ""),
                    market=item.get("type", "").upper(),
                    industry=item.get("industry_category", "")
                ))

        # 3. 批次寫入
        if to_add:
            logger.info(f"正在批次寫入 {len(to_add)} 筆新資料...")
            db.bulk_save_objects(to_add)
            db.commit()
            logger.info(f"✅ 成功寫入 {len(to_add)} 筆股票資料")
        else:
            logger.info("ℹ️ 沒有發現新資料，無需更新")

    except Exception as e:
        db.rollback()
        logger.error(f"❌ 寫入失敗: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(seed_stocks())
