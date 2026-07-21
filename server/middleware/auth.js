function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Bạn cần đăng nhập.' });
  next();
}

function requireRole(role) {
  return function (req, res, next) {
    if (!req.session.user) return res.status(401).json({ error: 'Bạn cần đăng nhập.' });
    if (req.session.user.role !== role) return res.status(403).json({ error: 'Không có quyền truy cập.' });
    next();
  };
}

module.exports = { requireAuth, requireRole };
