# PRD — Material AI (Ứng dụng Tìm kiếm Vật liệu)

> Tài liệu này là **Product Requirements Document**, mô tả mục tiêu sản phẩm và yêu cầu chức năng cho Material AI. PRD bao phủ **hai lớp phạm vi**:
> - **Nền tảng đã có (MVP hiện tại)** — đúng như đã triển khai và mô tả chi tiết trong [DESIGN.md](./DESIGN.md).
> - **Mở rộng ưu tiên cho bản kế tiếp** — đóng các khoảng trống đã biết (mục 9 DESIGN.md: tìm ảnh AI, upload ảnh thật, dữ liệu seller qua API, form liên hệ thật) và bổ sung tài khoản khách hàng.
>
> Về mặt kỹ thuật, PRD **cho phép mở rộng kiến trúc** (thêm AI service, storage upload file, đổi/nâng cấp DB...) khi cần, miễn giữ được các phần đang chạy tốt (site tĩnh Tailwind, auth/session, chat polling).

---

## 1. Tổng quan và mục tiêu ứng dụng

**Material AI** là một marketplace 2 chiều kết nối nhà bán vật liệu nội thất (ván công nghiệp, đá, gạch, sơn, gỗ tự nhiên, kính…) với khách hàng, kiến trúc sư (KTS) và kỹ sư xây dựng nội thất đang tìm vật liệu phù hợp.

**Giá trị cốt lõi:**
1. Nhà bán hàng đăng vật liệu kèm thông số kỹ thuật và giá.
2. Khách hàng/KTS/kỹ sư tìm vật liệu theo danh mục hoặc bằng cách upload ảnh mẫu.
3. Khách hàng và nhà bán hàng chat trực tiếp qua nền tảng để kết nối giao dịch (giao dịch thực tế diễn ra ngoài nền tảng).

**Mục tiêu kinh doanh** (theo 4 nhóm chỉ số đã thống nhất — xem chi tiết mục 7):
- Tăng trưởng nguồn cung: số nhà bán hàng đăng ký/được duyệt, số vật liệu được đăng.
- Tăng trưởng nhu cầu: lượt tìm kiếm/upload ảnh, số cuộc chat được khách khởi tạo.
- Tỷ lệ kết nối/chuyển đổi: chat có phản hồi từ seller, dẫn tới liên hệ ngoài nền tảng.
- Chất lượng/độ tin cậy hệ thống: thời gian phản hồi, uptime, tỷ lệ lỗi tìm kiếm/upload.

**Phạm vi phiên bản của PRD này:**
- Ghi nhận nguyên trạng MVP đã chạy thật (auth, đăng vật liệu, chat, admin duyệt seller) làm nền tảng **Must-have đã hoàn thành**.
- Đặt yêu cầu cho vòng phát triển kế tiếp: tài khoản khách hàng, tìm kiếm ảnh bằng AI thật, upload ảnh vật liệu thật, đồng bộ dữ liệu seller qua API, nối form liên hệ vào backend.

---

## 2. Đối tượng người dùng và User Stories

### 2.1 Khách hàng (bao gồm KTS, kỹ sư xây dựng nội thất)
Người tìm vật liệu để tư vấn/thi công dự án. Hiện tại ẩn danh (định danh qua `customerKey` trong localStorage); bản kế tiếp bổ sung tài khoản đăng ký.

- Là khách hàng, tôi muốn tìm vật liệu theo danh mục để nhanh chóng lọc ra đúng loại tôi cần.
- Là khách hàng, tôi muốn upload một tấm ảnh mẫu (vd ảnh vân gỗ/đá tôi thích) để hệ thống gợi ý vật liệu tương tự thay vì phải tự lọc thủ công.
- Là khách hàng, tôi muốn xem hồ sơ chi tiết của nhà bán hàng (đánh giá, số năm hoạt động, liên hệ) trước khi quyết định liên hệ.
- Là khách hàng, tôi muốn chat trực tiếp với nhà bán hàng để hỏi thêm về giá/thông số mà không cần rời khỏi trang.
- *(Mới)* Là khách hàng, tôi muốn đăng ký tài khoản để lịch sử chat và vật liệu đã xem/yêu thích được lưu lại giữa các lần truy cập, thay vì mất khi xoá localStorage hoặc đổi thiết bị.
- Là khách hàng, tôi muốn gửi câu hỏi qua form liên hệ và thực sự nhận được phản hồi (không phải chỉ thông báo mock).

