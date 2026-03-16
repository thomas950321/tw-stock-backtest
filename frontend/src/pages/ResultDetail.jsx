import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { resultsApi } from "../api";
import { Spinner, ErrorAlert, Badge, StatCard } from "../components/ui";
import { ArrowLeft, Bot, TrendingUp, TrendingDown } from "lucide-react";

function buildEquityCurve(trades) {
  const INITIAL = 1_000_000;
  let cash = INITIAL, entryPrice = 0;
  const curve = [{ date: "起始", equity: INITIAL }];
  trades.forEach((t) => {
    if (t.action === "buy") { cash -= parseFloat(t.price) * t.quantity; entryPrice = parseFloat(t.price); }
    else { cash += parseFloat(t.price) * t.quantity; curve.push({ date: t.trade_date, equity: Math.round(cash) }); }
  });
  return curve;
}

export default function ResultDetail() {
  const { id } = useParams();
  const [result,  setResult]  = useState(null);
  const [trades,  setTrades]  = useState([]);
  const [filter,  setFilter]  = useState("all");
  const [aiText,  setAiText]  = useState("");
  const [aiLoad,  setAiLoad]  = useState(false);
  const [aiError, setAiError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    Promise.all([resultsApi.getOne(id), resultsApi.getTrades(id)])
      .then(([r, t]) => { setResult(r); setTrades(t); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAIAnalysis = async () => {
    setAiLoad(true); setAiError(""); setAiText("");
    try { const { analysis } = await resultsApi.getAIAnalysis(id); setAiText(analysis); }
    catch (e) { setAiError(e.message); }
    finally { setAiLoad(false); }
  };

  if (loading) return <Spinner />;
  if (error)   return <ErrorAlert message={error} />;
  if (!result) return null;

  const totalReturn = parseFloat(result.total_return || 0);
  const maxDrawdown = parseFloat(result.max_drawdown || 0);
  const winRate     = parseFloat(result.win_rate || 0);
  const isPositive  = totalReturn >= 0;
  const equityCurve = buildEquityCurve(trades);
  const filteredTrades = filter === "all" ? trades : trades.filter((t) => t.action === filter);

  return (
    <div>
      <Link to="/results" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={15} /> 返回結果列表</Link>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{result.strategy_name} × {result.stock_symbol}</h1>
        <Badge color="gray">{result.start_date} ～ {result.end_date}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="總報酬率" value={`${(totalReturn * 100).toFixed(2)}%`} icon={isPositive ? "📈" : "📉"} color={isPositive ? "green" : "red"} />
        <StatCard label="最大回撤" value={`${(maxDrawdown * 100).toFixed(2)}%`} icon="⚠️" color="red" />
        <StatCard label="勝率"     value={`${(winRate * 100).toFixed(1)}%`}      icon="🎯" color={winRate >= 0.5 ? "green" : "purple"} />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h2 className="font-semibold text-gray-700 mb-4">資產曲線</h2>
        {equityCurve.length < 2 ? (
          <p className="text-gray-400 text-sm text-center py-8">交易筆數不足，無法繪製曲線</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={equityCurve} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={80} tickFormatter={(v) => `${(v / 10000).toFixed(0)}萬`} />
              <Tooltip formatter={(v) => [`NT$ ${v.toLocaleString()}`, "資產淨值"]} />
              <Area type="monotone" dataKey="equity" stroke={isPositive ? "#22c55e" : "#ef4444"} strokeWidth={2} fill="url(#equityGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Bot size={18} className="text-purple-500" /><h2 className="font-semibold text-gray-700">AI 策略健檢</h2></div>
          <button onClick={handleAIAnalysis} disabled={aiLoad}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            {aiLoad ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />分析中...</> : "✨ 開始健檢"}
          </button>
        </div>
        {aiError && <ErrorAlert message={aiError} />}
        {!aiText && !aiLoad && !aiError && <p className="text-gray-400 text-sm text-center py-8">點擊「開始健檢」，AI 將分析此策略的績效並給出優化建議</p>}
        {aiText && <div className="bg-purple-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{aiText}</div>}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">交易明細 <span className="text-gray-400 font-normal text-sm">（共 {trades.length} 筆）</span></h2>
          <div className="flex gap-1">
            {["all", "buy", "sell"].map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {{ all: "全部", buy: "買入", sell: "賣出" }[f]}
              </button>
            ))}
          </div>
        </div>
        {filteredTrades.length === 0 ? <p className="text-center text-gray-400 text-sm py-8">無交易記錄</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-5 py-3 text-left">日期</th>
                  <th className="px-5 py-3 text-left">動作</th>
                  <th className="px-5 py-3 text-right">價格</th>
                  <th className="px-5 py-3 text-right">數量（股）</th>
                  <th className="px-5 py-3 text-right">金額</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTrades.map((t) => {
                  const amount = parseFloat(t.price) * t.quantity;
                  const isBuy  = t.action === "buy";
                  return (
                    <tr key={t.trade_id} className="hover:bg-gray-50">
                      <td className="px-5 py-3 text-gray-600">{t.trade_date}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isBuy ? "text-green-600" : "text-red-500"}`}>
                          {isBuy ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{isBuy ? "買入" : "賣出"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono">{parseFloat(t.price).toFixed(2)}</td>
                      <td className="px-5 py-3 text-right font-mono">{t.quantity.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right font-mono text-gray-600">{amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
