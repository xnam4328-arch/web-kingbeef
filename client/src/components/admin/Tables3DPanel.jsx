import { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Wrench, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import HallMap3D from '../three/HallMap3D';

export default function Tables3DPanel({ branches = [] }) {
  const [branchId, setBranchId] = useState(branches[0]?.id || '');
  const [hallId, setHallId] = useState(branches[0]?.halls?.[0]?.id || '');
  const [hallData, setHallData] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);

  const [form, setForm] = useState({
    tableNumber: '',
    capacity: 4,
    posX: 0,
    posY: 0,
    posZ: 0,
    status: 'available',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!branchId && branches.length > 0) {
      setBranchId(branches[0].id);
      setHallId(branches[0].halls?.[0]?.id || '');
    }
  }, [branches, branchId]);

  const currentBranch = branches.find((b) => b.id === Number(branchId));
  const halls = currentBranch?.halls || [];

  const loadHallTables = (targetHallId = hallId) => {
    if (!targetHallId) return;
    api
      .get(`/halls/${targetHallId}/tables`)
      .then((res) => {
        setHallData(res.hall);
        setTables(res.tables || []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    setSelectedTable(null);
    setIsCreating(false);
    loadHallTables(hallId);
  }, [hallId]);

  const handleSelectTable = (t) => {
    setIsCreating(false);
    setSelectedTable(t);
    setForm({
      tableNumber: t.tableNumber,
      capacity: t.capacity,
      posX: t.posX,
      posY: t.posY,
      posZ: t.posZ,
      status: t.status,
    });
    setFeedback({ type: '', text: '' });
  };

  const handleStartCreate = () => {
    setSelectedTable(null);
    setIsCreating(true);
    const maxNum = tables.reduce((m, t) => Math.max(m, t.tableNumber), 0);
    setForm({
      tableNumber: maxNum + 1,
      capacity: 4,
      posX: 0,
      posY: 0,
      posZ: 5.5,
      status: 'available',
    });
    setFeedback({ type: '', text: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', text: '' });
    try {
      if (isCreating) {
        const res = await api.post('/tables', {
          hallId: Number(hallId),
          ...form,
        });
        setFeedback({ type: 'success', text: res.message });
        setIsCreating(false);
      } else if (selectedTable) {
        const res = await api.put(`/tables/${selectedTable.id}`, form);
        setFeedback({ type: 'success', text: res.message });
        setSelectedTable(res.table);
      }
      loadHallTables(hallId);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTable) return;
    if (!window.confirm(`Xóa Bàn số ${selectedTable.tableNumber} khỏi ${hallData?.name}?`)) return;
    setSaving(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.delete(`/tables/${selectedTable.id}`);
      setFeedback({ type: 'success', text: res.message });
      setSelectedTable(null);
      loadHallTables(hallId);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Selector */}
      <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#D4AF37]">
            Quản Lý Bàn &amp; Tọa Độ Sơ Đồ 3D
          </h2>
          <p className="text-xs text-[#F5F0E6]/60 mt-0.5">
            Click bàn trên mô hình 3D để chỉnh sức chứa, tọa độ (posX, posY, posZ) hoặc trạng thái
            bảo trì.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={branchId}
            onChange={(e) => {
              const nextB = branches.find((b) => b.id === Number(e.target.value));
              setBranchId(e.target.value);
              setHallId(nextB?.halls?.[0]?.id || '');
            }}
            className="input-luxury w-auto text-xs py-2"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id} className="bg-[#16161C]">
                Chi nhánh {b.name}
              </option>
            ))}
          </select>

          <select
            value={hallId}
            onChange={(e) => setHallId(e.target.value)}
            className="input-luxury w-auto text-xs py-2"
          >
            {halls.map((h) => (
              <option key={h.id} value={h.id} className="bg-[#16161C]">
                {h.name}
              </option>
            ))}
          </select>

          <button onClick={handleStartCreate} className="btn-gold text-xs py-2 px-4">
            <Plus className="w-4 h-4" />
            Thêm bàn mới
          </button>
        </div>
      </div>

      {feedback.text && (
        <div
          className={`p-3.5 rounded-xl text-xs border ${
            feedback.type === 'error'
              ? 'bg-red-500/15 border-red-500/40 text-red-300'
              : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 3D Preview */}
        <div className="xl:col-span-2">
          <HallMap3D
            hall={hallData}
            tables={tables}
            selectedTableId={selectedTable?.id}
            onSelectTable={handleSelectTable}
            selectable={true}
            heightClass="h-[480px]"
          />

          {/* Quick table chips (including maintenance tables which cannot be clicked in booking mode) */}
          <div className="mt-3 glass-card p-4">
            <div className="text-xs font-semibold text-[#D4AF37] mb-2.5">
              Chọn nhanh bàn trong {hallData?.name} ({tables.length} bàn — bao gồm bàn bảo trì):
            </div>
            <div className="flex flex-wrap gap-2">
              {tables.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSelectTable(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs border transition-colors inline-flex items-center gap-1.5 ${
                    selectedTable?.id === t.id
                      ? 'bg-[#D4AF37] text-[#0B0B0E] border-[#D4AF37] font-bold'
                      : t.status === 'maintenance'
                      ? 'bg-gray-500/15 text-gray-300 border-gray-500/40'
                      : 'bg-[#0B0B0E] text-[#F5F0E6] border-white/10 hover:border-[#D4AF37]/50'
                  }`}
                >
                  {t.status === 'maintenance' && <Wrench className="w-3 h-3" />}
                  Bàn {t.tableNumber} ({t.capacity}p)
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form chinh sua / them ban */}
        <div className="glass-card p-5 h-fit">
          {!selectedTable && !isCreating ? (
            <div className="py-12 text-center text-xs text-[#F5F0E6]/60 space-y-2">
              <p>Chọn một bàn trên sơ đồ 3D (hoặc danh sách bên dưới) để chỉnh sửa thông số.</p>
              <p>Hoặc bấm "Thêm bàn mới" để bổ sung bàn vào sảnh.</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <h3 className="font-serif text-lg font-bold text-[#D4AF37]">
                {isCreating ? `Thêm Bàn Vào ${hallData?.name}` : `Chỉnh Sửa Bàn #${selectedTable.tableNumber}`}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#F5F0E6]/75 mb-1">Số bàn</label>
                  <input
                    type="number"
                    required
                    value={form.tableNumber}
                    onChange={(e) => setForm({ ...form, tableNumber: Number(e.target.value) })}
                    className="input-luxury text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#F5F0E6]/75 mb-1">Sức chứa (khách)</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="input-luxury text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs text-[#F5F0E6]/75 mb-1">Tọa độ X</label>
                  <input
                    type="number"
                    step="0.2"
                    value={form.posX}
                    onChange={(e) => setForm({ ...form, posX: Number(e.target.value) })}
                    className="input-luxury text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#F5F0E6]/75 mb-1">Tọa độ Y</label>
                  <input
                    type="number"
                    step="0.2"
                    value={form.posY}
                    onChange={(e) => setForm({ ...form, posY: Number(e.target.value) })}
                    className="input-luxury text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#F5F0E6]/75 mb-1">Tọa độ Z</label>
                  <input
                    type="number"
                    step="0.2"
                    value={form.posZ}
                    onChange={(e) => setForm({ ...form, posZ: Number(e.target.value) })}
                    className="input-luxury text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#F5F0E6]/75 mb-1">Trạng thái bàn</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="input-luxury text-xs"
                >
                  <option value="available" className="bg-[#16161C]">
                    Hoạt động (Available)
                  </option>
                  <option value="maintenance" className="bg-[#16161C]">
                    Bảo trì (Maintenance — Xám)
                  </option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button type="submit" disabled={saving} className="btn-gold flex-1 text-xs py-2.5">
                  <Save className="w-4 h-4" />
                  {saving ? 'Đang lưu...' : isCreating ? 'Tạo bàn 3D' : 'Lưu thay đổi'}
                </button>
                {!isCreating && selectedTable && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleDelete}
                    className="p-2.5 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/15"
                    title="Xóa bàn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!isCreating && selectedTable && (
                <div className="text-[11px] text-[#F5F0E6]/50 flex items-center gap-1.5 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Thay đổi tọa độ sẽ cập nhật trực tiếp lên mô hình 3D ngay sau khi lưu.
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
