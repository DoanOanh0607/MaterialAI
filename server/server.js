const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { requireAuth, requireRole } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5500;

app.use(express.json({ limit: '5mb' }));
app.use(session({
  // Dev-only secret. Set SESSION_SECRET in the environment before deploying anywhere real.
  secret: process.env.SESSION_SECRET || 'materialai-dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 }
}));

// Serve the existing static site (index.html, materials.html, images, etc.)
// from the project root, plus the new auth/dashboard pages placed there too.
app.use(express.static(path.join(__dirname, '..')));

// Express 4 doesn't catch rejected promises from async route handlers on its
// own — an unhandled rejection would just leave the request hanging with no
// response. Wrapping every handler below routes the error to Express's error
// middleware (registered at the bottom of this file) instead.
function ah(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length >= 2 ? [parts[0][0], parts[1][0]] : [name[0] || '?', name[1] || ''];
  return letters.join('').toUpperCase();
}

function publicUser(row) {
  return { id: row.id, email: row.email, role: row.role, status: row.status, name: row.name || '' };
}

/* ===================== AUTH ===================== */

app.post('/api/auth/register', ah(async (req, res) => {
  const { email, password, businessName, category, phone, address, website, description } = req.body || {};
  if (!email || !password || !businessName || !category) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ email, mật khẩu, tên nhà bán hàng và ngành hàng.' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Mật khẩu cần tối thiểu 8 ký tự.' });
  }
  const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    return res.status(409).json({ error: 'Email này đã được đăng ký.' });
  }

  const hash = bcrypt.hashSync(String(password), 10);
  const userId = await db.tx(async (t) => {
    const info = await t.run('INSERT INTO users (email, password_hash, role, status) VALUES (?, ?, ?, ?) RETURNING id',
      [email, hash, 'seller', 'pending']);
    const newId = info.rows[0].id;
    await t.run(`INSERT INTO seller_profiles (user_id, business_name, initials, category, description, address, phone, website)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newId, businessName, initials(businessName), category, description || '', address || '', phone || '', website || '']);
    return newId;
  });
  const user = await db.get('SELECT * FROM users WHERE id = ?', [userId]);

  req.session.user = publicUser(user);
  res.status(201).json({ user: publicUser(user) });
}));

app.post('/api/auth/customer/register', ah(async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ email, mật khẩu và họ tên.' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Mật khẩu cần tối thiểu 8 ký tự.' });
  }
  const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    return res.status(409).json({ error: 'Email này đã được đăng ký.' });
  }

  const hash = bcrypt.hashSync(String(password), 10);
  const info = await db.run('INSERT INTO users (email, password_hash, role, status, name) VALUES (?, ?, ?, ?, ?) RETURNING id',
    [email, hash, 'customer', 'approved', name.trim()]);
  const user = await db.get('SELECT * FROM users WHERE id = ?', [info.rows[0].id]);

  // Unlike seller registration, don't auto-login — send the customer to the
  // login page so they sign in explicitly with their new credentials.
  res.status(201).json({ user: publicUser(user) });
}));

app.post('/api/auth/login', ah(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu.' });

  const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
  }
  if (user.status === 'blocked') {
    return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
  }

  req.session.user = publicUser(user);
  res.json({ user: publicUser(user) });
}));

app.post('/api/auth/forgot-password/verify', ah(async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Vui lòng nhập email.' });
  const user = await db.get('SELECT id FROM users WHERE email = ?', [String(email).trim()]);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này.' });
  res.json({ ok: true });
}));

app.post('/api/auth/forgot-password/reset', ah(async (req, res) => {
  const { email, newPassword } = req.body || {};
  if (!email || !newPassword) return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu mới.' });
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: 'Mật khẩu cần tối thiểu 8 ký tự.' });
  }
  const user = await db.get('SELECT id FROM users WHERE email = ?', [String(email).trim()]);
  if (!user) return res.status(404).json({ error: 'Không tìm thấy tài khoản với email này.' });

  const hash = bcrypt.hashSync(String(newPassword), 10);
  await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);
  res.json({ ok: true });
}));

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/me', ah(async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Chưa đăng nhập.' });
  const fresh = await db.get('SELECT * FROM users WHERE id = ?', [req.session.user.id]);
  if (!fresh) { req.session.destroy(() => {}); return res.status(401).json({ error: 'Chưa đăng nhập.' }); }
  req.session.user = publicUser(fresh);
  res.json({ user: publicUser(fresh) });
}));

/* ===================== SELLER ===================== */

app.get('/api/seller/profile', requireAuth, requireRole('seller'), ah(async (req, res) => {
  const row = await db.get(`SELECT u.email, u.status, p.* FROM users u
                           JOIN seller_profiles p ON p.user_id = u.id WHERE u.id = ?`,
    [req.session.user.id]);
  res.json({ profile: row });
}));

app.put('/api/seller/profile', requireAuth, requireRole('seller'), ah(async (req, res) => {
  const { businessName, category, description, address, phone, website } = req.body || {};
  if (!businessName || !category) return res.status(400).json({ error: 'Thiếu tên nhà bán hàng hoặc ngành hàng.' });
  await db.run(`UPDATE seller_profiles SET business_name=?, initials=?, category=?, description=?, address=?, phone=?, website=?
              WHERE user_id=?`,
    [businessName, initials(businessName), category, description || '', address || '', phone || '', website || '', req.session.user.id]);
  const row = await db.get(`SELECT u.email, u.status, p.* FROM users u
                           JOIN seller_profiles p ON p.user_id = u.id WHERE u.id = ?`,
    [req.session.user.id]);
  res.json({ profile: row });
}));

app.get('/api/seller/materials', requireAuth, requireRole('seller'), ah(async (req, res) => {
  const rows = await db.all('SELECT * FROM materials WHERE seller_id = ? ORDER BY created_at DESC', [req.session.user.id]);
  res.json({ materials: rows });
}));

app.post('/api/seller/materials', requireAuth, requireRole('seller'), ah(async (req, res) => {
  const fresh = await db.get('SELECT status FROM users WHERE id = ?', [req.session.user.id]);
  if (fresh.status !== 'approved') {
    return res.status(403).json({ error: 'Tài khoản đang chờ admin duyệt, chưa thể đăng vật liệu.' });
  }
  const { category, title, spec, price, description, image, code } = req.body || {};
  if (!category || !title) return res.status(400).json({ error: 'Thiếu danh mục hoặc tên vật liệu.' });
  const info = await db.run('INSERT INTO materials (seller_id, category, title, spec, price, description, image, code) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
    [req.session.user.id, category, title, spec || '', price || '', description || '', image || '', code || '']);
  const row = await db.get('SELECT * FROM materials WHERE id = ?', [info.rows[0].id]);
  res.status(201).json({ material: row });
}));

app.put('/api/seller/materials/:id', requireAuth, requireRole('seller'), ah(async (req, res) => {
  const existing = await db.get('SELECT * FROM materials WHERE id = ?', [req.params.id]);
  if (!existing || existing.seller_id !== req.session.user.id) return res.status(404).json({ error: 'Không tìm thấy vật liệu.' });
  const { category, title, spec, price, description, image, code } = req.body || {};
  if (!category || !title) return res.status(400).json({ error: 'Thiếu danh mục hoặc tên vật liệu.' });
  await db.run('UPDATE materials SET category=?, title=?, spec=?, price=?, description=?, image=?, code=? WHERE id=?',
    [category, title, spec || '', price || '', description || '', image || '', code || '', req.params.id]);
  res.json({ material: await db.get('SELECT * FROM materials WHERE id = ?', [req.params.id]) });
}));

app.delete('/api/seller/materials/:id', requireAuth, requireRole('seller'), ah(async (req, res) => {
  const existing = await db.get('SELECT * FROM materials WHERE id = ?', [req.params.id]);
  if (!existing || existing.seller_id !== req.session.user.id) return res.status(404).json({ error: 'Không tìm thấy vật liệu.' });
  await db.run('DELETE FROM materials WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

/* ===================== ADMIN ===================== */

app.get('/api/admin/sellers', requireAuth, requireRole('admin'), ah(async (req, res) => {
  const rows = await db.all(`
    SELECT u.id, u.email, u.status, u.created_at, p.business_name, p.initials, p.category, p.address, p.phone, p.website,
           (SELECT COUNT(*) FROM materials m WHERE m.seller_id = u.id) AS materials_count
    FROM users u JOIN seller_profiles p ON p.user_id = u.id
    WHERE u.role = 'seller'
    ORDER BY u.created_at DESC
  `);
  res.json({ sellers: rows });
}));

app.put('/api/admin/sellers/:id/status', requireAuth, requireRole('admin'), ah(async (req, res) => {
  const { status } = req.body || {};
  if (!['pending', 'approved', 'blocked'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
  }
  const info = await db.run("UPDATE users SET status = ? WHERE id = ? AND role = 'seller'", [status, req.params.id]);
  if (info.changes === 0) return res.status(404).json({ error: 'Không tìm thấy nhà bán hàng.' });
  res.json({ ok: true });
}));

app.delete('/api/admin/sellers/:id', requireAuth, requireRole('admin'), ah(async (req, res) => {
  const info = await db.run("DELETE FROM users WHERE id = ? AND role = 'seller'", [req.params.id]);
  if (info.changes === 0) return res.status(404).json({ error: 'Không tìm thấy nhà bán hàng.' });
  res.json({ ok: true });
}));

app.get('/api/admin/materials', requireAuth, requireRole('admin'), ah(async (req, res) => {
  const rows = await db.all(`
    SELECT m.*, p.business_name AS seller_name
    FROM materials m JOIN seller_profiles p ON p.user_id = m.seller_id
    ORDER BY m.created_at DESC
  `);
  res.json({ materials: rows });
}));

app.delete('/api/admin/materials/:id', requireAuth, requireRole('admin'), ah(async (req, res) => {
  const info = await db.run('DELETE FROM materials WHERE id = ?', [req.params.id]);
  if (info.changes === 0) return res.status(404).json({ error: 'Không tìm thấy vật liệu.' });
  res.json({ ok: true });
}));

app.get('/api/admin/stats', requireAuth, requireRole('admin'), ah(async (req, res) => {
  const totalSellers = (await db.get("SELECT COUNT(*) AS n FROM users WHERE role='seller'")).n;
  const pendingSellers = (await db.get("SELECT COUNT(*) AS n FROM users WHERE role='seller' AND status='pending'")).n;
  const approvedSellers = (await db.get("SELECT COUNT(*) AS n FROM users WHERE role='seller' AND status='approved'")).n;
  const blockedSellers = (await db.get("SELECT COUNT(*) AS n FROM users WHERE role='seller' AND status='blocked'")).n;
  const totalMaterials = (await db.get('SELECT COUNT(*) AS n FROM materials')).n;
  const totalCustomers = (await db.get("SELECT COUNT(*) AS n FROM users WHERE role='customer'")).n;
  const totalOrders = (await db.get('SELECT COUNT(*) AS n FROM orders')).n;
  const totalConversations = (await db.get('SELECT COUNT(*) AS n FROM conversations')).n;
  const totalMessages = (await db.get('SELECT COUNT(*) AS n FROM messages')).n;
  res.json({ totalSellers, pendingSellers, approvedSellers, blockedSellers, totalMaterials, totalCustomers, totalOrders, totalConversations, totalMessages });
}));

app.get('/api/admin/customers', requireAuth, requireRole('admin'), ah(async (req, res) => {
  const rows = await db.all(`
    SELECT u.id, u.email, u.name, u.status, u.created_at,
           (SELECT COUNT(*) FROM orders o WHERE o.customer_id = u.id) AS orders_count,
           (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.customer_id = u.id) AS total_spend,
           (SELECT STRING_AGG(DISTINCT o.seller_name, ',') FROM orders o WHERE o.customer_id = u.id) AS sellers
    FROM users u WHERE u.role = 'customer'
    ORDER BY u.created_at DESC
  `);
  res.json({ customers: rows });
}));

app.get('/api/admin/conversations', requireAuth, requireRole('admin'), ah(async (req, res) => {
  const rows = await db.all(`
    SELECT c.id, c.customer_name, c.created_at,
           COALESCE(p.business_name, u.email) AS seller_name,
           (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) AS messages_count,
           (SELECT MAX(m.created_at) FROM messages m WHERE m.conversation_id = c.id) AS last_message_at
    FROM conversations c
    JOIN users u ON u.id = c.seller_id
    LEFT JOIN seller_profiles p ON p.user_id = c.seller_id
    ORDER BY c.id DESC
  `);
  res.json({ conversations: rows });
}));

/* ===================== CART (customer, authenticated) ===================== */

function cartItemOut(row) {
  return {
    itemKey: row.item_key,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    title: row.title,
    spec: row.spec,
    priceText: row.price_text,
    image: row.image,
    texClass: row.tex_class,
    qty: row.qty
  };
}

app.get('/api/cart', requireAuth, requireRole('customer'), ah(async (req, res) => {
  const rows = await db.all('SELECT * FROM cart_items WHERE customer_id = ? ORDER BY id ASC', [req.session.user.id]);
  res.json({ items: rows.map(cartItemOut) });
}));

app.post('/api/cart', requireAuth, requireRole('customer'), ah(async (req, res) => {
  const { itemKey, sellerId, sellerName, title, spec, priceText, image, texClass, qty } = req.body || {};
  if (!itemKey || !sellerId || !sellerName || !title) {
    return res.status(400).json({ error: 'Thiếu thông tin vật liệu.' });
  }
  const addQty = Number(qty) > 0 ? Number(qty) : 1;
  const existing = await db.get('SELECT * FROM cart_items WHERE customer_id = ? AND item_key = ?', [req.session.user.id, itemKey]);
  if (existing) {
    await db.run('UPDATE cart_items SET qty = qty + ? WHERE id = ?', [addQty, existing.id]);
  } else {
    await db.run(`INSERT INTO cart_items (customer_id, item_key, seller_id, seller_name, title, spec, price_text, image, tex_class, qty)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.session.user.id, itemKey, sellerId, sellerName, title, spec || '', priceText || '', image || '', texClass || '', addQty]);
  }
  const rows = await db.all('SELECT * FROM cart_items WHERE customer_id = ? ORDER BY id ASC', [req.session.user.id]);
  res.status(201).json({ items: rows.map(cartItemOut) });
}));

