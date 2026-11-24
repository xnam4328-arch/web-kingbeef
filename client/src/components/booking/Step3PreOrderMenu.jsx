import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Plus,
  Minus,
  Wine,
  Sparkles,
  Search,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import VatNotice from '../common/VatNotice';
import MenuImage from '../common/MenuImage';
import { api } from '../../services/api';
import { formatVND, getHoursUntil } from '../../utils/format';

const CATEGORIES = [
  'all',
  'Couple Set',
  'Steak & Main Course',
  'Pasta',
  'Appetizers',
  'Soup',
  'Salad',
  'Drink & Dessert',
];

const WINE_PROMO_PRICE = 199000;
const BASE_DEPOSIT = 200000;

export default function Step3PreOrderMenu({
  reservationDate,
  startTime,
  guestName,
  guestPhone,
  cart,
  setCart,
  hasWinePromo,
  setHasWinePromo,
  specialRequest,
  setSpecialRequest,
  onBack,
  onSubmitBooking,
  submitting,
  submitError,
}) {
  const [menuItems, setMenuItems] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/menu')
      .then((res) => setMenuItems(res.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hoursUntilMeal = useMemo(
    () => getHoursUntil(reservationDate, startTime),
    [reservationDate, startTime]
  );

  const hasCoupleSet = useMemo(() => {
    return Object.entries(cart).some(([id, qty]) => {
      if (qty <= 0) return false;
      const item = menuItems.find((m) => m.id === Number(id));
      return item?.category === 'Couple Set';
    });
  }, [cart, menuItems]);

  useEffect(() => {
    if (!hasCoupleSet && hasWinePromo) {
      setHasWinePromo(false);
    }
  }, [hasCoupleSet, hasWinePromo, setHasWinePromo]);

  const filteredMenu = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = category === 'all' || item.category === category;
      const kw = search.trim().toLowerCase();
      const matchKw = !kw || item.name.toLowerCase().includes(kw);
      return matchCat && matchKw;
    });
  }, [menuItems, category, search]);

  const cartSummary = useMemo(() => {
    const selectedList = [];
    let foodTotal = 0;

    for (const [idStr, qty] of Object.entries(cart)) {
      if (qty <= 0) continue;
      const item = menuItems.find((m) => m.id === Number(idStr));
      if (!item) continue;
      foodTotal += item.price * qty;
      selectedList.push({ ...item, quantity: qty });
    }

    const totalAmount = foodTotal + (hasCoupleSet && hasWinePromo ? WINE_PROMO_PRICE : 0);
    const depositAmount =
      totalAmount > 0 ? Math.max(BASE_DEPOSIT, Math.round(totalAmount * 0.3)) : BASE_DEPOSIT;

    return { selectedList, foodTotal, totalAmount, depositAmount };
  }, [cart, menuItems, hasCoupleSet, hasWinePromo]);

  const updateQty = (item, delta) => {
    const current = cart[item.id] || 0;
    const next = Math.max(0, Math.min(item.stockQuantity, current + delta));
    setCart((prev) => {
      const copy = { ...prev };
      if (next === 0) delete copy[item.id];
      else copy[item.id] = next;
      return copy;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-serif font-bold text-[#E86B86]">
            Đặt Món Trước (Pre-order — Tùy Chọn)
          </h3>
          <p className="text-xs text-[#F5F0E6]/65 mt-0.5">
            Bạn có thể chọn trước món để bếp chuẩn bị chu đáo hoặc bỏ qua và gọi món trực tiếp tại
            nhà hàng.
          </p>
        </div>
        <VatNotice />
      </div>

      {/* Goi y tu dong Uu dai 2 ly ruou vang 199.000d khi chon Couple Set */}
      {hasCoupleSet && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#8B1E3F]/50 via-[#4A0E1E]/70 to-[#16161C] border-2 border-[#C83254] shadow-wine flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#9E1B32] text-[#F5F0E6] flex items-center justify-center shrink-0">
              <Wine className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#E86B86]">
                Ưu đãi độc quyền khi chọn Couple Set
              </div>
              <div className="font-serif text-lg font-bold text-[#F5F0E6]">
                Thêm 2 ly rượu vang tùy ý chỉ 199.000đ
              </div>
              <p className="text-xs text-[#F5F0E6]/75">
                Thưởng thức cặp rượu vang đỏ / vang trắng tuyển chọn giúp bữa tối thêm trọn vẹn (chưa
                gồm VAT).
              </p>
            </div>
          </div>

          <label className="inline-flex items-center gap-2.5 cursor-pointer select-none px-4 py-2.5 rounded-xl bg-[#0B0B0E]/80 border border-[#C83254]/70 shrink-0">
            <input
              type="checkbox"
              checked={hasWinePromo}
              onChange={(e) => setHasWinePromo(e.target.checked)}
              className="w-4 h-4 accent-[#9E1B32]"
            />
            <span className="text-sm font-semibold text-[#F5F0E6]">
              {hasWinePromo ? 'Đã thêm (+199.000đ)' : 'Chọn ưu đãi này'}
            </span>
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Danh sach mon */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#F5F0E6]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm món ăn muốn đặt trước..."
              className="input-luxury pl-10 text-xs"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${
                  category === cat
                    ? 'bg-[#9E1B32] text-[#F5F0E6] border-[#C83254]'
                    : 'bg-[#0B0B0E]/70 text-[#F5F0E6]/75 border-[#4A0E1E] hover:border-[#C83254]/60'
                }`}
              >
                {cat === 'all' ? 'Tất cả' : cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-[#F5F0E6]/60">Đang tải thực đơn...</div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {filteredMenu.map((item) => {
                const qty = cart[item.id] || 0;
                const outOfStock = !item.isAvailable || item.stockQuantity <= 0;
                const blockedBy4hRule =
                  item.requiresAdvanceOrderHours > 0 &&
                  hoursUntilMeal < item.requiresAdvanceOrderHours;
                const isSweetie = item.name.toLowerCase().includes('sweetie set');

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl bg-[#0B0B0E]/75 border flex items-center justify-between gap-4 transition-colors ${
                      qty > 0 ? 'border-[#C83254]' : 'border-[#4A0E1E]/60'
                    } ${outOfStock || blockedBy4hRule ? 'opacity-65' : ''}`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <MenuImage
                        src={item.imageUrl}
                        alt={item.name}
                        category={item.category}
                        className="w-16 h-16 rounded-lg object-cover shrink-0 bg-[#16161C]"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-sm text-[#F5F0E6] truncate">
                            {item.name}
                          </span>
                          {isSweetie && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#9E1B32] text-[#F5F0E6]">
                              <Sparkles className="w-2.5 h-2.5" />
                              Miễn phí trang trí tiệc
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-[#E86B86] mt-0.5">
                          {formatVND(item.price)}
                          <span className="text-[10px] font-normal text-[#F5F0E6]/45 ml-1.5">
                            (chưa VAT • còn {item.stockQuantity})
                          </span>
                        </div>
                        {item.requiresAdvanceOrderHours > 0 && (
                          <div
                            className={`text-[11px] mt-1 inline-flex items-center gap-1 ${
                              blockedBy4hRule ? 'text-red-400 font-medium' : 'text-[#F08CA2]'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {blockedBy4hRule
                              ? `Cần đặt trước tối thiểu ${item.requiresAdvanceOrderHours}h (khung giờ chọn không đủ 4h)`
                              : `Yêu cầu đặt trước tối thiểu ${item.requiresAdvanceOrderHours}h (Hợp lệ)`}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {outOfStock ? (
                        <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs font-semibold">
                          Hết món
                        </span>
                      ) : blockedBy4hRule ? (
                        <span className="px-2.5 py-1 rounded-lg bg-[#4A0E1E]/80 text-[#F08CA2] text-[11px]">
                          Chưa đủ 4h
                        </span>
                      ) : qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => updateQty(item, 1)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#9E1B32] text-[#F5F0E6] hover:bg-[#9E1B32] transition-colors"
                        >
                          + Thêm
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-2 bg-[#16161C] border border-[#C83254]/70 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => updateQty(item, -1)}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-xs font-bold w-5 text-center">{qty}</span>
                          <button
                            type="button"
                            disabled={qty >= item.stockQuantity}
                            onClick={() => updateQty(item, 1)}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-white/10 disabled:opacity-30"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tom tat don hang */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#0B0B0E]/85 border border-[#9E1B32]/65 space-y-4">
            <div className="flex items-center gap-2 font-serif text-lg font-bold text-[#E86B86]">
              <ShoppingBag className="w-5 h-5" />
              Tóm Tắt Đơn Đặt Bàn
            </div>

            <div className="text-xs bg-[#16161C] p-3 rounded-xl border border-[#4A0E1E] space-y-0.5">
              <div className="text-[#F5F0E6]/60">Người đặt:</div>
              <div className="font-semibold text-[#F5F0E6]">
                {guestName} • {guestPhone}
              </div>
            </div>

            {cartSummary.selectedList.length === 0 ? (
              <p className="text-xs text-[#F5F0E6]/55 py-1">
                Chưa chọn món đặt trước. Tiền cọc giữ bàn tiêu chuẩn là{' '}
                <strong className="text-[#E86B86]">200.000đ/bàn</strong>.
              </p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto text-xs">
                {cartSummary.selectedList.map((item) => (
                  <div key={item.id} className="flex justify-between gap-2 text-[#F5F0E6]/85">
                    <span className="truncate">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="shrink-0 font-medium">
                      {formatVND(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                {hasCoupleSet && hasWinePromo && (
                  <div className="flex justify-between gap-2 text-[#E86B86] pt-1 border-t border-white/10">
                    <span>Ưu đãi 2 ly rượu vang tùy ý</span>
                    <span className="font-semibold">199.000đ</span>
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-white/10 space-y-1.5 text-sm">
              <div className="flex justify-between text-[#F5F0E6]/75">
                <span>Tổng tiền món đặt trước:</span>
                <span>{formatVND(cartSummary.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#E86B86]">
                <span>Tiền cọc giữ bàn (QR):</span>
                <span>{formatVND(cartSummary.depositAmount)}</span>
              </div>
              <div className="text-[11px] text-[#F5F0E6]/50">
                * Cọc 200.000đ/bàn hoặc 30% tổng tiền món đặt trước (giá trên chưa bao gồm thuế VAT).
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#F5F0E6]/80 mb-1.5">
                Ghi chú đặc biệt (độ chín steak, trang trí sinh nhật, dị ứng...)
              </label>
              <textarea
                rows={3}
                value={specialRequest}
                onChange={(e) => setSpecialRequest(e.target.value)}
                placeholder="VD: Steak chín Medium Rare, sắp xếp bàn yên tĩnh..."
                className="input-luxury text-xs"
              />
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <button
              type="button"
              disabled={submitting}
              onClick={onSubmitBooking}
              className="btn-wine w-full py-3"
            >
              {submitting ? 'Đang khởi tạo mã đặt bàn & QR...' : 'Xác nhận & Tạo mã VietQR cọc →'}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/10">
        <button type="button" onClick={onBack} className="btn-outline-wine">
          <ArrowLeft className="w-4 h-4" />
          Quay lại chọn bàn 3D
        </button>
      </div>
    </div>
  );
}
