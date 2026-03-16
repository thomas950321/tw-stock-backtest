import pandas as pd
from typing import List, Tuple
from datetime import date


class TradeSignal:
    def __init__(self, trade_date: date, action: str, price: float, quantity: int):
        self.trade_date = trade_date
        self.action     = action
        self.price      = price
        self.quantity   = quantity


class BacktestMetrics:
    def __init__(self, total_return, max_drawdown, win_rate, trades):
        self.total_return = total_return
        self.max_drawdown = max_drawdown
        self.win_rate     = win_rate
        self.trades       = trades


def run_strategy(price_rows: list, parameters: dict) -> List[TradeSignal]:
    strategy_type = (parameters or {}).get("type", "ma_cross")
    if strategy_type == "rsi":
        return _rsi_strategy(price_rows, parameters)
    elif strategy_type == "bollinger":
        return _bollinger_strategy(price_rows, parameters)
    else:
        return _ma_cross_strategy(price_rows, parameters)


def _ma_cross_strategy(price_rows: list, parameters: dict) -> List[TradeSignal]:
    ma_short = int((parameters or {}).get("ma_short", 5))
    ma_long  = int((parameters or {}).get("ma_long",  20))

    df = _to_dataframe(price_rows)
    if len(df) < ma_long:
        return []

    df["ma_short"]   = df["close"].rolling(ma_short).mean()
    df["ma_long"]    = df["close"].rolling(ma_long).mean()
    df["prev_short"] = df["ma_short"].shift(1)
    df["prev_long"]  = df["ma_long"].shift(1)
    df.dropna(inplace=True)

    trades = []
    in_position = False

    for _, row in df.iterrows():
        golden_cross = row["prev_short"] < row["prev_long"] and row["ma_short"] >= row["ma_long"]
        death_cross  = row["prev_short"] > row["prev_long"] and row["ma_short"] <= row["ma_long"]

        if golden_cross and not in_position:
            trades.append(TradeSignal(row["date"], "buy", row["close"], 1000))
            in_position = True
        elif death_cross and in_position:
            trades.append(TradeSignal(row["date"], "sell", row["close"], 1000))
            in_position = False

    if in_position and len(df) > 0:
        last = df.iloc[-1]
        trades.append(TradeSignal(last["date"], "sell", last["close"], 1000))

    return trades


def _rsi_strategy(price_rows: list, parameters: dict) -> List[TradeSignal]:
    period     = int(parameters.get("period",      14))
    oversold   = float(parameters.get("oversold",  30))
    overbought = float(parameters.get("overbought", 70))

    df = _to_dataframe(price_rows)
    if len(df) < period + 1:
        return []

    delta = df["close"].diff()
    gain  = delta.clip(lower=0).rolling(period).mean()
    loss  = (-delta.clip(upper=0)).rolling(period).mean()
    rs    = gain / loss.replace(0, float("nan"))
    df["rsi"] = 100 - (100 / (1 + rs))
    df.dropna(inplace=True)

    trades = []
    in_position = False

    for _, row in df.iterrows():
        if row["rsi"] < oversold and not in_position:
            trades.append(TradeSignal(row["date"], "buy", row["close"], 1000))
            in_position = True
        elif row["rsi"] > overbought and in_position:
            trades.append(TradeSignal(row["date"], "sell", row["close"], 1000))
            in_position = False

    if in_position and len(df) > 0:
        last = df.iloc[-1]
        trades.append(TradeSignal(last["date"], "sell", last["close"], 1000))

    return trades


def _bollinger_strategy(price_rows: list, parameters: dict) -> List[TradeSignal]:
    period  = int(parameters.get("period",  20))
    std_dev = float(parameters.get("std_dev", 2))

    df = _to_dataframe(price_rows)
    if len(df) < period:
        return []

    df["ma"]    = df["close"].rolling(period).mean()
    df["std"]   = df["close"].rolling(period).std()
    df["upper"] = df["ma"] + std_dev * df["std"]
    df["lower"] = df["ma"] - std_dev * df["std"]
    df.dropna(inplace=True)

    trades = []
    in_position = False

    for _, row in df.iterrows():
        if row["close"] < row["lower"] and not in_position:
            trades.append(TradeSignal(row["date"], "buy", row["close"], 1000))
            in_position = True
        elif row["close"] > row["upper"] and in_position:
            trades.append(TradeSignal(row["date"], "sell", row["close"], 1000))
            in_position = False

    if in_position and len(df) > 0:
        last = df.iloc[-1]
        trades.append(TradeSignal(last["date"], "sell", last["close"], 1000))

    return trades


def calculate_metrics(trades: List[TradeSignal]) -> Tuple[float, float, float]:
    if not trades:
        return 0.0, 0.0, 0.0

    INITIAL_CAPITAL = 1_000_000.0
    cash        = INITIAL_CAPITAL
    position    = 0
    entry_price = 0.0
    profits     = []
    equity_curve = [INITIAL_CAPITAL]

    for trade in trades:
        if trade.action == "buy":
            cost = trade.price * trade.quantity
            if cash >= cost:
                cash       -= cost
                position    = trade.quantity
                entry_price = trade.price
        elif trade.action == "sell" and position > 0:
            revenue = trade.price * trade.quantity
            profit  = (trade.price - entry_price) * trade.quantity
            cash   += revenue
            position = 0
            profits.append(profit)
            equity_curve.append(cash)

    total_return = (cash - INITIAL_CAPITAL) / INITIAL_CAPITAL
    max_drawdown = _calculate_max_drawdown(equity_curve)
    win_rate     = sum(1 for p in profits if p > 0) / len(profits) if profits else 0.0

    return round(total_return, 4), round(max_drawdown, 4), round(win_rate, 4)


def _calculate_max_drawdown(equity_curve: List[float]) -> float:
    if len(equity_curve) < 2:
        return 0.0
    peak   = equity_curve[0]
    max_dd = 0.0
    for value in equity_curve:
        if value > peak:
            peak = value
        drawdown = (peak - value) / peak if peak > 0 else 0
        if drawdown > max_dd:
            max_dd = drawdown
    return round(max_dd, 4)


def _to_dataframe(price_rows: list) -> pd.DataFrame:
    data = [
        {
            "date":   row.datetime.date(),
            "open":   float(row.open  or 0),
            "high":   float(row.high  or 0),
            "low":    float(row.low   or 0),
            "close":  float(row.close or 0),
            "volume": int(row.volume  or 0),
        }
        for row in price_rows
    ]
    return pd.DataFrame(data)
