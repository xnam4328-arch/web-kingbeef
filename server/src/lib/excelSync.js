const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const prisma = require('./prisma');

const EXPORTS_DIR = path.join(__dirname, '..', '..', 'exports');
const EXCEL_FILE_PATH = path.join(EXPORTS_DIR, 'KingBeef_DatBan.xlsx');
const CONFIG_FILE_PATH = path.join(EXPORTS_DIR, 'excel-sync-config.json');

const STATUS_LABELS = {
  pending: 'Chờ thanh toán cọc',
  waiting_deposit_confirm: 'Chờ duyệt cọc QR',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã Check-in',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
};

const DEPOSIT_LABELS = {
  unpaid: 'Chưa cọc',
  waiting_confirm: 'Chờ thu ngân duyệt',
  paid: 'Đã nhận cọc',
};

function ensureExportsDir() {
  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }
}

function getSyncConfig() {
  ensureExportsDir();
  const defaults = {
    webhookUrl: process.env.EXCEL_WEBHOOK_URL || '',
    autoSync: true,
    lastSyncedAt: null,
    localExcelPath: EXCEL_FILE_PATH,
  };
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const saved = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));
      return { ...defaults, ...saved, localExcelPath: EXCEL_FILE_PATH };
    }
  } catch {
    // ignore corrupted config
  }
  return defaults;
}

function saveSyncConfig(partial) {
  ensureExportsDir();
  const current = getSyncConfig();
  const next = {
    webhookUrl: partial.webhookUrl !== undefined ? String(partial.webhookUrl).trim() : current.webhookUrl,
    autoSync: partial.autoSync !== undefined ? Boolean(partial.autoSync) : current.autoSync,
    lastSyncedAt: partial.lastSyncedAt !== undefined ? partial.lastSyncedAt : current.lastSyncedAt,
  };
  fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(next, null, 2), 'utf8');
  return { ...next, localExcelPath: EXCEL_FILE_PATH };
}

function formatDateVN(ymd) {
  if (!ymd) return '';
  const [y, m, d] = String(ymd).split('-');
  return d ? `${d}/${m}/${y}` : ymd;
}

