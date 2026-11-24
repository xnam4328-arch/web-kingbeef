import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Sparkles,
  Trees,
  Shield,
  Building2,
  User,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react';
import {
  HOTLINE_DISPLAY,
  HOTLINE_TEL,
  addTwoHours,
  getGoogleMapsUrl,
  getTodayYMD,
} from '../../utils/format';

const TIME_SLOTS = [
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
];

export default function Step1BranchHall({
  branches,
  selectedBranchId,
  setSelectedBranchId,
  selectedHallId,
  setSelectedHallId,
  reservationDate,
  setReservationDate,
  startTime,
  setStartTime,
  guestCount,
  setGuestCount,
  guestName,
  setGuestName,
  guestPhone,
  setGuestPhone,
  guestEmail,
  setGuestEmail,
  isLoggedIn,
  onNext,
}) {
  const currentBranch = branches.find((b) => b.id === Number(selectedBranchId));
  const halls = currentBranch?.halls || [];

  const canProceed =
    selectedBranchId &&
    selectedHallId &&
    reservationDate &&
    startTime &&
    guestCount >= 1 &&
    guestName.trim().length >= 2 &&
    guestPhone.trim().length >= 8;

  const hallIcon = (type) => {
    if (type === 'outdoor') return <Trees className="w-4 h-4 text-emerald-400" />;
    if (type === 'vip') return <Shield className="w-4 h-4 text-[#E86B86]" />;
    return <Building2 className="w-4 h-4 text-[#C83254]" />;
  };

  const hallTypeLabel = (type) => {
    if (type === 'outdoor') return 'Ngoài trời (Outdoor)';
    if (type === 'vip') return 'VIP • Vách ngăn riêng';
    return 'Trong nhà • Ánh sáng trầm ấm';
  };

  return (
    <div className="space-y-8">
      {/* 1. Thong tin khach hang (Guest Booking - khong bat buoc dang nhap) */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-lg font-serif font-semibold text-[#E86B86] flex items-center gap-2">
            <User className="w-5 h-5" />
            1. Thông Tin Người Đặt Bàn
          </h3>
          {isLoggedIn ? (
            <span className="text-[11px] text-emerald-400">
              ✓ Đã tự động điền từ tài khoản của bạn
            </span>
          ) : (
            <span className="text-[11px] text-[#F5F0E6]/55">
              Không cần đăng nhập • Dùng SĐT hoặc Mã đặt bàn để tra cứu lại đơn
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#0B0B0E]/65 border border-[#4A0E1E]">
          <div>
            <label className="block text-xs font-semibold text-[#F5F0E6]/85 mb-1.5">
              Họ và tên <span className="text-[#E86B86]">*</span>
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#E86B86]/70 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="input-luxury pl-9 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5F0E6]/85 mb-1.5">
              Số điện thoại <span className="text-[#E86B86]">*</span>
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[#E86B86]/70 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                placeholder="0909 123 456"
                className="input-luxury pl-9 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#F5F0E6]/85 mb-1.5">
              Email <span className="text-[#F5F0E6]/40 font-normal">(tùy chọn)</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#E86B86]/70 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="email@example.com"
                className="input-luxury pl-9 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Chon Chi nhanh */}
      <div>
        <h3 className="text-lg font-serif font-semibold text-[#E86B86] mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          2. Chọn Chi Nhánh
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {branches.map((branch) => {
            const active = Number(selectedBranchId) === branch.id;
            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => {
                  setSelectedBranchId(branch.id);
                  setSelectedHallId(branch.halls?.[0]?.id || null);
                }}
                className={`p-5 rounded-2xl border text-left transition-all ${
                  active
                    ? 'bg-[#9E1B32]/20 border-[#C83254] shadow-wine'
                    : 'bg-[#0B0B0E]/70 border-[#4A0E1E]/70 hover:border-[#C83254]/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-serif text-xl font-bold text-[#F5F0E6]">
                    Chi nhánh {branch.name}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#4A0E1E]/70 text-[#E86B86]">
                    {branch.halls?.length || 0} sảnh
                  </span>
                </div>
                <a
                  href={getGoogleMapsUrl(branch.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title="Xem chỉ đường trên Google Maps"
                  className="inline-flex items-center gap-1 text-xs text-[#F5F0E6]/75 hover:text-[#E86B86] hover:underline"
                >
                  <span>{branch.address}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
                <p className="text-xs text-[#E86B86] mt-1">
                  Hotline: {branch.phone || HOTLINE_DISPLAY}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Ngay, Khung gio & So khach */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs font-semibold text-[#E86B86] mb-2 flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            Ngày dùng bữa
          </label>
          <input
            type="date"
            min={getTodayYMD()}
            value={reservationDate}
            onChange={(e) => setReservationDate(e.target.value)}
            className="input-luxury text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#E86B86] mb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            Khung giờ (Giữ bàn 2 tiếng)
          </label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="input-luxury text-sm"
          >
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot} className="bg-[#16161C]">
                {slot} – {addTwoHours(slot)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#E86B86] mb-2 flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            Số lượng khách
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={guestCount}
            onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value)))}
            className="input-luxury text-sm"
          />
        </div>
      </div>

      {/* 4. Chon Sanh */}
      {currentBranch && (
        <div>
          <h3 className="text-lg font-serif font-semibold text-[#E86B86] mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            3. Chọn Sảnh Tiệc tại {currentBranch.name}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {halls.map((hall) => {
              const active = Number(selectedHallId) === hall.id;
              return (
                <button
                  key={hall.id}
                  type="button"
                  onClick={() => setSelectedHallId(hall.id)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    active
                      ? 'bg-[#9E1B32]/20 border-[#C83254] shadow-wine'
                      : 'bg-[#0B0B0E]/70 border-[#4A0E1E]/70 hover:border-[#C83254]/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-serif font-bold text-base text-[#F5F0E6]">
                        {hall.name}
                      </span>
                      {hallIcon(hall.type)}
                    </div>
                    <div className="text-[11px] font-medium text-[#E86B86] mb-1.5">
                      {hallTypeLabel(hall.type)}
                    </div>
                    <p className="text-xs text-[#F5F0E6]/60 leading-relaxed">{hall.description}</p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-white/10 text-xs text-[#E86B86] font-semibold">
                    {hall._count?.tables || 0} bàn trên sơ đồ 3D
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Next Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
        <a href={HOTLINE_TEL} className="text-xs text-[#F5F0E6]/65 hover:text-[#E86B86]">
          Cần đặt tiệc đoàn lớn (&gt; 20 khách)? Gọi Hotline{' '}
          <strong className="text-[#E86B86]">{HOTLINE_DISPLAY}</strong>
        </a>

        <button
          type="button"
          disabled={!canProceed}
          onClick={onNext}
          className="btn-wine px-8 py-3"
        >
          Tiếp tục: Chọn bàn trên Sơ đồ 3D →
        </button>
      </div>
    </div>
  );
}