### 2.2 Người bán hàng (Seller)
Doanh nghiệp/cá nhân kinh doanh vật liệu, cần được admin duyệt trước khi bán.

- Là nhà bán hàng, tôi muốn đăng ký tài khoản kèm hồ sơ doanh nghiệp để bắt đầu quy trình được duyệt bán hàng.
- Là nhà bán hàng, tôi muốn đăng nhập vào dashboard riêng để quản lý hồ sơ và danh sách vật liệu của mình.
- Là nhà bán hàng, tôi muốn đăng vật liệu mới kèm ảnh thật (không chỉ text thông số) để khách hàng thấy đúng sản phẩm.
- Là nhà bán hàng, tôi muốn nhận và trả lời tin nhắn từ khách hàng ngay trong dashboard.
- Là nhà bán hàng, tôi muốn biết trạng thái tài khoản của mình (`pending`/`approved`/`blocked`) và lý do nếu bị chặn/từ chối.

### 2.3 Admin (Quản trị viên nền tảng)
Vận hành và kiểm duyệt nền tảng.

- Là admin, tôi muốn duyệt hoặc khoá tài khoản nhà bán hàng để kiểm soát chất lượng nguồn cung.
- Là admin, tôi muốn xem thống kê tổng quan (số seller, số vật liệu, trạng thái duyệt) để theo dõi sức khoẻ nền tảng.
- Là admin, tôi muốn xoá vật liệu vi phạm hoặc sai lệch khỏi hệ thống.
- *(Mới)* Là admin, tôi muốn quản lý tài khoản khách hàng ở mức tối thiểu (khoá tài khoản vi phạm) khi tài khoản khách hàng được triển khai.

---

## 3. Danh sách chức năng chính (Must / Should / Could)

### 3.1 Đã có trong MVP (nền tảng — Must, đã triển khai)
| Chức năng | Đối tượng | Ghi chú |
|---|---|---|
| Đăng ký/đăng nhập/đăng xuất (session) | Seller, Admin | `POST /api/auth/*`, bcrypt hash, session cookie 7 ngày |
| Duyệt/khoá/mở khoá/xoá seller | Admin | Trạng thái `pending`/`approved`/`blocked` |
| Đăng/sửa/xoá vật liệu (text-only) | Seller | Bị chặn nếu tài khoản chưa `approved` |
| Xem/lọc vật liệu theo danh mục | Khách hàng | `materials.html`, 7 tab danh mục |
| Modal chi tiết nhà bán hàng | Khách hàng | Rating, địa chỉ, liên hệ, vật liệu tiêu biểu |
| Chat khách ẩn danh ↔ seller | Khách hàng, Seller | Polling 4–15s, bảng `conversations`/`messages` thật |
| Thống kê tổng quan cho admin | Admin | `GET /api/admin/stats` |
| Đa ngôn ngữ VI/EN cho trang marketing | Khách hàng | `i18n.js` |
| FAQ tìm kiếm + lọc danh mục | Khách hàng | `faq.html` |

### 3.2 Mở rộng ưu tiên cho bản kế tiếp

