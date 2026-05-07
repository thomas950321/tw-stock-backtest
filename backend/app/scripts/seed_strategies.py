import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import SessionLocal
from app import models

def seed_strategies():
    from app.database import Base, engine
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    strategies = [
        # MA Cross Variations
        {
            "name": "均線交叉 (短期 5/20)",
            "description": "經典短期均線黃金交叉買入，死亡交叉賣出。適合短線交易。",
            "parameters": {"type": "ma_cross", "ma_short": 5, "ma_long": 20}
        },
        {
            "name": "均線交叉 (中期 20/60)",
            "description": "月線與季線交叉，過濾掉短期的雜訊。適合中波段操作。",
            "parameters": {"type": "ma_cross", "ma_short": 20, "ma_long": 60}
        },
        {
            "name": "均線交叉 (長期 60/120)",
            "description": "季線與半年線交叉。適合大趨勢追蹤，交易次數較少。",
            "parameters": {"type": "ma_cross", "ma_short": 60, "ma_long": 120}
        },
        # RSI Variations
        {
            "name": "RSI 超賣買入 (標準 70/30)",
            "description": "RSI 低於 30 買入，高於 70 賣出。標準的反轉策略。",
            "parameters": {"type": "rsi", "period": 14, "oversold": 30, "overbought": 70}
        },
        {
            "name": "RSI 超賣買入 (保守 80/20)",
            "description": "RSI 低於 20 才買入，高於 80 賣出。更保守，機會較少但通常反轉信號更強。",
            "parameters": {"type": "rsi", "period": 14, "oversold": 20, "overbought": 80}
        },
        {
            "name": "RSI 短線積極 (60/40)",
            "description": "RSI 低於 40 買入，高於 60 賣出。適合震盪幅度較小的盤勢。",
            "parameters": {"type": "rsi", "period": 7, "oversold": 40, "overbought": 60}
        },
        # Bollinger Bands Variations
        {
            "name": "布林通道反轉 (標準 20/2)",
            "description": "觸碰下軌買入，觸碰上軌賣出。標準差設為 2。",
            "parameters": {"type": "bollinger", "period": 20, "std_dev": 2}
        },
        {
            "name": "布林通道反轉 (積極 20/3)",
            "description": "標準差設為 3。尋求極端的價格偏離進行反轉交易。",
            "parameters": {"type": "bollinger", "period": 20, "std_dev": 3}
        },
        {
            "name": "布林通道變形 (緊湊 10/1.5)",
            "description": "週期較短、標準差較小。捕捉短期的價格突破。",
            "parameters": {"type": "bollinger", "period": 10, "std_dev": 1.5}
        }
    ]

    print("Seeding more trading strategies...")
    inserted_count = 0
    for strat_data in strategies:
        # Check if already exists by name
        exists = db.query(models.Strategy).filter(models.Strategy.name == strat_data["name"]).first()
        if not exists:
            new_strat = models.Strategy(
                name=strat_data["name"],
                description=strat_data["description"],
                parameters=strat_data["parameters"]
            )
            db.add(new_strat)
            inserted_count += 1
    
    db.commit()
    db.close()
    print(f"Successfully seeded {inserted_count} new strategies!")

if __name__ == "__main__":
    seed_strategies()
