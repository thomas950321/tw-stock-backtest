import httpx
from datetime import date
from typing import List, Dict, Any
from app.config import settings

FINMIND_BASE_URL = "https://api.finmindtrade.com/api/v4/data"


async def fetch_taiwan_stock_price(
    stock_id: str,
    start_date: date,
    end_date: date,
    market: str = "TWSE",
) -> List[Dict[str, Any]]:
    # FinMind actually serves both TWSE and TPEX stocks from TaiwanStockPrice
    params = {
        "dataset":    "TaiwanStockPrice",
        "data_id":    stock_id,
        "start_date": str(start_date),
        "end_date":   str(end_date),
        "token":      settings.FINMIND_TOKEN,
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(FINMIND_BASE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            if data.get("status") != 200:
                raise ValueError(f"FinMind API 錯誤：{data.get('msg', '未知錯誤')}")
            return data.get("data", [])
    except httpx.HTTPStatusError as e:
        raise RuntimeError(f"FinMind HTTP 錯誤：{e.response.status_code}")
    except Exception as e:
        raise RuntimeError(f"FinMind 抓取失敗：{e}")


async def fetch_taiwan_stock_info() -> List[Dict[str, Any]]:
    params = {
        "dataset": "TaiwanStockInfo",
        "token":   settings.FINMIND_TOKEN,
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(FINMIND_BASE_URL, params=params)
            resp.raise_for_status()
            data = resp.json()
            if data.get("status") != 200:
                raise ValueError(f"FinMind API 錯誤：{data.get('msg', '未知錯誤')}")
            return data.get("data", [])
    except Exception as e:
        raise RuntimeError(f"FinMind 抓取失敗：{e}")
