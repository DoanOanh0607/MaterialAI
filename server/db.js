const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, 'data.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','seller','customer')),
  status TEXT NOT NULL DEFAULT 'approved' CHECK(status IN ('pending','approved','blocked')),
  name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);`);

// Existing databases were created before the 'customer' role and the name
// column existed. SQLite can't ALTER a CHECK constraint in place, so rebuild
// the table when it's still on the old schema.
const usersTableSql = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get().sql;
if (!usersTableSql.includes("'customer'")) {
  db.pragma('foreign_keys = OFF');
  // legacy_alter_table stops RENAME from rewriting the FK text in other
  // tables (seller_profiles/materials/conversations REFERENCES users(id)) —
  // without it, SQLite repoints those FKs at "users_old", which then
  // dangles once users_old is dropped below.
  db.pragma('legacy_alter_table = ON');
  db.exec(`
    ALTER TABLE users RENAME TO users_old;
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','seller','customer')),
      status TEXT NOT NULL DEFAULT 'approved' CHECK(status IN ('pending','approved','blocked')),
      name TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO users (id, email, password_hash, role, status, created_at)
      SELECT id, email, password_hash, role, status, created_at FROM users_old;
    DROP TABLE users_old;
  `);
  db.pragma('legacy_alter_table = OFF');
  db.pragma('foreign_keys = ON');
}

// One-time repair: earlier runs of the users-table migration above (before
// legacy_alter_table was used) left seller_profiles/materials/conversations
// with a FOREIGN KEY pointing at the now-dropped "users_old" table. Rebuild
// any table still carrying that dangling reference.
const danglingTables = db.prepare(
  "SELECT name, sql FROM sqlite_master WHERE type='table' AND sql LIKE '%users_old%'"
).all();
if (danglingTables.length) {
  db.pragma('foreign_keys = OFF');
  db.pragma('legacy_alter_table = ON');
  danglingTables.forEach(({ name, sql }) => {
    const fixedSql = sql.replace(/"users_old"/g, 'users');
    db.exec(`
      ALTER TABLE ${name} RENAME TO ${name}_repair_tmp;
      ${fixedSql};
      INSERT INTO ${name} SELECT * FROM ${name}_repair_tmp;
      DROP TABLE ${name}_repair_tmp;
    `);
  });
  db.pragma('legacy_alter_table = OFF');
  db.pragma('foreign_keys = ON');
}

db.exec(`

CREATE TABLE IF NOT EXISTS seller_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  initials TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  website TEXT NOT NULL DEFAULT '',
  cover_class TEXT NOT NULL DEFAULT 'bg-secondary-50',
  logo_class TEXT NOT NULL DEFAULT 'bg-secondary-50 text-secondary'
);

CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  spec TEXT NOT NULL DEFAULT '',
  price TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  code TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_key TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(seller_id, customer_key)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK(sender_role IN ('customer','seller')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  read_by_seller INTEGER NOT NULL DEFAULT 0,
  read_by_customer INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  seller_id INTEGER NOT NULL,
  seller_name TEXT NOT NULL,
  title TEXT NOT NULL,
  spec TEXT NOT NULL DEFAULT '',
  price_text TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  tex_class TEXT NOT NULL DEFAULT '',
  qty INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(customer_id, item_key)
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_name TEXT NOT NULL,
  items_json TEXT NOT NULL,
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  voucher_code TEXT NOT NULL DEFAULT '',
  customer_name TEXT NOT NULL DEFAULT '',
  customer_phone TEXT NOT NULL DEFAULT '',
  customer_address TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT 'cod' CHECK(payment_method IN ('cod','bank_transfer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','shipping','completed','cancelled')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS vouchers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL CHECK(discount_type IN ('percent','fixed')),
  discount_value INTEGER NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT NOT NULL DEFAULT '',
  min_order INTEGER NOT NULL DEFAULT 0,
  max_discount INTEGER NOT NULL DEFAULT 0,
  usage_limit INTEGER NOT NULL DEFAULT 0,
  used_count INTEGER NOT NULL DEFAULT 0,
  material_id INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(seller_id, code)
);
`);

// vouchers.expires_at / min_order / max_discount / usage_limit / used_count / material_id were added later.
const vouchersCols = db.prepare("PRAGMA table_info(vouchers)").all().map(c => c.name);
const voucherNewCols = [
  ['expires_at', "TEXT NOT NULL DEFAULT ''"],
  ['min_order', 'INTEGER NOT NULL DEFAULT 0'],
  ['max_discount', 'INTEGER NOT NULL DEFAULT 0'],
  ['usage_limit', 'INTEGER NOT NULL DEFAULT 0'],
  ['used_count', 'INTEGER NOT NULL DEFAULT 0'],
  ['material_id', 'INTEGER NOT NULL DEFAULT 0']
];
for (const [col, def] of voucherNewCols) {
  if (!vouchersCols.includes(col)) {
    db.exec(`ALTER TABLE vouchers ADD COLUMN ${col} ${def}`);
  }
}

// Earlier versions of "orders" only recorded a bare chat-inquiry snapshot
// (no status/checkout fields). Rebuild it once to the full checkout schema,
// same rename-recreate-copy approach as the users migration above.
// materials.description / materials.image / materials.code were added later — older databases need the columns.
const materialsCols = db.prepare("PRAGMA table_info(materials)").all().map(c => c.name);
if (!materialsCols.includes('description')) {
  db.exec("ALTER TABLE materials ADD COLUMN description TEXT NOT NULL DEFAULT ''");
}
if (!materialsCols.includes('image')) {
  db.exec("ALTER TABLE materials ADD COLUMN image TEXT NOT NULL DEFAULT ''");
}
if (!materialsCols.includes('code')) {
  db.exec("ALTER TABLE materials ADD COLUMN code TEXT NOT NULL DEFAULT ''");
}

const ordersTableRow = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='orders'").get();
if (ordersTableRow && !ordersTableRow.sql.includes('status')) {
  db.pragma('foreign_keys = OFF');
  db.pragma('legacy_alter_table = ON');
  db.exec(`
    ALTER TABLE orders RENAME TO orders_old;
    CREATE TABLE orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seller_name TEXT NOT NULL,
      items_json TEXT NOT NULL,
      subtotal INTEGER NOT NULL DEFAULT 0,
      discount INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL DEFAULT 0,
      voucher_code TEXT NOT NULL DEFAULT '',
      customer_name TEXT NOT NULL DEFAULT '',
      customer_phone TEXT NOT NULL DEFAULT '',
      customer_address TEXT NOT NULL DEFAULT '',
      payment_method TEXT NOT NULL DEFAULT 'cod' CHECK(payment_method IN ('cod','bank_transfer')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','shipping','completed','cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    INSERT INTO orders (id, customer_id, seller_id, seller_name, items_json, created_at, updated_at)
      SELECT id, customer_id, seller_id, seller_name, items_json, created_at, created_at FROM orders_old;
    DROP TABLE orders_old;
  `);
  db.pragma('legacy_alter_table = OFF');
  db.pragma('foreign_keys = ON');
}

module.exports = db;
