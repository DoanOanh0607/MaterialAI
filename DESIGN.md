# Material AI — Tài liệu thiết kế (Design Spec)

> Tài liệu này mô tả hệ thống thiết kế, sitemap và các tính năng của website **Material AI** **đúng theo trạng thái hiện tại của source code** (không còn là bản concept ban đầu). Toàn bộ giao diện là các file `.html` tĩnh dùng Tailwind qua CDN, có thêm một backend Node/Express + SQLite thật cho phần tài khoản, đăng vật liệu và chat.
>
> Vì source thật đã tồn tại trong repo, tài liệu này **không nhúng lại toàn bộ code HTML** (dễ lệch pha với code thật) — mỗi trang được mô tả bằng cấu trúc section + tính năng, kèm đường dẫn file để mở source gốc khi cần.

---

## 1. Bối cảnh dự án

| | |
|---|---|
| **Tên dự án** | Material AI |
| **Đối tượng mục tiêu** | Nhà bán vật liệu nội thất (ván công nghiệp, đá, gạch, sơn, gỗ tự nhiên, kính…); khách hàng; nhà thiết kế; kỹ sư xây dựng nội thất |
| **Giá trị cốt lõi** | (1) Nhà bán hàng đăng vật liệu, thông số kỹ thuật, giá tiền. (2) Khách hàng/KTS/kỹ sư tìm vật liệu theo danh mục hoặc upload ảnh. (3) Khách và nhà bán hàng chat trực tiếp với nhau qua nền tảng |
| **Mô hình** | Marketplace 2 chiều: Bên cung (nhà bán hàng, có tài khoản quản trị riêng) ↔ Bên cầu (KTS, kỹ sư, khách hàng ẩn danh) kết nối qua danh mục vật liệu + chat trực tuyến |
| **Trạng thái triển khai** | Frontend tĩnh (HTML/Tailwind CDN) đã hoàn thiện đủ 9 trang; backend Node/Express + SQLite đã chạy thật cho auth, quản lý vật liệu, chat — **xem mục 9 "Giới hạn hiện tại"** để biết phần nào còn là placeholder (ví dụ: tìm kiếm bằng ảnh AI chưa có endpoint xử lý ảnh thật) |

---

## 2. Kiến trúc thư mục & Sitemap

```
/index.html              Trang chủ
/materials.html          Kho vật liệu (danh mục + lưới sản phẩm + modal nhà bán hàng)
/sellers.html            Danh sách nhà bán hàng (grid + modal chi tiết)
/faq.html                Câu hỏi thường gặp (tìm kiếm + lọc danh mục)
/contact.html            Liên hệ (form UI, chưa nối backend)
/login.html              Đăng nhập (nhà bán hàng / admin)
/register.html           Đăng ký nhà bán hàng
/seller-dashboard.html   Bảng điều khiển nhà bán hàng (auth-gated, role=seller)
/admin-dashboard.html    Bảng điều khiển quản trị (auth-gated, role=admin)

/i18n.js                 Hệ thống đa ngôn ngữ VI/EN dùng chung
/chat-widget.js          Widget chat nổi (khách ẩn danh ↔ nhà bán hàng)
/melamine-data.js        Dữ liệu mẫu 360 tấm Melamine An Cường (ảnh minh hoạ vật liệu)
/images/                 Logo, favicon, ảnh hero, ảnh mẫu gạch-đá & melamine

/server/server.js        Express app: routes auth/seller/admin/chat + phục vụ static site
/server/db.js            Khởi tạo SQLite (better-sqlite3), schema 5 bảng
/server/seed.js          Seed admin + 8 seller demo + vật liệu mẫu
/server/middleware/      requireAuth, requireRole
```

**3 tầng giao diện** (khác nhau về navbar/footer/tính năng, xem chi tiết mục 5-7):

| Tầng | Trang | Đặc điểm |
|---|---|---|
| **Marketing (public)** | index, materials, sellers, faq, contact | Navbar pill nổi + footer đầy đủ + i18n VI/EN + hiệu ứng `.reveal` |
| **Auth** | login, register | Cùng ngôn ngữ thị giác nhưng **không có i18n, không có footer**, form nối backend thật |
| **Dashboard** | seller-dashboard, admin-dashboard | Navbar tối giản (logo + email + đăng xuất), không i18n, không footer, thêm màu badge trạng thái riêng |

