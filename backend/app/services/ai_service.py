import httpx
import json
from typing import List, Dict, Any
from app.config import settings


async def analyze_strategy(
    strategy_name: str,
    parameters: Dict[str, Any],
    total_return: float,
    max_drawdown: float,
    win_rate: float,
    trades: List[Dict[str, Any]],
) -> str:
    prompt = _build_prompt(strategy_name, parameters, total_return, max_drawdown, win_rate, trades)

    if settings.GEMINI_API_KEY:
        return await _call_gemini(prompt)
    elif settings.OPENAI_API_KEY:
        return await _call_openai(prompt)
    else:
        return "⚠️ 尚未設定 AI API 金鑰（GEMINI_API_KEY 或 OPENAI_API_KEY），請在 .env 中填入。"


def _build_prompt(strategy_name, parameters, total_return, max_drawdown, win_rate, trades):
    trade_sample = trades[:20]
    trade_text = "\n".join([
        f"  {t.get('trade_date')} | {t.get('action'):4s} | 價格:{t.get('price')} | 數量:{t.get('quantity')}"
        for t in trade_sample
    ])
    if len(trades) > 20:
        trade_text += f"\n  ...（共 {len(trades)} 筆，僅顯示前 20 筆）"

    return f"""你是一位專業的量化交易策略分析師，請針對以下回測結果給出繁體中文的策略健檢報告。

## 策略資訊
- 策略名稱：{strategy_name}
- 策略參數：{json.dumps(parameters, ensure_ascii=False)}

## 績效指標
- 總報酬率：{total_return * 100:.2f}%
- 最大回撤：{max_drawdown * 100:.2f}%
- 勝　　率：{win_rate * 100:.2f}%

## 交易明細（樣本）
{trade_text}

## 請依以下格式回答：

### 🔍 整體評估
（2-3 句話總結此策略表現）

### ✅ 策略優點
（列出 2-3 點）

### ⚠️ 潛在風險
（列出 2-3 點）

### 🛠️ 優化建議
（列出 3-5 點具體可調整的方向）

### 📌 結論
（一句話總結是否建議使用此策略）
"""


async def _call_gemini(prompt: str) -> str:
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024},
    }
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        return f"❌ Gemini API 呼叫失敗：{e}"


async def _call_openai(prompt: str) -> str:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
        "Content-Type":  "application/json",
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "你是一位專業的量化交易策略分析師，請用繁體中文回答。"},
            {"role": "user",   "content": prompt},
        ],
        "max_tokens": 1024,
        "temperature": 0.7,
    }
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        return f"❌ OpenAI API 呼叫失敗：{e}"
