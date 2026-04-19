const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'apmos.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cpu_load REAL,
      ram_used REAL,
      ram_total REAL,
      battery_percent INTEGER,
      battery_charging INTEGER,
      data_usage_rx REAL,
      data_usage_tx REAL,
      process_timing REAL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS process_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pid INTEGER,
      name TEXT,
      memory_mb REAL,
      cpu_percent REAL,
      status TEXT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS network_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      interface_name TEXT,
      ip_address TEXT,
      speed_mbps REAL,
      status TEXT,
      connections INTEGER,
      latency_ms REAL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS browser_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      browser TEXT DEFAULT 'chrome',
      title TEXT,
      url TEXT,
      visit_time DATETIME,
      memory_mb REAL,
      processes INTEGER,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      color_theme TEXT DEFAULT 'dark',
      dynamic_background INTEGER DEFAULT 1,
      compact_mode INTEGER DEFAULT 0,
      refresh_rate INTEGER DEFAULT 3,
      auto_pause_graph INTEGER DEFAULT 1,
      realtime_alerts INTEGER DEFAULT 1,
      high_cpu_alerts INTEGER DEFAULT 1,
      battery_warning INTEGER DEFAULT 0,
      session_timeout INTEGER DEFAULT 1,
      UNIQUE(user_id)
    );
  `);

  // Seed default admin user
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existing) {
    const hashed = bcrypt.hashSync('admin123', 10);
    db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run('admin', 'admin@apmos.local', hashed);
    console.log('[DB] Default user created: admin / admin123');
  }
}

module.exports = { getDb };
