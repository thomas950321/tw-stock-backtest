import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { strategiesApi, stocksApi, backtestApi } from "../api";
import { ErrorAlert, PageHeader } from "../components/ui";
import { FlaskConical } from "lucide-react";
import dayjs from "dayjs";

export default function Backtest() {
  const navigate = useNavigate();
  const [strategies,   setStrategies]   = useState([]);
  const [stocks,       setStocks]       = useState([]);
  const [form,         setForm]         = useState({
    strategy_id: "", stock_id: "",
    start_date: dayjs().subtract(1, "year").format("YYYY-MM-DD"),
    end_date:   dayjs().format("YYYY-MM-DD"),
  });
  const [stockSearch, setStockSearch] = useState("");
  const [running,     setRunning]     = useState(false);
  const [error,       setError]       = useState("");

  useEffect(() => {
    strategiesApi.getAll().then(setStrategies);
    stocksApi.getAll().then(setStocks);
  }, []);

  const filteredStocks = stocks.filter((s) =>
    s.symbol.toLowerCase().includes(stockSearch.toLowerCase()) || s.name.includes(stockSearch)
  );

  const handleRun = async () => {
    setError("");
    if (!form.strategy_id || !form.stock_id) { setError("請選擇策略與股票"); return; }
    setRunning(true);
    try {
      const payload = {
        ...form,
        strategy_id: parseInt(form.strategy_id, 10),
        stock_id: parseInt(form.stock_id, 10)
      };
      const { result_id } = await backtestApi.run(payload);
      navigate(`/results/${result_id}`);
    } catch (e) { setError(e.message); setRunning(false); }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="執行回測" description="選擇策略、股票與回測區間，系統將自動計算績效" />
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">📐 選擇策略 *</label>
          <select value={form.strategy_id} onChange={(e) => { setForm({ ...form, strategy_id: e.target.value }); setError(""); }}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">請選擇策略...</option>
            {strategies.map((s) => <option key={s.strategy_id} value={s.strategy_id}>{s.name}</option>)}
          </select>
          {form.strategy_id && (
            <div className="mt-2 bg-gray-50 rounded-lg p-3 text-xs text-gray-500 font-mono">
              {JSON.stringify(strategies.find((s) => s.strategy_id == form.strategy_id)?.parameters, null, 2)}
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">📈 選擇股票 *</label>
          <input value={stockSearch} onChange={(e) => setStockSearch(e.target.value)} placeholder="輸入代號或名稱篩選..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <div className="border border-gray-200 rounded-lg overflow-y-auto max-h-48 custom-scrollbar">
            {filteredStocks.map((s) => (
              <div 
                key={s.stock_id} 
                onClick={() => { setForm({ ...form, stock_id: s.stock_id }); setError(""); }}
                className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                  form.stock_id == s.stock_id ? "bg-blue-500 text-white" : "hover:bg-gray-50 text-gray-700"
                }`}
              >
                {s.symbol} — {s.name}
              </div>
            ))}
            {filteredStocks.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-gray-500">找不到符合的股票</div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📅 開始日期</label>
            <input type="date" value={form.start_date} onChange={(e) => { setForm({ ...form, start_date: e.target.value }); setError(""); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📅 結束日期</label>
            <input type="date" value={form.end_date} onChange={(e) => { setForm({ ...form, end_date: e.target.value }); setError(""); }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        {error && <ErrorAlert message={error} />}
        <button onClick={handleRun} disabled={running}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-semibold transition-colors">
          {running ? (
            <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />回測執行中，請稍候...</>
          ) : (
            <><FlaskConical size={18} />執行回測</>
          )}
        </button>
        {running && <p className="text-center text-sm text-gray-400">系統正在計算交易訊號與績效指標，完成後將自動跳轉至結果頁面</p>}
      </div>
    </div>
  );
}
