const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const db = require('./db');
const { requireAuth, requireRole } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5500;

app.use(express.json());
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

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length >= 2 ? [parts[0][0], parts[1][0]] : [name[0] || '?', name[1] || ''];
  return letters.join('').toUpperCase();
}

function publicUser(row) {
  return { id: row.id, email: row.email, role: row.role, status: row.status };
}

/* ===================== AUTH ===================== */

app.post('/api/auth/register', (req, res) => {
  const { email, password, businessName, category, phone, address, website, description } = req.body || {};
  if (!email || !password || !businessName || !category) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ email, mật khẩu, tên nhà bán hàng và ngành hàng.' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Mật khẩu cần tối thiểu 8 ký tự.' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email này đã được đăng ký.' });
  }

  const hash = bcrypt.hashSync(String(password), 10);
  const tx = db.transaction(() => {
    const info = db.prepare('INSERT INTO users (email, password_hash, role, status) VALUES (?, ?, ?, ?)')
      .run(email, hash, 'seller', 'pending');
    const userId = info.lastInsertRowid;
    db.prepare(`INSERT INTO seller_profiles (user_id, business_name, initials, category, description, address, phone, website)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(userId, businessName, initials(businessName), category, description || '', address || '', phone || '', website || '');
    return userId;
  });
  const userId = tx();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  req.session.user = publicUser(user);
  res.status(201).json({ user: publicUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu.' });

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng.' });
  }
  if (user.status === 'blocked') {
    return res.status(403).json({ error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' });
  }

  req.session.user = publicUser(user);
  res.json({ user: publicUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Chưa đăng nhập.' });
  const fresh = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.user.id);
  if (!fresh) { req.session.destroy(() => {}); return res.status(401).json({ error: 'Chưa đăng nhập.' }); }
  req.session.user = publicUser(fresh);
  res.json({ user: publicUser(fresh) });
});

/* ===================== SELLER ===================== */

app.get('/api/seller/profile', requireAuth, requireRole('seller'), (req, res) => {
  const row = db.prepare(`SELECT u.email, u.status, p.* FROM users u
                           JOIN seller_profiles p ON p.user_id = u.id WHERE u.id = ?`)
    .get(req.session.user.id);
  res.json({ profile: row });
});

app.put('/api/seller/profile', requireAuth, requireRole('seller'), (req, res) => {
  const { businessName, category, description, address, phone, website } = req.body || {};
  if (!businessName || !category) return res.status(400).json({ error: 'Thiếu tên nhà bán hàng hoặc ngành hàng.' });
  db.prepare(`UPDATE seller_profiles SET business_name=?, initials=?, category=?, description=?, address=?, phone=?, website=?
              WHERE user_id=?`)
    .run(businessName, initials(businessName), category, description || '', address || '', phone || '', website || '', req.session.user.id);
  const row = db.prepare(`SELECT u.email, u.status, p.* FROM users u
                           JOIN seller_profiles p ON p.user_id = u.id WHERE u.id = ?`)
    .get(req.session.user.id);
  res.json({ profile: row });
});

app.get('/api/seller/materials', requireAuth, requireRole('seller'), (req, res) => {
  const rows = db.prepare('SELECT * FROM materials WHERE seller_id = ? ORDER BY created_at DESC').all(req.session.user.id);
  res.json({ materials: rows });
});

app.post('/api/seller/materials', requireAuth, requireRole('seller'), (req, res) => {
  const fresh = db.prepare('SELECT status FROM users WHERE id = ?').get(req.session.user.id);
  if (fresh.status !== 'approved') {
    return res.status(403).json({ error: 'Tài khoản đang chờ admin duyệt, chưa thể đăng vật liệu.' });
  }
  const { category, title, spec, price } = req.body || {};
  if (!category || !title) return res.status(400).json({ error: 'Thiếu danh mục hoặc tên vật liệu.' });
  const info = db.prepare('INSERT INTO materials (seller_id, category, title, spec, price) VALUES (?, ?, ?, ?, ?)')
    .run(req.session.user.id, category, title, spec || '', price || '');
  const row = db.prepare('SELECT * FROM materials WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ material: row });
});

app.put('/api/seller/materials/:id', requireAuth, requireRole('seller'), (req, res) => {
  const existing = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!existing || existing.seller_id !== req.session.user.id) return res.status(404).json({ error: 'Không tìm thấy vật liệu.' });
  const { category, title, spec, price } = req.body || {};
  if (!category || !title) return res.status(400).json({ error: 'Thiếu danh mục hoặc tên vật liệu.' });
  db.prepare('UPDATE materials SET category=?, title=?, spec=?, price=? WHERE id=?')
    .run(category, title, spec || '', price || '', req.params.id);
  res.json({ material: db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id) });
});

app.delete('/api/seller/materials/:id', requireAuth, requireRole('seller'), (req, res) => {
  const existing = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!existing || existing.seller_id !== req.session.user.id) return res.status(404).json({ error: 'Không tìm thấy vật liệu.' });
  db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

/* ===================== ADMIN ===================== */

app.get('/api/admin/sellers', requireAuth, requireRole('admin'), (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.email, u.status, u.created_at, p.business_name, p.initials, p.category, p.address, p.phone, p.website,
           (SELECT COUNT(*) FROM materials m WHERE m.seller_id = u.id) AS materials_count
    FROM users u JOIN seller_profiles p ON p.user_id = u.id
    WHERE u.role = 'seller'
    ORDER BY u.created_at DESC
  `).all();
  res.json({ sellers: rows });
});

app.put('/api/admin/sellers/:id/status', requireAuth, requireRole('admin'), (req, res) => {
  const { status } = req.body || {};
  if (!['pending', 'approved', 'blocked'].includes(status)) {
    return res.status(400).json({ error: 'Trạng thái không hợp lệ.' });
  }
  const info = db.prepare("UPDATE users SET status = ? WHERE id = ? AND role = 'seller'").run(status, req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Không tìm thấy nhà bán hàng.' });
  res.json({ ok: true });
});

app.delete('/api/admin/sellers/:id', requireAuth, requireRole('admin'), (req, res) => {
  const info = db.prepare("DELETE FROM users WHERE id = ? AND role = 'seller'").run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Không tìm thấy nhà bán hàng.' });
  res.json({ ok: true });
});

app.get('/api/admin/materials', requireAuth, requireRole('admin'), (req, res) => {
  const rows = db.prepare(`
    SELECT m.*, p.business_name AS seller_name
    FROM materials m JOIN seller_profiles p ON p.user_id = m.seller_id
    ORDER BY m.created_at DESC
  `).all();
  res.json({ materials: rows });
});

app.delete('/api/admin/materials/:id', requireAuth, requireRole('admin'), (req, res) => {
  const info = db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Không tìm thấy vật liệu.' });
  res.json({ ok: true });
});

app.get('/api/admin/stats', requireAuth, requireRole('admin'), (req, res) => {
  const totalSellers = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='seller'").get().n;
  const pendingSellers = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='seller' AND status='pending'").get().n;
  const approvedSellers = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='seller' AND status='approved'").get().n;
  const blockedSellers = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='seller' AND status='blocked'").get().n;
  const totalMaterials = db.prepare('SELECT COUNT(*) AS n FROM materials').get().n;
  res.json({ totalSellers, pendingSellers, approvedSellers, blockedSellers, totalMaterials });
});

/* ===================== CHAT (customer side — anonymous by customerKey) ===================== */

function conversationSummary(convRow, forRole) {
  const lastMsg = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1').get(convRow.id);
  const unreadCol = forRole === 'seller' ? 'read_by_seller' : 'read_by_customer';
  const otherRole = forRole === 'seller' ? 'customer' : 'seller';
  const unread = db.prepare(
    `SELECT COUNT(*) AS n FROM messages WHERE conversation_id = ? AND sender_role = ? AND ${unreadCol} = 0`
  ).get(convRow.id, otherRole).n;
  return {
    id: convRow.id,
    sellerId: convRow.seller_id,
    customerName: convRow.customer_name,
    lastMessage: lastMsg ? lastMsg.body : '',
    lastMessageAt: lastMsg ? lastMsg.created_at : convRow.created_at,
    unread
  };
}

app.post('/api/chat/start', (req, res) => {
  const { sellerId, customerKey, customerName } = req.body || {};
  if (!sellerId || !customerKey || !customerName) {
    return res.status(400).json({ error: 'Thiếu thông tin nhà bán hàng hoặc tên khách hàng.' });
  }
  const seller = db.prepare("SELECT u.id, p.business_name, p.initials FROM users u JOIN seller_profiles p ON p.user_id = u.id WHERE u.id = ? AND u.role = 'seller'").get(sellerId);
  if (!seller) return res.status(404).json({ error: 'Không tìm thấy nhà bán hàng.' });

  let conv = db.prepare('SELECT * FROM conversations WHERE seller_id = ? AND customer_key = ?').get(sellerId, customerKey);
  if (!conv) {
    const info = db.prepare('INSERT INTO conversations (seller_id, customer_key, customer_name) VALUES (?, ?, ?)').run(sellerId, customerKey, customerName);
    conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(info.lastInsertRowid);
  }
  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC').all(conv.id);
  res.status(201).json({
    conversation: { id: conv.id, sellerId: seller.id, sellerName: seller.business_name, sellerInitials: seller.initials },
    messages
  });
});

app.get('/api/chat/conversations', (req, res) => {
  const customerKey = req.query.customerKey;
  if (!customerKey) return res.status(400).json({ error: 'Thiếu customerKey.' });
  const rows = db.prepare(`
    SELECT c.*, p.business_name AS seller_name, p.initials AS seller_initials
    FROM conversations c JOIN seller_profiles p ON p.user_id = c.seller_id
    WHERE c.customer_key = ? ORDER BY c.id DESC
  `).all(customerKey);
  const conversations = rows.map(r => ({ ...conversationSummary(r, 'customer'), sellerName: r.seller_name, sellerInitials: r.seller_initials }));
  res.json({ conversations });
});

app.get('/api/chat/conversations/:id/messages', (req, res) => {
  const customerKey = req.query.customerKey;
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conv || conv.customer_key !== customerKey) return res.status(404).json({ error: 'Không tìm thấy hội thoại.' });
  db.prepare("UPDATE messages SET read_by_customer = 1 WHERE conversation_id = ? AND sender_role = 'seller'").run(conv.id);
  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC').all(conv.id);
  res.json({ messages });
});

app.post('/api/chat/conversations/:id/messages', (req, res) => {
  const { customerKey, body } = req.body || {};
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conv || conv.customer_key !== customerKey) return res.status(404).json({ error: 'Không tìm thấy hội thoại.' });
  if (!body || !body.trim()) return res.status(400).json({ error: 'Tin nhắn trống.' });
  const info = db.prepare("INSERT INTO messages (conversation_id, sender_role, body, read_by_customer) VALUES (?, 'customer', ?, 1)").run(conv.id, body.trim());
  res.status(201).json({ message: db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid) });
});

