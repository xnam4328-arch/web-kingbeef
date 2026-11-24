import { MapPin, Calendar, Clock, Users, Sparkles, Trees, Shield, Building2 } from 'lucide-react';
import { addTwoHours, getTodayYMD } from '../../utils/format';

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
  onNext,
}) {
  const currentBranch = branches.find((b) => b.id === Number(selectedBranchId));
  const halls = currentBranch?.halls || [];

  const canProceed =
    selectedBranchId && selectedHallId && reservationDate && startTime && guestCount >= 1;

  const hallIcon = (type) => {
    if (type === 'outdoor') return <Trees className="w-4 h-4 text-emerald-400" />;
    if (type === 'vip') return <Shield className="w-4 h-4 text-[#D4AF37]" />;
    return <Building2 className="w-4 h-4 text-amber-300" />;
  };

  const hallTypeLabel = (type) => {
    if (type === 'outdoor') return 'Ngoài trời (Outdoor)';
    if (type === 'vip') return 'VIP • Vách ngăn riêng';
    return 'Trong nhà • Ánh sáng ấm';
  };

  return (
    <div className="space-y-8">
      {/* 1. Chon Chi nhanh */}
      <div>
        <h3 className="text-lg font-serif font-semibold text-[#D4AF37] mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          1. Chọn Chi Nhánh
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
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-gold'
                    : 'bg-[#0B0B0E]/70 border-white/10 hover:border-[#D4AF37]/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-serif text-xl font-bold text-[#F5F0E6]">
                    Chi nhánh {branch.name}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/5 text-[#D4AF37]">
                    {branch.halls?.length || 0} sảnh
                  </span>
                </div>
                <p className="text-xs text-[#F5F0E6]/65">{branch.address}</p>
                <p className="text-xs text-[#D4AF37]/80 mt-1">Hotline: {branch.phone}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Ngay, Khung gio & So khach */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs font-semibold text-[#D4AF37] mb-2 flex items-center gap-1.5">
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
          <label className="block text-xs font-semibold text-[#D4AF37] mb-2 flex items-center gap-1.5">
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
          <label className="block text-xs font-semibold text-[#D4AF37] mb-2 flex items-center gap-1.5">
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

      {/* 3. Chon Sanh */}
      {currentBranch && (
        <div>
          <h3 className="text-lg font-serif font-semibold text-[#D4AF37] mb-3 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            2. Chọn Sảnh Tiệc tại {currentBranch.name}
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
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37] shadow-gold'
                      : 'bg-[#0B0B0E]/70 border-white/10 hover:border-[#D4AF37]/40'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-serif font-bold text-base text-[#F5F0E6]">
                        {hall.name}
                      </span>
                      {hallIcon(hall.type)}
                    </div>
                    <div className="text-[11px] font-medium text-[#E8CC6C] mb-1.5">
                      {hallTypeLabel(hall.type)}
                    </div>
                    <p className="text-xs text-[#F5F0E6]/60 leading-relaxed">{hall.description}</p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-white/10 text-xs text-[#D4AF37] font-semibold">
                    {hall._count?.tables || 0} bàn trên sơ đồ 3D
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Next Button */}
      <div className="flex justify-end pt-4 border-t border-white/10">
        <button
          type="button"
          disabled={!canProceed}
          onClick={onNext}
          className="btn-gold px-8 py-3"
        >
          Tiếp tục: Chọn bàn trên Sơ đồ 3D →
        </button>
      </div>
    </div>
  );
}