| Chức năng | Ưu tiên | Đối tượng | Mô tả |
|---|---|---|---|
| **Tìm kiếm vật liệu bằng ảnh (AI thật)** | **Must** | Khách hàng | Nối dropzone/upload hiện có (chỉ preview) vào một endpoint xử lý ảnh thật (nhận diện vân/màu/hoạ tiết → trả về vật liệu tương tự). Đây là USP truyền thông chính của trang chủ nhưng hiện chưa có backend. |
| **Tài khoản khách hàng (đăng ký/đăng nhập)** | **Must** | Khách hàng | Thay dần định danh `customerKey` localStorage bằng tài khoản thật; giữ khả năng dùng ẩn danh song song (không bắt buộc đăng nhập mới được chat). |
| **Upload ảnh thật cho vật liệu (seller)** | **Must** | Seller | Thêm xử lý file upload (vd `multer` + storage) vào form "Đăng vật liệu mới", thay vì chỉ nhập text thông số. |
| **Đồng bộ dữ liệu seller qua API** | **Should** | Khách hàng, Admin | `sellers.html` chuyển từ mảng JS hard-code sang gọi endpoint public (vd `GET /api/public/sellers`) để không lệch pha với dữ liệu thật trong DB. |
| **Form liên hệ nối backend thật** | **Should** | Khách hàng, Admin | `contact.html` gửi dữ liệu tới API lưu DB hoặc gửi email, thay vì chỉ `preventDefault()` mock. |
| **Lưu lịch sử/yêu thích cho khách hàng có tài khoản** | **Should** | Khách hàng | Sau khi có tài khoản: lưu lịch sử chat, danh sách vật liệu đã xem/yêu thích. |
| **Quản lý tài khoản khách hàng (admin)** | **Could** | Admin | Xem danh sách, khoá tài khoản khách hàng vi phạm (spam chat...). |
| **Đánh giá/rating do khách hàng tự nhập** | **Could** | Khách hàng | Hiện rating trên modal seller là dữ liệu mẫu tĩnh; cho khách hàng có tài khoản gửi đánh giá thật. |
| **Thông báo real-time (WebSocket) cho chat** | **Could** | Khách hàng, Seller | Thay polling hiện tại để giảm độ trễ tin nhắn. |

---

## 4. Non-Goals (KHÔNG làm ở phiên bản này)

- **Không xử lý thanh toán/giao dịch trong nền tảng** — Material AI chỉ kết nối, giao dịch tiền bạc diễn ra ngoài hệ thống (qua chat/liên hệ trực tiếp).
- **Không có giỏ hàng, đặt hàng, hay quản lý đơn hàng.**
- **Không có ứng dụng di động (iOS/Android)** — chỉ web responsive.
- **Không tích hợp vận chuyển/logistics.**
- **Không xây dựng mô hình AI tìm kiếm ảnh từ đầu ở phiên bản này** — ưu tiên tích hợp dịch vụ/API AI có sẵn (self-hosted hoặc bên thứ ba) thay vì tự huấn luyện model; việc chọn nhà cung cấp cụ thể để mở (xem mục 8).
- **Không mở rộng thêm ngôn ngữ ngoài VI/EN.**
- **Không xây dựng hệ thống review 2 chiều (seller đánh giá khách hàng).**
- **Không có tích hợp ERP/tồn kho thật cho seller** — form đăng vật liệu vẫn là nhập tay, không đồng bộ tự động với hệ thống quản lý kho của seller.
- **Không đổi định vị sản phẩm** — vẫn là nền tảng "kết nối & tra cứu", không trở thành sàn thương mại điện tử đầy đủ (full e-commerce).

---

## 5. Luồng sử dụng chính