/* ===================== CHAT (seller side — authenticated) ===================== */

app.get('/api/seller/conversations', requireAuth, requireRole('seller'), (req, res) => {
  const rows = db.prepare('SELECT * FROM conversations WHERE seller_id = ? ORDER BY id DESC').all(req.session.user.id);
  const conversations = rows.map(r => conversationSummary(r, 'seller'));
  res.json({ conversations });
});

app.get('/api/seller/conversations/:id/messages', requireAuth, requireRole('seller'), (req, res) => {
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conv || conv.seller_id !== req.session.user.id) return res.status(404).json({ error: 'Không tìm thấy hội thoại.' });
  db.prepare("UPDATE messages SET read_by_seller = 1 WHERE conversation_id = ? AND sender_role = 'customer'").run(conv.id);
  const messages = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC').all(conv.id);
  res.json({ messages, customerName: conv.customer_name });
});

app.post('/api/seller/conversations/:id/messages', requireAuth, requireRole('seller'), (req, res) => {
  const { body } = req.body || {};
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id);
  if (!conv || conv.seller_id !== req.session.user.id) return res.status(404).json({ error: 'Không tìm thấy hội thoại.' });
  if (!body || !body.trim()) return res.status(400).json({ error: 'Tin nhắn trống.' });
  const info = db.prepare("INSERT INTO messages (conversation_id, sender_role, body, read_by_seller) VALUES (?, 'seller', ?, 1)").run(conv.id, body.trim());
  res.status(201).json({ message: db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid) });
});

app.listen(PORT, () => {
  console.log(`Material AI server running at http://localhost:${PORT}`);
});
