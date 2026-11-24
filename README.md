# KingBeef — Steak & Pasta House (3D Table Reservation System)

Hệ thống website đặt bàn nhà hàng Âu cao cấp **KingBeef (Steak & Pasta House)** phong cách **Dark Luxury** tích hợp **Sơ đồ chọn bàn 3D (Three.js)**, **Đặt cọc VietQR**, **Quản lý tồn kho thực đơn** và **Admin Dashboard phân quyền RBAC**.

---

## 1. Công nghệ sử dụng

- **Môi trường:** Chỉ yêu cầu **Node.js (v18 LTS trở lên)**. Không cần cài PostgreSQL/MySQL hay Docker.
- **Root Orchestration:** `concurrently` chạy đồng thời Frontend + Backend chỉ bằng **1 lệnh `npm run dev`**.
- **Frontend (`/client`):** React 18 + Vite + Tailwind CSS + Three.js (`@react-three/fiber`, `@react-three/drei`) + `lucide-react` + `recharts`.
- **Backend (`/server`):** Node.js + Express (RESTful API) + `jsonwebtoken` (JWT) + `bcryptjs`.
- **Database:** SQLite (`server/prisma/dev.db`) + Prisma ORM + `server/prisma/seed.js`.

---

## 2. Hướng dẫn cài đặt & khởi chạy nhanh

### Bước 1: Cài đặt thư viện & Khởi tạo Database SQLite (chỉ chạy 1 lần)

Mở Terminal tại thư mục gốc `kingbeef/` và chạy:

```bash
npm run setup
```

Lệnh này sẽ tự động thực hiện toàn bộ:
1. Cài dependencies cho thư mục gốc (`concurrently`), `/server` và `/client`.
2. Sinh Prisma Client và tạo file SQLite `server/prisma/dev.db`.
3. Chạy `server/prisma/seed.js` nạp đầy đủ:
   - **2 Chi nhánh** (Tân Bình & Gò Vấp), **7 Sảnh** và **62 Bàn 3D** đúng quy tắc đánh số.
   - **52 Món ăn** chuẩn thực đơn KingBeef (`stockQuantity = 50`).
   - **Tài khoản phân quyền (Admin, Cashier, Staff, Customer)** và dữ liệu đơn đặt bàn mẫu cho biểu đồ.

### Bước 2: Khởi chạy toàn bộ hệ thống bằng 1 lệnh

```bash
npm run dev
```

- **Frontend (Web 3D & Admin):** `http://localhost:5173`
- **Backend API:** `http://localhost:5000/api/health`

*(Nếu muốn nạp lại dữ liệu mẫu ban đầu bất kỳ lúc nào, chạy `npm run seed` tại thư mục gốc.)*

---

## 3. Tài khoản phân quyền mặc định (`seed.js`)

> Trang Đăng nhập (`/login`) đã tích hợp sẵn **4 nút điền nhanh tài khoản trải nghiệm**.

| Vai trò | Email | Mật khẩu | Quyền hạn chính |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (`admin`)** | `admin@kingbeef.vn` | `Admin@123` | Toàn quyền: Biểu đồ 2 chi nhánh, Duyệt cọc, Check-in, Quản lý bàn 3D, Thực đơn & tồn kho, Khách hàng, Nhân sự |
| **Thu ngân (`cashier`)** | `cashier@kingbeef.vn` | `Cashier@123` | Duyệt cọc QR 1-click (`confirmed`), Hoàn tất thanh toán (`completed`), Báo cáo doanh thu trong ngày |
| **Phục vụ (`staff`)** | `staff@kingbeef.vn` | `Staff@123` | Xem lịch đặt bàn, Check-in khách (`checked_in`), Đổi bàn cho khách, Báo hết món / mở bán nhanh |
| **Khách hàng (`customer`)** | `customer@kingbeef.vn` | `Customer@123` | Đặt bàn 3D 4 bước, Đặt cọc VietQR, Xem lịch sử & Hủy đơn trước giờ ăn tối thiểu 2 tiếng |

---

## 4. Cấu trúc Chi nhánh, Sảnh & Quy tắc nghiệp vụ nổi bật

### Hệ thống 2 Chi nhánh – 7 Sảnh – 62 Bàn 3D
- **Chi nhánh Tân Bình (3 sảnh — 32 bàn):**
  - `Sảnh Classic` (Trong nhà): 10 bàn (`1 → 10`)
  - `Sảnh Gallery` (Trong nhà): 12 bàn (`1 → 12`)
  - `Sảnh Train to Love` (Trong nhà, kiến trúc vòm toa tàu): 10 bàn (`1 → 10`)
- **Chi nhánh Gò Vấp (4 sảnh — 30 bàn):**
  - `Sảnh Sweet` (Trong nhà): 10 bàn, **không có bàn số 6** (`1, 2, 3, 4, 5, 7, 8, 9, 10, 11`)
  - `Sảnh Love` (Trong nhà): 6 bàn, **bắt đầu từ bàn số 13** (`13 → 18`)
  - `Sảnh VIP` (Phòng/vách ngăn riêng tư): 8 bàn (`1 → 8`)
  - `Sảnh Mây` (Ngoài trời — Outdoor): 6 bàn (`1 → 6`)

### Quy tắc nghiệp vụ đã tích hợp chặt chẽ (Frontend + Backend)
1. **Ghi chú VAT:** Toàn bộ giá hiển thị đi kèm ghi chú *"Giá trên chưa bao gồm thuế VAT"*.
2. **Đặt trước tối thiểu 4 giờ:** *Beef Wellington Premium* và *King & Queen* (`requiresAdvanceOrderHours: 4`) chỉ cho phép đặt nếu giờ dùng bữa cách hiện tại ít nhất 4 giờ.
3. **Ưu đãi Couple Set:** Chọn bất kỳ *Couple Set* nào ở bước Pre-order sẽ tự động hiện gợi ý **Ưu đãi 2 ly rượu vang tùy ý chỉ 199.000đ**. Riêng *Sweetie Set* gắn nhãn nổi bật **"Miễn phí trang trí tiệc"**.
4. **Khóa khung giờ 2 tiếng chống đặt trùng:** Backend kiểm tra giao nhau trong transaction và cập nhật màu bàn 3D theo thời gian thực (**Xanh lá**: Trống • **Đỏ**: Đã đặt • **Vàng đồng**: Đang chọn • **Xám**: Bảo trì).
5. **Tự động quản lý tồn kho:** Tự động trừ tồn kho khi đặt món trước, chuyển `isAvailable = false` ("Hết món") khi tồn kho về 0 và hoàn kho khi hủy đơn.
6. **Hủy đơn trước 2 tiếng:** Khách hàng có thể hủy đơn trực tiếp trong trang Tài khoản nếu còn cách giờ ăn ít nhất 2 tiếng.
