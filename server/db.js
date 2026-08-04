const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Add your Supabase Postgres connection string to the .env file in the project root (see README).');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase's Postgres uses a certificate that Node doesn't have in its
  // default trust store; this matches Supabase's own connection examples.
  ssl: { rejectUnauthorized: false }
});

// The rest of the codebase was written against better-sqlite3's `?`
// placeholder style. Rewriting every query to `$1, $2, ...` by hand would
// touch the same call sites as the actual logic changes we're trying to
// avoid, so translate positional placeholders here instead.
function toPgQuery(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function all(client, sql, params = []) {
  const { rows } = await client.query(toPgQuery(sql), params);
  return rows;
}

async function get(client, sql, params = []) {
  const rows = await all(client, sql, params);
  return rows[0];
}

async function run(client, sql, params = []) {
  const result = await client.query(toPgQuery(sql), params);
  // Mirrors the pieces of better-sqlite3's RunResult that server.js reads:
  // `.changes` (row count) and, via `.rows[0].id`, the RETURNING id in place
  // of `.lastInsertRowid` (Postgres has no built-in equivalent).
  return { changes: result.rowCount, rows: result.rows };
}

module.exports = {
  pool,
  all: (sql, params) => all(pool, sql, params),
  get: (sql, params) => get(pool, sql, params),
  run: (sql, params) => run(pool, sql, params),
  // Replaces db.transaction(fn)(): runs fn against a single dedicated
  // connection wrapped in BEGIN/COMMIT, rolling back on any thrown error.
  async tx(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const scoped = {
        all: (sql, params) => all(client, sql, params),
        get: (sql, params) => get(client, sql, params),
        run: (sql, params) => run(client, sql, params)
      };
      const result = await fn(scoped);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};