function formatDateTimeVN(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getCheckInLabel(status) {
  if (status === 'checked_in') return '✓ Khách đã đến (Check-in)';
  if (status === 'completed') return '✓ Đã hoàn tất bữa ăn';
  if (status === 'cancelled') return '✗ Đã hủy';
  return 'Chờ khách đến';
}

function formatReservationRow(r) {
  const preOrderText = (r.items || [])
    .map((it) => `${it.quantity}x ${it.menuItem?.name || `Món #${it.menuItemId}`}`)
    .join('; ');

  return {
    'Mã đặt bàn': r.bookingCode,
    'Xác nhận khách đến': getCheckInLabel(r.status),
    'Trạng thái đơn': STATUS_LABELS[r.status] || r.status,
    'Họ tên khách': r.guestName || r.user?.fullName || 'Khách vãng lai',
    'Số điện thoại': r.guestPhone || r.user?.phone || '',
    Email: r.guestEmail || r.user?.email || '',
    'Loại khách': r.userId ? 'Thành viên' : 'Khách vãng lai',
    'Chi nhánh': r.branch?.name || '',
    Sảnh: r.hall?.name || '',
    'Số bàn': r.table ? `Bàn ${r.table.tableNumber}` : '',
    'Ngày đặt': formatDateVN(r.reservationDate),
    'Khung giờ': `${r.startTime} - ${r.endTime}`,
    'Số khách': r.guestCount,
    'Món đặt trước': preOrderText || 'Gọi món tại bàn',
    'Ưu đãi 2 ly vang 199k': r.hasWinePromo ? 'Có (+199.000đ)' : 'Không',
    'Tổng tiền món (VNĐ)': r.totalAmount || 0,
    'Tiền cọc (VNĐ)': r.depositAmount || 0,
    'Trạng thái cọc': DEPOSIT_LABELS[r.depositStatus] || r.depositStatus,
    'Ghi chú đặc biệt': r.specialRequest || '',
    'Thời gian đặt': formatDateTimeVN(r.createdAt),
  };
}

function buildWorksheet(rows) {
  const headers = [
    'Mã đặt bàn',
    'Xác nhận khách đến',
    'Trạng thái đơn',
    'Họ tên khách',
    'Số điện thoại',
    'Email',
    'Loại khách',
    'Chi nhánh',
    'Sảnh',
    'Số bàn',
    'Ngày đặt',
    'Khung giờ',
    'Số khách',
    'Món đặt trước',
    'Ưu đãi 2 ly vang 199k',
    'Tổng tiền món (VNĐ)',
    'Tiền cọc (VNĐ)',
    'Trạng thái cọc',
    'Ghi chú đặc biệt',
    'Thời gian đặt',
  ];

  const ws =
    rows.length > 0
      ? XLSX.utils.json_to_sheet(rows, { header: headers })
      : XLSX.utils.aoa_to_sheet([headers]);

  ws['!cols'] = [
    { wch: 18 }, // Ma dat ban
    { wch: 24 }, // Xac nhan khach den
    { wch: 20 }, // Trang thai don
    { wch: 24 }, // Ho ten
    { wch: 15 }, // SDT
    { wch: 24 }, // Email
    { wch: 15 }, // Loai khach
    { wch: 14 }, // Chi nhanh
    { wch: 18 }, // Sanh
    { wch: 10 }, // So ban
    { wch: 13 }, // Ngay dat
    { wch: 15 }, // Khung gio
    { wch: 10 }, // So khach
    { wch: 40 }, // Mon dat truoc
    { wch: 20 }, // Uu dai vang
    { wch: 18 }, // Tong tien mon
    { wch: 16 }, // Tien coc
    { wch: 18 }, // Trang thai coc
    { wch: 32 }, // Ghi chu
    { wch: 19 }, // Thoi gian dat
  ];

  return ws;
}

function buildExcelBuffer(reservations) {
  const wb = XLSX.utils.book_new();
  const allRows = reservations.map(formatReservationRow);
  const tbRows = reservations
    .filter((r) => (r.branch?.name || '').toLowerCase().includes('tân bình'))
    .map(formatReservationRow);
  const gvRows = reservations
    .filter((r) => (r.branch?.name || '').toLowerCase().includes('gò vấp'))
    .map(formatReservationRow);

  XLSX.utils.book_append_sheet(wb, buildWorksheet(allRows), 'Tat_Ca_Don');
  XLSX.utils.book_append_sheet(wb, buildWorksheet(tbRows), 'Chi_Nhanh_Tan_Binh');
  XLSX.utils.book_append_sheet(wb, buildWorksheet(gvRows), 'Chi_Nhanh_Go_Vap');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

async function fetchAllReservationsForExcel() {
  return prisma.reservation.findMany({
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true } },
      branch: { select: { id: true, name: true } },
      hall: { select: { id: true, name: true } },
      table: { select: { id: true, tableNumber: true } },
      items: { include: { menuItem: { select: { id: true, name: true } } } },
    },
    orderBy: [{ reservationDate: 'desc' }, { startTime: 'desc' }, { createdAt: 'desc' }],
  });
}

async function syncLocalExcelFile() {
  try {
    ensureExportsDir();
    const all = await fetchAllReservationsForExcel();
    const buffer = buildExcelBuffer(all);
    fs.writeFileSync(EXCEL_FILE_PATH, buffer);
    saveSyncConfig({ lastSyncedAt: new Date().toISOString() });
    return { count: all.length, path: EXCEL_FILE_PATH };
  } catch (err) {
    console.error('[Excel Local Sync Warning]', err.message);
    return null;
  }
}

async function pushToWebhook(payload) {
  const cfg = getSyncConfig();
  if (!cfg.webhookUrl || !cfg.autoSync) return { skipped: true };

  try {
    const res = await fetch(cfg.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    console.error('[Excel Webhook Warning]', err.message);
    return { ok: false, error: err.message };
  }
}

async function syncReservationEverywhere(reservation, eventType = 'UPDATED') {
  // 1. Cap nhat file Excel cuc bo server/exports/KingBeef_DatBan.xlsx
  await syncLocalExcelFile();

  // 2. Day sang Excel Online / Google Sheets Webhook (neu da cau hinh)
  if (reservation) {
    await pushToWebhook({
      event: eventType,
      syncedAt: new Date().toISOString(),
      row: formatReservationRow(reservation),
    });
  }
}

module.exports = {
  EXCEL_FILE_PATH,
  getSyncConfig,
  saveSyncConfig,
  formatReservationRow,
  buildExcelBuffer,
  fetchAllReservationsForExcel,
  syncLocalExcelFile,
  pushToWebhook,
  syncReservationEverywhere,
};
