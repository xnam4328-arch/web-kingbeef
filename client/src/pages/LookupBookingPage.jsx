import { useState } from 'react';
import {
  Search,
  Calendar,
  Clock,
  MapPin,
  Phone,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  Wine,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import VatNotice from '../components/common/VatNotice';
import {
  DEPOSIT_STATUS_META,
  HOTLINE_DISPLAY,
  HOTLINE_TEL,
  formatDateVN,
  formatVND,
  getGoogleMapsUrl,
} from '../utils/format';

export default function LookupBookingPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleLookup = async (e, overrideQuery) => {
    if (e) e.preventDefault();
    const q = (overrideQuery !== undefined ? overrideQuery : query).trim();
    if (!q) return;

    setLoading(true);
    setError('');
    setSuccessMsg('');
    setSearched(true);

    try {
      const res = await api.get(`/reservations/lookup/${encodeURIComponent(q)}`);
      setResults(res.reservations || (res.reservation ? [res.reservation] : []));
    } catch (err) {
      setResults([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = async (booking) => {
    setBusyId(booking.id);
    setError('');
    setSuccessMsg('');
    try {
      const res = await api.patch(`/reservations/${booking.id}/confirm-transfer`, {
        bookingCode: booking.bookingCode,
      });
      setSuccessMsg(res.message);
      setResults((prev) =>
        prev.map((item) => (item.id === booking.id ? res.reservation : item))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <div className="text-center space-y-2">
        <div className="text-xs uppercase tracking-[0.25em] text-[#E86B86]">
          Guest Booking Lookup
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#F5F0E6]">
          Tra Cứu Đơn Đặt Bàn &amp; Mã QR Cọc
        </h1>
        <p className="text-sm text-[#F5F0E6]/65 max-w-xl mx-auto">
          Khách hàng đặt bàn không cần đăng nhập có thể nhập <strong>Mã đặt bàn (BookingCode)</strong>{' '}
          hoặc <strong>Số điện thoại</strong> để kiểm tra trạng thái giữ bàn và mã VietQR bất kỳ lúc
          nào.
        </p>
      </div>

      {/* Form tra cuu */}
      <form
        onSubmit={handleLookup}
        className="glass-card p-5 sm:p-6 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#E86B86] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nhập Mã đặt bàn (VD: KB-GV-DEMO04) hoặc SĐT (VD: 0938112233)..."
            className="input-luxury pl-10 text-sm"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-wine px-6 py-2.5 shrink-0">
          {loading ? 'Đang tra cứu...' : 'Tra cứu ngay'}
        </button>
      </form>

      {/* Goi y ma mau de test nhanh */}
      <div className="text-center text-xs text-[#F5F0E6]/55 flex flex-wrap items-center justify-center gap-2">
        <span>Thử nhanh đơn khách vãng lai mẫu:</span>
        <button
          type="button"
          onClick={() => {
            setQuery('KB-GV-DEMO04');
            handleLookup(null, 'KB-GV-DEMO04');
          }}
          className="px-2.5 py-1 rounded-lg bg-[#4A0E1E]/50 border border-[#9E1B32]/50 text-[#F5F0E6] font-mono hover:border-[#C83254]"
        >
          KB-GV-DEMO04
        </button>
        <button
          type="button"
          onClick={() => {
            setQuery('0938112233');
            handleLookup(null, '0938112233');
          }}
          className="px-2.5 py-1 rounded-lg bg-[#4A0E1E]/50 border border-[#9E1B32]/50 text-[#F5F0E6] font-mono hover:border-[#C83254]"
        >
          0938112233
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-sm flex items-center gap-2 max-w-2xl mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Ket qua */}
      {results.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-serif text-xl font-bold text-[#E86B86]">
              Tìm thấy {results.length} đơn đặt bàn
            </h2>
            <VatNotice />
          </div>

          {results.map((b) => {
            const depMeta = DEPOSIT_STATUS_META[b.depositStatus] || { label: b.depositStatus };
            const qr = b.qrPayment;

            return (
              <div key={b.id} className="glass-card p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Thong tin chi tiet */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-lg font-bold text-[#E86B86]">
                        {b.bookingCode}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <span className={`text-xs font-semibold ${depMeta.className}`}>
                      Cọc {formatVND(b.depositAmount)} ({depMeta.label})
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-[#F5F0E6]/85">
                    <div>
                      <strong className="text-[#F5F0E6]">Khách hàng:</strong> {b.customerDisplayName}{' '}
                      • <span className="font-mono">{b.customerDisplayPhone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-[#C83254] shrink-0 mt-0.5" />
                      <span>
                        Chi nhánh <strong>{b.branch?.name}</strong> (
                        <a
                          href={getGoogleMapsUrl(b.branch?.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Mở trên Google Maps"
                          className="inline-flex items-center gap-1 text-[#E86B86] hover:underline"
                        >
                          <span>{b.branch?.address}</span>
                          <ExternalLink className="w-3 h-3 inline shrink-0" />
                        </a>
                        ) — {b.hall?.name} —{' '}
                        <strong className="text-[#E86B86]">Bàn số {b.table?.tableNumber}</strong>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-5 text-xs text-[#F5F0E6]/75">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#C83254]" />
                        {formatDateVN(b.reservationDate)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#C83254]" />
                        {b.startTime} – {b.endTime} ({b.guestCount} khách)
                      </span>
                    </div>
                  </div>

                  {(b.items?.length > 0 || b.hasWinePromo) && (
                    <div className="bg-[#0B0B0E]/75 rounded-xl p-4 space-y-1.5 text-xs border border-[#4A0E1E]/60">
                      <div className="font-semibold text-[#E86B86] mb-1">
                        Món đặt trước (Tổng: {formatVND(b.totalAmount)} — chưa VAT):
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
                        <div className="flex justify-between text-[#E86B86] pt-1 border-t border-white/10">
                          <span className="inline-flex items-center gap-1">
                            <Wine className="w-3.5 h-3.5" />
                            Ưu đãi 2 ly rượu vang tùy ý
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

                  <div className="pt-2 text-xs text-[#F5F0E6]/65 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#C83254]" />
                    <span>
                      Cần hỗ trợ thay đổi hoặc hủy bàn? Gọi Hotline:{' '}
                      <a href={HOTLINE_TEL} className="text-[#E86B86] font-semibold hover:underline">
                        {HOTLINE_DISPLAY}
                      </a>
                    </span>
                  </div>
                </div>

                {/* Ma QR dat coc */}
                <div className="p-4 rounded-xl bg-[#0B0B0E]/85 border border-[#4A0E1E] flex flex-col items-center justify-between space-y-3">
                  <div className="text-xs font-semibold text-[#E86B86] inline-flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" />
                    Mã VietQR Đặt Cọc
                  </div>
                  <div className="bg-white p-2.5 rounded-xl">
                    <img src={qr?.qrUrl} alt="VietQR" className="w-44 h-44 object-contain" />
                  </div>
                  <div className="w-full text-[11px] space-y-1 text-[#F5F0E6]/80">
                    <div className="flex justify-between">
                      <span>Số tiền:</span>
                      <strong className="text-[#E86B86]">{formatVND(b.depositAmount)}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Nội dung:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(qr?.transferContent)}
                        className="inline-flex items-center gap-1 font-mono text-[#E86B86] hover:underline"
                      >
                        {qr?.transferContent}
                        {copiedCode === qr?.transferContent ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {b.status === 'pending' && (
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => handleConfirmTransfer(b)}
                      className="btn-wine w-full text-xs py-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {busyId === b.id ? 'Đang gửi...' : 'Tôi đã chuyển khoản'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {searched && !loading && !error && results.length === 0 && (
        <div className="glass-card p-10 text-center text-sm text-[#F5F0E6]/60">
          Không tìm thấy đơn đặt bàn nào.
        </div>
      )}
    </div>
  );
}
