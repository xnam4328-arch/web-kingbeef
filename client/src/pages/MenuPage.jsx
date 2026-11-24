import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, Sparkles, Wine, AlertCircle } from 'lucide-react';
import VatNotice from '../components/common/VatNotice';
import MenuImage from '../components/common/MenuImage';
import { api } from '../services/api';
import { formatVND } from '../utils/format';

const CATEGORIES = [
  'all',
  'Appetizers',
  'Soup',
  'Salad',
  'Pasta',
  'Steak & Main Course',
  'Drink & Dessert',
  'Couple Set',
];

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/menu')
      .then((res) => setItems(res.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCat = category === 'all' || item.category === category;
      const kw = search.trim().toLowerCase();
      const matchSearch =
        !kw ||
        item.name.toLowerCase().includes(kw) ||
        item.description.toLowerCase().includes(kw);
      return matchCat && matchSearch;
    });
  }, [items, category, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-[#E86B86] mb-2">
            KingBeef Culinary Collection
          </div>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold">Thực Đơn Nhà Hàng</h1>
        </div>
        <VatNotice />
      </div>

      {/* Banner uu dai Couple Set */}
      <div className="glass-card p-4 sm:p-5 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-[#9E1B32]/70 bg-gradient-to-r from-[#4A0E1E]/80 via-[#16161C]/90 to-[#16161C]/90">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#9E1B32]/35 border border-[#C83254]/50 flex items-center justify-center shrink-0">
            <Wine className="w-5 h-5 text-[#E86B86]" />
          </div>
          <div>
            <div className="font-semibold text-sm text-[#F5F0E6]">
              Đặc Quyền Khi Đặt Trước Couple Set
            </div>
            <p className="text-xs text-[#F5F0E6]/75 mt-0.5">
              Chọn bất kỳ <strong>Couple Set</strong> nào ở bước đặt món trước để nhận ngay ưu đãi{' '}
              <strong className="text-[#E86B86]">2 ly rượu vang tùy ý chỉ 199.000đ</strong>. Riêng{' '}
              <strong>Sweetie Set</strong> được <strong>Miễn phí trang trí tiệc</strong>!
            </p>
          </div>
        </div>
        <Link to="/booking" className="btn-wine shrink-0 text-xs py-2.5 px-4">
          Đặt bàn &amp; Pre-order
        </Link>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                category === cat
                  ? 'bg-[#9E1B32] text-[#F5F0E6] border-[#C83254] shadow-wine'
                  : 'bg-[#16161C] text-[#F5F0E6]/75 border-[#4A0E1E] hover:border-[#C83254]/70'
              }`}
            >
              {cat === 'all' ? 'Tất cả món' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-[#F5F0E6]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm món ăn..."
            className="input-luxury pl-10 text-sm"
          />
        </div>
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div className="py-20 text-center text-[#F5F0E6]/60">Đang tải thực đơn...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center text-[#F5F0E6]/60">
          Không tìm thấy món ăn phù hợp với từ khóa "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const outOfStock = !item.isAvailable || item.stockQuantity <= 0;
            const isSweetie = item.name.toLowerCase().includes('sweetie set');

            return (
              <div
                key={item.id}
                className={`glass-card-hover overflow-hidden flex flex-col ${
                  outOfStock ? 'opacity-65' : ''
                }`}
              >
                <div className="relative h-48 bg-[#0B0B0E] overflow-hidden">
                  <MenuImage
                    src={item.imageUrl}
                    alt={item.name}
                    category={item.category}
                    className={`w-full h-full object-cover transition-transform duration-500 ${
                      outOfStock ? 'grayscale' : 'hover:scale-105'
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#16161C] via-transparent to-transparent" />

                  <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2">
                    {isSweetie ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-[#8B1E3F] to-[#C83254] text-[#F5F0E6] border border-[#F5F0E6]/30 shadow-lg">
                        <Sparkles className="w-3 h-3" />
                        Miễn phí trang trí tiệc
                      </span>
                    ) : item.requiresAdvanceOrderHours > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#4A0E1E]/95 text-[#F5F0E6] border border-[#C83254]">
                        <Clock className="w-3 h-3 text-[#E86B86]" />
                        Đặt trước tối thiểu {item.requiresAdvanceOrderHours}h
                      </span>
                    ) : (
                      <span />
                    )}

                    {outOfStock && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-red-600 text-white shadow-lg">
                        <AlertCircle className="w-3 h-3" />
                        Hết món
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-[#E86B86] mb-1">
                      {item.category}
                    </div>
                    <h3 className="font-serif text-lg font-semibold text-[#F5F0E6] mb-1.5">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#F5F0E6]/65 leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-end justify-between pt-3 border-t border-white/10">
                    <div>
                      <div className="text-lg font-bold text-[#E86B86]">{formatVND(item.price)}</div>
                      <div className="text-[10px] text-[#F5F0E6]/45">
                        Giá trên chưa bao gồm thuế VAT
                      </div>
                    </div>

                    {outOfStock ? (
                      <span className="text-xs font-semibold text-red-400">Hết món</span>
                    ) : (
                      <span className="text-xs text-emerald-400/90">
                        Còn {item.stockQuantity} phần
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
