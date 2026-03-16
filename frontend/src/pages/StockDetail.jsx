import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { stocksApi, watchlistsApi } from "../api";
import { Spinner, ErrorAlert, Badge, Modal } from "../components/ui";
import { ArrowLeft, Plus } from "lucide-react";
import dayjs from "dayjs";

const INTERVALS = [{ label: "日K", value: "1d" }, { label: "週K", value: "1w" }, { label: "月K", value: "1m" }];

export default function StockDetail() {
  const { id } = useParams();
  const [stock,      setStock]      = useState(null);
  const [prices,     setPrices]     = useState([]);
  const [interval,   setInterval]   = useState("1d");
  const [startDate,  setStartDate]  = useState(dayjs().subtract(1, "year").format("YYYY-MM-DD"));
  const [endDate,    setEndDate]    = useState(dayjs().format("YYYY-MM-DD"));
  const [loading,    setLoading]    = useState(true);
  const [chartLoad,  setChartLoad]  = useState(false);
  const [error,      setError]      = useState("");
  const [watchlists, setWatchlists] = useState([]);
  const [wlModal,    setWlModal]    = useState(false);
  const [wlAdding,   setWlAdding]   = useState(null);

  useEffect(() => {
    stocksApi.getOne(id).then(setStock).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id]);

  const loadPrices = () => {
    setChartLoad(true);
    stocksApi.getPrice(id, { interval, start: startDate, end: endDate })
      .then((rows) => setPrices(rows.map((r) => ({
        date: dayjs(r.datetime).format("MM/DD"),
        open: parseFloat(r.open), high: parseFloat(r.high),
        low: parseFloat(r.low),   close: parseFloat(r.close), volume: r.volume,
      }))))
      .catch((e) => setError(e.message))
      .finally(() => setChartLoad(false));
  };

  useEffect(() => { if (stock) loadPrices(); }, [stock, interval]);

  const openWatchlist = () => { watchlistsApi.getAll().then(setWatchlists); setWlModal(true); };

  const addToWatchlist = async (wid) => {
    setWlAdding(wid);
    try { await watchlistsApi.addStock(wid, { stock_id: parseInt(id) }); alert("已加入自選清單 ✅"); setWlModal(false); }
    catch (e) { alert(e.message); }
    finally { setWlAdding(null); }
  };

  if (loading) return <Spinner />;
  if (error)   return <ErrorAlert message={error} />;
  if (!stock)  return null;

  return (
    <div>
      <Link to="/stocks" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"><ArrowLeft size={15} /> 返回股票列表</Link>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-gray-800">{stock.symbol}</span>
              <span className="text-xl text-gray-500">{stock.name}</span>
            </div>
            <div className="flex gap-2 mt-2">
              {stock.market   && <Badge color="blue">{stock.market}</Badge>}
              {stock.industry && <Badge color="gray">{stock.industry}</Badge>}
            </div>
          </div>
        </div>
        <button onClick={openWatchlist} className="flex items-center gap-2 border border-blue-500 text-blue-500 hover:bg-blue-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={15} /> 加入自選清單
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">K 線類型</label>
            <div className="flex gap-1">
              {INTERVALS.map((iv) => (
                <button key={iv.value} onClick={() => setInterval(iv.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${interval === iv.value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {iv.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">開始日期</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">結束日期</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button onClick={loadPrices} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">查詢</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-5">
        <h2 className="font-semibold text-gray-700 mb-4">股價走勢</h2>
        {chartLoad ? <Spinner /> : prices.length === 0 ? (
          <div className="text-center text-gray-400 py-12 text-sm">無股價資料</div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={prices} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.floor(prices.length / 8)} />
              <YAxis yAxisId="price" domain={["auto", "auto"]} tick={{ fontSize: 11 }} width={60} />
              <YAxis yAxisId="volume" orientation="right" tick={{ fontSize: 11 }} width={70} />
              <Tooltip content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload;
                return (
                  <div className="bg-white shadow-lg rounded-lg p-3 text-xs border border-gray-100">
                    <p className="font-semibold mb-1">{d.date}</p>
                    <p>開：<span className="font-mono">{d.open}</span></p>
                    <p>高：<span className="font-mono text-red-500">{d.high}</span></p>
                    <p>低：<span className="font-mono text-green-500">{d.low}</span></p>
                    <p>收：<span className="font-mono font-semibold">{d.close}</span></p>
                    <p>量：<span className="font-mono">{d.volume?.toLocaleString()}</span></p>
                  </div>
                );
              }} />
              <Line yAxisId="price" type="monotone" dataKey="close" stroke="#3b82f6" dot={false} strokeWidth={2} name="收盤價" />
              <Bar yAxisId="volume" dataKey="volume" fill="#bfdbfe" opacity={0.6} name="成交量" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
      <Modal open={wlModal} onClose={() => setWlModal(false)} title="選擇自選清單">
        {watchlists.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">尚無清單，請先前往自選清單頁面新增</p>
        ) : (
          <div className="space-y-2">
            {watchlists.map((wl) => (
              <button key={wl.watchlist_id} onClick={() => addToWatchlist(wl.watchlist_id)} disabled={wlAdding === wl.watchlist_id}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-sm disabled:opacity-50">
                ⭐ {wl.name}
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
