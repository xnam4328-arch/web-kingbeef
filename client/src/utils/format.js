export const HOTLINE_DISPLAY = '0562 275 375';
export const HOTLINE_TEL = 'tel:0562275375';

export function getGoogleMapsUrl(address) {
  if (!address) return 'https://www.google.com/maps';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN').format(Number(amount || 0)) + 'đ';
}

export function formatDateVN(ymd) {
  if (!ymd) return '';
  const [y, m, d] = String(ymd).split('-');
  if (!d) return ymd;
  return `${d}/${m}/${y}`;
}

export function formatDateTimeVN(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
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
    className: 'bg-[#4A0E1E]/60 text-[#F08CA2] border-[#9E1B32]/60',
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
    className: 'bg-[#9E1B32]/30 text-[#F5F0E6] border-[#C83254]/70',
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
  unpaid: { label: 'Chưa cọc', className: 'text-[#E86B86]' },
  waiting_confirm: { label: 'Đang chờ duyệt', className: 'text-sky-300' },
  paid: { label: 'Đã nhận cọc', className: 'text-emerald-400' },
};

export const ACTIVITY_ACTION_META = {
  CONFIRM_DEPOSIT: {
    label: 'Duyệt cọc QR',
    className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
  },
  CHECK_IN: {
    label: 'Check-in khách',
    className: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
  },
  COMPLETE_BOOKING: {
    label: 'Hoàn tất đơn',
    className: 'bg-purple-500/15 text-purple-300 border-purple-500/35',
  },
  CANCEL_BOOKING: {
    label: 'Hủy đặt bàn',
    className: 'bg-red-500/15 text-red-300 border-red-500/35',
  },
  CHANGE_TABLE: {
    label: 'Đổi bàn',
    className: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/35',
  },
  UPDATE_STOCK: {
    label: 'Cập nhật tồn kho',
    className: 'bg-[#9E1B32]/30 text-[#F08CA2] border-[#C83254]/60',
  },
  UPDATE_MENU: {
    label: 'Cập nhật thực đơn',
    className: 'bg-[#4A0E1E]/70 text-[#F5F0E6] border-[#9E1B32]/60',
  },
  UPDATE_TABLE: {
    label: 'Cập nhật bàn 3D',
    className: 'bg-teal-500/15 text-teal-300 border-teal-500/35',
  },
  MANAGE_STAFF: {
    label: 'Quản lý nhân sự',
    className: 'bg-pink-500/15 text-pink-300 border-pink-500/35',
  },
};
