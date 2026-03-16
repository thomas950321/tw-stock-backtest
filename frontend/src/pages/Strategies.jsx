import { useEffect, useState } from "react";
import { strategiesApi } from "../api";
import { Spinner, ErrorAlert, EmptyState, PageHeader, Modal, Badge } from "../components/ui";
import { Plus, Pencil, Trash2 } from "lucide-react";
import dayjs from "dayjs";

const EMPTY_FORM = { name: "", description: "", parameters: '{"type":"ma_cross","ma_short":5,"ma_long":20}' };

export default function Strategies() {
  const [strategies, setStrategies] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [modal,      setModal]      = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState(EMPTY_FORM);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState("");

  const load = () => {
    setLoading(true);
    strategiesApi.getAll().then(setStrategies).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(""); setModal(true); };
  const openEdit = (s) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description || "", parameters: JSON.stringify(s.parameters || {}, null, 2) });
    setFormError(""); setModal(true);
  };

  const handleSave = async () => {
    setFormError("");
    let params;
    try { params = JSON.parse(form.parameters); } catch { setFormError("策略參數 JSON 格式有誤，請檢查"); return; }
    setSaving(true);
    try {
      const payload = { name: form.name, description: form.description, parameters: params };
      editing ? await strategiesApi.update(editing.strategy_id, payload) : await strategiesApi.create(payload);
      setModal(false); load();
    } catch (e) { setFormError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("確定刪除此策略？")) return;
    try { await strategiesApi.remove(id); load(); } catch (e) { alert(e.message); }
  };

  const typeLabel = (params) => {
    const t = params?.type || "ma_cross";
    return { ma_cross: "均線交叉", rsi: "RSI", bollinger: "布林通道" }[t] || t;
  };

  return (
    <div>
      <PageHeader title="策略管理" description="新增、編輯量化交易策略"
        action={
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <Plus size={16} /> 新增策略
          </button>
        }
      />
      {error   && <ErrorAlert message={error} />}
      {loading && <Spinner />}
      {!loading && !error && (
        strategies.length === 0 ? <EmptyState icon="🧠" title="尚無策略" description="點擊右上角新增第一個策略" /> : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {strategies.map((s) => (
              <div key={s.strategy_id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div><h3 className="font-semibold text-gray-800">{s.name}</h3><Badge color="blue">{typeLabel(s.parameters)}</Badge></div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(s)} className="text-gray-400 hover:text-blue-500 transition-colors"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(s.strategy_id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={15} /></button>
                  </div>
                </div>
                {s.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{s.description}</p>}
                <pre className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 overflow-x-auto">{JSON.stringify(s.parameters, null, 2)}</pre>
                <p className="text-xs text-gray-400 mt-3">建立於 {dayjs(s.created_at).format("YYYY/MM/DD")}</p>
              </div>
            ))}
          </div>
        )
      )}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "編輯策略" : "新增策略"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">策略名稱 *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例如：台積電均線策略" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">策略說明</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="選填，簡述策略邏輯..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">策略參數（JSON）*</label>
            <textarea value={form.parameters} onChange={(e) => setForm({ ...form, parameters: e.target.value })} rows={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-400 mt-1">type 可填：ma_cross / rsi / bollinger</p>
          </div>
          {formError && <p className="text-red-500 text-sm">{formError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">取消</button>
            <button onClick={handleSave} disabled={saving || !form.name}
              className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? "儲存中..." : "儲存"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
