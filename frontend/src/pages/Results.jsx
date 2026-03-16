import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { resultsApi } from "../api";
import { Spinner, ErrorAlert, EmptyState, PageHeader, Badge } from "../components/ui";
import { TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";

function ReturnCell({ value }) {
  const v = parseFloat(value || 0);
  const pos = v >= 0;
  return (
    <span className={`flex items-center gap-1 font-semibold ${pos ? "text-green-600" : "text-red-500"}`}>
      {pos ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
      {(v * 100).toFixed(2)}%
    </span>
  );
}

export default function Results() {
  const [results, setResults] = useState([]);
  const [sort,    setSort]    = useState("created_at");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = (s) => {
    setLoading(true);
    resultsApi.getAll({ sort: s }).then(setResults).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(sort); }, [sort]);

  return (
    <div>
      <PageHeader title="回測結果" description="所有回測績效一覽" />
      <div className="flex gap-2 mb-5">
        {[{ label: "最新優先", value: "created_at" }, { label: "報酬率排序", value: "total_return" }].map((opt) => (
          <button key={opt.value} onClick={() => setSort(opt.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${sort === opt.value ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            <ArrowUpDown size={14} /> {opt.label}
          </button>
        ))}
      </div>
      {error   && <ErrorAlert message={error} />}
      {loading && <Spinner />}
      {!loading && !error && (
        results.length === 0 ? <EmptyState icon="🔬" title="尚無回測記錄" description="前往「執行回測」頁面開始第一次回測" /> : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-5 py-3 text-left">策略</th>
                  <th className="px-5 py-3 text-left">股票</th>
                  <th className="px-5 py-3 text-left hidden md:table-cell">回測期間</th>
                  <th className="px-5 py-3 text-right">總報酬</th>
                  <th className="px-5 py-3 text-right hidden lg:table-cell">最大回撤</th>
                  <th className="px-5 py-3 text-right hidden lg:table-cell">勝率</th>
                  <th className="px-5 py-3 text-left">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results.map((r) => (
                  <tr key={r.result_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-700">{r.strategy_name}</td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-blue-600 font-semibold">{r.stock_symbol}</span>
                      <span className="text-gray-500 ml-1.5 text-xs hidden sm:inline">{r.stock_name}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs hidden md:table-cell">{r.start_date} ～ {r.end_date}</td>
                    <td className="px-5 py-4 text-right"><ReturnCell value={r.total_return} /></td>
                    <td className="px-5 py-4 text-right text-orange-500 hidden lg:table-cell">{(parseFloat(r.max_drawdown || 0) * 100).toFixed(2)}%</td>
                    <td className="px-5 py-4 text-right hidden lg:table-cell">
                      <Badge color={parseFloat(r.win_rate) >= 0.5 ? "green" : "yellow"}>{(parseFloat(r.win_rate || 0) * 100).toFixed(1)}%</Badge>
                    </td>
                    <td className="px-5 py-4"><Link to={`/results/${r.result_id}`} className="text-blue-500 hover:underline text-xs">詳情 →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
