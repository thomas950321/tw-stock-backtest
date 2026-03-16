import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { dashboardApi, resultsApi } from "../api";
import { StatCard, Spinner, ErrorAlert } from "../components/ui";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    Promise.all([dashboardApi.getSummary(), resultsApi.getAll({ limit: 5 })])
      .then(([s, r]) => { setSummary(s); setResults(Array.isArray(r) ? r.slice(0, 5) : []); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error)   return <ErrorAlert message={error} />;

  const bestReturn = summary?.best_return ? `${(summary.best_return * 100).toFixed(2)}%` : "—";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">系統整體狀況一覽</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="股票總數"     value={summary?.total_stocks}     icon="📈" color="blue"   />
        <StatCard label="策略數量"     value={summary?.total_strategies} icon="🧠" color="purple" />
        <StatCard label="回測次數"     value={summary?.total_backtests}  icon="🔬" color="green"  />
        <StatCard label="最佳策略報酬" value={bestReturn}                icon="🏆" color="green"  />
      </div>
      <div className="flex gap-3 mb-8">
        <Link to="/backtest" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">▶ 執行回測</Link>
        <Link to="/strategies" className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">＋ 新增策略</Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">最近回測結果</h2>
          <Link to="/results" className="text-blue-500 text-sm hover:underline">查看全部</Link>
        </div>
        {results.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">尚無回測記錄</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {results.map((r) => {
              const ret = parseFloat(r.total_return || 0);
              const pos = ret >= 0;
              return (
                <Link key={r.result_id} to={`/results/${r.result_id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{r.strategy_name} × {r.stock_symbol}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.start_date} ～ {r.end_date}</p>
                  </div>
                  <div className={`flex items-center gap-1 font-semibold text-sm ${pos ? "text-green-600" : "text-red-500"}`}>
                    {pos ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    {(ret * 100).toFixed(2)}%
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
