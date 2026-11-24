import { createInitialDemoDB } from './demoData';
import { addTwoHours, getHoursUntil, getTodayYMD } from '../utils/format';
import {
  formatReservationForExcel,
  getClientExcelSyncConfig,
  pushClientWebhook,
  saveClientExcelSyncConfig,
} from '../utils/excelExport';

const STORAGE_KEY = 'kingbeef_static_demo_db_v1';
const ACTIVE_STATUSES = ['pending', 'waiting_deposit_confirm', 'confirmed', 'checked_in'];

function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  const init = createInitialDemoDB();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(init));
  return init;
}

function saveDB(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function nextId(arr) {
  return arr.reduce((m, item) => Math.max(m, item.id || 0), 0) + 1;
}

function toMinutes(t) {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + m;
}

function overlaps(sA, eA, sB, eB) {
  return toMinutes(sA) < toMinutes(eB) && toMinutes(eA) > toMinutes(sB);
}

function buildVietQR(bookingCode, amount) {
  const bankId = 'MB';
  const accountNo = '0741236901122';
  const accountName = 'TRINH XUAN NAM';
  const transferContent = `KINGBEEF ${bookingCode}`;
  return {
    bankId,
    accountNo,
    accountName,
    amount,
    transferContent,
    qrUrl: `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
      transferContent
    )}&accountName=${encodeURIComponent(accountName)}`,
  };
}

function fail(status, message) {
  const err = new Error(message);
  err.status = status;
  throw err;
}

function sanitizeUser(u, db) {
  const { password, ...rest } = u;
  const branch = db.branches.find((b) => b.id === u.branchId) || null;
  return { ...rest, branch: branch ? { id: branch.id, name: branch.name } : null };
}

function getAuthUser(db, token) {
  if (!token || !token.startsWith('demo-token-')) return null;
  const uid = Number(token.replace('demo-token-', ''));
  return db.users.find((u) => u.id === uid) || null;
}

function requireRole(user, roles) {
  if (!user) fail(401, 'Vui lòng đăng nhập để tiếp tục.');
  if (roles && !roles.includes(user.role)) {
    fail(403, `Bạn không có quyền thực hiện thao tác này (yêu cầu: ${roles.join(', ')}).`);
  }
}

function pushLog(db, user, action, targetType, targetId, details, branchId = null) {
  if (!user || !['admin', 'cashier', 'staff'].includes(user.role)) return;
  db.activityLogs.unshift({
    id: nextId(db.activityLogs),
    userId: user.id,
    branchId: branchId !== null && branchId !== undefined ? Number(branchId) : user.branchId || null,
    action,
    targetType,
    targetId: targetId != null ? String(targetId) : null,
    details,
    createdAt: new Date().toISOString(),
  });
}

function hydrateReservation(db, r) {
  const user = r.userId ? db.users.find((u) => u.id === r.userId) : null;
  const branch = db.branches.find((b) => b.id === r.branchId) || null;
  const hall = db.halls.find((h) => h.id === r.hallId) || null;
  const table = db.tables.find((t) => t.id === r.tableId) || null;
  const items = (r.items || []).map((it) => ({
    ...it,
    menuItem: db.menuItems.find((m) => m.id === it.menuItemId) || null,
  }));
  const hoursLeft = getHoursUntil(r.reservationDate, r.startTime);
  const cancellable = ['pending', 'waiting_deposit_confirm', 'confirmed'].includes(r.status);

  return {
    ...r,
    user: user ? { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone } : null,
    branch,
    hall,
    table,
    items,
    customerDisplayName: r.guestName || user?.fullName || 'Khách vãng lai',
    customerDisplayPhone: r.guestPhone || user?.phone || '',
    customerDisplayEmail: r.guestEmail || user?.email || '',
    isGuestBooking: !r.userId,
    qrPayment: buildVietQR(r.bookingCode, r.depositAmount),
    canCancel: cancellable && hoursLeft >= 2,
    hoursUntilMeal: Number(hoursLeft.toFixed(2)),
  };
}

function resRevenue(r) {
  if (r.status === 'completed') return r.totalAmount > 0 ? r.totalAmount : r.depositAmount;
  if (['confirmed', 'checked_in'].includes(r.status)) return r.depositAmount;
  return 0;
}

export async function handleDemoRequest(fullPath, { method = 'GET', body, token } = {}) {
  const db = loadDB();
  const [pathname, queryString] = fullPath.split('?');
  const qs = new URLSearchParams(queryString || '');
  const savedToken = token || localStorage.getItem('kingbeef_token');
  const currentUser = getAuthUser(db, savedToken);

  // ---------------- AUTH ----------------
  if (method === 'POST' && pathname === '/auth/login') {
    const email = (body?.email || '').trim().toLowerCase();
    const u = db.users.find((x) => x.email.toLowerCase() === email && x.password === body?.password);
    if (!u) fail(401, 'Email hoặc mật khẩu không chính xác.');
    return { message: 'Đăng nhập thành công.', token: `demo-token-${u.id}`, user: sanitizeUser(u, db) };
  }

  if (method === 'POST' && pathname === '/auth/register') {
    const email = (body?.email || '').trim().toLowerCase();
    if (db.users.some((x) => x.email.toLowerCase() === email)) fail(409, 'Email này đã được đăng ký.');
    const created = {
      id: nextId(db.users),
      fullName: (body?.fullName || '').trim(),
      email,
      phone: (body?.phone || '').trim(),
      password: body?.password || '',
      role: 'customer',
      branchId: null,
      createdAt: new Date().toISOString(),
    };
    db.users.push(created);
    saveDB(db);
    return { message: 'Đăng ký thành công.', token: `demo-token-${created.id}`, user: sanitizeUser(created, db) };
  }

  if (method === 'GET' && pathname === '/auth/me') {
    requireRole(currentUser);
    return { user: sanitizeUser(currentUser, db) };
  }

  // ---------------- BRANCHES & HALLS ----------------
  if (method === 'GET' && pathname === '/branches') {
    const branches = db.branches.map((b) => ({
      ...b,
      halls: db.halls
        .filter((h) => h.branchId === b.id)
        .map((h) => ({
          ...h,
          _count: { tables: db.tables.filter((t) => t.hallId === h.id).length },
        })),
    }));
    return { branches };
  }

  const hallTablesMatch = pathname.match(/^\/halls\/(\d+)\/tables$/);
  if (method === 'GET' && hallTablesMatch) {
    const hallId = Number(hallTablesMatch[1]);
    const hall = db.halls.find((h) => h.id === hallId);
    if (!hall) fail(404, 'Không tìm thấy sảnh.');
    const branch = db.branches.find((b) => b.id === hall.branchId);
    const date = qs.get('date');
    const startTime = qs.get('startTime');
    const bookedIds = new Set();

    if (date && startTime) {
      const endTime = addTwoHours(startTime);
      db.reservations
        .filter((r) => r.hallId === hallId && r.reservationDate === date && ACTIVE_STATUSES.includes(r.status))
        .forEach((r) => {
          if (overlaps(startTime, endTime, r.startTime, r.endTime)) bookedIds.add(r.tableId);
        });
    }

    const tables = db.tables
      .filter((t) => t.hallId === hallId)
      .sort((a, b) => a.tableNumber - b.tableNumber)
      .map((t) => ({
        ...t,
        displayStatus: t.status === 'maintenance' ? 'maintenance' : bookedIds.has(t.id) ? 'booked' : 'available',
      }));

    return { hall: { ...hall, branch }, tables };
  }

  // ---------------- TABLES (Admin) ----------------
  if (method === 'POST' && pathname === '/tables') {
    requireRole(currentUser, ['admin']);
    const hall = db.halls.find((h) => h.id === Number(body.hallId));
    if (!hall) fail(404, 'Không tìm thấy sảnh.');
    if (db.tables.some((t) => t.hallId === hall.id && t.tableNumber === Number(body.tableNumber))) {
      fail(409, 'Số bàn này đã tồn tại trong sảnh.');
    }
    const table = {
      id: nextId(db.tables),
      hallId: hall.id,
      tableNumber: Number(body.tableNumber),
      capacity: Number(body.capacity || 4),
      posX: Number(body.posX || 0),
      posY: Number(body.posY || 0),
      posZ: Number(body.posZ || 0),
      status: body.status || 'available',
    };
    db.tables.push(table);
    pushLog(db, currentUser, 'UPDATE_TABLE', 'Table', table.tableNumber, `Thêm Bàn số ${table.tableNumber} (${table.capacity} khách) vào ${hall.name}`, hall.branchId);
    saveDB(db);
    return { message: 'Thêm bàn 3D thành công.', table };
  }

  const tableIdMatch = pathname.match(/^\/tables\/(\d+)$/);
  if (tableIdMatch && method === 'PUT') {
    requireRole(currentUser, ['admin']);
    const id = Number(tableIdMatch[1]);
    const t = db.tables.find((x) => x.id === id);
    if (!t) fail(404, 'Không tìm thấy bàn.');
    Object.assign(t, {
      ...(body.tableNumber !== undefined && { tableNumber: Number(body.tableNumber) }),
      ...(body.capacity !== undefined && { capacity: Number(body.capacity) }),
      ...(body.posX !== undefined && { posX: Number(body.posX) }),
      ...(body.posY !== undefined && { posY: Number(body.posY) }),
      ...(body.posZ !== undefined && { posZ: Number(body.posZ) }),
      ...(body.status !== undefined && { status: body.status }),
    });
    const hall = db.halls.find((h) => h.id === t.hallId);
    pushLog(db, currentUser, 'UPDATE_TABLE', 'Table', t.tableNumber, `Cập nhật Bàn số ${t.tableNumber} (${hall?.name}): sức chứa ${t.capacity}, trạng thái ${t.status}`, hall?.branchId);
    saveDB(db);
    return { message: 'Cập nhật bàn 3D thành công.', table: t };
  }

  if (tableIdMatch && method === 'DELETE') {
    requireRole(currentUser, ['admin']);
    const id = Number(tableIdMatch[1]);
    const idx = db.tables.findIndex((x) => x.id === id);
    if (idx === -1) fail(404, 'Không tìm thấy bàn.');
    const t = db.tables[idx];
    const hall = db.halls.find((h) => h.id === t.hallId);
    db.tables.splice(idx, 1);
    pushLog(db, currentUser, 'UPDATE_TABLE', 'Table', t.tableNumber, `Xóa Bàn số ${t.tableNumber} khỏi ${hall?.name}`, hall?.branchId);
    saveDB(db);
    return { message: 'Xóa bàn thành công.' };
  }

  // ---------------- MENU ----------------
  if (method === 'GET' && pathname === '/menu') {
    return { vatNotice: 'Giá trên chưa bao gồm thuế VAT', items: db.menuItems };
  }

  if (method === 'POST' && pathname === '/menu') {
    requireRole(currentUser, ['admin']);
    const stock = Math.max(0, Number(body.stockQuantity ?? 50));
    const item = {
      id: nextId(db.menuItems),
      name: body.name.trim(),
      category: body.category,
      description: (body.description || '').trim(),
      price: Number(body.price),
      imageUrl: body.imageUrl || null,
      badge: body.badge || null,
      stockQuantity: stock,
      isAvailable: stock === 0 ? false : Boolean(body.isAvailable ?? true),
      requiresAdvanceOrderHours: Number(body.requiresAdvanceOrderHours || 0),
    };
    db.menuItems.push(item);
    pushLog(db, currentUser, 'UPDATE_MENU', 'MenuItem', item.id, `Thêm món mới "${item.name}" (${item.category})`);
    saveDB(db);
    return { message: 'Thêm món ăn thành công.', item };
  }

  const menuIdMatch = pathname.match(/^\/menu\/(\d+)$/);
  if (menuIdMatch && method === 'PUT') {
    requireRole(currentUser, ['admin']);
    const item = db.menuItems.find((m) => m.id === Number(menuIdMatch[1]));
    if (!item) fail(404, 'Không tìm thấy món ăn.');
    const prevStock = item.stockQuantity;
    if (body.name !== undefined) item.name = body.name.trim();
    if (body.category !== undefined) item.category = body.category;
    if (body.description !== undefined) item.description = body.description.trim();
    if (body.price !== undefined) item.price = Number(body.price);
    if (body.imageUrl !== undefined) item.imageUrl = body.imageUrl;
    if (body.badge !== undefined) item.badge = body.badge;
    if (body.requiresAdvanceOrderHours !== undefined) item.requiresAdvanceOrderHours = Number(body.requiresAdvanceOrderHours);
    if (body.stockQuantity !== undefined) {
      item.stockQuantity = Math.max(0, Number(body.stockQuantity));
      if (item.stockQuantity === 0) item.isAvailable = false;
      else if (prevStock === 0 && item.stockQuantity > 0 && body.isAvailable === undefined) item.isAvailable = true;
    }
    if (body.isAvailable !== undefined && item.stockQuantity > 0) item.isAvailable = Boolean(body.isAvailable);
    pushLog(db, currentUser, body.name === undefined ? 'UPDATE_STOCK' : 'UPDATE_MENU', 'MenuItem', item.id, `Cập nhật "${item.name}" — tồn kho ${item.stockQuantity}`);
    saveDB(db);
    return { message: 'Cập nhật thực đơn & tồn kho thành công.', item };
  }

  const menuToggleMatch = pathname.match(/^\/menu\/(\d+)\/availability$/);
  if (menuToggleMatch && method === 'PATCH') {
    requireRole(currentUser, ['staff', 'admin']);
    const item = db.menuItems.find((m) => m.id === Number(menuToggleMatch[1]));
    if (!item) fail(404, 'Không tìm thấy món ăn.');
    const nextAvail = body?.isAvailable !== undefined ? Boolean(body.isAvailable) : !item.isAvailable;
    if (nextAvail && item.stockQuantity === 0) fail(400, 'Tồn kho đang bằng 0. Vui lòng cập nhật tồn kho > 0 trước khi mở bán.');
    item.isAvailable = nextAvail;
    pushLog(db, currentUser, 'UPDATE_STOCK', 'MenuItem', item.id, `${item.isAvailable ? 'Mở bán lại' : 'Báo hết món'} "${item.name}"`);
    saveDB(db);
    return { message: item.isAvailable ? 'Đã mở bán món ăn.' : 'Đã chuyển sang trạng thái Hết món.', item };
  }

  if (menuIdMatch && method === 'DELETE') {
    requireRole(currentUser, ['admin']);
    const idx = db.menuItems.findIndex((m) => m.id === Number(menuIdMatch[1]));
    if (idx === -1) fail(404, 'Không tìm thấy món ăn.');
    const [removed] = db.menuItems.splice(idx, 1);
    pushLog(db, currentUser, 'UPDATE_MENU', 'MenuItem', removed.id, `Xóa món ăn "${removed.name}"`);
    saveDB(db);
    return { message: 'Xóa món ăn thành công.' };
  }

  // ---------------- RESERVATIONS ----------------
  if (method === 'POST' && pathname === '/reservations') {
    const table = db.tables.find((t) => t.id === Number(body.tableId));
    const hall = db.halls.find((h) => h.id === Number(body.hallId));
    const branch = db.branches.find((b) => b.id === Number(body.branchId));
    if (!table || !hall || !branch) fail(400, 'Thông tin chi nhánh, sảnh hoặc bàn không hợp lệ.');
    if (table.status === 'maintenance') fail(400, `Bàn số ${table.tableNumber} đang bảo trì.`);

    const guestName = (body.guestName || currentUser?.fullName || '').trim();
    const guestPhone = (body.guestPhone || currentUser?.phone || '').trim();
    const guestEmail = (body.guestEmail || currentUser?.email || '').trim() || null;
    if (!guestName || !guestPhone) fail(400, 'Vui lòng nhập Họ tên và Số điện thoại.');

    const endTime = addTwoHours(body.startTime);
    const conflict = db.reservations.some(
      (r) =>
        r.tableId === table.id &&
        r.reservationDate === body.reservationDate &&
        ACTIVE_STATUSES.includes(r.status) &&
        overlaps(body.startTime, endTime, r.startTime, r.endTime)
    );
    if (conflict) fail(409, `Bàn số ${table.tableNumber} đã có khách đặt trong khung giờ này (giữ bàn 2 tiếng).`);

    const hoursAhead = getHoursUntil(body.reservationDate, body.startTime);
    let preOrderTotal = 0;
    let hasCoupleSet = false;
    const preparedItems = [];

    for (const row of body.items || []) {
      const m = db.menuItems.find((x) => x.id === Number(row.menuItemId));
      const qty = Number(row.quantity);
      if (!m || qty <= 0) continue;
      if (!m.isAvailable || m.stockQuantity < qty) fail(400, `Món "${m.name}" đã hết món hoặc không đủ tồn kho.`);
      if (m.requiresAdvanceOrderHours > 0 && hoursAhead < m.requiresAdvanceOrderHours) {
        fail(400, `Món "${m.name}" yêu cầu đặt trước tối thiểu ${m.requiresAdvanceOrderHours} giờ.`);
      }
      if (m.category === 'Couple Set') hasCoupleSet = true;
      preOrderTotal += m.price * qty;
      preparedItems.push({ id: Date.now() + preparedItems.length, menuItemId: m.id, quantity: qty, unitPrice: m.price });
    }

    const applyWine = Boolean(body.hasWinePromo) && hasCoupleSet;
    const totalAmount = preOrderTotal + (applyWine ? 199000 : 0);
    const depositAmount = totalAmount > 0 ? Math.max(200000, Math.round(totalAmount * 0.3)) : 200000;

    // Tru ton kho
    for (const pi of preparedItems) {
      const m = db.menuItems.find((x) => x.id === pi.menuItemId);
      if (m) {
        m.stockQuantity = Math.max(0, m.stockQuantity - pi.quantity);
        if (m.stockQuantity === 0) m.isAvailable = false;
      }
    }

    const prefix = branch.name.includes('Tân Bình') ? 'TB' : 'GV';
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    const bookingCode = `KB-${prefix}-${rand}`;

    const created = {
      id: nextId(db.reservations),
      bookingCode,
      userId: currentUser ? currentUser.id : null,
      guestName,
      guestPhone,
      guestEmail,
      branchId: branch.id,
      hallId: hall.id,
      tableId: table.id,
      reservationDate: body.reservationDate,
      startTime: body.startTime,
      endTime,
      guestCount: Number(body.guestCount),
      hasWinePromo: applyWine,
      totalAmount,
      depositAmount,
      depositStatus: 'unpaid',
      status: 'pending',
      specialRequest: (body.specialRequest || '').trim() || null,
      createdAt: new Date().toISOString(),
      items: preparedItems,
    };

    db.reservations.unshift(created);
    saveDB(db);
    const hydratedCreated = hydrateReservation(db, created);
    pushClientWebhook({
      event: 'CREATED',
      syncedAt: new Date().toISOString(),
      row: formatReservationForExcel(hydratedCreated),
    }).catch(() => {});
    return {
      message: 'Đặt bàn thành công! Vui lòng quét mã VietQR để hoàn tất đặt cọc.',
      reservation: hydratedCreated,
    };
  }

  // ---------------- EXCEL SYNC (Static / GitHub Pages Mode) ----------------
  if (method === 'GET' && pathname === '/reservations/excel-sync/config') {
    requireRole(currentUser, ['staff', 'cashier', 'admin']);
    return { config: getClientExcelSyncConfig() };
  }

  if (method === 'PUT' && pathname === '/reservations/excel-sync/config') {
    requireRole(currentUser, ['admin']);
    const config = saveClientExcelSyncConfig({
      webhookUrl: (body?.webhookUrl || '').trim(),
      autoSync: body?.autoSync !== false,
    });
    return { message: 'Đã lưu cấu hình liên kết Excel / Google Sheets.', config };
  }

  if (method === 'POST' && pathname === '/reservations/excel-sync/sync-now') {
    requireRole(currentUser, ['staff', 'cashier', 'admin']);
    const cfg = getClientExcelSyncConfig();
    if (!cfg.webhookUrl) {
      return {
        message: 'Chưa cấu hình Webhook URL. Bạn có thể bấm "Tải Excel ngay" để xuất file .xlsx hoặc dán URL Google Sheets phía dưới.',
        config: cfg,
      };
    }
    const allRows = db.reservations.map((r) => formatReservationForExcel(hydrateReservation(db, r)));
    const result = await pushClientWebhook({
      event: 'SYNC_ALL',
      syncedAt: new Date().toISOString(),
      rows: allRows,
    });
    return {
      message: result.ok
        ? `Đã gửi đồng bộ toàn bộ ${allRows.length} đơn đặt bàn sang Google Sheets / Excel Online!`
        : `Không thể gửi sang Webhook (${result.error || 'Lỗi kết nối'}).`,
      config: getClientExcelSyncConfig(),
    };
  }

  const lookupMatch = pathname.match(/^\/reservations\/lookup(?:\/(.+))?$/);
  if (method === 'GET' && lookupMatch) {
    const raw = decodeURIComponent(lookupMatch[1] || qs.get('q') || '').trim();
    if (!raw) fail(400, 'Vui lòng nhập Mã đặt bàn hoặc Số điện thoại.');
    const up = raw.toUpperCase();
    const cleaned = raw.replace(/\s+/g, '');
    const found = db.reservations.filter(
      (r) =>
        r.bookingCode.toUpperCase() === up ||
        (r.guestPhone || '').replace(/\s+/g, '') === cleaned
    );
    if (found.length === 0) fail(404, `Không tìm thấy đơn đặt bàn khớp với "${raw}".`);
    const hydrated = found.map((r) => hydrateReservation(db, r));
    return { reservation: hydrated[0], reservations: hydrated };
  }

  if (method === 'GET' && pathname === '/reservations/my') {
    requireRole(currentUser);
    return {
      reservations: db.reservations
        .filter((r) => r.userId === currentUser.id)
        .map((r) => hydrateReservation(db, r)),
    };
  }

  if (method === 'GET' && pathname === '/reservations') {
    requireRole(currentUser, ['staff', 'cashier', 'admin']);
    let list = db.reservations.map((r) => hydrateReservation(db, r));
    const bId = qs.get('branchId');
    const st = qs.get('status');
    const dt = qs.get('date');
    const search = (qs.get('search') || '').trim().toLowerCase();
    if (bId && bId !== 'all') list = list.filter((r) => r.branchId === Number(bId));
    if (st && st !== 'all') list = list.filter((r) => r.status === st);
    if (dt) list = list.filter((r) => r.reservationDate === dt);
    if (search) {
      list = list.filter(
        (r) =>
          r.bookingCode.toLowerCase().includes(search) ||
          r.customerDisplayName.toLowerCase().includes(search) ||
          r.customerDisplayPhone.toLowerCase().includes(search)
      );
    }
    return { reservations: list };
  }

  const resActionMatch = pathname.match(/^\/reservations\/(\d+)\/(confirm-transfer|approve-deposit|check-in|change-table|complete|cancel)$/);
  if (method === 'PATCH' && resActionMatch) {
    const id = Number(resActionMatch[1]);
    const act = resActionMatch[2];
    const r = db.reservations.find((x) => x.id === id);
    if (!r) fail(404, 'Không tìm thấy đơn đặt bàn.');

    const syncStaticEvent = (ev) => {
      const hyd = hydrateReservation(db, r);
      pushClientWebhook({
        event: ev,
        syncedAt: new Date().toISOString(),
        row: formatReservationForExcel(hyd),
      }).catch(() => {});
      return hyd;
    };

    if (act === 'confirm-transfer') {
      r.status = 'waiting_deposit_confirm';
      r.depositStatus = 'waiting_confirm';
      saveDB(db);
      return { message: 'Đã ghi nhận thông báo chuyển khoản!', reservation: syncStaticEvent('TRANSFER_REPORTED') };
    }
    if (act === 'approve-deposit') {
      requireRole(currentUser, ['cashier', 'admin']);
      r.status = 'confirmed';
      r.depositStatus = 'paid';
      pushLog(db, currentUser, 'CONFIRM_DEPOSIT', 'Reservation', r.bookingCode, `Duyệt cọc QR ${r.depositAmount.toLocaleString('vi-VN')}đ cho đơn ${r.bookingCode}`, r.branchId);
      saveDB(db);
      return { message: `Đã duyệt cọc cho đơn ${r.bookingCode}.`, reservation: syncStaticEvent('DEPOSIT_CONFIRMED') };
    }
    if (act === 'check-in') {
      requireRole(currentUser, ['staff', 'admin']);
      r.status = 'checked_in';
      pushLog(db, currentUser, 'CHECK_IN', 'Reservation', r.bookingCode, `Check-in khách ${r.guestName} tại đơn ${r.bookingCode}`, r.branchId);
      saveDB(db);
      return { message: `Check-in thành công cho đơn ${r.bookingCode}.`, reservation: syncStaticEvent('CHECKED_IN') };
    }
    if (act === 'complete') {
      requireRole(currentUser, ['cashier', 'admin']);
      r.status = 'completed';
      r.depositStatus = 'paid';
      pushLog(db, currentUser, 'COMPLETE_BOOKING', 'Reservation', r.bookingCode, `Hoàn tất thanh toán đơn ${r.bookingCode}`, r.branchId);
      saveDB(db);
      return { message: `Đã hoàn tất thanh toán cho đơn ${r.bookingCode}.`, reservation: syncStaticEvent('COMPLETED') };
    }
    if (act === 'change-table') {
      requireRole(currentUser, ['staff', 'admin']);
      const target = db.tables.find((t) => t.id === Number(body.newTableId));
      if (!target) fail(404, 'Không tìm thấy bàn mới.');
      const targetHall = db.halls.find((h) => h.id === target.hallId);
      r.tableId = target.id;
      r.hallId = target.hallId;
      pushLog(db, currentUser, 'CHANGE_TABLE', 'Reservation', r.bookingCode, `Đổi đơn ${r.bookingCode} sang ${targetHall?.name} - Bàn ${target.tableNumber}`, r.branchId);
      saveDB(db);
      return { message: `Đã đổi sang ${targetHall?.name} - Bàn ${target.tableNumber}.`, reservation: syncStaticEvent('TABLE_CHANGED') };
    }
    if (act === 'cancel') {
      requireRole(currentUser, ['customer', 'admin']);
      r.status = 'cancelled';
      for (const it of r.items || []) {
        const m = db.menuItems.find((x) => x.id === it.menuItemId);
        if (m) {
          m.stockQuantity += it.quantity;
          if (m.stockQuantity > 0) m.isAvailable = true;
        }
      }
      pushLog(db, currentUser, 'CANCEL_BOOKING', 'Reservation', r.bookingCode, `Hủy đơn đặt bàn ${r.bookingCode}`, r.branchId);
      saveDB(db);
      return { message: 'Đã hủy đơn đặt bàn.', reservation: syncStaticEvent('CANCELLED') };
    }
  }

  // ---------------- DASHBOARD ----------------
  if (method === 'GET' && pathname === '/dashboard/overview') {
    requireRole(currentUser, ['cashier', 'admin']);
    const bId = qs.get('branchId');
    let list = db.reservations;
    if (bId && bId !== 'all') list = list.filter((r) => r.branchId === Number(bId));
    const todayStr = getTodayYMD();
    return {
      totalRevenue: list.reduce((s, r) => s + resRevenue(r), 0),
      todayRevenue: list.filter((r) => r.reservationDate === todayStr).reduce((s, r) => s + resRevenue(r), 0),
      totalReservations: list.length,
      waitingDepositCount: list.filter((r) => r.status === 'waiting_deposit_confirm').length,
      confirmedCount: list.filter((r) => r.status === 'confirmed').length,
      checkedInCount: list.filter((r) => r.status === 'checked_in').length,
      completedCount: list.filter((r) => r.status === 'completed').length,
      lowStockCount: db.menuItems.filter((m) => m.stockQuantity <= 10 || !m.isAvailable).length,
      totalCustomers: db.users.filter((u) => u.role === 'customer').length,
    };
  }

  if (method === 'GET' && pathname === '/dashboard/charts') {
    requireRole(currentUser, ['cashier', 'admin']);
    const bId = qs.get('branchId');
    let list = db.reservations.filter((r) => r.status !== 'cancelled');
    let halls = db.halls;
    if (bId && bId !== 'all') {
      list = list.filter((r) => r.branchId === Number(bId));
      halls = halls.filter((h) => h.branchId === Number(bId));
    }

    const revMap = new Map();
    list.forEach((r) => {
      const cur = revMap.get(r.reservationDate) || { date: r.reservationDate, revenue: 0, bookings: 0 };
      cur.revenue += resRevenue(r);
      cur.bookings += 1;
      revMap.set(r.reservationDate, cur);
    });

    const hallOccupancy = halls.map((h) => {
      const bookings = list.filter((r) => r.hallId === h.id).length;
      const totalTables = db.tables.filter((t) => t.hallId === h.id).length || 1;
      return {
        hallId: h.id,
        shortName: h.name,
        bookings,
        occupancyRate: Math.min(100, Math.round((bookings / (totalTables * 2)) * 100)),
      };
    });

    const hours = ['11:00', '12:00', '13:00', '17:00', '18:00', '18:30', '19:00', '19:30', '20:00', '21:00'];
    const peakHours = hours.map((hr) => {
      const matched = list.filter((r) => r.startTime === hr);
      return { hour: hr, bookings: matched.length, guests: matched.reduce((s, r) => s + r.guestCount, 0) };
    });

    return {
      revenueByDate: Array.from(revMap.values()).sort((a, b) => a.date.localeCompare(b.date)),
      hallOccupancy,
      peakHours,
    };
  }

  // ---------------- USERS & ACTIVITY LOGS ----------------
  if (method === 'GET' && pathname === '/users/customers') {
    requireRole(currentUser, ['admin']);
    const customers = db.users
      .filter((u) => u.role === 'customer')
      .map((u) => {
        const resList = db.reservations.filter((r) => r.userId === u.id).map((r) => hydrateReservation(db, r));
        return {
          ...sanitizeUser(u, db),
          reservations: resList,
          totalBookings: resList.length,
          totalSpent: resList.reduce((s, r) => s + resRevenue(r), 0),
        };
      });
    return { customers };
  }

  if (method === 'GET' && pathname === '/users/staff') {
    requireRole(currentUser, ['admin']);
    return { staff: db.users.filter((u) => ['admin', 'cashier', 'staff'].includes(u.role)).map((u) => sanitizeUser(u, db)) };
  }

  if (method === 'POST' && pathname === '/users/staff') {
    requireRole(currentUser, ['admin']);
    const created = {
      id: nextId(db.users),
      fullName: body.fullName,
      email: body.email.trim().toLowerCase(),
      phone: body.phone,
      password: body.password,
      role: body.role,
      branchId: body.branchId ? Number(body.branchId) : null,
      createdAt: new Date().toISOString(),
    };
    db.users.push(created);
    pushLog(db, currentUser, 'MANAGE_STAFF', 'User', created.id, `Tạo tài khoản nhân sự "${created.fullName}" (${created.role})`, created.branchId);
    saveDB(db);
    return { message: 'Tạo tài khoản nhân sự thành công.', user: sanitizeUser(created, db) };
  }

  const staffMatch = pathname.match(/^\/users\/staff\/(\d+)$/);
  if (staffMatch && method === 'PUT') {
    requireRole(currentUser, ['admin']);
    const u = db.users.find((x) => x.id === Number(staffMatch[1]));
    if (!u) fail(404, 'Không tìm thấy nhân sự.');
    if (body.role) u.role = body.role;
    pushLog(db, currentUser, 'MANAGE_STAFF', 'User', u.id, `Cập nhật nhân sự "${u.fullName}" → vai trò ${u.role}`, u.branchId);
    saveDB(db);
    return { message: 'Cập nhật nhân sự thành công.', user: sanitizeUser(u, db) };
  }

  if (staffMatch && method === 'DELETE') {
    requireRole(currentUser, ['admin']);
    const id = Number(staffMatch[1]);
    if (id === currentUser.id) fail(400, 'Không thể tự xóa tài khoản đang đăng nhập.');
    const idx = db.users.findIndex((x) => x.id === id);
    if (idx === -1) fail(404, 'Không tìm thấy nhân sự.');
    const [removed] = db.users.splice(idx, 1);
    pushLog(db, currentUser, 'MANAGE_STAFF', 'User', id, `Xóa tài khoản nhân sự "${removed.fullName}"`, removed.branchId);
    saveDB(db);
    return { message: 'Đã xóa tài khoản nhân sự.' };
  }

  if (method === 'GET' && pathname === '/admin/activity-logs') {
    requireRole(currentUser, ['admin']);
    const bId = qs.get('branchId');
    const uId = qs.get('userId');
    const act = qs.get('action');
    const search = (qs.get('search') || '').trim().toLowerCase();
    const page = Math.max(1, Number(qs.get('page') || 1));
    const limit = Math.max(5, Number(qs.get('limit') || 15));

    let list = db.activityLogs.map((l) => ({
      ...l,
      user: db.users.find((u) => u.id === l.userId) || null,
      branch: db.branches.find((b) => b.id === l.branchId) || null,
    }));

    if (bId && bId !== 'all') list = list.filter((l) => l.branchId === Number(bId));
    if (uId && uId !== 'all') list = list.filter((l) => l.userId === Number(uId));
    if (act && act !== 'all') list = list.filter((l) => l.action === act);
    if (search) {
      list = list.filter(
        (l) =>
          (l.targetId || '').toLowerCase().includes(search) ||
          l.details.toLowerCase().includes(search) ||
          (l.user?.fullName || '').toLowerCase().includes(search)
      );
    }

    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const logs = list.slice((page - 1) * limit, page * limit);
    const staffList = db.users
      .filter((u) => ['admin', 'cashier', 'staff'].includes(u.role))
      .map((u) => ({ id: u.id, fullName: u.fullName, role: u.role }));

    return { logs, staffList, pagination: { page, limit, total, totalPages } };
  }

  fail(404, `Endpoint chưa hỗ trợ: ${method} ${pathname}`);
}
