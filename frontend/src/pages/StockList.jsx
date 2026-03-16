import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { stocksApi } from "../api";
import { Spinner, ErrorAlert, EmptyState, PageHeader } from "../components/ui";
import { Search } from "lucide-react";

export default function StockList() {
  const [stocks,  setStocks]  = useState([]);
  const [search,  setSearch]  = useState("");
  const [market,  setMarket]  = useState("");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = (params = {}) => {
    setLoading(true);
    stocksApi.getAll(params).then(setStocks).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => { e.preventDefault(); load({ search, market }); };

  return (
    <div>
      <PageHeader title="股票列表" description="瀏覽與搜尋所有上市股票" />
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜尋代號或名稱..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={market} onChange={(e) => setMarket(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">全部市場</option>
          <option value="TWSE">TWSE 上市</option>
          <option value="TPEX">TPEX 上櫃</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">搜尋</button>
      </form>
      {error   && <ErrorAlert message={error} />}
      {loading && <Spinner />}
      {!loading && !error && (
        stocks.length === 0 ? <EmptyState icon="📭" title="查無股票" description="請調整搜尋條件" /> : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left">代號</th>
                  <th className="px-6 py-3 text-left">名稱</th>
                  <th className="px-6 py-3 text-left hidden md:table-cell">市場</th>
                  <th className="px-6 py-3 text-left hidden lg:table-cell">產業</th>
                  <th className="px-6 py-3 text-left">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stocks.map((s) => (
                  <tr key={s.stock_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-semibold text-blue-600">{s.symbol}</td>
                    <td className="px-6 py-4 font-medium text-gray-700">{s.name}</td>
                    <td className="px-6 py-4 text-gray-500 hidden md:table-cell">{s.market || "—"}</td>
                    <td className="px-6 py-4 text-gray-500 hidden lg:table-cell">{s.industry || "—"}</td>
                    <td className="px-6 py-4"><Link to={`/stocks/${s.stock_id}`} className="text-blue-500 hover:underline text-xs">詳情 →</Link></td>
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