**Responsive:** breakpoint chính `md: 768px`. Dưới 768px: mọi grid (`grid-cols-2/3/4`) chuyển `grid-cols-1`, navbar chuyển hamburger menu, khối 2 cột xếp dọc.

**SEO cơ bản** (chỉ áp dụng đủ ở tầng marketing; các trang auth/dashboard không có meta description vì không cần index):
```html
<title>...</title>
<meta name="description" content="...">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

---

## 3. Hệ thống thiết kế (Design System)

> Bảng màu đã đổi từ tông xanh dương/cam (bản concept đầu) sang **tông kem – nâu đen – xám ấm**, lấy cảm hứng vật liệu tự nhiên (gỗ, đá).

### 3.1 Màu sắc

| Vai trò | Biến Tailwind | Hex | Ghi chú sử dụng |
|---|---|---|---|
| Nền trang | `bg-cream` | `#FBF6F0` | Nền `<body>` toàn site |
| Chữ chính | `ink` | `#211E1A` | Heading, body text, footer background |
| Chữ phụ | `muted` | `#6B6259` | Caption, mô tả phụ |
| Thương hiệu (Secondary) | `secondary` | `#3A3632` (50 `#F2F0EE`, 100 `#E3DFDA`, 600 `#2C2925`, 700 `#201E1A`) | Logo/text nhấn, viền input, nút outline, trạng thái nav active nền |
| Nhấn (Accent) | `accent` | `#9AA3A4` (50 `#F1F2F0`, 100 `#E3E6E4`, 600 `#7D8688`) | Nút CTA chính (nền be-xám), giá tiền (`text-accent-600`), badge, sao đánh giá |
| Kem (nền phụ) | `cream` | `#FBF6F0` | Alias của nền trang, dùng lại trong `bg-cream` |

**Chỉ dùng ở dashboard (không thuộc bảng màu chính, dành riêng cho trạng thái):**

| Trạng thái | Nền / Chữ |
|---|---|
| `badge-pending` (chờ duyệt) | xám trung tính |
| `badge-approved` (đã duyệt) | `#EAF3EA` / `#3E7A45` (xanh lá) |
| `badge-blocked` (bị khoá) | `#FBE9E7` / `#B3261E` (đỏ) |

Hiệu ứng **kính (glassmorphism)**: `background: rgba(251,247,242,.78)` + `backdrop-filter: blur(16px)` + viền `1px solid rgba(251,247,242,.6)`. Dùng cho navbar pill nổi và một số card nổi bật.

### 3.2 Kiểu chữ (Typography)

- **Heading:** `Inter` (500–800)
- **Body:** `Roboto` (400–500)
- **Tagline/script:** class `.font-script` — `Inter` *italic* weight 700, dùng cho các dòng tagline ngắn dưới H1 (vd "nhanh · chính xác · minh bạch")
- Nạp qua Google Fonts (đã thêm italic weight so với bản đầu):
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,500;0,600;0,700;0,800;1,600;1,700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
```

| Cấp | Font | Size (desktop / mobile) | Weight |
|---|---|---|---|
| H1 | Inter | 3.75rem (`text-6xl`) / 2.25rem (`text-4xl`) | 800 |
| Tagline (`.font-script`) | Inter italic | 1.875rem / 1.5rem | 700 |
| H2 | Inter | 2.25rem / 1.875rem | 700 |
| H3 | Inter | 1.25rem | 600 |
| Body | Roboto | 1rem | 400 |
| Caption | Roboto | 0.75–0.875rem | 500 |

### 3.3 Khoảng cách, bo góc, đổ bóng

- Section padding đã **thu gọn hơn bản concept đầu**: `py-8`–`py-14` (trước là `py-20 md:py-28`) — giao diện hiện đặc hơn, ít khoảng trắng dư.
- Bo góc: nút `rounded-full`, thẻ `rounded-2xl`/`rounded-3xl`.
- Đổ bóng: `shadow-soft` = `0 10px 40px -10px rgba(33,30,26,0.15)`; hover nâng thẻ `hover:-translate-y-1 hover:shadow-xl`.

### 3.4 Tailwind config dùng chung (nhúng trong `<head>` mỗi trang)

```html
<script src="https://cdn.tailwindcss.com"></script>
<script>
  tailwind.config = { theme: { extend: {
    colors: {
      primary:'#FFFFFF',
      secondary:{ DEFAULT:'#3A3632', 50:'#F2F0EE', 100:'#E3DFDA', 600:'#2C2925', 700:'#201E1A' },
      accent:{ DEFAULT:'#9AA3A4', 50:'#F1F2F0', 100:'#E3E6E4', 600:'#7D8688' },
      cream:'#FBF6F0', ink:'#211E1A', muted:'#6B6259',
    },
    fontFamily: { heading:['Inter','sans-serif'], body:['Roboto','sans-serif'] },
    boxShadow: { soft:'0 10px 40px -10px rgba(33,30,26,0.15)', glass:'0 8px 32px 0 rgba(58,54,50,0.15)' },
  }}}
