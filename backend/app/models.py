from sqlalchemy import (
    Column, Integer, String, Text, Date, DateTime,
    DECIMAL, BigInteger, Enum, JSON, ForeignKey,
    PrimaryKeyConstraint, func
)
from sqlalchemy.orm import relationship
from app.database import Base


class Stock(Base):
    __tablename__ = "STOCK"

    stock_id  = Column(Integer, primary_key=True, autoincrement=True)
    symbol    = Column(String(20), nullable=False, comment="股票代號，如 2330")
    name      = Column(String(100), nullable=False, comment="股票名稱，如 台積電")
    market    = Column(String(50), comment="所屬市場，如 TWSE")
    industry  = Column(String(50), comment="所屬產業，如 半導體")

    prices           = relationship("Price",          back_populates="stock", cascade="all, delete-orphan")
    backtest_results = relationship("BacktestResult", back_populates="stock")
    watchlist_stocks = relationship("WatchlistStock", back_populates="stock", cascade="all, delete-orphan")


class Price(Base):
    __tablename__ = "Price"
    __table_args__ = (
        PrimaryKeyConstraint("stock_id", "datetime", "interval_type"),
    )

    stock_id      = Column(Integer, ForeignKey("STOCK.stock_id"), nullable=False)
    datetime      = Column(DateTime, nullable=False)
    interval_type = Column(String(10), nullable=False)
    open          = Column(DECIMAL(12, 4))
    high          = Column(DECIMAL(12, 4))
    low           = Column(DECIMAL(12, 4))
    close         = Column(DECIMAL(12, 4))
    volume        = Column(BigInteger)

    stock = relationship("Stock", back_populates="prices")


class Watchlist(Base):
    __tablename__ = "Watchlist"

    watchlist_id = Column(Integer, primary_key=True, autoincrement=True)
    name         = Column(String(100), nullable=False)
    created_at   = Column(DateTime, server_default=func.now())

    watchlist_stocks = relationship(
        "WatchlistStock", back_populates="watchlist", cascade="all, delete-orphan"
    )


class WatchlistStock(Base):
    __tablename__ = "Watchlist_Stock"
    __table_args__ = (
        PrimaryKeyConstraint("watchlist_id", "stock_id"),
    )

    watchlist_id = Column(Integer, ForeignKey("Watchlist.watchlist_id"), nullable=False)
    stock_id     = Column(Integer, ForeignKey("STOCK.stock_id"),         nullable=False)

    watchlist = relationship("Watchlist", back_populates="watchlist_stocks")
    stock     = relationship("Stock",     back_populates="watchlist_stocks")


class Strategy(Base):
    __tablename__ = "Strategy"

    strategy_id  = Column(Integer, primary_key=True, autoincrement=True)
    name         = Column(String(100), nullable=False)
    description  = Column(Text)
    parameters   = Column(JSON)
    created_at   = Column(DateTime, server_default=func.now())

    backtest_results = relationship("BacktestResult", back_populates="strategy")


class BacktestResult(Base):
    __tablename__ = "Backtest_Result"

    result_id    = Column(Integer, primary_key=True, autoincrement=True)
    strategy_id  = Column(Integer, ForeignKey("Strategy.strategy_id"), nullable=False)
    stock_id     = Column(Integer, ForeignKey("STOCK.stock_id"),        nullable=False)
    start_date   = Column(Date, nullable=False)
    end_date     = Column(Date, nullable=False)
    total_return = Column(DECIMAL(8, 4))
    max_drawdown = Column(DECIMAL(8, 4))
    win_rate     = Column(DECIMAL(5, 4))
    created_at   = Column(DateTime, server_default=func.now())

    strategy      = relationship("Strategy",   back_populates="backtest_results")
    stock         = relationship("Stock",       back_populates="backtest_results")
    trade_records = relationship("TradeRecord", back_populates="result", cascade="all, delete-orphan")


class TradeRecord(Base):
    __tablename__ = "Trade_Record"

    trade_id   = Column(Integer, primary_key=True, autoincrement=True)
    result_id  = Column(Integer, ForeignKey("Backtest_Result.result_id"), nullable=False)
    trade_date = Column(Date, nullable=False)
    action     = Column(Enum("buy", "sell"), nullable=False)
    price      = Column(DECIMAL(12, 4), nullable=False)
    quantity   = Column(Integer, nullable=False)

    result = relationship("BacktestResult", back_populates="trade_records")
