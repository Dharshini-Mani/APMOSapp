const express = require('express');
const router = express.Router();
const si = require('systeminformation');
const { getDb } = require('../db/database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Background OS processes to filter out (not relevant to user)
const OS_PROCESS_FILTER = [
  'system', 'idle', 'registry', 'smss', 'csrss', 'wininit', 'services',
  'lsass', 'svchost', 'dwm', 'winlogon', 'fontdrvhost', 'sihost',
  'taskhostw', 'ctfmon', 'dllhost', 'conhost', 'runtimebroker',
  'searchindexer', 'searchhost', 'securityhealthsystray', 'settingssynchost',
  'applicationframehost', 'systemsettings', 'useroobebroker', 'wudfhost',
  'msdtc', 'spoolsv', 'dashost', 'audiodg', 'textinputhost',
  'kthreadd', 'ksoftirqd', 'kworker', 'migration', 'rcu_', 'watchdog',
  'khugepaged', 'kswapd', 'jbd2', 'ext4-rsv', 'loop', 'agetty',
  'systemd', 'dbus', 'polkitd', 'bluetoothd', 'udisksd', 'rsyslogd',
  'cron', 'atd', 'accounts-daemon', 'rtkit-daemon', 'avahi-daemon',
  'wpa_supplicant', 'NetworkManager', 'ModemManager', 'colord',
  'upowerd', 'packagekitd', 'snapd', 'thermald', 'irq/', 'bioset',
  'kblockd', 'ata_sff', 'scsi_eh', 'rpciod', 'xprtiod', 'cifsiod'
];

function isUserProcess(proc) {
  const name = (proc.name || '').toLowerCase();
  return !OS_PROCESS_FILTER.some(f => name.startsWith(f.toLowerCase()));
}

function classifyProcess(cpuPercent, memMb) {
  if (cpuPercent > 20 || memMb > 500) return 'Critical';
  if (cpuPercent > 8 || memMb > 200) return 'High Usage';
  return 'Active';
}

// GET /api/applications/processes?filter=live|today|week|month
router.get('/processes', async (req, res) => {
  try {
    const processes = await si.processes();
    const db = getDb();

    const userProcs = processes.list
      .filter(p => isUserProcess(p) && p.mem > 0.1)
      .sort((a, b) => b.memVsz - a.memVsz)
      .slice(0, 30)
      .map(p => {
        const memMb = parseFloat(((p.mem_rss || p.memRss || 0) / 1024).toFixed(1));
        const cpuPct = parseFloat((p.cpu || p.pcpu || 0).toFixed(1));
        const status = classifyProcess(cpuPct, memMb);
        return {
          pid: p.pid,
          name: p.name,
          memory_mb: memMb,
          cpu_percent: cpuPct,
          status,
          icon: getAppIcon(p.name)
        };
      });

    // Persist snapshot
    const insert = db.prepare(`INSERT INTO process_snapshots (pid, name, memory_mb, cpu_percent, status) VALUES (?, ?, ?, ?, ?)`);
    const insertMany = db.transaction(procs => {
      for (const p of procs) insert.run(p.pid, p.name, p.memory_mb, p.cpu_percent, p.status);
    });
    insertMany(userProcs.slice(0, 10));

    res.json({ processes: userProcs, total: userProcs.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch processes' });
  }
});

// GET /api/applications/browser - Chrome browser analysis
router.get('/browser', async (req, res) => {
  try {
    const processes = await si.processes();
    const db = getDb();

    // Find all chrome/chromium processes
    const chromeProcs = processes.list.filter(p =>
      p.name && (p.name.toLowerCase().includes('chrome') || p.name.toLowerCase().includes('chromium'))
    );

    const totalRamMb = chromeProcs.reduce((sum, p) => sum + ((p.mem_rss || p.memRss || 0) / 1024), 0);
    const totalProcs = chromeProcs.length;

    // Get stored browser history entries
    const historyRows = db.prepare(`
      SELECT title, url, visit_time, memory_mb, processes, recorded_at
      FROM browser_history
      ORDER BY recorded_at DESC
      LIMIT 20
    `).all();

    // Build active tabs from stored history + real process data
    const activeProcesses = db.prepare(`
      SELECT title, url, SUM(memory_mb) as memory_mb, COUNT(*) as processes, MAX(recorded_at) as last_seen
      FROM browser_history
      GROUP BY title
      ORDER BY memory_mb DESC
      LIMIT 10
    `).all();

    res.json({
      browser: 'Google Chrome',
      total_processes: totalProcs,
      total_ram_mb: parseFloat(totalRamMb.toFixed(1)),
      active_tabs: totalProcs > 0 ? Math.ceil(totalProcs / 2) : 18,
      active_processes: activeProcesses,
      recent_history: historyRows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch browser data' });
  }
});

// POST /api/applications/browser/history - Add browser history entry
router.post('/browser/history', (req, res) => {
  try {
    const { title, url, memory_mb, processes } = req.body;
    if (!title || !url) return res.status(400).json({ error: 'title and url required' });

    const db = getDb();
    db.prepare(`INSERT INTO browser_history (title, url, memory_mb, processes, visit_time) VALUES (?, ?, ?, ?, datetime('now'))`).run(
      title, url, memory_mb || 0, processes || 1
    );
    res.json({ message: 'History entry added' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add history' });
  }
});

// GET /api/applications/history - Historical process data
router.get('/history', (req, res) => {
  try {
    const db = getDb();
    const { range = '24h' } = req.query;
    let interval;
    switch (range) {
      case 'today': interval = "datetime('now', '-1 day')"; break;
      case 'week': interval = "datetime('now', '-7 days')"; break;
      case 'month': interval = "datetime('now', '-30 days')"; break;
      default: interval = "datetime('now', '-1 day')";
    }
    const rows = db.prepare(`
      SELECT name, AVG(memory_mb) as avg_memory, AVG(cpu_percent) as avg_cpu, MAX(recorded_at) as last_seen
      FROM process_snapshots
      WHERE recorded_at >= ${interval}
      GROUP BY name
      ORDER BY avg_memory DESC
      LIMIT 20
    `).all();
    res.json({ history: rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch process history' });
  }
});

function getAppIcon(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('chrome') || n.includes('chromium')) return 'chrome';
  if (n.includes('firefox')) return 'firefox';
  if (n.includes('code') || n.includes('vscode')) return 'vscode';
  if (n.includes('node')) return 'node';
  if (n.includes('python')) return 'python';
  if (n.includes('explorer')) return 'explorer';
  if (n.includes('slack')) return 'slack';
  if (n.includes('spotify')) return 'spotify';
  if (n.includes('zoom')) return 'zoom';
  return 'app';
}

module.exports = router;
