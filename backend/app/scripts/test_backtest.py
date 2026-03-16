import requests
import json

payload = {
    "strategy_id": 1,
    "stock_id": 1,
    "start_date": "2024-03-10",
    "end_date": "2026-03-10"
}

try:
    response = requests.post(
        "http://localhost:8000/api/backtest", 
        json=payload,
        headers={"Content-Type": "application/json"}
    )
    print("Status Code:", response.status_code)
    print("Response Body:", response.json())
except Exception as e:
    print("Error:", e)
