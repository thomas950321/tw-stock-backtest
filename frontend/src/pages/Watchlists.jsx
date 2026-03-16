import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { watchlistsApi } from "../api";
import { Spinner, ErrorAlert, EmptyState, PageHeader, Modal } from "../components/ui";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import dayjs from "dayjs";

export default function Watchlists() {
  const [watchlists, setWatchlists] = useState([]);
  const [expanded,   setExpanded]   = useState({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [modal,      setModal]      = useState(false);
  const [newName,    setNewName]    = useState("");
  const [saving,     setSaving]     = useState(false);

  const load = () => {
    setLoading(true);
    watchlistsApi.getAll().then(setWatchlists).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = async (wid) => {
    if (expanded[wid]) { setExpanded((p) => ({ ...p, [wid]: null })); return; }
    const stocks = await watchlistsApi.getStocks(wid);
    setExpanded((p) => ({ ...p, [wid]: stocks }));
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try { await watchlistsApi.create({ name: newName.trim() }); setModal(false); setNewName(""); load(); }
    catch (e) { alert(e.message); }
    finally { setSaving(false); }
  };

  const handleDeleteList = async (wid) => {
    if (!confirm("確定刪除此清單？")) return;
    await watchlistsApi.remove(wid); load();
  };

  const handleRemoveStock = async (wid, sid) => {
    await watchlistsApi.removeStock(wid, sid);
    const stocks = await watchlistsApi.getStocks(wid);
    setExpanded((p) => ({ ...p, [wid]: stocks }));
  };

  return (
    <div>
      <PageHeader title="自選清單" description="管理你的股票觀察清單"
        action={
          <button onClick={() => { setModal(true); setNewName(""); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus size={16} /> 新增清單
          </button>
        }
      />
      {error   && <ErrorAlert message={error} />}
      {loading && <Spinner />}
      {!loading && !error && (
        watchlists.length === 0 ? <EmptyState icon="⭐" title="尚無自選清單" description="點擊右上角建立第一個清單" /> : (
          <div className="space-y-3">
            {watchlists.map((wl) => (
              <div key={wl.watchlist_id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">{wl.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">建立於 {dayjs(wl.created_at).format("YYYY/MM/DD")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleDeleteList(wl.watchlist_id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                    <button onClick={() => toggleExpand(wl.watchlist_id)} className="text-gray-400 hover:text-blue-500 transition-colors">
                      {expanded[wl.watchlist_id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>
                {expanded[wl.watchlist_id] && (
                  <div className="border-t border-gray-100">
                    {expanded[wl.watchlist_id].length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">清單內尚無股票，可從股票詳情頁加入</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                          <tr>
                            <th className="px-5 py-2 text-left">代號</th>
                            <th className="px-5 py-2 text-left">名稱</th>
                            <th className="px-5 py-2 text-left hidden md:table-cell">市場</th>
                            <th className="px-5 py-2 text-left">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {expanded[wl.watchlist_id].map((s) => (
                            <tr key={s.stock_id} className="hover:bg-gray-50">
                              <td className="px-5 py-3 font-mono font-semibold text-blue-600">{s.symbol}</td>
                              <td className="px-5 py-3 text-gray-700"><Link to={`/stocks/${s.stock_id}`} className="hover:underline">{s.name}</Link></td>
                              <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{s.market || "—"}</td>
                              <td className="px-5 py-3"><button onClick={() => handleRemoveStock(wl.watchlist_id, s.stock_id)} className="text-xs text-red-400 hover:text-red-600 transition-colors">移除</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}
      <Modal open={modal} onClose={() => setModal(false)} title="新增自選清單">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">清單名稱 *</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：半導體觀察" autoFocus />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-600">取消</button>
            <button onClick={handleCreate} disabled={saving || !newName.trim()}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? "建立中..." : "建立"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
