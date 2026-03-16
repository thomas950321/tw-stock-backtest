import httpx
from app.config import settings


async def send_backtest_result(
    strategy_name: str,
    stock_symbol: str,
    total_return: float,
    max_drawdown: float,
    win_rate: float,
    result_id: int,
):
    if not settings.DISCORD_WEBHOOK_URL:
        return

    color = 0x2ECC71 if total_return >= 0 else 0xE74C3C

    payload = {
        "embeds": [
            {
                "title": f"📊 回測完成｜{strategy_name} × {stock_symbol}",
                "color": color,
                "fields": [
                    {"name": "💰 總報酬率", "value": f"`{total_return * 100:.2f}%`", "inline": True},
                    {"name": "📉 最大回撤", "value": f"`{max_drawdown * 100:.2f}%`", "inline": True},
                    {"name": "🎯 勝率",     "value": f"`{win_rate * 100:.2f}%`",     "inline": True},
                ],
                "footer": {"text": f"Result ID: {result_id}"},
            }
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(settings.DISCORD_WEBHOOK_URL, json=payload)
    except Exception as e:
        print(f"[Discord] 推播失敗：{e}")