app.put('/api/cart/:itemKey', requireAuth, requireRole('customer'), ah(async (req, res) => {
  const { qty } = req.body || {};
  const existing = await db.get('SELECT * FROM cart_items WHERE customer_id = ? AND item_key = ?', [req.session.user.id, req.params.itemKey]);
  if (!existing) return res.status(404).json({ error: 'Không tìm thấy vật liệu trong giỏ hàng.' });
  if (Number(qty) > 0) {
    await db.run('UPDATE cart_items SET qty = ? WHERE id = ?', [Number(qty), existing.id]);
  } else {
    await db.run('DELETE FROM cart_items WHERE id = ?', [existing.id]);
  }
  const rows = await db.all('SELECT * FROM cart_items WHERE customer_id = ? ORDER BY id ASC', [req.session.user.id]);
  res.json({ items: rows.map(cartItemOut) });
}));

app.delete('/api/cart/:itemKey', requireAuth, requireRole('customer'), ah(async (req, res) => {
  await db.run('DELETE FROM cart_items WHERE customer_id = ? AND item_key = ?', [req.session.user.id, req.params.itemKey]);
  const rows = await db.all('SELECT * FROM cart_items WHERE customer_id = ? ORDER BY id ASC', [req.session.user.id]);
  res.json({ items: rows.map(cartItemOut) });
}));

