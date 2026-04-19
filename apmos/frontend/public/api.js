// api.js - Centralized API service for APMOS
const API_BASE = 'https://apmos-backend.onrender.com/api';

function getToken() {
  return localStorage.getItem('apmos_token');
}

function authHeaders() {
  const headers = {
    'Content-Type': 'application/json'
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      ...authHeaders(),
      ...(options.headers || {})
    },
    ...options
  });

  if (res.status === 401) {
    localStorage.removeItem('apmos_token');
    localStorage.removeItem('apmos_user');
    window.location.href = 'login.html';
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}

const api = {
  auth: {
    login: (username, password) =>
      apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      }),

    register: (username, email, password) =>
      apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      }),

    logout: () => {
      localStorage.removeItem('apmos_token');
      localStorage.removeItem('apmos_user');
      window.location.href = 'login.html';
    }
  },

  metrics: {
    live: () => apiFetch('/metrics/live'),
    history: (range = '24h') => apiFetch(`/metrics/history?range=${range}`),
    systemHealth: () => apiFetch('/metrics/system-health')
  },

  applications: {
    processes: () => apiFetch('/applications/processes'),
    browser: () => apiFetch('/applications/browser'),
    history: (range = '24h') => apiFetch(`/applications/history?range=${range}`),

    addBrowserHistory: (data) =>
      apiFetch('/applications/browser/history', {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  network: {
    diagnostics: () => apiFetch('/network/diagnostics'),
    history: () => apiFetch('/network/history')
  },

  settings: {
    get: () => apiFetch('/settings'),

    update: (data) =>
      apiFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  }
};

function requireAuth() {
  const token = getToken();

  if (!token) {
    window.location.href = 'login.html';
    return false;
  }

  return true;
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('apmos_user') || '{}');
  } catch {
    return {};
  }
}