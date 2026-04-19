const express = require('express');
const router = express.Router();
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/settings
router.get('/', (req, res) => {
  try {
    const db = getDb();
    let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id);
    if (!settings) {
      db.prepare('INSERT INTO user_settings (user_id) VALUES (?)').run(req.user.id);
      settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id);
    }
    res.json({ settings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings
router.put('/', (req, res) => {
  try {
    const db = getDb();
    const {
      color_theme, dynamic_background, compact_mode,
      refresh_rate, auto_pause_graph, realtime_alerts,
      high_cpu_alerts, battery_warning, session_timeout
    } = req.body;

    const existing = db.prepare('SELECT id FROM user_settings WHERE user_id = ?').get(req.user.id);
    if (existing) {
      db.prepare(`UPDATE user_settings SET
        color_theme = COALESCE(?, color_theme),
        dynamic_background = COALESCE(?, dynamic_background),
        compact_mode = COALESCE(?, compact_mode),
        refresh_rate = COALESCE(?, refresh_rate),
        auto_pause_graph = COALESCE(?, auto_pause_graph),
        realtime_alerts = COALESCE(?, realtime_alerts),
        high_cpu_alerts = COALESCE(?, high_cpu_alerts),
        battery_warning = COALESCE(?, battery_warning),
        session_timeout = COALESCE(?, session_timeout)
        WHERE user_id = ?
      `).run(color_theme, dynamic_background, compact_mode, refresh_rate,
        auto_pause_graph, realtime_alerts, high_cpu_alerts,
        battery_warning, session_timeout, req.user.id);
    } else {
      db.prepare('INSERT INTO user_settings (user_id, color_theme, refresh_rate) VALUES (?, ?, ?)').run(req.user.id, color_theme || 'dark', refresh_rate || 3);
    }

    const updated = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user.id);
    res.json({ settings: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

module.exports = router;