### 5.1 Khách hàng — tìm vật liệu bằng ảnh và liên hệ seller
1. Vào trang chủ (`index.html`), kéo-thả hoặc chọn ảnh mẫu vào dropzone hero.
2. *(Mới)* Ảnh được gửi tới endpoint AI xử lý thật; hệ thống chuyển sang `materials.html` với kết quả đã được lọc theo độ tương đồng (thay vì chỉ preview rồi chuyển trang như hiện tại).
3. Khách hàng lọc thêm theo danh mục nếu cần, xem lưới sản phẩm.
4. Click vào "Xem nhà bán hàng" trên một thẻ vật liệu → mở modal chi tiết seller (rating, địa chỉ, liên hệ).
5. Click "Liên hệ nhà bán hàng" → mở chat widget, gõ tin nhắn đầu tiên.
6. *(Mới, tuỳ chọn)* Nếu đã đăng nhập, cuộc trò chuyện và vật liệu đã xem được lưu vào tài khoản; nếu ẩn danh, vẫn hoạt động như hiện tại qua `customerKey`.
7. Seller nhận tin nhắn trong dashboard, phản hồi; khách hàng nhận phản hồi qua widget (polling).

### 5.2 Người bán hàng — đăng ký, đăng vật liệu, chăm sóc khách
1. Vào `register.html`, điền hồ sơ doanh nghiệp (tên, danh mục, SĐT, địa chỉ, mô tả) → tài khoản tạo với trạng thái `pending`.
2. Đăng nhập `login.html` → vào `seller-dashboard.html`, thấy banner "đang chờ duyệt".
3. Admin duyệt tài khoản (xem 5.3) → trạng thái chuyển `approved`, banner biến mất.
4. Seller điền form "Đăng vật liệu mới": danh mục, tiêu đề, thông số, giá, **và ảnh thật** *(mới)*.
5. Vật liệu xuất hiện trên `materials.html` cho khách hàng tìm thấy.
6. Seller mở hộp "Tin nhắn khách hàng", chọn hội thoại, trả lời khách.

### 5.3 Admin — duyệt seller và kiểm soát nội dung
1. Đăng nhập `login.html` bằng tài khoản admin → vào `admin-dashboard.html`.
2. Xem 4 stat card tổng quan (tổng seller, chờ duyệt, đã duyệt, tổng vật liệu).
3. Vào tab "Nhà bán hàng", duyệt (`pending` → `approved`) hoặc khoá tài khoản vi phạm.
4. Vào tab "Vật liệu", xoá vật liệu sai lệch/vi phạm nếu phát hiện.
5. *(Mới)* Nếu có tài khoản khách hàng: vào tab tương ứng để khoá tài khoản khách hàng vi phạm (spam chat, nội dung không phù hợp).

---

## 6. Giao diện dự kiến (liên kết [DESIGN.md](./DESIGN.md))

Giao diện kế thừa toàn bộ hệ thống thiết kế đã chuẩn hoá trong DESIGN.md (mục 3–4): bảng màu kem–nâu đen–xám ấm, typography Inter/Roboto, glassmorphism cho navbar/help widget, `.reveal` scroll animation.

- **Trang hiện có, giữ nguyên layout, chỉ đổi phần dữ liệu/logic phía sau:**
  `index.html` (dropzone nối AI thật — mục 5.1), `materials.html` (kết quả tìm ảnh động thay vì chỉ lọc tĩnh), `sellers.html` (dữ liệu từ API thay vì mảng JS — mục 3.2), `contact.html` (form nối backend), `seller-dashboard.html` (thêm control upload ảnh trong form đăng vật liệu — mục 7.2 DESIGN.md).
- **Trang mới cần thiết kế thêm** (theo cùng design system tầng Auth ở mục 6 DESIGN.md):
  - `customer-login.html` / `customer-register.html` (hoặc mở rộng `login.html`/`register.html` hiện có để hỗ trợ thêm role `customer`).
  - Trang/khu vực "Tài khoản của tôi" cho khách hàng: lịch sử chat, vật liệu đã xem/yêu thích (tầng Dashboard tối giản, tương tự `seller-dashboard.html` nhưng scope hẹp hơn).
- **Không cần thiết kế mới:** `faq.html`, `admin-dashboard.html` giữ nguyên như hiện tại (chỉ thêm 1 tab quản lý khách hàng nếu triển khai mục Could ở 3.2).

---

## 7. Ràng buộc kỹ thuật và tiêu chí thành công (Success Metrics)

