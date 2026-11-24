import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  QrCode,
  XCircle,
  CheckCircle2,
  Wine,
  User,
  Copy,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import VatNotice from '../components/common/VatNotice';
import {
  DEPOSIT_STATUS_META,
  ROLE_LABELS,
  formatDateVN,
  formatVND,
} from '../utils/format';

export default function ProfilePage() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState(null);
  const [actionMsg, setActionMsg] = useState('');
  const [actionErr, setActionErr] = useState('');
  const [busyId, setBusyId] = useState(null);

  const loadReservations = () => {
    setLoading(true);
    api
      .get('/reservations/my')
      .then((res) => setReservations(res.reservations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleConfirmTransfer = async (id) => {
    setBusyId(id);
    setActionErr('');
    setActionMsg('');
    try {
      const res = await api.patch(`/reservations/${id}/confirm-transfer`);
      setActionMsg(res.message);
      setQrModal(null);
      loadReservations();
    } catch (err) {
      setActionErr(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCancel = async (booking) => {
    if (!window.confirm(`Bạn chắc chắn muốn hủy đơn ${booking.bookingCode}?`)) return;
    setBusyId(booking.id);
    setActionErr('');
    setActionMsg('');
    try {
      const res = await api.patch(`/reservations/${booking.id}/cancel`);
      setActionMsg(res.message);
      loadReservations();
    } catch (err) {
      setActionErr(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Thong tin tai khoan */}
      <div className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center">
            <User className="w-7 h-7 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#F5F0E6]">{user?.fullName}</h1>
            <div className="text-sm text-[#F5F0E6]/65">
              {user?.email} • {user?.phone}
            </div>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30">
              {ROLE_LABELS[user?.role]}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/booking" className="btn-gold">
            Đặt bàn 3D mới
          </Link>
        </div>
      </div>

      {/* Thong bao */}
      {actionMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}
      {actionErr && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-sm flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{actionErr}</span>
        </div>
      )}

      {/* Lich su dat ban */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <h2 className="text-2xl font-serif font-bold">Lịch Sử Đặt Bàn Của Bạn</h2>
          <VatNotice />
        </div>

        {loading ? (
          <div className="py-12 text-center text-[#F5F0E6]/60">Đang tải lịch sử đặt bàn...</div>
        ) : reservations.length === 0 ? (
          <div className="glass-card p-12 text-center space-y-4">
            <p className="text-[#F5F0E6]/65">Bạn chưa có đơn đặt bàn nào tại KingBeef.</p>
            <Link to="/booking" className="btn-gold">
              Trải nghiệm đặt bàn 3D ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((b) => {
              const depMeta = DEPOSIT_STATUS_META[b.depositStatus] || {
                label: b.depositStatus,
                className: 'text-[#F5F0E6]',
              };

              return (
                <div key={b.id} className="glass-card p-6 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-base font-bold text-[#D4AF37]">
                          {b.bookingCode}
                        </span>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#F5F0E6]/75">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                          Chi nhánh {b.branch?.name} — {b.hall?.name} —{' '}
                          <strong className="text-[#F5F0E6]">Bàn {b.table?.tableNumber}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                          {formatDateVN(b.reservationDate)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                          {b.startTime} – {b.endTime} ({b.guestCount} khách)
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-[#F5F0E6]/55">Tiền cọc giữ bàn</div>
                      <div className="text-lg font-bold text-[#D4AF37]">
                        {formatVND(b.depositAmount)}
                      </div>
                      <div className={`text-xs font-medium ${depMeta.className}`}>
                        {depMeta.label}
                      </div>
                    </div>
                  </div>

                  {/* Pre-order items */}
                  {(b.items?.length > 0 || b.hasWinePromo) && (
                    <div className="bg-[#0B0B0E]/60 rounded-xl p-4 space-y-1.5 text-xs">
                      <div className="font-semibold text-[#D4AF37] mb-1">
                        Món đặt trước (Tổng: {formatVND(b.totalAmount)} — chưa gồm VAT):
                      </div>
                      {b.items.map((it) => (
                        <div key={it.id} className="flex justify-between text-[#F5F0E6]/80">
                          <span>
                            {it.quantity}x {it.menuItem?.name}
                          </span>
                          <span>{formatVND(it.unitPrice * it.quantity)}</span>
                        </div>
                      ))}
                      {b.hasWinePromo && (
                        <div className="flex justify-between text-[#E8CC6C] pt-1 border-t border-white/5">
                          <span className="inline-flex items-center gap-1.5">
                            <Wine className="w-3.5 h-3.5" />
                            Ưu đãi 2 ly rượu vang tùy ý (Couple Set)
                          </span>
                          <span>199.000đ</span>
                        </div>
                      )}
                    </div>
                  )}

                  {b.specialRequest && (
                    <div className="text-xs text-[#F5F0E6]/70">
                      <strong className="text-[#F5F0E6]">Ghi chú:</strong> {b.specialRequest}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="text-[11px] text-[#F5F0E6]/50">
                      Quy định: Khách hàng có thể tự hủy đơn trước giờ ăn tối thiểu 2 tiếng.
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {b.status === 'pending' && (
                        <button
                          onClick={() => setQrModal(b)}
                          className="btn-gold text-xs py-2 px-4"
                        >
                          <QrCode className="w-4 h-4" />
                          Thanh toán cọc QR
                        </button>
                      )}

                      {['pending', 'waiting_deposit_confirm', 'confirmed'].includes(b.status) && (
                        <button
                          disabled={!b.canCancel || busyId === b.id}
                          onClick={() => handleCancel(b)}
                          title={
                            b.canCancel
                              ? 'Hủy đơn đặt bàn'
                              : 'Chỉ được hủy đơn trước giờ ăn tối thiểu 2 tiếng'
                          }
                          className="px-4 py-2 rounded-xl text-xs font-medium border border-red-500/40 text-red-300 hover:bg-red-500/15 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {b.canCancel ? 'Hủy đơn' : 'Quá hạn hủy (< 2h)'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal QR dat coc */}
      {qrModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 relative space-y-4">
            <button
              onClick={() => setQrModal(null)}
              className="absolute top-4 right-4 text-[#F5F0E6]/60 hover:text-[#F5F0E6]"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-serif font-bold text-[#D4AF37]">
              Quét Mã VietQR Đặt Cọc
            </h3>
            <div className="bg-white p-3 rounded-xl flex justify-center">
              <img
                src={qrModal.qrPayment?.qrUrl}
                alt="VietQR Deposit"
                className="w-60 h-60 object-contain"
              />
            </div>
            <div className="text-xs space-y-1.5 bg-[#0B0B0E]/80 p-3.5 rounded-xl border border-white/10">
              <div className="flex justify-between">
                <span className="text-[#F5F0E6]/60">Số tiền cọc:</span>
                <span className="font-bold text-[#D4AF37]">{formatVND(qrModal.depositAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#F5F0E6]/60">Nội dung CK:</span>
                <button
                  onClick={() => navigator.clipboard?.writeText(qrModal.qrPayment?.transferContent)}
                  className="inline-flex items-center gap-1 font-mono text-[#E8CC6C] hover:underline"
                >
                  {qrModal.qrPayment?.transferContent}
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
            <button
              disabled={busyId === qrModal.id}
              onClick={() => handleConfirmTransfer(qrModal.id)}
              className="btn-gold w-full py-3"
            >
              {busyId === qrModal.id ? 'Đang gửi xác nhận...' : 'Tôi đã chuyển khoản'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
