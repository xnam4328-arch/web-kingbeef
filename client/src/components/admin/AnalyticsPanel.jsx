import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  DollarSign,
  CalendarCheck,
  Clock,
  AlertTriangle,
  TrendingUp,
  Building2,
} from 'lucide-react';
import { api } from '../../services/api';
import { formatDateVN, formatVND } from '../../utils/format';
import { useAuth } from '../../context/AuthContext';

export default function AnalyticsPanel({ branches = [] }) {
  const { user } = useAuth();
  const isCashier = user?.role === 'cashier';

  const [branchId, setBranchId] = useState('all');
  const [range, setRange] = useState(isCashier ? 'today' : '30d');
  const [overview, setOverview] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const effectiveRange = isCashier ? 'today' : range;
    const qs = `?branchId=${branchId}&range=${effectiveRange}`;

    Promise.all([api.get(`/dashboard/overview${qs}`), api.get(`/dashboard/charts${qs}`)])
      .then(([ov, ch]) => {
        setOverview(ov);
        setCharts(ch);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [branchId, range, isCashier]);

  const tooltipStyle = {
    backgroundColor: '#0B0B0E',
    borderColor: 'rgba(212, 175, 55, 0.45)',
    borderRadius: '12px',
    color: '#F5F0E6',
    fontSize: '12px',
  };

  return (
    <div className="space-y-6">
      {/* Bo loc Chi nhanh & Thoi gian */}
      <div className="glass-card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#D4AF37]">
            {isCashier ? 'Báo Cáo Doanh Thu Trong Ngày' : 'Thống Kê & Biểu Đồ Hoạt Động'}
          </h2>
          <p className="text-xs text-[#F5F0E6]/60 mt-0.5">
            {isCashier
              ? 'Phạm vi Thu ngân: Theo dõi doanh thu & tình trạng cọc trong ngày hôm nay.'
              : 'Phân tích doanh thu, tỷ lệ lấp đầy từng sảnh và khung giờ cao điểm toàn hệ thống.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="input-luxury w-auto text-xs py-2"
          >
            <option value="all" className="bg-[#16161C]">
              Tất cả chi nhánh
            </option>
            {branches.map((b) => (
              <option key={b.id} value={b.id} className="bg-[#16161C]">
                Chi nhánh {b.name}
              </option>
            ))}
          </select>

          {!isCashier ? (
            <div className="inline-flex rounded-xl bg-[#0B0B0E] p-1 border border-white/10">
              {[
                { key: 'today', label: 'Hôm nay' },
                { key: '7d', label: '7 ngày' },
                { key: '30d', label: '30 ngày' },
                { key: 'all', label: 'Tất cả' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setRange(opt.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    range === opt.key
                      ? 'bg-[#D4AF37] text-[#0B0B0E]'
                      : 'text-[#F5F0E6]/70 hover:text-[#F5F0E6]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-xs font-semibold text-[#D4AF37]">
              Hôm nay
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-[#F5F0E6]/60">Đang tải dữ liệu thống kê...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="glass-card p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#F5F0E6]/65">
                <span>{isCashier ? 'Doanh thu hôm nay' : 'Tổng doanh thu'}</span>
                <DollarSign className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <div className="text-2xl font-serif font-bold text-[#D4AF37]">
                {formatVND(isCashier ? overview?.todayRevenue : overview?.totalRevenue)}
              </div>
              <div className="text-[11px] text-[#F5F0E6]/50">
                Chưa bao gồm VAT • Hôm nay: {formatVND(overview?.todayRevenue)}
              </div>
            </div>

            <div className="glass-card p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#F5F0E6]/65">
                <span>Tổng đơn đặt bàn</span>
                <CalendarCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-serif font-bold text-[#F5F0E6]">
                {overview?.totalReservations || 0}
              </div>
              <div className="text-[11px] text-emerald-400/90">
                Xác nhận: {overview?.confirmedCount || 0} • Hoàn tất: {overview?.completedCount || 0}
              </div>
            </div>

            <div className="glass-card p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#F5F0E6]/65">
                <span>Chờ duyệt cọc QR</span>
                <Clock className="w-4 h-4 text-sky-400" />
              </div>
              <div className="text-2xl font-serif font-bold text-sky-300">
                {overview?.waitingDepositCount || 0}
              </div>
              <div className="text-[11px] text-[#F5F0E6]/55">
                Đang Check-in tại bàn: {overview?.checkedInCount || 0}
              </div>
            </div>

            <div className="glass-card p-5 space-y-2">
              <div className="flex items-center justify-between text-xs text-[#F5F0E6]/65">
                <span>Cảnh báo tồn kho thấp</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-serif font-bold text-amber-300">
                {overview?.lowStockCount || 0} món
              </div>
              <div className="text-[11px] text-[#F5F0E6]/55">
                Tổng khách hàng thành viên: {overview?.totalCustomers || 0}
              </div>
            </div>
          </div>

          {/* Bieu do Doanh thu */}
          <div className="glass-card p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="font-serif text-lg font-bold text-[#F5F0E6]">
                Biểu Đồ Doanh Thu Theo Ngày (VNĐ)
              </h3>
            </div>
            {charts?.revenueByDate?.length > 0 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={charts.revenueByDate}>
                    <defs>
                      <linearGradient id="goldRevGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.55} />
                        <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => formatDateVN(v).slice(0, 5)}
                      stroke="#9CA3AF"
                      fontSize={11}
                    />
                    <YAxis
                      stroke="#9CA3AF"
                      fontSize={11}
                      tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(val, name) =>
                        name === 'revenue' ? [formatVND(val), 'Doanh thu'] : [val, 'Số đơn']
                      }
                      labelFormatter={(l) => `Ngày ${formatDateVN(l)}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#D4AF37"
                      strokeWidth={2.5}
                      fill="url(#goldRevGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#F5F0E6]/50">
                Chưa có dữ liệu doanh thu trong khoảng thời gian đã chọn.
              </div>
            )}
          </div>

          {/* 2 Bieu do: Ty le lap day sanh & Gio cao diem */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-serif text-lg font-bold text-[#F5F0E6]">
                  Tỷ Lệ Lấp Đầy Từng Sảnh (%)
                </h3>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.hallOccupancy || []} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis type="number" domain={[0, 100]} stroke="#9CA3AF" fontSize={11} unit="%" />
                    <YAxis
                      type="category"
                      dataKey="shortName"
                      stroke="#E5E7EB"
                      fontSize={11}
                      width={110}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(val, name) =>
                        name === 'occupancyRate'
                          ? [`${val}%`, 'Tỷ lệ lấp đầy']
                          : [val, 'Lượt đặt']
                      }
                    />
                    <Bar dataKey="occupancyRate" fill="#D4AF37" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-[#D4AF37]" />
                <h3 className="font-serif text-lg font-bold text-[#F5F0E6]">
                  Biểu Đồ Giờ Cao Điểm (Peak Hours)
                </h3>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={charts?.peakHours || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="hour" stroke="#9CA3AF" fontSize={11} />
                    <YAxis stroke="#9CA3AF" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="bookings" name="Số đơn đặt" fill="#D4AF37" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="guests" name="Tổng khách" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
