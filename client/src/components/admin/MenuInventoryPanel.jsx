import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Search,
  Edit3,
  Trash2,
  Power,
  Clock,
  X,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import VatNotice from '../common/VatNotice';
import { formatVND } from '../../utils/format';

const CATEGORIES = [
  'Appetizers',
  'Soup',
  'Salad',
  'Pasta',
  'Steak & Main Course',
  'Drink & Dessert',
  'Couple Set',
];

export default function MenuInventoryPanel() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [onlyAlerts, setOnlyAlerts] = useState(false);

  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: 'Steak & Main Course',
    description: '',
    price: 150000,
    stockQuantity: 50,
    isAvailable: true,
    requiresAdvanceOrderHours: 0,
    badge: '',
    imageUrl: '',
  });

  const loadMenu = () => {
    setLoading(true);
    api
      .get('/menu')
      .then((res) => setItems(res.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMenu();
  }, []);

  const lowStockItems = useMemo(
    () => items.filter((m) => m.stockQuantity <= 10 || !m.isAvailable),
    [items]
  );

  const filtered = useMemo(() => {
    return items.filter((m) => {
      if (onlyAlerts && m.stockQuantity > 10 && m.isAvailable) return false;
      if (category !== 'all' && m.category !== category) return false;
      const kw = search.trim().toLowerCase();
      if (kw && !m.name.toLowerCase().includes(kw)) return false;
      return true;
    });
  }, [items, category, search, onlyAlerts]);

  const handleQuickToggle = async (item) => {
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.patch(`/menu/${item.id}/availability`, {
        isAvailable: !item.isAvailable,
      });
      setFeedback({ type: 'success', text: `${item.name}: ${res.message}` });
      loadMenu();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleQuickStock = async (item, newQty) => {
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.put(`/menu/${item.id}`, {
        stockQuantity: Math.max(0, Number(newQty)),
      });
      setFeedback({
        type: 'success',
        text: `Đã cập nhật tồn kho "${item.name}" thành ${res.item.stockQuantity} (${
          res.item.isAvailable ? 'Đang bán' : 'Tự động tắt - Hết món'
        }).`,
      });
      loadMenu();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm({
      name: '',
      category: 'Steak & Main Course',
      description: '',
      price: 150000,
      stockQuantity: 50,
      isAvailable: true,
      requiresAdvanceOrderHours: 0,
      badge: '',
      imageUrl: '',
    });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category: item.category,
      description: item.description,
      price: item.price,
      stockQuantity: item.stockQuantity,
      isAvailable: item.isAvailable,
      requiresAdvanceOrderHours: item.requiresAdvanceOrderHours || 0,
      badge: item.badge || '',
      imageUrl: item.imageUrl || '',
    });
    setModalOpen(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', text: '' });
    try {
      const payload = {
        ...form,
        badge: form.badge.trim() || null,
        imageUrl: form.imageUrl.trim() || null,
      };
      if (editingItem) {
        const res = await api.put(`/menu/${editingItem.id}`, payload);
        setFeedback({ type: 'success', text: res.message });
      } else {
        const res = await api.post('/menu', payload);
        setFeedback({ type: 'success', text: res.message });
      }
      setModalOpen(false);
      loadMenu();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Xóa món "${item.name}"?`)) return;
    try {
      const res = await api.delete(`/menu/${item.id}`);
      setFeedback({ type: 'success', text: res.message });
      loadMenu();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#D4AF37]">
              Quản Lý Thực Đơn &amp; Tồn Kho
            </h2>
            <p className="text-xs text-[#F5F0E6]/60 mt-0.5">
              {isAdmin
                ? 'Quản lý tồn kho, tự động tắt trạng thái phục vụ khi tồn kho về 0 và cảnh báo sắp hết hàng.'
                : 'Phục vụ: Cập nhật nhanh trạng thái Hết món / Mở bán lại khi bếp thông báo.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <VatNotice />
            {isAdmin && (
              <button onClick={openCreate} className="btn-gold text-xs py-2 px-4">
                <Plus className="w-4 h-4" />
                Thêm món mới
              </button>
            )}
          </div>
        </div>

        {/* Canh bao ton kho */}
        {lowStockItems.length > 0 && (
          <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 flex flex-wrap items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                Có <strong>{lowStockItems.length} món</strong> đang sắp hết hàng (≤ 10) hoặc đang ở
                trạng thái <strong>Hết món</strong>.
              </span>
            </div>
            <button
              onClick={() => setOnlyAlerts((v) => !v)}
              className="px-3 py-1 rounded-lg bg-amber-400/20 border border-amber-400/40 font-semibold hover:bg-amber-400/30"
            >
              {onlyAlerts ? 'Hiển thị tất cả món' : 'Chỉ xem món cảnh báo'}
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#F5F0E6]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên món ăn..."
              className="input-luxury pl-9 text-xs"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input-luxury sm:w-56 text-xs"
          >
            <option value="all" className="bg-[#16161C]">
              Tất cả danh mục
            </option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="bg-[#16161C]">
                {c}
              </option>
            ))}
          </select>
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

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0B0E]/80 border-b border-white/10 text-[#D4AF37] uppercase text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Món ăn</th>
                <th className="py-3.5 px-4">Danh mục</th>
                <th className="py-3.5 px-4">Giá (chưa VAT)</th>
                <th className="py-3.5 px-4">Tồn kho</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#F5F0E6]/60">
                    Đang tải thực đơn...
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isLow = item.stockQuantity > 0 && item.stockQuantity <= 10;
                  const isOut = !item.isAvailable || item.stockQuantity === 0;

                  return (
                    <tr key={item.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-[#F5F0E6]">{item.name}</div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {item.requiresAdvanceOrderHours > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
                              <Clock className="w-2.5 h-2.5" />
                              Đặt trước {item.requiresAdvanceOrderHours}h
                            </span>
                          )}
                          {item.badge && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 text-[#E8CC6C]">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#F5F0E6]/75">{item.category}</td>
                      <td className="py-3 px-4 font-bold text-[#D4AF37]">{formatVND(item.price)}</td>
                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <div className="inline-flex items-center gap-1.5">
                            <input
                              type="number"
                              min={0}
                              defaultValue={item.stockQuantity}
                              onBlur={(e) => {
                                if (Number(e.target.value) !== item.stockQuantity) {
                                  handleQuickStock(item, e.target.value);
                                }
                              }}
                              className="w-16 px-2 py-1 rounded-lg bg-[#0B0B0E] border border-white/15 text-center text-xs"
                            />
                            {isLow && (
                              <span className="text-[10px] text-amber-400 font-semibold">
                                Sắp hết
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className={isLow ? 'text-amber-400 font-bold' : ''}>
                            {item.stockQuantity}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isOut ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-500/20 text-red-300 border border-red-500/35">
                            Hết món
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
                            Đang bán
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleQuickToggle(item)}
                            title={item.isAvailable ? 'Báo hết món' : 'Mở bán lại'}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                              item.isAvailable
                                ? 'border-amber-500/40 text-amber-300 hover:bg-amber-500/15'
                                : 'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15'
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            {item.isAvailable ? 'Báo hết' : 'Mở bán'}
                          </button>

                          {isAdmin && (
                            <>
                              <button
                                onClick={() => openEdit(item)}
                                className="p-1.5 rounded-lg border border-white/10 text-[#F5F0E6]/75 hover:border-[#D4AF37] hover:text-[#D4AF37]"
                                title="Sửa món"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item)}
                                className="p-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/15"
                                title="Xóa món"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Them / Sua mon (Admin) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-[#F5F0E6]/60 hover:text-[#F5F0E6]"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-serif text-xl font-bold text-[#D4AF37] mb-4">
              {editingItem ? 'Cập Nhật Món Ăn' : 'Thêm Món Mới'}
            </h3>
            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-xs">
              <div>
                <label className="block mb-1 text-[#F5F0E6]/75">Tên món</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-luxury"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-[#F5F0E6]/75">Danh mục</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-luxury"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-[#16161C]">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-[#F5F0E6]/75">Giá bán (VNĐ - chưa VAT)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="input-luxury"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-[#F5F0E6]/75">Tồn kho (stockQuantity)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.stockQuantity}
                    onChange={(e) => setForm({ ...form, stockQuantity: Number(e.target.value) })}
                    className="input-luxury"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-[#F5F0E6]/75">Yêu cầu đặt trước (giờ)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.requiresAdvanceOrderHours}
                    onChange={(e) =>
                      setForm({ ...form, requiresAdvanceOrderHours: Number(e.target.value) })
                    }
                    className="input-luxury"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 text-[#F5F0E6]/75">Nhãn nổi bật (tùy chọn)</label>
                <input
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  placeholder="VD: Miễn phí trang trí tiệc"
                  className="input-luxury"
                />
              </div>
              <div>
                <label className="block mb-1 text-[#F5F0E6]/75">URL hình ảnh</label>
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="input-luxury"
                />
              </div>
              <div>
                <label className="block mb-1 text-[#F5F0E6]/75">Mô tả món ăn</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-luxury"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-outline-gold text-xs py-2"
                >
                  Hủy
                </button>
                <button type="submit" className="btn-gold text-xs py-2 px-5">
                  {editingItem ? 'Lưu cập nhật' : 'Thêm món'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
