-- ============================================================================
-- Material AI — Supabase schema + seed data
-- ============================================================================
-- Paste this whole file into the Supabase SQL Editor (Project → SQL Editor →
-- New query) and run it once. It creates every table used by server/db.js
-- and loads the same demo data server/seed.js used to load into SQLite
-- (1 admin account + 8 sellers with their listed materials).
--
-- Login accounts created below:
--   Admin  -> admin@materialai.vn        / Admin@2026
--   Seller -> any seller email below     / MaterialAI@2026
--   (e.g. minhkhoi@daminhkhoi.vn / MaterialAI@2026)
--
-- Safe to re-run on a fresh project. Re-running on a project that already
-- has this data will fail on the UNIQUE(email) / UNIQUE(seller_id, code)
-- constraints — drop the tables first (see bottom of file) if you want to
-- reset and reseed.
-- ============================================================================

-- created_at/updated_at are kept as TEXT in the same "YYYY-MM-DD HH:MM:SS"
-- shape SQLite's datetime('now') produced, because the front-end (e.g.
-- pages/admin-dashboard.html, js/cart.js, js/chat-widget.js) parses these
-- fields with string slicing like `.replace(' ', 'T') + 'Z'` and
-- `.slice(0, 10)`. Using a native TIMESTAMPTZ here would change the JSON
-- shape (ISO strings with "T"/milliseconds) and silently break those pages.
create table if not exists users (
  id serial primary key,
  email text unique not null,
  password_hash text not null,
  role text not null check (role in ('admin','seller','customer')),
  status text not null default 'approved' check (status in ('pending','approved','blocked')),
  name text not null default '',
  created_at text not null default to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
);

create table if not exists seller_profiles (
  id serial primary key,
  user_id integer unique not null references users(id) on delete cascade,
  business_name text not null,
  initials text not null,
  category text not null,
  description text not null default '',
  address text not null default '',
  phone text not null default '',
  website text not null default '',
  cover_class text not null default 'bg-secondary-50',
  logo_class text not null default 'bg-secondary-50 text-secondary'
);

create table if not exists materials (
  id serial primary key,
  seller_id integer not null references users(id) on delete cascade,
  category text not null,
  title text not null,
  spec text not null default '',
  price text not null default '',
  description text not null default '',
  image text not null default '',
  code text not null default '',
  created_at text not null default to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
);

create table if not exists conversations (
  id serial primary key,
  seller_id integer not null references users(id) on delete cascade,
  customer_key text not null,
  customer_name text not null,
  created_at text not null default to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
  unique (seller_id, customer_key)
);

