from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("backend_errors.log", encoding="utf-8"),
        logging.StreamHandler()
    ]
)

from app.config import settings
from app.database import Base, engine
from app.routers import stocks, watchlists, strategies, results, backtest
from app.scheduler.price_updater import create_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    scheduler = create_scheduler()
    scheduler.start()
    print("✅ 排程器已啟動（每日 18:30 自動更新股價）")
    yield
    scheduler.shutdown()
    print("🛑 排程器已停止")


app = FastAPI(
    title    = "股票回測系統 API",
    version  = "1.0.0",
    docs_url = "/api/docs",
    lifespan = lifespan,
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logging.error(f"Validation Error for {request.url}: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins     = [settings.FRONTEND_URL],
    allow_credentials = True,
    allow_methods     = ["*"],
    allow_headers     = ["*"],
)

app.include_router(stocks.router,      prefix="/api")
app.include_router(watchlists.router,  prefix="/api")
app.include_router(strategies.router,  prefix="/api")
app.include_router(results.router,     prefix="/api")
app.include_router(backtest.router,    prefix="/api")


@app.get("/api/health", tags=["System"])
def health_check():
    return {"status": "ok"}


@app.get("/api/summary", tags=["Dashboard"])
def get_summary():
    from app.database import SessionLocal
    from app import models
    from sqlalchemy import func
    db = SessionLocal()
    try:
        return {
            "total_stocks":     db.query(models.Stock).count(),
            "total_strategies": db.query(models.Strategy).count(),
            "total_backtests":  db.query(models.BacktestResult).count(),
            "best_return":      db.query(func.max(models.BacktestResult.total_return)).scalar(),
        }
    finally:
        db.close()
