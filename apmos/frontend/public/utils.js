// utils.js - Shared utilities for APMOS frontend

function setActivePage(page) {
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const el = document.getElementById('nav-' + page);
  if (el) el.classList.add('active');

  // Update battery in topbar on all pages
  updateBattery();
}

async function updateBattery() {
  try {
    const data = await api.metrics.live();
    const pct = document.getElementById('batteryPct');
    const status = document.getElementById('batteryStatus');
    if (pct) pct.textContent = data.battery_percent + '%';
    if (status) status.textContent = data.battery_charging ? 'Charging' : 'Discharging';
  } catch {}
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span> ${message}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function formatBytes(bytes, decimals = 2) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return diff + 's ago';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ' + (diff % 60) + 's ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ' + Math.floor((diff % 3600) / 60) + 'm ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function getProcessIcon(iconType) {
  const icons = {
    chrome: '🌐', firefox: '🦊', vscode: '💻', node: '📦',
    python: '🐍', explorer: '📁', slack: '💬', spotify: '🎵',
    zoom: '📹', app: '⚙️'
  };
  return icons[iconType] || icons.app;
}