create table if not exists messages (
  id serial primary key,
  conversation_id integer not null references conversations(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer','seller')),
  body text not null,
  created_at text not null default to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
  read_by_seller integer not null default 0,
  read_by_customer integer not null default 0
);

create table if not exists cart_items (
  id serial primary key,
  customer_id integer not null references users(id) on delete cascade,
  item_key text not null,
  seller_id integer not null,
  seller_name text not null,
  title text not null,
  spec text not null default '',
  price_text text not null default '',
  image text not null default '',
  tex_class text not null default '',
  qty integer not null default 1,
  created_at text not null default to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
  unique (customer_id, item_key)
);

create table if not exists orders (
  id serial primary key,
  customer_id integer not null references users(id) on delete cascade,
  seller_id integer not null references users(id) on delete cascade,
  seller_name text not null,
  items_json text not null,
  subtotal integer not null default 0,
  discount integer not null default 0,
  total integer not null default 0,
  voucher_code text not null default '',
  customer_name text not null default '',
  customer_phone text not null default '',
  customer_address text not null default '',
  payment_method text not null default 'cod' check (payment_method in ('cod','bank_transfer')),
  status text not null default 'pending' check (status in ('pending','confirmed','shipping','completed','cancelled')),
  created_at text not null default to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
  updated_at text not null default to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
);

create table if not exists vouchers (
  id serial primary key,
  seller_id integer not null references users(id) on delete cascade,
  code text not null,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value integer not null,
  active integer not null default 1,
  expires_at text not null default '',
  min_order integer not null default 0,
  max_discount integer not null default 0,
  usage_limit integer not null default 0,
  used_count integer not null default 0,
  material_id integer not null default 0,
  created_at text not null default to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
  unique (seller_id, code)
);

create index if not exists idx_materials_seller_id on materials(seller_id);
create index if not exists idx_conversations_seller_id on conversations(seller_id);
create index if not exists idx_messages_conversation_id on messages(conversation_id);
create index if not exists idx_cart_items_customer_id on cart_items(customer_id);
create index if not exists idx_orders_customer_id on orders(customer_id);
create index if not exists idx_orders_seller_id on orders(seller_id);
create index if not exists idx_vouchers_seller_id on vouchers(seller_id);

-- Our Express backend connects with the Postgres connection string (the
-- "postgres" role), which owns these tables and always bypasses Row Level
-- Security. RLS is enabled here purely as a safety net: it blocks the
-- anon/authenticated PostgREST roles (i.e. requests made straight from a
-- browser using PUBLISHABLE_KEY) from reading or writing these tables
-- directly, since all real traffic is meant to go through our API instead.
alter table users enable row level security;
alter table seller_profiles enable row level security;
alter table materials enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table vouchers enable row level security;

-- ============================================================================
-- Seed data — 1 admin + 8 demo sellers with their listed materials
-- (mirrors server/seed.js)
-- ============================================================================

-- Admin account
INSERT INTO users (email, password_hash, role, status, name) VALUES
  ('admin@materialai.vn', '$2a$10$5nrpfR4QMn33s6et90grduAzBJdU/DlL3H7t9P0980IVFGYYLJw66', 'admin', 'approved', '');

-- Seller accounts + profiles + materials (demo password for all sellers: MaterialAI@2026)
-- Đá Tự Nhiên Minh Khôi
WITH new_user AS (
  INSERT INTO users (email, password_hash, role, status, name)
  VALUES ('minhkhoi@daminhkhoi.vn', '$2a$10$aXLrWy/Sxxtr/asj39OjX.9uy2b7.KJhWiqZsxPpgv3B4KYei89C.', 'seller', 'approved', '')
  RETURNING id
), new_profile AS (
  INSERT INTO seller_profiles (user_id, business_name, initials, category, description, address, phone, website, cover_class, logo_class)
  SELECT id, 'Đá Tự Nhiên Minh Khôi', 'MK', 'da', 'Chuyên cung cấp đá granite, marble tự nhiên khai thác trực tiếp từ Phú Yên, Bình Định. Hơn 10 năm kinh nghiệm cung ứng cho các công trình nhà ở và thương mại trên toàn quốc.', '123 Lê Văn Sỹ, Q. Phú Nhuận, TP. Hồ Chí Minh', '+84 909 111 222', 'daminhkhoi.vn', 'bg-secondary-50', 'bg-secondary-50 text-secondary'
  FROM new_user
)
INSERT INTO materials (seller_id, category, title, spec, price)
SELECT id, cat, title, spec, price FROM new_user, (VALUES
  ('da', 'Granite đen Phú Yên', 'Dày 20mm · Bề mặt mài bóng', '800.000đ/m²'),
  ('da', 'Marble trắng vân mây', 'Dày 20mm · Bề mặt mài bóng', '950.000đ/m²'),
  ('da', 'Đá bazan xám', 'Dày 20mm · Bề mặt mài bóng', '1.100.000đ/m²'),
  ('da', 'Marble kem Ý', 'Dày 20mm · Bề mặt mài bóng', '1.250.000đ/m²')
) AS m(cat, title, spec, price);

-- Sơn Bích Ngọc
WITH new_user AS (
  INSERT INTO users (email, password_hash, role, status, name)
  VALUES ('lienhe@sonbichngoc.vn', '$2a$10$aXLrWy/Sxxtr/asj39OjX.9uy2b7.KJhWiqZsxPpgv3B4KYei89C.', 'seller', 'approved', '')
  RETURNING id
), new_profile AS (
  INSERT INTO seller_profiles (user_id, business_name, initials, category, description, address, phone, website, cover_class, logo_class)
  SELECT id, 'Sơn Bích Ngọc', 'BN', 'son', 'Đại lý phân phối sơn nội – ngoại thất cao cấp, chuyên các dòng sơn bóng mờ, chống ẩm và sơn trang trí hiệu ứng cho các dự án căn hộ, biệt thự.', '45 Nguyễn Trãi, Q.5, TP. Hồ Chí Minh', '+84 908 222 333', 'sonbichngoc.vn', 'bg-accent-50', 'bg-accent-50 text-accent-600'
  FROM new_user
)
INSERT INTO materials (seller_id, category, title, spec, price)
SELECT id, cat, title, spec, price FROM new_user, (VALUES
  ('son', 'Sơn bóng mờ cao cấp', '18L · Phủ 40-45m²/lít', '950.000đ/thùng'),
  ('son', 'Sơn chống ẩm', '18L · Phủ 40-45m²/lít', '1.150.000đ/thùng'),
  ('son', 'Sơn hiệu ứng bê tông', '18L · Phủ 40-45m²/lít', '1.350.000đ/thùng')
) AS m(cat, title, spec, price);

-- Xưởng Ván Văn Hải
WITH new_user AS (
  INSERT INTO users (email, password_hash, role, status, name)
  VALUES ('kinhdoanh@vanvanhai.vn', '$2a$10$aXLrWy/Sxxtr/asj39OjX.9uy2b7.KJhWiqZsxPpgv3B4KYei89C.', 'seller', 'approved', '')
  RETURNING id
), new_profile AS (
  INSERT INTO seller_profiles (user_id, business_name, initials, category, description, address, phone, website, cover_class, logo_class)
  SELECT id, 'Xưởng Ván Văn Hải', 'VH', 'van', 'Sản xuất và phân phối ván MDF, MFC, Plywood phủ Melamine/Laminate với đa dạng vân màu, phục vụ ngành sản xuất nội thất và thi công trọn gói.', '78 Quốc lộ 1A, Bình Tân, TP. Hồ Chí Minh', '+84 907 333 444', 'vanvanhai.vn', 'bg-secondary-50', 'bg-secondary-50 text-secondary'
  FROM new_user
)
INSERT INTO materials (seller_id, category, title, spec, price)
SELECT id, cat, title, spec, price FROM new_user, (VALUES
  ('van', 'MDF phủ Melamine vân sồi', 'Dày 18mm · Kích thước 1220x2440mm', '320.000đ/tấm'),
  ('van', 'Plywood phủ Phenolic', 'Dày 18mm · Kích thước 1220x2440mm', '380.000đ/tấm'),
  ('van', 'MFC chống ẩm', 'Dày 18mm · Kích thước 1220x2440mm', '440.000đ/tấm'),
  ('van', 'Ván Laminate vân đá', 'Dày 18mm · Kích thước 1220x2440mm', '500.000đ/tấm')
) AS m(cat, title, spec, price);

-- Gạch Ốp Lát Đông Á
WITH new_user AS (
  INSERT INTO users (email, password_hash, role, status, name)
  VALUES ('sales@gachdonga.vn', '$2a$10$aXLrWy/Sxxtr/asj39OjX.9uy2b7.KJhWiqZsxPpgv3B4KYei89C.', 'seller', 'approved', '')
  RETURNING id
), new_profile AS (
  INSERT INTO seller_profiles (user_id, business_name, initials, category, description, address, phone, website, cover_class, logo_class)
  SELECT id, 'Gạch Ốp Lát Đông Á', 'DA', 'gach', 'Nhà phân phối gạch ốp lát vân đá marble, gạch bóng gương và gạch trang trí nhập khẩu, phục vụ các công trình nhà ở, showroom, khách sạn.', '212 Cách Mạng Tháng 8, Q.10, TP. Hồ Chí Minh', '+84 906 444 555', 'gachdonga.vn', 'bg-accent-50', 'bg-accent-50 text-accent-600'
  FROM new_user
)
INSERT INTO materials (seller_id, category, title, spec, price)
SELECT id, cat, title, spec, price FROM new_user, (VALUES
  ('gach', 'Gạch vân đá marble 600x600', '600x600mm · Bề mặt bóng gương', '150.000đ/m²'),
  ('gach', 'Gạch bóng gương', '600x600mm · Bề mặt bóng gương', '190.000đ/m²'),
  ('gach', 'Gạch trang trí mosaic', '600x600mm · Bề mặt bóng gương', '230.000đ/m²')
) AS m(cat, title, spec, price);

-- Kính An Toàn Phúc Long
WITH new_user AS (
  INSERT INTO users (email, password_hash, role, status, name)
  VALUES ('contact@kinhphuclong.vn', '$2a$10$aXLrWy/Sxxtr/asj39OjX.9uy2b7.KJhWiqZsxPpgv3B4KYei89C.', 'seller', 'approved', '')
  RETURNING id
), new_profile AS (
  INSERT INTO seller_profiles (user_id, business_name, initials, category, description, address, phone, website, cover_class, logo_class)
  SELECT id, 'Kính An Toàn Phúc Long', 'PL', 'kinh', 'Chuyên gia công kính cường lực, kính dán an toàn, kính phản quang cho vách ngăn, cầu thang, mặt dựng công trình dân dụng và thương mại.', '9 Điện Biên Phủ, Bình Thạnh, TP. Hồ Chí Minh', '+84 905 555 666', 'kinhphuclong.vn', 'bg-secondary-50', 'bg-secondary-50 text-secondary'
  FROM new_user
)
INSERT INTO materials (seller_id, category, title, spec, price)
SELECT id, cat, title, spec, price FROM new_user, (VALUES
  ('kinh', 'Kính cường lực trong suốt', 'Dày 10mm · An toàn, chịu lực cao', '550.000đ/m²'),
  ('kinh', 'Kính dán an toàn 2 lớp', 'Dày 10mm · An toàn, chịu lực cao', '640.000đ/m²'),
  ('kinh', 'Kính phản quang xanh', 'Dày 10mm · An toàn, chịu lực cao', '730.000đ/m²')
) AS m(cat, title, spec, price);

-- Gỗ Tự Nhiên Đức Anh
WITH new_user AS (
  INSERT INTO users (email, password_hash, role, status, name)
  VALUES ('go.ducanh@gmail.com', '$2a$10$aXLrWy/Sxxtr/asj39OjX.9uy2b7.KJhWiqZsxPpgv3B4KYei89C.', 'seller', 'approved', '')
  RETURNING id
), new_profile AS (
  INSERT INTO seller_profiles (user_id, business_name, initials, category, description, address, phone, website, cover_class, logo_class)
  SELECT id, 'Gỗ Tự Nhiên Đức Anh', 'DA', 'go', 'Cung cấp gỗ sồi, gỗ óc chó, gỗ căm xe nguyên tấm đã qua xử lý sấy tẩm chống mối mọt, phục vụ đóng đồ nội thất cao cấp và sàn gỗ.', '56 Phạm Văn Đồng, Thủ Đức, TP. Hồ Chí Minh', '+84 904 666 777', 'goducanh.vn', 'bg-accent-50', 'bg-accent-50 text-accent-600'
  FROM new_user
)
INSERT INTO materials (seller_id, category, title, spec, price)
SELECT id, cat, title, spec, price FROM new_user, (VALUES
  ('go', 'Gỗ sồi tự nhiên nguyên tấm', 'Dày 25mm · Đã sấy tẩm chống mối', '2.800.000đ/m³'),
  ('go', 'Gỗ óc chó nhập khẩu', 'Dày 25mm · Đã sấy tẩm chống mối', '3.100.000đ/m³'),
  ('go', 'Gỗ căm xe sấy tẩm', 'Dày 25mm · Đã sấy tẩm chống mối', '3.400.000đ/m³')
) AS m(cat, title, spec, price);

-- Nội Thất Thành Phát
WITH new_user AS (
  INSERT INTO users (email, password_hash, role, status, name)
  VALUES ('info@thanhphatnt.vn', '$2a$10$aXLrWy/Sxxtr/asj39OjX.9uy2b7.KJhWiqZsxPpgv3B4KYei89C.', 'seller', 'approved', '')
  RETURNING id
), new_profile AS (
  INSERT INTO seller_profiles (user_id, business_name, initials, category, description, address, phone, website, cover_class, logo_class)
  SELECT id, 'Nội Thất Thành Phát', 'TP', 'van', 'Cung cấp ván công nghiệp và phụ kiện nội thất cho xưởng sản xuất, ưu tiên hàng có sẵn kho, giao nhanh trong 24h nội thành.', '33 Lũy Bán Bích, Tân Phú, TP. Hồ Chí Minh', '+84 903 777 888', 'thanhphatnt.vn', 'bg-secondary-50', 'bg-secondary-50 text-secondary'
  FROM new_user
)
INSERT INTO materials (seller_id, category, title, spec, price)
SELECT id, cat, title, spec, price FROM new_user, (VALUES
  ('van', 'Ván MFC phủ nhựa', 'Dày 18mm · Kích thước 1220x2440mm', '320.000đ/tấm'),
  ('van', 'Ván ép chịu nước', 'Dày 18mm · Kích thước 1220x2440mm', '380.000đ/tấm')
) AS m(cat, title, spec, price);

-- Đá Marble Ý Gia Bảo
WITH new_user AS (
  INSERT INTO users (email, password_hash, role, status, name)
  VALUES ('giabao@marbleitaly.vn', '$2a$10$aXLrWy/Sxxtr/asj39OjX.9uy2b7.KJhWiqZsxPpgv3B4KYei89C.', 'seller', 'approved', '')
  RETURNING id
), new_profile AS (
  INSERT INTO seller_profiles (user_id, business_name, initials, category, description, address, phone, website, cover_class, logo_class)
  SELECT id, 'Đá Marble Ý Gia Bảo', 'GB', 'da', 'Nhập khẩu và phân phối đá marble cao cấp trực tiếp từ Ý, phục vụ các dự án biệt thự, khách sạn 5 sao và showroom sang trọng.', '19 Trường Sơn, Tân Bình, TP. Hồ Chí Minh', '+84 902 888 999', 'marbleitaly.vn', 'bg-accent-50', 'bg-accent-50 text-accent-600'
  FROM new_user
)
INSERT INTO materials (seller_id, category, title, spec, price)
SELECT id, cat, title, spec, price FROM new_user, (VALUES
  ('da', 'Marble Ý kem vân vàng', 'Dày 20mm · Bề mặt mài bóng', '800.000đ/m²'),
  ('da', 'Marble Ý trắng Carrara', 'Dày 20mm · Bề mặt mài bóng', '950.000đ/m²'),
  ('da', 'Marble Ý xám Bardiglio', 'Dày 20mm · Bề mặt mài bóng', '1.100.000đ/m²')
) AS m(cat, title, spec, price);

-- ============================================================================
-- To wipe everything and start over, run this then re-run the whole file:
--   drop table if exists messages, conversations, cart_items, orders, vouchers,
--     materials, seller_profiles, users cascade;
-- ============================================================================
