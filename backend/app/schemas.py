from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import date, datetime
from decimal import Decimal


class StockBase(BaseModel):
    symbol: str
    name: str
    market: Optional[str] = None
    industry: Optional[str] = None

class StockCreate(StockBase):
    pass

class StockOut(StockBase):
    stock_id: int
    class Config:
        from_attributes = True


class PriceOut(BaseModel):
    stock_id: int
    datetime: datetime
    interval_type: str
    open: Optional[Decimal]
    high: Optional[Decimal]
    low: Optional[Decimal]
    close: Optional[Decimal]
    volume: Optional[int]
    class Config:
        from_attributes = True


class WatchlistCreate(BaseModel):
    name: str

class WatchlistOut(BaseModel):
    watchlist_id: int
    name: str
    created_at: datetime
    class Config:
        from_attributes = True

class WatchlistAddStock(BaseModel):
    stock_id: int


class StrategyCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parameters: Optional[Any] = None

class StrategyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parameters: Optional[Any] = None

class StrategyOut(BaseModel):
    strategy_id: int
    name: str
    description: Optional[str]
    parameters: Optional[Any]
    created_at: datetime
    class Config:
        from_attributes = True


class BacktestRequest(BaseModel):
    strategy_id: int
    stock_id: int
    start_date: date
    end_date: date

class BacktestResponse(BaseModel):
    result_id: int


class BacktestResultOut(BaseModel):
    result_id: int
    strategy_id: int
    stock_id: int
    start_date: date
    end_date: date
    total_return: Optional[Decimal]
    max_drawdown: Optional[Decimal]
    win_rate: Optional[Decimal]
    created_at: datetime
    strategy_name: Optional[str] = None
    stock_symbol: Optional[str] = None
    stock_name: Optional[str] = None
    class Config:
        from_attributes = True


class TradeRecordOut(BaseModel):
    trade_id: int
    result_id: int
    trade_date: date
    action: str
    price: Decimal
    quantity: int
    class Config:
        from_attributes = True


class SuccessResponse(BaseModel):
    success: bool
    message: Optional[str] = None

class SummaryOut(BaseModel):
    total_stocks: int
    total_strategies: int
    total_backtests: int
    best_return: Optional[Decimal]