</script>
<style>
  body{font-family:'Roboto',sans-serif;color:#211E1A;background:#FBF6F0}
  h1,h2,h3,h4,.font-heading{font-family:'Inter',sans-serif}
  .font-script{font-family:'Inter',sans-serif;font-style:italic;font-weight:700}
  .glass{background:rgba(251,247,242,.78);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(251,247,242,.6)}
  .blob{position:absolute;border-radius:9999px;filter:blur(80px);z-index:-1;opacity:.5}
  .reveal{opacity:0;transform:translateY(28px);transition:opacity .7s cubic-bezier(.16,1,.3,1),transform .7s cubic-bezier(.16,1,.3,1)}
  .reveal.in-view{opacity:1;transform:translateY(0)}
  .nav-active{background:#9AA3A4;color:#211E1A;font-weight:600}
  .lang-btn.active,
  html[lang="vi"] .lang-btn[data-lang="vi"],
  html[lang="en"] .lang-btn[data-lang="en"]{background:#3A3632;color:#fff}
</style>
```

Anti-FOUC (chống nháy tiếng Việt trước khi JS đổi ngôn ngữ), đặt ngay đầu `<head>`:
```html
<script>(function(){var l=localStorage.getItem('materialai_lang')==='en'?'en':'vi';document.documentElement.lang=l;if(l==='en')document.documentElement.style.visibility='hidden';})();</script>
```

---

## 4. Thành phần dùng chung (Shared components)

### 4.1 Navbar (tầng marketing)

Pill nổi cố định trên cùng, không chiếm full-width: `header.fixed.top-3.md:top-5.inset-x-3.md:inset-x-6`, bên trong là `nav.glass.rounded-full`. Logo lấy từ `images/LOGO.png`. Menu: Trang chủ · Vật liệu · Nhà bán hàng · Hỏi đáp · Liên hệ, cộng nút "Đăng nhập" + switch ngôn ngữ VI/EN (`.lang-btn`). Trang hiện tại được đánh dấu bằng class `.nav-active`. Dưới 768px sập thành `#mobileMenu` (glass rounded-3xl, cột dọc), mở bằng nút hamburger `#menuBtn`.

Tầng auth (login/register) dùng lại đúng navbar này nhưng **bỏ nút VI/EN**. Tầng dashboard dùng navbar khác hẳn — thanh tối giản: logo + tên trang + email người dùng + nút "Đăng xuất", không link điều hướng công khai.

### 4.2 Footer

Chỉ xuất hiện ở tầng marketing. 3 cột: (1) logo trên nền trắng bo góc + mô tả ngắn + icon mạng xã hội (Facebook/TikTok/Twitter/LinkedIn/YouTube, SVG inline), (2) điều hướng, (3) liên hệ (email + hotline). Dòng copyright ở dưới cùng.

### 4.3 Help widget & back-to-top

Góc dưới-phải mỗi trang marketing: bong bóng gợi ý "Chúng tôi có thể giúp gì cho bạn?" (đóng được, link tới `contact.html`) + nút tròn hình chat + nút "TOP" hiện ra sau khi cuộn > 400px.

### 4.4 Hệ thống đa ngôn ngữ (`i18n.js`)

- Hai object từ điển phẳng `VI`/`EN` (namespace dạng `trang.khoá`, ví dụ `home.h1`, `sellers.modal_address`), lộ ra `window.I18N_VI` / `window.I18N_EN`.
- `I18N.t(key)` tra theo ngôn ngữ hiện tại (`localStorage['materialai_lang']`, mặc định `vi`), fallback VI rồi fallback chính key đó.
- `applyTranslations(root)` quét `[data-i18n]` (textContent), `[data-i18n-html]` (innerHTML), `[data-i18n-placeholder]`, `[data-i18n-aria-label]`, `[data-i18n-title]`, cùng `<html data-i18n-doc-title>` (đổi `document.title`) và `meta[data-i18n-content]`.
- Đổi ngôn ngữ phát sự kiện `i18n:change` để các trang tự render lại phần động (thẻ nhà bán hàng, lọc FAQ…). Trang auth/dashboard **không nhúng `i18n.js`**, chỉ có tiếng Việt cứng.

### 4.5 Widget chat (`chat-widget.js`)

Bong bóng chat nổi góc dưới-phải, chỉ được nhúng ở `materials.html` và `sellers.html`. Khách ẩn danh được định danh bằng `materialai_customer_key` lưu localStorage + tên nhập lần đầu (`materialai_customer_name`). Cho phép xem danh sách hội thoại, mở thread, gửi tin (poll 4–15s). API công khai `window.ChatWidget.openWithSeller(sellerId)` được nút "Liên hệ nhà bán hàng" trong modal (mục 4.6) và trên thẻ vật liệu gọi tới. Đây là **tính năng backend thật** (bảng `conversations`/`messages`), không phải mock.

### 4.6 Modal chi tiết nhà bán hàng

Xuất hiện trên cả `materials.html` (mở từ nút `seller-trigger` gắn `data-*` trên mỗi thẻ vật liệu) và `sellers.html` (mở từ thẻ nhà bán hàng trong `#sellerGrid`, dữ liệu lấy từ mảng JS `SELLERS` khai báo inline). Modal gồm: cover, logo/initials, tên, danh mục, badge rating/số đánh giá/số năm hoạt động, mô tả, thông tin liên hệ (địa chỉ/điện thoại/email/website), lưới "vật liệu tiêu biểu", nút "Xem tất cả vật liệu" và "Liên hệ nhà bán hàng" (mở chat widget). Đóng bằng nút ✕ / click nền / phím `Esc`.

### 4.7 Texture swatch (CSS gradient) cho vật liệu chưa có ảnh thật

`materials.html` định nghĩa các class `.tex-son-*`, `.tex-kinh-1`, `.tex-go-1` — gradient CSS mô phỏng bề mặt sơn/kính/gỗ cho những thẻ chưa có ảnh chụp thật, dùng song song với thẻ có ảnh thật (`images/melamine/thumbs/…`, `images/gach-da/…`).

---

## 5. Trang tầng Marketing

### 5.1 Trang chủ — `index.html`

1. Navbar (nav-active: Trang chủ)
2. Hero 2 cột: badge + H1 + tagline script + mô tả + 2 CTA ("Upload ảnh tìm kiếm" → `materials.html`, "Dành cho nhà bán hàng" → `materials.html#upload`); cột phải là ảnh hero (`images/P1.webp`) với **dropzone kéo-thả ảnh thật** (`#heroDropzone`) — chọn/thả ảnh sẽ preview vào 1 trong 4 ô thumbnail rồi tự chuyển sang `materials.html` sau 700ms
3. 3 khối tính năng: Nhà bán hàng đăng vật liệu / Tìm kiếm bằng hình ảnh / So sánh & kết nối trực tiếp
4. Testimonials theo tab: Khách hàng / Nhà bán hàng / Kỹ sư-KTS (3 quote mỗi tab)
5. FAQ accordion rút gọn (4 câu) + link "Xem tất cả câu hỏi thường gặp" → `faq.html`
6. Footer + help widget + back-to-top

### 5.2 Kho vật liệu — `materials.html`

1. Navbar (nav-active: Vật liệu)
2. Header: H1 + tagline + thanh tìm kiếm/upload ảnh + 7 tab lọc danh mục (Tất cả/Ván công nghiệp/Sơn/Gạch/Đá/Kính/Gỗ tự nhiên)
3. Lưới sản phẩm `#matGrid` (`sm:grid-cols-2 lg:grid-cols-4`): mỗi thẻ gồm ảnh hoặc texture swatch, badge danh mục, tên, thông số, **nút mở modal nhà bán hàng** (`seller-trigger`, mang theo rating/xác thực/địa chỉ/SĐT qua `data-*`), giá, nút "Tìm tương tự". Lọc theo `data-cat` + ẩn/hiện bằng class `filtered-out`.
4. Modal chi tiết nhà bán hàng (mục 4.6)
5. Footer + widget chat + help widget

### 5.3 Nhà bán hàng — `sellers.html`

1. Navbar (nav-active: Nhà bán hàng)
2. Header: H1 + tagline + tìm kiếm theo tên/khu vực + tab lọc danh mục (giống materials.html)
3. Lưới hồ sơ nhà bán hàng `#sellerGrid`, render từ mảng JS `SELLERS` (8 seller demo, đồng bộ với dữ liệu seed backend — xem mục 8)
4. Modal chi tiết đầy đủ khi click vào thẻ (mục 4.6), nút "Liên hệ nhà bán hàng" mở `chat-widget.js`
5. Footer + widget chat + help widget

### 5.4 Hỏi đáp — `faq.html`

1. Navbar (nav-active: Hỏi đáp)
2. Header: H1 + tagline + ô tìm kiếm (icon kính lúp)
3. Tab lọc theo 5 danh mục: Tất cả / Tìm kiếm / Bán hàng / Tài khoản / Bảo mật
4. Danh sách 11 câu hỏi dạng accordion (mỗi câu gắn `data-cat`, nhiều câu có thể mở cùng lúc), thông báo "không có kết quả" khi lọc/tìm không khớp
5. CTA "Không tìm thấy câu trả lời bạn cần?" → `contact.html`
6. Footer

### 5.5 Liên hệ — `contact.html`

1. Navbar (nav-active: Liên hệ)
2. Hero + `.blob` trang trí
3. 3 kênh hỗ trợ (Email/Hotline/Văn phòng) — dùng icon **Font Awesome** thay vì SVG inline (điểm khác biệt duy nhất so với style chung)
4. 2 cột: thông tin liên hệ + link gợi ý FAQ | form liên hệ (Họ tên, SĐT, Email, chủ đề dropdown, lời nhắn)
5. Footer

> ⚠️ Form liên hệ hiện **chỉ là mock UI**: submit gọi `preventDefault()`, hiện thông báo thành công rồi reset form — **không gọi API nào**, không có email/lưu trữ thật đứng sau.

---

## 6. Trang tầng Auth

Cả 2 trang dùng lại navbar/màu/font marketing nhưng **không nhúng `i18n.js`, không có footer, không có `.reveal`** — và có gọi backend thật.

### 6.1 Đăng nhập — `login.html`

Card giữa trang: badge "Khu vực nhà bán hàng & quản trị" + form (email, mật khẩu, submit) + link sang `register.html` + hộp tài khoản demo hiển thị sẵn (`admin@materialai.vn` / `Admin@2026`, `minhkhoi@daminhkhoi.vn` / `MaterialAI@2026`). Gọi `POST /api/auth/login`, tự động gọi `GET /api/auth/me` để redirect nếu đã đăng nhập, điều hướng theo role sang `admin-dashboard.html` hoặc `seller-dashboard.html`.

### 6.2 Đăng ký — `register.html`

Form đăng ký nhà bán hàng: email, mật khẩu (≥ 8 ký tự), tên doanh nghiệp, danh mục (van/son/gach/da/kinh/go), SĐT, website (tuỳ chọn), địa chỉ, mô tả — kèm ghi chú "cần admin duyệt trước khi được bán". Gọi `POST /api/auth/register`, redirect sang `seller-dashboard.html` sau khi tạo tài khoản.

---

## 7. Trang tầng Dashboard (auth-gated)

Navbar tối giản riêng, không i18n, không footer. Thêm 3 màu badge trạng thái: `pending` (xám), `approved` (xanh `#EAF3EA`/`#3E7A45`), `blocked` (đỏ `#FBE9E7`/`#B3261E`).

### 7.1 Quản trị — `admin-dashboard.html` (role: admin)

1. Header tối giản + đăng xuất
2. 4 stat card: Tổng nhà bán hàng / Chờ duyệt / Đã duyệt / Tổng vật liệu (số lớn dùng `.font-script`)
3. Tab "Nhà bán hàng" / "Vật liệu"
4. Bảng nhà bán hàng: tên, ngành hàng, số vật liệu, trạng thái, hành động (Duyệt/Khoá/Mở khoá/Xoá có confirm)
5. Bảng vật liệu: tên, nhà bán hàng, danh mục, giá, hành động (Xoá)

Gọi: `GET /api/auth/me` (chặn nếu không phải admin), `GET /api/admin/stats`, `GET/DELETE /api/admin/sellers[/:id]`, `PUT /api/admin/sellers/:id/status`, `GET/DELETE /api/admin/materials[/:id]`, `POST /api/auth/logout`.

### 7.2 Nhà bán hàng — `seller-dashboard.html` (role: seller)

1. Header tối giản + đăng xuất
2. Lời chào + badge trạng thái tài khoản; banner cảnh báo nếu đang `pending` hoặc `blocked`
3. Hộp "Tin nhắn khách hàng": inbox 2 khung — danh sách hội thoại (badge chưa đọc, poll 5s) và khung thread (bong bóng chat, form gửi, poll 4s khi đang mở)
4. Form hồ sơ: tên doanh nghiệp, danh mục, SĐT, website, địa chỉ, mô tả
5. Form "Đăng vật liệu mới": danh mục, tiêu đề, thông số, giá — nút submit khoá nếu tài khoản chưa `approved`
6. Danh sách vật liệu đã đăng + nút xoá

Gọi: `GET /api/auth/me`, `GET/PUT /api/seller/profile`, `GET/POST /api/seller/materials`, `DELETE /api/seller/materials/:id`, `GET /api/seller/conversations[/:id/messages]`, `POST /api/seller/conversations/:id/messages`, `POST /api/auth/logout`.

---

## 8. Backend (Node/Express + SQLite)

`server/server.js` vừa phục vụ API vừa `express.static` toàn bộ thư mục gốc (site tĩnh + API chạy chung 1 process, không cần CORS). Session cookie qua `express-session` (7 ngày, secret lấy từ env `SESSION_SECRET`). Mật khẩu hash bằng `bcryptjs`.

### 8.1 Schema (`server/db.js`, better-sqlite3, WAL, foreign_keys ON)

| Bảng | Cột chính |
|---|---|
| `users` | id, email (unique), password_hash, role (`admin`\|`seller`), status (`pending`\|`approved`\|`blocked`), created_at |
| `seller_profiles` | id, user_id (FK→users), business_name, initials, category, description, address, phone, website, cover_class, logo_class |
| `materials` | id, seller_id (FK→users), category, title, spec, price, created_at |
| `conversations` | id, seller_id (FK→users), customer_key, customer_name, created_at — unique(seller_id, customer_key) |
| `messages` | id, conversation_id (FK→conversations), sender_role (`customer`\|`seller`), body, created_at, read_by_seller, read_by_customer |

### 8.2 Seed (`server/seed.js`, idempotent — bỏ qua nếu `users` đã có dữ liệu)

- 1 tài khoản admin (`admin@materialai.vn` / `Admin@2026`).
- 8 tài khoản seller demo (mật khẩu chung `MaterialAI@2026`, đều `approved`), khớp tên/danh mục/địa chỉ với mảng `SELLERS` hard-code trong `sellers.html`.
- Vật liệu mẫu cho mỗi seller theo template giá/spec riêng từng danh mục.

### 8.3 API routes

| Method & Path | Auth | Mô tả |
|---|---|---|
| `POST /api/auth/register` | — | Tạo tài khoản seller + hồ sơ, tự đăng nhập |
| `POST /api/auth/login` | — | Đăng nhập (chặn tài khoản `blocked`) |
| `POST /api/auth/logout` | session | Huỷ session |
| `GET /api/auth/me` | session | Trả user hiện tại (dùng để gate/redirect) |
| `GET/PUT /api/seller/profile` | seller | Xem/sửa hồ sơ nhà bán hàng |
| `GET/POST /api/seller/materials` | seller | Danh sách / tạo vật liệu (tạo bị chặn nếu chưa `approved`) |
| `PUT/DELETE /api/seller/materials/:id` | seller | Sửa/xoá vật liệu của chính mình |
| `GET /api/admin/stats` | admin | Thống kê tổng quan |
| `GET/DELETE /api/admin/sellers[/:id]` | admin | Danh sách / xoá seller |
| `PUT /api/admin/sellers/:id/status` | admin | Đổi trạng thái pending/approved/blocked |
| `GET/DELETE /api/admin/materials[/:id]` | admin | Danh sách / xoá vật liệu bất kỳ |
| `POST /api/chat/start` | — (customerKey) | Tạo/tìm hội thoại với 1 seller |
| `GET /api/chat/conversations` | — (customerKey) | Danh sách hội thoại của khách |
| `GET/POST /api/chat/conversations/:id/messages` | — (customerKey) | Đọc/gửi tin nhắn (khách) |
| `GET /api/seller/conversations` | seller | Danh sách hội thoại của seller |
| `GET/POST /api/seller/conversations/:id/messages` | seller | Đọc/gửi tin nhắn (seller) |

---

## 9. Giới hạn hiện tại (để không hiểu nhầm là đã hoàn thiện)

- **Tìm kiếm bằng ảnh AI** là trọng tâm truyền thông của trang chủ/kho vật liệu nhưng **chưa có endpoint xử lý ảnh thật** ở backend — dropzone/upload hiện chỉ preview ảnh rồi điều hướng sang `materials.html`, không có bước gọi model AI nào.
- **Form liên hệ** (`contact.html`) chỉ là mock giao diện, không gửi dữ liệu đi đâu.
- Dữ liệu nhà bán hàng ở `sellers.html` là **mảng JS hard-code**, chưa fetch từ `GET /api/admin/sellers` hay một endpoint public tương đương — cần đồng bộ thủ công với dữ liệu seed nếu seed thay đổi.
- Không có upload file thật (không có `multer` hay thư viện tương đương) — ảnh sản phẩm hiện dùng ảnh tĩnh có sẵn trong `images/`, seller không tự upload ảnh vật liệu mới qua dashboard.

---

## 10. Tương tác & hoạt ảnh (tổng hợp)

| Hiệu ứng | Cách triển khai |
|---|---|
| Hover nút | `hover:-translate-y-0.5/1` + `hover:shadow-lg/xl`, `transition-all duration-300` |
| Hover thẻ | `hover:-translate-y-1 hover:shadow-xl transition-all duration-300` |
| Cuộn mượt vào khung hình | class `.reveal` + `IntersectionObserver` (opacity 0→1, translateY 28px→0), stagger bằng `transition-delay` |
| FAQ accordion | JS toggle `.hidden` trên panel + xoay icon `+` (`rotate-45`) |
| Lọc danh mục (materials/sellers/faq) | JS toggle class `filtered-out`/`hidden` theo `data-cat` |
| Kính (glass) | `.glass` + `backdrop-filter: blur(16px)` trên navbar, help bubble |
| Chat & modal seller | poll định kỳ (4–15s) qua `fetch`, không dùng WebSocket |

## 11. SEO checklist (áp dụng cho 5 trang tầng marketing)

- [x] `<title>` riêng, chứa từ khoá + tên thương hiệu
- [x] `<meta name="description">` riêng, dịch qua i18n
- [x] `<meta name="viewport">` responsive
- [x] 1× `<h1>` mỗi trang, `<h2>`/`<h3>` cho section
- [ ] `alt` mô tả đầy đủ cho ảnh minh hoạ vật liệu (một số thẻ texture-swatch không có ảnh thật nên không có `alt`)
