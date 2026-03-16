# 股票回測系統 Stock Backtest System

## 技術架構

| 層級 | 技術 |
|------|------|
| 前端 | React 18 + Vite + Tailwind CSS + Recharts |
| 後端 | Python FastAPI + SQLAlchemy |
| 資料庫 | MySQL 8.0+ |
| 外部 API | FinMind（台股股價）|

---

## 快速啟動

### 後端

```bash
cd backend

# 1. 安裝套件
pip install -r requirements.txt

# 2. 設定環境變數
cp .env.example .env
# 編輯 .env，填入 DATABASE_URL

# 3. 啟動伺服器
uvicorn app.main:app --reload --port 8000

# API 文件：http://localhost:8000/api/docs
```

### 前端

```bash
cd frontend

# 1. 安裝套件
npm install

# 2. 啟動開發伺服器
npm run dev

# 瀏覽器開啟：http://localhost:5173
```

---

## 環境變數說明（backend/.env）

```env
# MySQL 連線字串（必填）
DATABASE_URL=mysql+pymysql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DBNAME>

# FinMind Token（選填，抓取台股股價用）
FINMIND_TOKEN=

# Discord Webhook（選填，回測完成推播）
DISCORD_WEBHOOK_URL=

# AI 健檢（擇一填入）
GEMINI_API_KEY=
OPENAI_API_KEY=

FRONTEND_URL=http://localhost:5173
```

---

## 支援策略

| 策略類型 | parameters 範例 |
|---------|----------------|
| 均線交叉 | `{"type": "ma_cross", "ma_short": 5, "ma_long": 20}` |
| RSI | `{"type": "rsi", "period": 14, "oversold": 30, "overbought": 70}` |
| 布林通道 | `{"type": "bollinger", "period": 20, "std_dev": 2}` |

---

## 頁面路由

| 路由 | 功能 |
|------|------|
| `/` | Dashboard 統計摘要 |
| `/stocks` | 股票列表與搜尋 |
| `/stocks/:id` | 個股詳情與股價圖 |
| `/watchlists` | 自選清單管理 |
| `/strategies` | 策略 CRUD |
| `/backtest` | 執行回測 |
| `/results` | 回測結果列表 |
| `/results/:id` | 回測詳情 + AI 健檢 |

---

## 手動更新股價

```bash
cd backend
python -m app.scheduler.price_updater
```