app.delete('/api/cart', requireAuth, requireRole('customer'), ah(async (req, res) => {
  await db.run('DELETE FROM cart_items WHERE customer_id = ?', [req.session.user.id]);
  res.json({ items: [] });
}));

/* ===================== ORDERS / CHECKOUT (customer, authenticated) =====================
   Real order placement with COD or manual bank transfer — no online payment
   gateway is integrated, the seller and customer settle payment directly. */

function orderOut(row) {
  return {
    id: row.id,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    items: JSON.parse(row.items_json),
    subtotal: row.subtotal,
    discount: row.discount,
    total: row.total,
    voucherCode: row.voucher_code,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function parsePriceServer(text) {
  const m = String(text || '').match(/([\d.,]+)/);
  return m ? parseInt(m[1].replace(/[^\d]/g, ''), 10) || 0 : 0;
}

const ORDER_STATUSES = ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'];

// Lấy voucher kèm tên vật liệu áp dụng (nếu mã chỉ áp dụng riêng cho 1 vật liệu, material_id != 0).
async function findVoucherWithMaterial(sellerId, code) {
  return db.get(`
    SELECT v.*, m.title AS material_title FROM vouchers v
    LEFT JOIN materials m ON m.id = v.material_id AND v.material_id != 0
    WHERE v.seller_id = ? AND v.code = ?
  `, [sellerId, String(code || '').trim().toUpperCase()]);
}

// Kiểm tra voucher còn hợp lệ (hạn dùng, đơn tối thiểu, giới hạn lượt, đúng vật liệu áp dụng)
// và tính số tiền giảm thực tế (đã áp trần) dựa trên danh sách vật phẩm trong giỏ/đơn.
// items: [{ title, priceText, qty }]
function validateVoucher(voucher, items) {
  if (!voucher || !voucher.active) return { ok: false, error: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' };
  if (voucher.expires_at && voucher.expires_at < new Date().toISOString().slice(0, 10)) {
    return { ok: false, error: 'Mã giảm giá đã hết hạn sử dụng.' };
  }
  if (voucher.usage_limit > 0 && voucher.used_count >= voucher.usage_limit) {
    return { ok: false, error: 'Mã giảm giá đã hết lượt sử dụng.' };
  }
  const subtotal = items.reduce((s, i) => s + parsePriceServer(i.priceText) * i.qty, 0);
  if (voucher.min_order > 0 && subtotal < voucher.min_order) {
    return { ok: false, error: `Đơn hàng cần tối thiểu ${voucher.min_order.toLocaleString('vi-VN')}đ để dùng mã này.` };
  }
  let baseAmount = subtotal;
  if (voucher.material_id) {
    const matched = items.filter(i => i.title === voucher.material_title);
    if (!matched.length) {
      return { ok: false, error: `Mã này chỉ áp dụng cho vật liệu "${voucher.material_title}".` };
    }
    baseAmount = matched.reduce((s, i) => s + parsePriceServer(i.priceText) * i.qty, 0);
  }
  let discount = voucher.discount_type === 'percent'
    ? Math.round(baseAmount * voucher.discount_value / 100)
    : voucher.discount_value;
  if (voucher.discount_type === 'percent' && voucher.max_discount > 0) {
    discount = Math.min(discount, voucher.max_discount);
  }
  discount = Math.min(discount, baseAmount);
  return { ok: true, discount };
}

app.post('/api/vouchers/check', requireAuth, requireRole('customer'), ah(async (req, res) => {
  const { sellerId, code, items } = req.body || {};
  if (!sellerId || !code) return res.status(400).json({ error: 'Thiếu thông tin.' });
  const voucher = await findVoucherWithMaterial(sellerId, code);
  const check = validateVoucher(voucher, Array.isArray(items) ? items : []);
  if (!check.ok) return res.status(404).json({ error: check.error });
  res.json({ voucher: { code: voucher.code, discountType: voucher.discount_type, discountValue: voucher.discount_value, discount: check.discount } });
}));

app.post('/api/orders', requireAuth, requireRole('customer'), ah(async (req, res) => {
  const { sellerId, customerName, customerPhone, customerAddress, paymentMethod, voucherCode } = req.body || {};
  if (!sellerId) return res.status(400).json({ error: 'Thiếu thông tin nhà bán hàng.' });
  if (!customerName || !customerPhone || !customerAddress) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng.' });
  }
  const method = paymentMethod === 'bank_transfer' ? 'bank_transfer' : 'cod';
  const items = await db.all('SELECT * FROM cart_items WHERE customer_id = ? AND seller_id = ?', [req.session.user.id, sellerId]);
  if (!items.length) return res.status(400).json({ error: 'Giỏ hàng của nhà bán hàng này đang trống.' });

  const sellerName = items[0].seller_name;
  // cart_items chỉ lưu tên vật liệu (không có material_id liên kết), nên khớp mã vật liệu
  // theo tên với bảng materials của người bán — best-effort, để trống nếu không khớp được.
  const materialsForSeller = await db.all('SELECT title, code FROM materials WHERE seller_id = ?', [sellerId]);
  const codeByTitle = materialsForSeller.reduce((map, m) => { map[m.title] = m.code; return map; }, {});
  const itemsSnapshot = items.map(i => ({ title: i.title, spec: i.spec, priceText: i.price_text, qty: i.qty, code: codeByTitle[i.title] || '' }));
  const subtotal = itemsSnapshot.reduce((s, i) => s + parsePriceServer(i.priceText) * i.qty, 0);

  let discount = 0;
  let appliedCode = '';
  let appliedVoucherId = null;
  if (voucherCode && String(voucherCode).trim()) {
    const voucher = await findVoucherWithMaterial(sellerId, voucherCode);
    const check = validateVoucher(voucher, itemsSnapshot);
    if (!check.ok) return res.status(400).json({ error: check.error });
    discount = check.discount;
    appliedCode = voucher.code;
    appliedVoucherId = voucher.id;
  }
  const total = subtotal - discount;

  const orderId = await db.tx(async (t) => {
    const info = await t.run(`
      INSERT INTO orders (customer_id, seller_id, seller_name, items_json, subtotal, discount, total, voucher_code, customer_name, customer_phone, customer_address, payment_method, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      RETURNING id
    `, [req.session.user.id, sellerId, sellerName, JSON.stringify(itemsSnapshot), subtotal, discount, total, appliedCode,
      String(customerName).trim(), String(customerPhone).trim(), String(customerAddress).trim(), method]);
    await t.run('DELETE FROM cart_items WHERE customer_id = ? AND seller_id = ?', [req.session.user.id, sellerId]);
    if (appliedVoucherId) {
      await t.run('UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?', [appliedVoucherId]);
    }
    return info.rows[0].id;
  });
  const order = await db.get('SELECT * FROM orders WHERE id = ?', [orderId]);
  const remaining = await db.all('SELECT * FROM cart_items WHERE customer_id = ? ORDER BY id ASC', [req.session.user.id]);
  res.status(201).json({ order: orderOut(order), items: remaining.map(cartItemOut) });
}));

app.get('/api/orders', requireAuth, requireRole('customer'), ah(async (req, res) => {
  const rows = await db.all('SELECT * FROM orders WHERE customer_id = ? ORDER BY id DESC', [req.session.user.id]);
  res.json({ orders: rows.map(orderOut) });
}));

/* ===================== SELLER ORDERS ===================== */

app.get('/api/seller/orders', requireAuth, requireRole('seller'), ah(async (req, res) => {
  const rows = await db.all('SELECT * FROM orders WHERE seller_id = ? ORDER BY id DESC', [req.session.user.id]);
  res.json({ orders: rows.map(orderOut) });
}));

app.put('/api/seller/orders/:id/status', requireAuth, requireRole('seller'), ah(async (req, res) => {
  const { status } = req.body || {};
  if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
  const existing = await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!existing || existing.seller_id !== req.session.user.id) return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
  await db.run("UPDATE orders SET status = ?, updated_at = to_char(now(), 'YYYY-MM-DD HH24:MI:SS') WHERE id = ?", [status, req.params.id]);
  res.json({ order: orderOut(await db.get('SELECT * FROM orders WHERE id = ?', [req.params.id])) });
}));

/* ===================== SELLER VOUCHERS ===================== */

function voucherOut(row) {
  return {
    id: row.id, code: row.code, discountType: row.discount_type, discountValue: row.discount_value,
    active: !!row.active, expiresAt: row.expires_at || '', minOrder: row.min_order || 0,
    maxDiscount: row.max_discount || 0, usageLimit: row.usage_limit || 0, usedCount: row.used_count || 0,
    materialId: row.material_id || 0, materialTitle: row.material_title || '',
    createdAt: row.created_at
  };
}

app.get('/api/seller/vouchers', requireAuth, requireRole('seller'), ah(async (req, res) => {
  const rows = await db.all(`
    SELECT v.*, m.title AS material_title FROM vouchers v
    LEFT JOIN materials m ON m.id = v.material_id AND v.material_id != 0
    WHERE v.seller_id = ? ORDER BY v.id DESC
  `, [req.session.user.id]);
  res.json({ vouchers: rows.map(voucherOut) });
}));

app.post('/api/seller/vouchers', requireAuth, requireRole('seller'), ah(async (req, res) => {
  const { code, discountType, discountValue, expiresAt, minOrder, maxDiscount, usageLimit, materialId } = req.body || {};
  if (!code || !['percent', 'fixed'].includes(discountType) || !discountValue) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ mã, loại và giá trị giảm giá.' });
  }
  const value = Number(discountValue);
  if (!value || value <= 0 || (discountType === 'percent' && value > 100)) {
    return res.status(400).json({ error: 'Giá trị giảm giá không hợp lệ.' });
  }
  let materialIdNum = Number(materialId) || 0;
  if (materialIdNum) {
    const material = await db.get('SELECT id FROM materials WHERE id = ? AND seller_id = ?', [materialIdNum, req.session.user.id]);
    if (!material) return res.status(400).json({ error: 'Vật liệu áp dụng không hợp lệ.' });
  }
  const normalizedCode = String(code).trim().toUpperCase();
  const existing = await db.get('SELECT id FROM vouchers WHERE seller_id = ? AND code = ?', [req.session.user.id, normalizedCode]);
  if (existing) return res.status(409).json({ error: 'Mã giảm giá này đã tồn tại.' });
  const info = await db.run(`
    INSERT INTO vouchers (seller_id, code, discount_type, discount_value, expires_at, min_order, max_discount, usage_limit, material_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    RETURNING id
  `, [req.session.user.id, normalizedCode, discountType, value, String(expiresAt || ''),
    Number(minOrder) || 0, Number(maxDiscount) || 0, Number(usageLimit) || 0, materialIdNum]);
  const created = await db.get(`
    SELECT v.*, m.title AS material_title FROM vouchers v
    LEFT JOIN materials m ON m.id = v.material_id AND v.material_id != 0
    WHERE v.id = ?
  `, [info.rows[0].id]);
  res.status(201).json({ voucher: voucherOut(created) });
}));

