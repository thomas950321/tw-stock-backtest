import asyncio
from app.database import SessionLocal
from app import models

def check_strategies():
    db = SessionLocal()
    try:
        strategies = db.query(models.Strategy).all()
        print(f"Total strategies: {len(strategies)}")
        for s in strategies:
            print(f"ID: {s.strategy_id}, Name: {s.name}")
    finally:
        db.close()

if __name__ == "__main__":
    check_strategies()