### 7.1 Ràng buộc kỹ thuật
- **Giữ nguyên phần đang chạy tốt:** frontend site tĩnh HTML/Tailwind CDN, backend Node/Express + SQLite (better-sqlite3), session qua `express-session`, mật khẩu hash `bcryptjs`, chat qua polling (không bắt buộc đổi sang WebSocket).
- **Được phép mở rộng khi cần** (đã thống nhất với chủ sản phẩm):
  - Thêm dịch vụ/API xử lý ảnh AI (self-hosted hoặc bên thứ ba) cho tính năng tìm kiếm bằng ảnh — nhà cung cấp cụ thể còn mở (mục 8).
  - Thêm xử lý upload file thật (vd `multer` + lưu trữ local hoặc object storage) cho ảnh vật liệu.
  - Có thể cần nâng cấp/đổi DB nếu SQLite không đáp ứng được khi có thêm bảng tài khoản khách hàng + lượng ảnh lớn — đánh giá lại khi có số liệu tải thực tế.
- **Bảo toàn tương thích:** dữ liệu seed hiện có (8 seller demo, admin demo) và các route API hiện tại không bị phá vỡ khi thêm chức năng mới.

### 7.2 Success Metrics (theo 4 nhóm đã chọn)

| Nhóm | Chỉ số cụ thể |
|---|---|
| **Tăng trưởng nguồn cung** | Số tài khoản seller đăng ký mới/tháng; tỷ lệ được `approved`; số vật liệu đăng mới/tháng; % vật liệu có ảnh thật (sau khi có upload) |
| **Tăng trưởng nhu cầu** | Số lượt tìm kiếm bằng ảnh/tháng; số lượt lọc theo danh mục; số cuộc chat mới được khách khởi tạo/tháng |
| **Tỷ lệ kết nối/chuyển đổi** | % cuộc chat nhận được phản hồi từ seller trong vòng 24h; % cuộc chat có từ 3 tin nhắn qua lại trở lên (dấu hiệu quan tâm thật) |
| **Chất lượng/độ tin cậy hệ thống** | Thời gian phản hồi endpoint tìm kiếm ảnh (mục tiêu < 3s); uptime API (mục tiêu ≥ 99%); tỷ lệ lỗi upload ảnh (< 2%) |

---

## 8. Câu hỏi còn mở (Open Questions)

- **Nhà cung cấp/mô hình AI tìm kiếm ảnh:** dùng API bên thứ ba (vd Google Vision, AWS Rekognition, mô hình embedding ảnh mở) hay tự host? Ảnh hưởng trực tiếp tới chi phí vận hành và độ trễ.
- **Ngân sách & timeline** cho các hạng mục Must ở mục 3.2 (AI search, upload ảnh, tài khoản khách hàng) — chưa được xác nhận, cần chủ sản phẩm chốt trước khi lập roadmap chi tiết.
- **Phạm vi tài khoản khách hàng ở bản đầu:** chỉ lưu lịch sử chat + yêu thích, hay mở rộng luôn sang gửi đánh giá/rating thật (hiện đang là dữ liệu mẫu tĩnh)?
- **Có bắt buộc xác thực email/SĐT** khi khách hàng đăng ký, hay cho phép đăng ký nhanh (social login, hoặc chỉ email + mật khẩu)?
- **Thứ tự ưu tiên giữa các hạng mục Must** (AI search vs. tài khoản khách hàng vs. upload ảnh) nếu không thể làm song song — nên làm cái nào trước?
- **Chính sách dữ liệu cá nhân** cho tài khoản khách hàng mới (lưu trữ, thời gian giữ dữ liệu chat) — cần xác nhận có yêu cầu tuân thủ cụ thể nào không.
- **`sellers.html` chuyển sang API:** có cần thêm endpoint public mới (không yêu cầu auth) hay tái sử dụng route admin hiện có với quyền hạn giới hạn?
