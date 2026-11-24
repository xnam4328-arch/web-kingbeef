import { useEffect, useState } from 'react';
import { Users, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { api } from '../../services/api';
import StatusBadge from '../common/StatusBadge';
import { formatDateVN, formatVND } from '../../utils/format';

export default function CustomersPanel() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api
      .get('/users/customers')
      .then((res) => setCustomers(res.customers || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((c) => {
    const kw = search.trim().toLowerCase();
    if (!kw) return true;
    return (
      c.fullName.toLowerCase().includes(kw) ||
      c.email.toLowerCase().includes(kw) ||
      c.phone.includes(kw)
    );
  });

  return (
    <div className="space-y-5">
      <div className="glass-card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#E86B86]">Quản Lý Khách Hàng</h2>
          <p className="text-xs text-[#F5F0E6]/60 mt-0.5">
            Danh sách khách hàng thành viên, lịch sử đặt bàn và tổng chi tiêu tích lũy.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#F5F0E6]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên, email hoặc SĐT..."
            className="input-luxury pl-9 text-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-[#F5F0E6]/60">Đang tải danh sách khách hàng...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-10 text-center text-sm text-[#F5F0E6]/60">
          Không tìm thấy khách hàng nào.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const isOpen = expandedId === c.id;
            return (
              <div key={c.id} className="glass-card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : c.id)}
                  className="w-full p-5 flex flex-wrap items-center justify-between gap-4 text-left hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#4A0E1E]/80 border border-[#9E1B32]/60 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-[#E86B86]" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[#F5F0E6]">{c.fullName}</div>
                      <div className="text-xs text-[#F5F0E6]/60">
                        {c.email} • {c.phone}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-[11px] text-[#F5F0E6]/55">Số lượt đặt</div>
                      <div className="text-sm font-bold text-[#F5F0E6]">{c.totalBookings} đơn</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-[#F5F0E6]/55">Tổng chi tiêu</div>
                      <div className="text-sm font-bold text-[#E86B86]">
                        {formatVND(c.totalSpent)}
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#E86B86]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#F5F0E6]/50" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-2 border-t border-white/10 bg-[#0B0B0E]/50 space-y-2">
                    <div className="text-xs font-semibold text-[#E86B86] mb-2">
                      Lịch sử đặt bàn ({c.reservations?.length || 0}):
                    </div>
                    {c.reservations?.length === 0 ? (
                      <div className="text-xs text-[#F5F0E6]/50">Chưa có đơn đặt bàn nào.</div>
                    ) : (
                      c.reservations.map((r) => (
                        <div
                          key={r.id}
                          className="p-3 rounded-xl bg-[#16161C] border border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-[#E86B86] mr-2">
                              {r.bookingCode}
                            </span>
                            <span className="text-[#F5F0E6]/80">
                              {r.branch?.name} • {r.hall?.name} • Bàn {r.table?.tableNumber} •{' '}
                              {formatDateVN(r.reservationDate)} ({r.startTime})
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-[#F5F0E6]">
                              {formatVND(r.totalAmount > 0 ? r.totalAmount : r.depositAmount)}
                            </span>
                            <StatusBadge status={r.status} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
