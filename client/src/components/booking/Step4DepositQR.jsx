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
  Phone,
  Search,
  ExternalLink,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { api } from '../../services/api';
import {
  HOTLINE_DISPLAY,
  HOTLINE_TEL,
  formatDateVN,
  formatVND,
  getGoogleMapsUrl,
} from '../../utils/format';

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
      const res = await api.patch(`/reservations/${reservation.id}/confirm-transfer`, {
        bookingCode: reservation.bookingCode,
      });
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
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#4A0E1E]/80 border border-[#C83254]/70 text-xs font-semibold text-[#F5F0E6]">
          <Sparkles className="w-3.5 h-3.5 text-[#E86B86]" />
          Mã đặt bàn của bạn: <span className="font-mono font-bold text-[#E86B86]">{reservation.bookingCode}</span>
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
        <div className="p-6 rounded-2xl bg-[#0B0B0E]/85 border border-[#9E1B32]/65 flex flex-col items-center space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#E86B86]">
            <QrCode className="w-4 h-4" />
            Chuyển khoản nhanh 24/7 qua VietQR
          </div>

          <div className="bg-white p-3.5 rounded-2xl shadow-xl">
            <img
              src={qr?.qrUrl}
              alt="VietQR MB Bank - TRINH XUAN NAM"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `${import.meta.env.BASE_URL}images/vietqr-kingbeef.jpg`;
              }}
              className="w-64 h-64 object-contain"
            />
          </div>

          <div className="w-full space-y-2 text-xs bg-[#16161C] p-4 rounded-xl border border-[#4A0E1E]">
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
              <span className="text-base font-bold text-[#E86B86]">
                {formatVND(reservation.depositAmount)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1.5 border-t border-white/10">
              <span className="text-[#F5F0E6]/60">Nội dung chuyển khoản:</span>
              <button
                type="button"
                onClick={handleCopyContent}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#4A0E1E]/80 text-[#F5F0E6] font-mono font-bold hover:bg-[#9E1B32]"
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
              className="btn-wine w-full py-3.5 text-base"
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
                Hãy lưu lại Mã đặt bàn <strong className="font-mono">{reservation.bookingCode}</strong>{' '}
                để tra cứu trạng thái bất kỳ lúc nào tại mục <strong>Tra cứu đơn</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Cot phai: Chi tiet dat ban */}
        <div className="p-6 rounded-2xl bg-[#0B0B0E]/85 border border-[#4A0E1E] space-y-4">
          <h4 className="font-serif text-lg font-bold text-[#E86B86]">Chi Tiết Đơn Đặt Bàn</h4>

          <div className="space-y-2.5 text-sm">
            <div>
              <span className="text-[#F5F0E6]/60">Khách hàng: </span>
              <strong className="text-[#F5F0E6]">{reservation.customerDisplayName}</strong> •{' '}
              <span className="font-mono text-xs">{reservation.customerDisplayPhone}</span>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-[#C83254] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">
                  Chi nhánh {reservation.branch?.name} — {reservation.hall?.name}
                </div>
                <a
                  href={getGoogleMapsUrl(reservation.branch?.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Mở chỉ đường trên Google Maps"
                  className="inline-flex items-center gap-1 text-xs text-[#F5F0E6]/70 hover:text-[#E86B86] hover:underline"
                >
                  <span>{reservation.branch?.address}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <div className="text-xs text-[#F5F0E6]/75 mt-0.5">
                  Bàn số <strong className="text-[#E86B86]">{reservation.table?.tableNumber}</strong>{' '}
                  (Sức chứa {reservation.table?.capacity} khách) • Đặt cho {reservation.guestCount}{' '}
                  khách
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-[#C83254]" />
              <span>Ngày: {formatDateVN(reservation.reservationDate)}</span>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-[#C83254]" />
              <span>
                Khung giờ: <strong>{reservation.startTime} – {reservation.endTime}</strong> (giữ bàn
                2 tiếng)
              </span>
            </div>

            <div className="flex items-center gap-2.5 pt-1 text-xs">
              <Phone className="w-4 h-4 text-[#C83254]" />
              <span>
                Hotline hỗ trợ:{' '}
                <a href={HOTLINE_TEL} className="text-[#E86B86] font-bold hover:underline">
                  {HOTLINE_DISPLAY}
                </a>
              </span>
            </div>
          </div>

          {(reservation.items?.length > 0 || reservation.hasWinePromo) && (
            <div className="pt-3 border-t border-white/10 space-y-1.5 text-xs">
              <div className="font-semibold text-[#E86B86] mb-1">
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
                <div className="flex justify-between text-[#E86B86] pt-1">
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
            <Link to="/lookup" className="btn-outline-wine flex-1 justify-center text-xs">
              <Search className="w-3.5 h-3.5" />
              Tra cứu đơn đặt bàn
            </Link>
            <Link to="/" className="btn-wine flex-1 justify-center text-xs">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
