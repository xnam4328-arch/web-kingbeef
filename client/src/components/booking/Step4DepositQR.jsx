import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Copy,
  Check,
  QrCode,
  Calendar,
  MapPin,
  Clock,
  Wine,
  Sparkles,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { api } from '../../services/api';
import { formatDateVN, formatVND } from '../../utils/format';

export default function Step4DepositQR({ reservation, onUpdated }) {
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  if (!reservation) return null;

  const qr = reservation.qrPayment;
  const isWaitingConfirm = reservation.status === 'waiting_deposit_confirm';
  const isConfirmed = reservation.status === 'confirmed';

  const handleCopyContent = () => {
    navigator.clipboard?.writeText(qr?.transferContent || reservation.bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmTransfer = async () => {
    setConfirming(true);
    setError('');
    try {
      const res = await api.patch(`/reservations/${reservation.id}/confirm-transfer`);
      onUpdated(res.reservation);
    } catch (err) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-xs font-semibold text-[#E8CC6C]">
          <Sparkles className="w-3.5 h-3.5" />
          Mã đặt bàn của bạn: <span className="font-mono font-bold">{reservation.bookingCode}</span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#F5F0E6]">
          {isWaitingConfirm || isConfirmed
            ? 'Đã Ghi Nhận Thông Báo Chuyển Khoản!'
            : 'Quét Mã VietQR Để Đặt Cọc Giữ Bàn'}
        </h3>
        <div className="flex justify-center">
          <StatusBadge status={reservation.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Cot trai: Ma VietQR */}
        <div className="p-6 rounded-2xl bg-[#0B0B0E]/85 border border-[#D4AF37]/35 flex flex-col items-center space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#D4AF37]">
            <QrCode className="w-4 h-4" />
            Chuyển khoản nhanh 24/7 qua VietQR
          </div>

          <div className="bg-white p-3.5 rounded-2xl shadow-xl">
            <img
              src={qr?.qrUrl}
              alt="VietQR KingBeef"
              className="w-64 h-64 object-contain"
            />
          </div>

          <div className="w-full space-y-2 text-xs bg-[#16161C] p-4 rounded-xl border border-white/10">
            <div className="flex justify-between">
              <span className="text-[#F5F0E6]/60">Ngân hàng:</span>
              <span className="font-semibold text-[#F5F0E6]">{qr?.bankId} Bank</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#F5F0E6]/60">Số tài khoản:</span>
              <span className="font-mono font-semibold text-[#F5F0E6]">{qr?.accountNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#F5F0E6]/60">Chủ tài khoản:</span>
              <span className="font-semibold text-[#F5F0E6]">{qr?.accountName}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-white/10">
              <span className="text-[#F5F0E6]/60">Số tiền cần cọc:</span>
              <span className="text-base font-bold text-[#D4AF37]">
                {formatVND(reservation.depositAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-white/10">
              <span className="text-[#F5F0E6]/60">Nội dung chuyển khoản:</span>
              <button
                type="button"
                onClick={handleCopyContent}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#D4AF37]/15 text-[#E8CC6C] font-mono font-bold hover:bg-[#D4AF37]/25"
              >
                {qr?.transferContent}
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="w-full p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs">
              {error}
            </div>
          )}

          {reservation.status === 'pending' ? (
            <button
              type="button"
              disabled={confirming}
              onClick={handleConfirmTransfer}
              className="btn-gold w-full py-3.5 text-base"
            >
              <CheckCircle2 className="w-5 h-5" />
              {confirming ? 'Đang gửi xác nhận...' : 'Tôi đã chuyển khoản'}
            </button>
          ) : (
            <div className="w-full p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs text-center space-y-2">
              <CheckCircle2 className="w-7 h-7 mx-auto text-emerald-400" />
              <div className="font-semibold text-sm">
                Đơn đặt bàn đang ở trạng thái Chờ Thu Ngân duyệt cọc (`waiting_deposit_confirm`)
              </div>
              <p className="text-[#F5F0E6]/75">
                Bàn số {reservation.table?.tableNumber} đã được giữ riêng cho bạn. Bạn có thể theo
                dõi trạng thái duyệt cọc trong trang Tài khoản.
              </p>
            </div>
          )}
        </div>

        {/* Cot phai: Chi tiet dat ban */}
        <div className="p-6 rounded-2xl bg-[#0B0B0E]/85 border border-white/10 space-y-4">
          <h4 className="font-serif text-lg font-bold text-[#D4AF37]">Chi Tiết Đơn Đặt Bàn</h4>

          <div className="space-y-2.5 text-sm">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">
                  Chi nhánh {reservation.branch?.name} — {reservation.hall?.name}
                </div>
                <div className="text-xs text-[#F5F0E6]/65">
                  Bàn số <strong className="text-[#D4AF37]">{reservation.table?.tableNumber}</strong>{' '}
                  (Sức chứa {reservation.table?.capacity} khách) • Đặt cho {reservation.guestCount}{' '}
                  khách
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              <span>Ngày: {formatDateVN(reservation.reservationDate)}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#D4AF37]" />
              <span>
                Khung giờ: <strong>{reservation.startTime} – {reservation.endTime}</strong> (giữ bàn
                2 tiếng)
              </span>
            </div>
          </div>

          {(reservation.items?.length > 0 || reservation.hasWinePromo) && (
            <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
              <div className="font-semibold text-[#D4AF37] mb-1">
                Món đặt trước (Giá chưa bao gồm thuế VAT):
              </div>
              {reservation.items.map((it) => (
                <div key={it.id} className="flex justify-between text-[#F5F0E6]/85">
                  <span>
                    {it.quantity}x {it.menuItem?.name}
                  </span>
                  <span>{formatVND(it.unitPrice * it.quantity)}</span>
                </div>
              ))}
              {reservation.hasWinePromo && (
                <div className="flex justify-between text-[#E8CC6C] pt-1">
                  <span className="inline-flex items-center gap-1">
                    <Wine className="w-3.5 h-3.5" />
                    Ưu đãi 2 ly rượu vang tùy ý (Couple Set)
                  </span>
                  <span>199.000đ</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-sm text-[#F5F0E6] pt-2 border-t border-white/10">
                <span>Tổng tiền món đặt trước:</span>
                <span>{formatVND(reservation.totalAmount)}</span>
              </div>
            </div>
          )}

          {reservation.specialRequest && (
            <div className="pt-3 border-t border-white/10 text-xs text-[#F5F0E6]/75">
              <strong className="text-[#F5F0E6]">Ghi chú đặc biệt:</strong>{' '}
              {reservation.specialRequest}
            </div>
          )}

          <div className="pt-4 border-t border-white/10 flex flex-wrap gap-3">
            <Link to="/profile" className="btn-outline-gold flex-1 justify-center text-xs">
              Xem lịch sử đặt bàn
            </Link>
            <Link to="/" className="btn-gold flex-1 justify-center text-xs">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
