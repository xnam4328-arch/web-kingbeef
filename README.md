# KingBeef — Steak & Pasta House (3D Table Reservation System)

Hệ thống website đặt bàn nhà hàng Âu cao cấp **KingBeef (Steak & Pasta House)** phong cách **Dark Luxury Đỏ Rượu Vang (Wine Red)** tích hợp **Sơ đồ chọn bàn 3D (Three.js)**, **Đặt bàn không cần đăng nhập (Guest Booking)**, **Tra cứu đơn & VietQR**, **Quản lý tồn kho thực đơn** và **Admin Dashboard phân quyền RBAC + Nhật ký thao tác nhân sự (Audit Log)**.

- **Hotline toàn hệ thống:** `0562 275 375`
- **Chi nhánh Tân Bình:** `120 Trương Công Định, Quận Tân Bình, TP.HCM`
- **Chi nhánh Gò Vấp:** `495 Phan Văn Trị, Quận Gò Vấp, TP.HCM`

---

## 1. Công nghệ sử dụng

- **Môi trường:** Chỉ yêu cầu **Node.js (v18 LTS trở lên)**.
- **Root Orchestration:** `concurrently` chạy đồng thời Frontend + Backend chỉ bằng **1 lệnh `npm run dev`**.
- **Frontend (`/client`):** React 18 + Vite + Tailwind CSS + Three.js (`@react-three/fiber`, `@react-three/drei`) + `lucide-react` + `recharts`.
- **Backend (`/server`):** Node.js + Express (RESTful API) + `jsonwebtoken` (JWT) + `bcryptjs`.
- **Database:** SQLite (`server/prisma/dev.db`) + Prisma ORM + `server/prisma/seed.js`.

---

## 2. Hướng dẫn cài đặt & khởi chạy nhanh

```bash
# 1. Cài đặt dependencies + tạo SQLite dev.db + nạp dữ liệu seed.js
npm run setup

# 2. Khởi chạy đồng thời Frontend (5173) và Backend (5000) chỉ bằng 1 lệnh
npm run dev
```

- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000/api/health`
- **Ảnh thực đơn cục bộ:** Xem danh sách tên file chuẩn tại `client/public/images/menu/DANH_SACH_ANH_MENU.md` và thả ảnh `.jpg` vào thư mục `client/public/images/menu/`.

---

## 3. Tài khoản phân quyền mặc định (`seed.js`)

| Vai trò | Email | Mật khẩu | Quyền hạn chính |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (`admin`)** | `admin@kingbeef.vn` | `Admin@123` | Toàn quyền + **Lịch sử thao tác nhân sự (Audit Log)** |
| **Thu ngân (`cashier`)** | `cashier@kingbeef.vn` | `Cashier@123` | Duyệt cọc QR 1-click (`confirmed`), Hoàn tất thanh toán (`completed`), Doanh thu ngày |
| **Phục vụ (`staff`)** | `staff@kingbeef.vn` | `Staff@123` | Xem lịch đặt bàn, Check-in (`checked_in`), Đổi bàn, Báo hết món nhanh |
| **Khách hàng (`customer`)** | `customer@kingbeef.vn` | `Customer@123` | Đặt bàn 3D (hoặc đặt không cần đăng nhập), Tra cứu đơn `/lookup`, Hủy đơn ≥ 2 tiếng |
