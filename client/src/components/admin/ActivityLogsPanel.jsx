import { useEffect, useState } from 'react';
import { History, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { ACTIVITY_ACTION_META, ROLE_LABELS, formatDateTimeVN } from '../../utils/format';

const ACTION_OPTIONS = [
  { key: 'all', label: 'Tất cả hành động' },
  { key: 'CONFIRM_DEPOSIT', label: 'Duyệt cọc QR' },
  { key: 'CHECK_IN', label: 'Check-in khách' },
  { key: 'COMPLETE_BOOKING', label: 'Hoàn tất đơn' },
  { key: 'CANCEL_BOOKING', label: 'Hủy đặt bàn' },
  { key: 'CHANGE_TABLE', label: 'Đổi bàn' },
  { key: 'UPDATE_STOCK', label: 'Cập nhật tồn kho' },
  { key: 'UPDATE_MENU', label: 'Cập nhật thực đơn' },
  { key: 'UPDATE_TABLE', label: 'Cập nhật bàn 3D' },
  { key: 'MANAGE_STAFF', label: 'Quản lý nhân sự' },
];

const ROLE_BADGE_STYLE = {
  admin: 'bg-[#9E1B32]/35 text-[#F5F0E6] border-[#C83254]/70',
  cashier: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
  staff: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
};

export default function ActivityLogsPanel({ branches = [] }) {
  const [logs, setLogs] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const [branchId, setBranchId] = useState('all');
  const [userId, setUserId] = useState('all');
  const [action, setAction] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadLogs = (targetPage = page) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(targetPage));
    params.set('limit', '15');
    if (branchId !== 'all') params.set('branchId', branchId);
    if (userId !== 'all') params.set('userId', userId);
    if (action !== 'all') params.set('action', action);
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    if (search.trim()) params.set('search', search.trim());

    api
      .get(`/admin/activity-logs?${params.toString()}`)
      .then((res) => {
        setLogs(res.logs || []);
        setStaffList(res.staffList || []);
        setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
    loadLogs(1);
  }, [branchId, userId, action, fromDate, toDate]);

  return (
    <div className="space-y-5">
      {/* Header & Bo loc */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#E86B86] flex items-center gap-2">
              <History className="w-5 h-5" />
              Lịch Sử Thao Tác Nhân Sự (Audit Log)
            </h2>
            <p className="text-xs text-[#F5F0E6]/60 mt-0.5">
              Ghi nhận tự động toàn bộ thao tác duyệt cọc, check-in, đổi bàn, chỉnh tồn kho, bàn 3D
              và quản trị nhân sự ({pagination.total} bản ghi).
            </p>
          </div>
          <button onClick={() => loadLogs(page)} className="btn-outline-wine text-xs py-2 px-3.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Làm mới
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#F5F0E6]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  loadLogs(1);
                }
              }}
              placeholder="Tìm theo BookingCode, tên món, chi tiết..."
              className="input-luxury pl-9 text-xs"
            />
          </div>

          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="input-luxury text-xs"
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

          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="input-luxury text-xs"
          >
            <option value="all" className="bg-[#16161C]">
              Tất cả nhân sự
            </option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id} className="bg-[#16161C]">
                {s.fullName} ({ROLE_LABELS[s.role]})
              </option>
            ))}
          </select>

          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="input-luxury text-xs"
          >
            {ACTION_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key} className="bg-[#16161C]">
                {opt.label}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              title="Từ ngày"
              className="input-luxury text-xs px-2.5"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              title="Đến ngày"
              className="input-luxury text-xs px-2.5"
            />
          </div>

          <button
            onClick={() => {
              setPage(1);
              loadLogs(1);
            }}
            className="btn-wine text-xs py-2"
          >
            Lọc lịch sử
          </button>
        </div>
      </div>

      {/* Bang Lich su thao tac */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B0B0E]/85 border-b border-[#4A0E1E] text-[#E86B86] uppercase text-[11px]">
              <tr>
                <th className="py-3.5 px-4 whitespace-nowrap">Thời gian</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Nhân sự</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Chi nhánh</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Hành động</th>
                <th className="py-3.5 px-4">Chi tiết thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#F5F0E6]/60">
                    Đang tải lịch sử thao tác...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#F5F0E6]/60">
                    Chưa có bản ghi thao tác nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actionMeta = ACTIVITY_ACTION_META[log.action] || {
                    label: log.action,
                    className: 'bg-white/10 text-[#F5F0E6] border-white/20',
                  };
                  const roleCls =
                    ROLE_BADGE_STYLE[log.user?.role] || 'bg-white/10 text-[#F5F0E6] border-white/20';

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-[#F5F0E6]/75">
                        {formatDateTimeVN(log.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-[#F5F0E6]">{log.user?.fullName}</div>
                        <span
                          className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleCls}`}
                        >
                          {ROLE_LABELS[log.user?.role] || log.user?.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-[#F5F0E6]/80">
                        {log.branch ? `Chi nhánh ${log.branch.name}` : 'Toàn hệ thống'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${actionMeta.className}`}
                        >
                          {actionMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#F5F0E6]/85 leading-relaxed">
                        {log.details}
                        {log.targetId && (
                          <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#4A0E1E]/60 text-[#E86B86]">
                            #{log.targetId}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Phan trang */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-[#F5F0E6]/60">
              Trang {pagination.page} / {pagination.totalPages} ({pagination.total} bản ghi)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => {
                  const next = page - 1;
                  setPage(next);
                  loadLogs(next);
                }}
                className="btn-outline-wine py-1.5 px-3 text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Trước
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => {
                  const next = page + 1;
                  setPage(next);
                  loadLogs(next);
                }}
                className="btn-outline-wine py-1.5 px-3 text-xs"
              >
                Sau
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
