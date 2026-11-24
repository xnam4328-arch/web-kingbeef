export function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN').format(Number(amount || 0)) + 'đ';
}

export function formatDateVN(ymd) {
  if (!ymd) return '';
  const [y, m, d] = String(ymd).split('-');
  if (!d) return ymd;
  return `${d}/${m}/${y}`;
}

export function getTodayYMD() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addTwoHours(startTime) {
  if (!startTime) return '';
  const [h, m] = startTime.split(':').map(Number);
  const total = Math.min(h * 60 + m + 120, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export function getHoursUntil(reservationDate, startTime) {
  if (!reservationDate || !startTime) return 0;
  const target = new Date(`${reservationDate}T${startTime}:00`);
  return (target.getTime() - Date.now()) / (1000 * 60 * 60);
}

export const ROLE_LABELS = {
  admin: 'Quản trị viên',
  cashier: 'Thu ngân',
  staff: 'Phục vụ',
  customer: 'Khách hàng',
};

export const STATUS_META = {
  pending: {
    label: 'Chờ thanh toán cọc',
    className: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
  },
  waiting_deposit_confirm: {
    label: 'Chờ duyệt cọc QR',
    className: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
  },
  confirmed: {
    label: 'Đã xác nhận',
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
  },
  checked_in: {
    label: 'Khách đã Check-in',
    className: 'bg-[#D4AF37]/20 text-[#E8CC6C] border-[#D4AF37]/45',
  },
  completed: {
    label: 'Hoàn tất',
    className: 'bg-purple-500/15 text-purple-300 border-purple-500/35',
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'bg-red-500/15 text-red-300 border-red-500/35',
  },
};

export const DEPOSIT_STATUS_META = {
  unpaid: { label: 'Chưa cọc', className: 'text-amber-300' },
  waiting_confirm: { label: 'Đang chờ duyệt', className: 'text-sky-300' },
  paid: { label: 'Đã nhận cọc', className: 'text-emerald-400' },
};