app.put('/api/seller/vouchers/:id', requireAuth, requireRole('seller'), ah(async (req, res) => {
  const existing = await db.get('SELECT * FROM vouchers WHERE id = ?', [req.params.id]);
  if (!existing || existing.seller_id !== req.session.user.id) return res.status(404).json({ error: 'Không tìm thấy mã giảm giá.' });
  const { active } = req.body || {};
  await db.run('UPDATE vouchers SET active = ? WHERE id = ?', [active ? 1 : 0, req.params.id]);
  res.json({ voucher: voucherOut(await db.get('SELECT * FROM vouchers WHERE id = ?', [req.params.id])) });
}));

app.delete('/api/seller/vouchers/:id', requireAuth, requireRole('seller'), ah(async (req, res) => {
  const existing = await db.get('SELECT * FROM vouchers WHERE id = ?', [req.params.id]);
  if (!existing || existing.seller_id !== req.session.user.id) return res.status(404).json({ error: 'Không tìm thấy mã giảm giá.' });
  await db.run('DELETE FROM vouchers WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
}));

/* ===================== CHAT (customer side — anonymous by customerKey) ===================== */

async function conversationSummary(convRow, forRole) {
  const lastMsg = await db.get('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1', [convRow.id]);
  const unreadCol = forRole === 'seller' ? 'read_by_seller' : 'read_by_customer';
  const otherRole = forRole === 'seller' ? 'customer' : 'seller';
  const unread = (await db.get(
    `SELECT COUNT(*) AS n FROM messages WHERE conversation_id = ? AND sender_role = ? AND ${unreadCol} = 0`,
    [convRow.id, otherRole]
  )).n;
  return {
    id: convRow.id,
    sellerId: convRow.seller_id,
    customerName: convRow.customer_name,
    lastMessage: lastMsg ? lastMsg.body : '',
    lastMessageAt: lastMsg ? lastMsg.created_at : convRow.created_at,
    unread
  };
}

app.post('/api/chat/start', ah(async (req, res) => {
  const { sellerId, customerKey, customerName } = req.body || {};
  if (!sellerId || !customerKey || !customerName) {
    return res.status(400).json({ error: 'Thiếu thông tin nhà bán hàng hoặc tên khách hàng.' });
  }
  const seller = await db.get("SELECT u.id, p.business_name, p.initials FROM users u JOIN seller_profiles p ON p.user_id = u.id WHERE u.id = ? AND u.role = 'seller'", [sellerId]);
  if (!seller) return res.status(404).json({ error: 'Không tìm thấy nhà bán hàng.' });

  let conv = await db.get('SELECT * FROM conversations WHERE seller_id = ? AND customer_key = ?', [sellerId, customerKey]);
  if (!conv) {
    const info = await db.run('INSERT INTO conversations (seller_id, customer_key, customer_name) VALUES (?, ?, ?) RETURNING id', [sellerId, customerKey, customerName]);
    conv = await db.get('SELECT * FROM conversations WHERE id = ?', [info.rows[0].id]);
  }
  const messages = await db.all('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC', [conv.id]);
  res.status(201).json({
    conversation: { id: conv.id, sellerId: seller.id, sellerName: seller.business_name, sellerInitials: seller.initials },
    messages
  });
}));

app.get('/api/chat/conversations', ah(async (req, res) => {
  const customerKey = req.query.customerKey;
  if (!customerKey) return res.status(400).json({ error: 'Thiếu customerKey.' });
  const rows = await db.all(`
    SELECT c.*, p.business_name AS seller_name, p.initials AS seller_initials
    FROM conversations c JOIN seller_profiles p ON p.user_id = c.seller_id
    WHERE c.customer_key = ? ORDER BY c.id DESC
  `, [customerKey]);
  const conversations = await Promise.all(rows.map(async r => ({ ...(await conversationSummary(r, 'customer')), sellerName: r.seller_name, sellerInitials: r.seller_initials })));
  res.json({ conversations });
}));

app.get('/api/chat/conversations/:id/messages', ah(async (req, res) => {
  const customerKey = req.query.customerKey;
  const conv = await db.get('SELECT * FROM conversations WHERE id = ?', [req.params.id]);
  if (!conv || conv.customer_key !== customerKey) return res.status(404).json({ error: 'Không tìm thấy hội thoại.' });
  await db.run("UPDATE messages SET read_by_customer = 1 WHERE conversation_id = ? AND sender_role = 'seller'", [conv.id]);
  const messages = await db.all('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC', [conv.id]);
  res.json({ messages });
}));

app.post('/api/chat/conversations/:id/messages', ah(async (req, res) => {
  const { customerKey, body } = req.body || {};
  const conv = await db.get('SELECT * FROM conversations WHERE id = ?', [req.params.id]);
  if (!conv || conv.customer_key !== customerKey) return res.status(404).json({ error: 'Không tìm thấy hội thoại.' });
  if (!body || !body.trim()) return res.status(400).json({ error: 'Tin nhắn trống.' });
  const info = await db.run("INSERT INTO messages (conversation_id, sender_role, body, read_by_customer) VALUES (?, 'customer', ?, 1) RETURNING id", [conv.id, body.trim()]);
  res.status(201).json({ message: await db.get('SELECT * FROM messages WHERE id = ?', [info.rows[0].id]) });
}));

/* ===================== CHAT (seller side — authenticated) ===================== */

app.get('/api/seller/conversations', requireAuth, requireRole('seller'), ah(async (req, res) => {
  const rows = await db.all('SELECT * FROM conversations WHERE seller_id = ? ORDER BY id DESC', [req.session.user.id]);
  const conversations = await Promise.all(rows.map(r => conversationSummary(r, 'seller')));
  res.json({ conversations });
}));

app.get('/api/seller/conversations/:id/messages', requireAuth, requireRole('seller'), ah(async (req, res) => {
  const conv = await db.get('SELECT * FROM conversations WHERE id = ?', [req.params.id]);
  if (!conv || conv.seller_id !== req.session.user.id) return res.status(404).json({ error: 'Không tìm thấy hội thoại.' });
  await db.run("UPDATE messages SET read_by_seller = 1 WHERE conversation_id = ? AND sender_role = 'customer'", [conv.id]);
  const messages = await db.all('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC', [conv.id]);
  res.json({ messages, customerName: conv.customer_name });
}));

app.post('/api/seller/conversations/:id/messages', requireAuth, requireRole('seller'), ah(async (req, res) => {
  const { body } = req.body || {};
  const conv = await db.get('SELECT * FROM conversations WHERE id = ?', [req.params.id]);
  if (!conv || conv.seller_id !== req.session.user.id) return res.status(404).json({ error: 'Không tìm thấy hội thoại.' });
  if (!body || !body.trim()) return res.status(400).json({ error: 'Tin nhắn trống.' });
  const info = await db.run("INSERT INTO messages (conversation_id, sender_role, body, read_by_seller) VALUES (?, 'seller', ?, 1) RETURNING id", [conv.id, body.trim()]);
  res.status(201).json({ message: await db.get('SELECT * FROM messages WHERE id = ?', [info.rows[0].id]) });
}));

// Catches errors forwarded by `ah()` (query failures, etc.) so a broken
// request gets a JSON 500 response instead of hanging with no reply.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Đã có lỗi xảy ra phía máy chủ.' });
});

app.listen(PORT, () => {
  console.log(`Material AI server running at http://localhost:${PORT}`);
});
