import asyncio
from datetime import date
from app.services.finmind_service import fetch_taiwan_stock_price

async def test_finmind():
    try:
        print("Fetching for 3629...")
        data = await fetch_taiwan_stock_price("3629", date(2025, 3, 12), date(2026, 3, 12))
        print(f"Result count: {len(data)}")
        if data:
            print(f"First element: {data[0]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_finmind())
