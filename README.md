# Material AI

Marketplace 2 chiều kết nối **nhà bán vật liệu nội thất** (ván công nghiệp, đá, gạch, sơn, gỗ tự nhiên, kính…) với **khách hàng, kiến trúc sư và kỹ sư xây dựng nội thất** đang tìm vật liệu phù hợp.

- Nhà bán hàng đăng vật liệu kèm thông số kỹ thuật và giá.
- Khách hàng tìm vật liệu theo danh mục (bản kế tiếp: upload ảnh để tìm bằng AI).
- Khách hàng và nhà bán hàng chat trực tiếp qua nền tảng để kết nối giao dịch (giao dịch thực tế diễn ra ngoài nền tảng).

Tài liệu chi tiết:
- [PRD.md](./PRD.md) — mục tiêu sản phẩm, user stories, phạm vi chức năng.
- [DESIGN.md](./DESIGN.md) — hệ thống thiết kế, sitemap, mô tả từng trang.

## Kiến trúc

Frontend là các trang **HTML tĩnh** dùng Tailwind CSS qua CDN, phục vụ bởi backend **Node.js/Express + SQLite** (xử lý auth, đăng vật liệu, chat).

```
/index.html              Trang chủ
/materials.html          Kho vật liệu (danh mục + lưới sản phẩm + modal nhà bán hàng)
/sellers.html            Danh sách nhà bán hàng
/faq.html                Câu hỏi thường gặp
/contact.html            Liên hệ (form UI, chưa nối backend)
/login.html               Đăng nhập (nhà bán hàng / admin)
/register.html            Đăng ký nhà bán hàng
/seller-dashboard.html    Bảng điều khiển nhà bán hàng (auth-gated, role=seller)
/admin-dashboard.html     Bảng điều khiển quản trị (auth-gated, role=admin)

/i18n.js                  Đa ngôn ngữ VI/EN dùng chung
/chat-widget.js           Widget chat nổi (khách ẩn danh ↔ nhà bán hàng)
/melamine-data.js         Dữ liệu mẫu tấm Melamine An Cường
/images/                  Logo, favicon, ảnh mẫu

/server/server.js         Express app: routes auth/seller/admin/chat + phục vụ static site
/server/db.js             Khởi tạo SQLite (better-sqlite3), schema các bảng users/seller_profiles/materials/conversations/messages
/server/seed.js           Seed admin + seller demo + vật liệu mẫu
/server/middleware/       requireAuth, requireRole
```

Xem chi tiết hệ màu, typography, breakpoint responsive trong [DESIGN.md](./DESIGN.md).

## Cài đặt & chạy dự án

Yêu cầu: Node.js (khuyến nghị v18+).

```bash
cd server
npm install
npm run seed    # tạo DB SQLite + seed admin/seller demo
npm start        # chạy server tại http://localhost:5500
```

Server phục vụ cả API lẫn toàn bộ file tĩnh ở thư mục gốc — mở `http://localhost:5500` là vào thẳng trang chủ.

Có thể đổi cổng bằng biến môi trường `PORT` và secret session bằng `SESSION_SECRET`:

```bash
PORT=4000 SESSION_SECRET=your-secret npm start
```

### Tài khoản demo (sau khi chạy `npm run seed`)

| Vai trò | Đăng nhập | Mật khẩu |
|---|---|---|
| Admin | `admin@materialai.vn` | `Admin@2026` |
| Seller (bất kỳ email seller nào trong `server/seed.js`) | vd `minhkhoi@daminhkhoi.vn` | `MaterialAI@2026` |

## API chính

Toàn bộ endpoint nằm trong [server/server.js](./server/server.js):

| Nhóm | Endpoint |
|---|---|
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Seller | `GET/PUT /api/seller/profile`, `GET/POST /api/seller/materials`, `PUT/DELETE /api/seller/materials/:id` |
| Admin | `GET /api/admin/sellers`, `PUT /api/admin/sellers/:id/status`, `DELETE /api/admin/sellers/:id`, `GET /api/admin/materials`, `DELETE /api/admin/materials/:id`, `GET /api/admin/stats` |
| Chat (khách ẩn danh) | `POST /api/chat/start`, `GET /api/chat/conversations`, `GET/POST /api/chat/conversations/:id/messages` |
| Chat (seller) | `GET /api/seller/conversations`, `GET/POST /api/seller/conversations/:id/messages` |

Auth dùng session cookie (7 ngày), mật khẩu hash bằng `bcryptjs`. Các route seller/admin được bảo vệ bởi middleware `requireAuth` + `requireRole` trong [server/middleware/auth.js](./server/middleware/auth.js).

## Trạng thái hiện tại

Đây là bản MVP đang chạy thật. Các phần còn là placeholder / chưa nối backend (xem mục 9 [DESIGN.md](./DESIGN.md) và mục 3.2 [PRD.md](./PRD.md) để biết ưu tiên mở rộng):

- Tìm kiếm vật liệu bằng ảnh (AI) — mới có UI upload/preview, chưa có xử lý ảnh thật.
- Upload ảnh thật cho vật liệu (seller) — hiện chỉ nhập text thông số.
- `sellers.html` dùng mảng dữ liệu hard-code, chưa gọi API thật.
- Form liên hệ (`contact.html`) chỉ mock, chưa gửi dữ liệu tới backend.
- Chưa có tài khoản khách hàng (khách hàng hiện định danh ẩn danh qua `customerKey` trong localStorage).
