import asyncio
from app.database import SessionLocal
from app import models

def test_db():
    db = SessionLocal()
    strategy = db.query(models.Strategy).filter(
        models.Strategy.strategy_id == 1
    ).first()
    print("Strategy DB Record:", strategy.parameters)
    print("Strategy DB Type:", type(strategy.parameters))

if __name__ == "__main__":
    test_db()
