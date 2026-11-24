import * as XLSX from 'xlsx';
import { DEPOSIT_STATUS_META, STATUS_META, formatDateTimeVN, formatDateVN } from './format';

const CLIENT_WEBHOOK_KEY = 'kingbeef_excel_sync_config_v1';

export const EXCEL_HEADERS = [
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

function getCheckInLabel(status) {
  if (status === 'checked_in') return '✓ Khách đã đến (Check-in)';
  if (status === 'completed') return '✓ Đã hoàn tất bữa ăn';
  if (status === 'cancelled') return '✗ Đã hủy';
  return 'Chờ khách đến';
}

export function formatReservationForExcel(r) {
  const preOrderText = (r.items || [])
    .map((it) => `${it.quantity}x ${it.menuItem?.name || `Món #${it.menuItemId}`}`)
    .join('; ');

  return {
    'Mã đặt bàn': r.bookingCode,
    'Xác nhận khách đến': getCheckInLabel(r.status),
    'Trạng thái đơn': STATUS_META[r.status]?.label || r.status,
    'Họ tên khách': r.customerDisplayName || r.guestName || r.user?.fullName || 'Khách vãng lai',
    'Số điện thoại': r.customerDisplayPhone || r.guestPhone || r.user?.phone || '',
    Email: r.customerDisplayEmail || r.guestEmail || r.user?.email || '',
    'Loại khách': r.isGuestBooking ? 'Khách vãng lai' : 'Thành viên',
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
    'Trạng thái cọc': DEPOSIT_STATUS_META[r.depositStatus]?.label || r.depositStatus,
    'Ghi chú đặc biệt': r.specialRequest || '',
    'Thời gian đặt': formatDateTimeVN(r.createdAt),
  };
}

function createFormattedSheet(rows) {
  const ws =
    rows.length > 0
      ? XLSX.utils.json_to_sheet(rows, { header: EXCEL_HEADERS })
      : XLSX.utils.aoa_to_sheet([EXCEL_HEADERS]);

  ws['!cols'] = [
    { wch: 18 },
    { wch: 24 },
    { wch: 20 },
    { wch: 24 },
    { wch: 15 },
    { wch: 24 },
    { wch: 15 },
    { wch: 14 },
    { wch: 18 },
    { wch: 10 },
    { wch: 13 },
    { wch: 15 },
    { wch: 10 },
    { wch: 40 },
    { wch: 20 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 32 },
    { wch: 19 },
  ];
  return ws;
}

export function downloadReservationsExcel(reservations, filePrefix = 'KingBeef_DatBan') {
  const wb = XLSX.utils.book_new();
  const allRows = reservations.map(formatReservationForExcel);
  const tbRows = reservations
    .filter((r) => (r.branch?.name || '').toLowerCase().includes('tân bình'))
    .map(formatReservationForExcel);
  const gvRows = reservations
    .filter((r) => (r.branch?.name || '').toLowerCase().includes('gò vấp'))
    .map(formatReservationForExcel);

  XLSX.utils.book_append_sheet(wb, createFormattedSheet(allRows), 'Tat_Ca_Don');
  XLSX.utils.book_append_sheet(wb, createFormattedSheet(tbRows), 'Chi_Nhanh_Tan_Binh');
  XLSX.utils.book_append_sheet(wb, createFormattedSheet(gvRows), 'Chi_Nhanh_Go_Vap');

  const today = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filePrefix}_${today}.xlsx`);
}

export function getClientExcelSyncConfig() {
  try {
    const raw = localStorage.getItem(CLIENT_WEBHOOK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return { webhookUrl: '', autoSync: true, lastSyncedAt: null };
}

export function saveClientExcelSyncConfig(cfg) {
  const merged = { ...getClientExcelSyncConfig(), ...cfg };
  localStorage.setItem(CLIENT_WEBHOOK_KEY, JSON.stringify(merged));
  return merged;
}

export async function pushClientWebhook(payload) {
  const cfg = getClientExcelSyncConfig();
  if (!cfg.webhookUrl || !cfg.autoSync) return { skipped: true };
  try {
    await fetch(cfg.webhookUrl, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script Web App cho phep POST tu moi domain (ke ca GitHub Pages)
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    saveClientExcelSyncConfig({ lastSyncedAt: new Date().toISOString() });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export const GOOGLE_APPS_SCRIPT_TEMPLATE = `// Dán đoạn mã này vào Google Sheets -> Tiện ích mở rộng -> Apps Script
// Sau đó bấm Triển khai (Deploy) -> Triển khai mới -> Ứng dụng web (Ai cũng có quyền truy cập)
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('KingBeef_DatBan') || ss.insertSheet('KingBeef_DatBan');
  var payload = JSON.parse(e.postData.contents);
  var headers = [
    'Mã đặt bàn', 'Xác nhận khách đến', 'Trạng thái đơn', 'Họ tên khách',
    'Số điện thoại', 'Email', 'Loại khách', 'Chi nhánh', 'Sảnh', 'Số bàn',
    'Ngày đặt', 'Khung giờ', 'Số khách', 'Món đặt trước', 'Ưu đãi 2 ly vang 199k',
    'Tổng tiền món (VNĐ)', 'Tiền cọc (VNĐ)', 'Trạng thái cọc', 'Ghi chú đặc biệt', 'Thời gian đặt'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#9E1B32').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }

  var rows = payload.rows ? payload.rows : (payload.row ? [payload.row] : []);
  var existingData = sheet.getDataRange().getValues();
  var codeToRowIndex = {};
  for (var i = 1; i < existingData.length; i++) {
    codeToRowIndex[String(existingData[i][0])] = i + 1;
  }

  rows.forEach(function(item) {
    var line = headers.map(function(h) { return item[h] !== undefined ? item[h] : ''; });
    var code = String(item['Mã đặt bàn'] || '');
    if (code && codeToRowIndex[code]) {
      sheet.getRange(codeToRowIndex[code], 1, 1, headers.length).setValues([line]);
    } else {
      sheet.appendRow(line);
    }
  });

  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}`;
