import { useEffect, useState } from 'react';
import {
  Search,
  CheckCircle2,
  UserCheck,
  ArrowLeftRight,
  BadgeCheck,
  XCircle,
  RefreshCw,
  Wine,
  X,
  FileSpreadsheet,
  Link2,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../common/StatusBadge';
import ExcelSyncModal from './ExcelSyncModal';
import { downloadReservationsExcel } from '../../utils/excelExport';
import { DEPOSIT_STATUS_META, formatDateVN, formatVND } from '../../utils/format';

const STATUS_FILTERS = [
  { key: 'all', label: 'Tất cả' },
  { key: 'waiting_deposit_confirm', label: 'Chờ duyệt cọc QR' },
  { key: 'pending', label: 'Chờ chuyển khoản' },
  { key: 'confirmed', label: 'Đã xác nhận' },
  { key: 'checked_in', label: 'Đã Check-in' },
  { key: 'completed', label: 'Hoàn tất' },
  { key: 'cancelled', label: 'Đã hủy' },
];

export default function ReservationsPanel({ branches = [] }) {
  const { user } = useAuth();
  const canApproveOrComplete = ['cashier', 'admin'].includes(user?.role);
  const canCheckInOrMove = ['staff', 'admin'].includes(user?.role);
  const isAdmin = user?.role === 'admin';

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchId, setBranchId] = useState('all');
  const [status, setStatus] = useState(user?.role === 'cashier' ? 'waiting_deposit_confirm' : 'all');
  const [date, setDate] = useState('');
  const [search, setSearch] = useState('');

  const [feedback, setFeedback] = useState({ type: '', text: '' });
  const [busyId, setBusyId] = useState(null);

  const [moveModal, setMoveModal] = useState(null);
  const [branchHallsTables, setBranchHallsTables] = useState([]);
  const [selectedNewTableId, setSelectedNewTableId] = useState('');
  const [excelModalOpen, setExcelModalOpen] = useState(false);

  const loadReservations = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (branchId !== 'all') params.set('branchId', branchId);
    if (status !== 'all') params.set('status', status);
    if (date) params.set('date', date);
    if (search.trim()) params.set('search', search.trim());

    api
      .get(`/reservations?${params.toString()}`)
      .then((res) => setReservations(res.reservations || []))
      .catch((err) => setFeedback({ type: 'error', text: err.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReservations();
  }, [branchId, status, date]);

  const runAction = async (id, endpoint, body) => {
    setBusyId(id);
    setFeedback({ type: '', text: '' });
    try {
      const res = await api.patch(`/reservations/${id}/${endpoint}`, body);
      setFeedback({ type: 'success', text: res.message });
      loadReservations();
      return true;
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const openChangeTableModal = async (booking) => {
    setMoveModal(booking);
    setSelectedNewTableId('');
    const branch = branches.find((b) => b.id === booking.branchId);
    if (!branch) return;

    try {
      const results = await Promise.all(
        (branch.halls || []).map((h) =>
          api.get(
            `/halls/${h.id}/tables?date=${booking.reservationDate}&startTime=${booking.startTime}`
          )
        )
      );
      setBranchHallsTables(results);
    } catch {
      setBranchHallsTables([]);
    }
  };

  const handleConfirmChangeTable = async () => {
    if (!moveModal || !selectedNewTableId) return;
    const ok = await runAction(moveModal.id, 'change-table', {
      newTableId: Number(selectedNewTableId),
    });
    if (ok) setMoveModal(null);
  };

  return (
    <div className="space-y-5">
      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#E86B86]">
              Quản Lý Đặt Bàn &amp; Duyệt Cọc QR
            </h2>
            <p className="text-xs text-[#F5F0E6]/60 mt-0.5">
              {user?.role === 'cashier'
                ? 'Thu ngân: Duyệt cọc QR 1-click và xác nhận hoàn tất thanh toán.'
                : user?.role === 'staff'
                ? 'Phục vụ: Theo dõi lịch đặt bàn, Check-in khách đến và hỗ trợ đổi bàn.'
                : 'Toàn quyền duyệt cọc QR, Check-in, đổi bàn, hoàn tất thanh toán & hủy đơn (mọi thao tác được ghi vào Audit Log).'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => downloadReservationsExcel(reservations)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600/90 hover:bg-emerald-500 text-white transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Xuất Excel (.xlsx)
            </button>
            <button
              type="button"
              onClick={() => setExcelModalOpen(true)}
              className="btn-outline-wine text-xs py-2 px-3.5"
            >
              <Link2 className="w-3.5 h-3.5" />
              Liên kết Excel tự động
            </button>
            <button onClick={loadReservations} className="btn-outline-wine text-xs py-2 px-3.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Làm mới
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-[#F5F0E6]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadReservations()}
              placeholder="Mã đặt bàn, tên, SĐT..."
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

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-luxury text-xs"
          />

          <button onClick={loadReservations} className="btn-wine text-xs py-2">
            Lọc danh sách
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((st) => (
            <button
              key={st.key}
              onClick={() => setStatus(st.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-colors ${
                status === st.key
                  ? 'bg-[#9E1B32] text-[#F5F0E6] border-[#C83254]'
                  : 'bg-[#0B0B0E]/70 text-[#F5F0E6]/75 border-[#4A0E1E] hover:border-[#C83254]/60'
              }`}
            >
              {st.label}
            </button>
          ))}
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

      {loading ? (
        <div className="py-12 text-center text-sm text-[#F5F0E6]/60">Đang tải danh sách đơn...</div>
      ) : reservations.length === 0 ? (
        <div className="glass-card p-10 text-center text-sm text-[#F5F0E6]/60">
          Không có đơn đặt bàn nào khớp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((b) => {
            const depMeta = DEPOSIT_STATUS_META[b.depositStatus] || { label: b.depositStatus };
            const isBusy = busyId === b.id;

            return (
              <div key={b.id} className="glass-card p-5 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono font-bold text-sm text-[#E86B86]">
                        {b.bookingCode}
                      </span>
                      <StatusBadge status={b.status} />
                      {b.isGuestBooking && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#4A0E1E]/80 text-[#F5F0E6] border border-[#9E1B32]/60">
                          Khách vãng lai
                        </span>
                      )}
                      <span className={`text-xs font-medium ${depMeta.className}`}>
                        • Cọc: {formatVND(b.depositAmount)} ({depMeta.label})
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-[#F5F0E6]">
                      {b.customerDisplayName}{' '}
                      <span className="font-normal text-xs text-[#F5F0E6]/65">
                        ({b.customerDisplayPhone}
                        {b.customerDisplayEmail ? ` • ${b.customerDisplayEmail}` : ''})
                      </span>
                    </div>
                    <div className="text-xs text-[#F5F0E6]/75">
                      Chi nhánh <strong className="text-[#F5F0E6]">{b.branch?.name}</strong> •{' '}
                      {b.hall?.name} •{' '}
                      <strong className="text-[#E86B86]">Bàn {b.table?.tableNumber}</strong> •{' '}
                      {formatDateVN(b.reservationDate)} ({b.startTime} – {b.endTime}) •{' '}
                      {b.guestCount} khách
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {canApproveOrComplete &&
                      ['pending', 'waiting_deposit_confirm'].includes(b.status) && (
                        <button
                          disabled={isBusy}
                          onClick={() => runAction(b.id, 'approve-deposit')}
                          className="btn-wine text-xs py-2 px-3.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Duyệt cọc 1-click
                        </button>
                      )}

                    {canCheckInOrMove && ['confirmed', 'waiting_deposit_confirm'].includes(b.status) && (
                      <button
                        disabled={isBusy}
                        onClick={() => runAction(b.id, 'check-in')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        Check-in
                      </button>
                    )}

                    {canCheckInOrMove &&
                      ['pending', 'waiting_deposit_confirm', 'confirmed', 'checked_in'].includes(
                        b.status
                      ) && (
                        <button
                          disabled={isBusy}
                          onClick={() => openChangeTableModal(b)}
                          className="btn-outline-wine text-xs py-2 px-3"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          Đổi bàn
                        </button>
                      )}

                    {canApproveOrComplete && ['confirmed', 'checked_in'].includes(b.status) && (
                      <button
                        disabled={isBusy}
                        onClick={() => runAction(b.id, 'complete')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30"
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Hoàn tất thanh toán
                      </button>
                    )}

                    {isAdmin &&
                      ['pending', 'waiting_deposit_confirm', 'confirmed'].includes(b.status) && (
                        <button
                          disabled={isBusy}
                          onClick={() => {
                            if (window.confirm(`Hủy đơn ${b.bookingCode}?`)) {
                              runAction(b.id, 'cancel');
                            }
                          }}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-red-300 border border-red-500/35 hover:bg-red-500/15"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Hủy
                        </button>
                      )}
                  </div>
                </div>

                {(b.items?.length > 0 || b.hasWinePromo || b.specialRequest) && (
                  <div className="pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-[#F5F0E6]/75">
                    <div className="flex flex-wrap items-center gap-2">
                      {b.items?.map((it) => (
                        <span
                          key={it.id}
                          className="px-2.5 py-1 rounded-lg bg-[#0B0B0E]/80 border border-white/10"
                        >
                          {it.quantity}x {it.menuItem?.name}
                        </span>
                      ))}
                      {b.hasWinePromo && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#4A0E1E]/80 border border-[#9E1B32]/60 text-[#F5F0E6]">
                          <Wine className="w-3 h-3 text-[#E86B86]" />
                          +2 ly vang 199k
                        </span>
                      )}
                    </div>
                    {b.specialRequest && (
                      <div className="italic text-[#F08CA2]">Ghi chú: {b.specialRequest}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {moveModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 space-y-4 relative">
            <button
              onClick={() => setMoveModal(null)}
              className="absolute top-4 right-4 text-[#F5F0E6]/60 hover:text-[#F5F0E6]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-serif text-xl font-bold text-[#E86B86]">
              Đổi Bàn — {moveModal.bookingCode}
            </h3>
            <p className="text-xs text-[#F5F0E6]/70">
              Hiện tại: <strong>{moveModal.hall?.name} — Bàn {moveModal.table?.tableNumber}</strong>{' '}
              ({formatDateVN(moveModal.reservationDate)} • {moveModal.startTime}–{moveModal.endTime})
            </p>

            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {branchHallsTables.map((group) => {
                const avail = (group.tables || []).filter(
                  (t) => t.displayStatus === 'available' && t.id !== moveModal.tableId
                );
                return (
                  <div key={group.hall.id} className="space-y-1.5">
                    <div className="text-xs font-semibold text-[#E86B86]">{group.hall.name}</div>
                    {avail.length === 0 ? (
                      <div className="text-[11px] text-[#F5F0E6]/45">Không còn bàn trống</div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {avail.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setSelectedNewTableId(t.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                              Number(selectedNewTableId) === t.id
                                ? 'bg-[#9E1B32] text-[#F5F0E6] border-[#C83254] font-bold'
                                : 'bg-[#0B0B0E] text-[#F5F0E6] border-emerald-500/40 hover:border-[#C83254]'
                            }`}
                          >
                            Bàn {t.tableNumber} ({t.capacity}p)
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
              <button onClick={() => setMoveModal(null)} className="btn-outline-wine text-xs py-2">
                Hủy
              </button>
              <button
                disabled={!selectedNewTableId || busyId === moveModal.id}
                onClick={handleConfirmChangeTable}
                className="btn-wine text-xs py-2"
              >
                Xác nhận đổi bàn
              </button>
            </div>
          </div>
        </div>
      )}

      {excelModalOpen && (
        <ExcelSyncModal reservations={reservations} onClose={() => setExcelModalOpen(false)} />
      )}
    </div>
  );
}
