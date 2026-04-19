# APMOS — Application Performance Monitoring System

> Real-time system monitoring dashboard | Node.js + Express + SQLite + Vanilla JS

---

## Project Structure

```
APMOS/
├── backend/                  ← Node.js + Express + SQLite
│   ├── db/
│   │   └── database.js       ← SQLite schema + seeding
│   ├── middleware/
│   │   └── auth.js           ← JWT authentication
│   ├── routes/
│   │   ├── auth.js           ← Login / Register / Logout
│   │   ├── metrics.js        ← CPU, RAM, Battery, Data Usage
│   │   ├── applications.js   ← Processes + Chrome analysis
│   │   ├── network.js        ← Network diagnostics
│   │   └── settings.js       ← User settings
│   ├── .env                  ← Environment variables
│   ├── server.js             ← Main Express server (port 5000)
│   └── package.json
│
└── frontend/                 ← Pure HTML + CSS + JS
    └── public/
        ├── index.html        ← Overview / Dashboard
        ├── applications.html ← Process list + Browser analysis
        ├── network.html      ← Network diagnostics
        ├── settings.html     ← Settings page
        ├── login.html        ← Login / Register
        ├── styles.css        ← Full dark theme CSS
        ├── api.js            ← Centralized API service
        ├── utils.js          ← Shared utilities
        └── package.json
```

---

## Prerequisites

- **Node.js** v18 or higher — https://nodejs.org
- **VS Code** with **Live Server** extension installed

---

## Setup Instructions

### Step 1 — Backend Setup

Open a terminal in VS Code and run:

```bash
cd backend
npm install
npm run dev
```

You should see:
```
🚀 APMOS Backend running on http://localhost:5000
```

The SQLite database (`apmos.db`) is created automatically on first run.

Default login credentials:
- Username: `admin`
- Password: `admin123`

---

### Step 2 — Frontend Setup

1. Open the `frontend/public/` folder in VS Code
2. Right-click `login.html` → **"Open with Live Server"**
3. Browser opens at `http://127.0.0.1:5500/login.html`
4. Log in with `admin` / `admin123`

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register |
| GET | `/api/metrics/live` | Real-time CPU/RAM/Battery |
| GET | `/api/metrics/history?range=live\|24h\|7d\|30d` | Historical metrics |
| GET | `/api/metrics/system-health` | System health % |
| GET | `/api/applications/processes` | Running processes (filtered) |
| GET | `/api/applications/browser` | Chrome browser data |
| POST | `/api/applications/browser/history` | Add browser history |
| GET | `/api/applications/history?range=today\|week\|month` | Process history |
| GET | `/api/network/diagnostics` | Network interfaces + latency |
| GET | `/api/settings` | Get user settings |
| PUT | `/api/settings` | Update user settings |

---

## Features Implemented

- ✅ Secure JWT authentication (Login + Register)
- ✅ Real-time CPU load & RAM usage monitoring
- ✅ Battery status (percent + charging state)
- ✅ Data usage tracking
- ✅ Process timing measurement
- ✅ Smart process filtering (removes OS background processes)
- ✅ Process classification: Normal / High Usage / Critical
- ✅ Google Chrome browser analysis
- ✅ Browser active processes + recent history
- ✅ System Resource History chart (Live / 24h / 7d / 30d)
- ✅ Network diagnostics (connections, latency, interfaces)
- ✅ SQLite database for historical data
- ✅ User settings persistence (theme, refresh rate, alerts)
- ✅ System health score
- ✅ Toast notifications
- ✅ Search/filter for processes

---

## Technologies Used

- **Backend**: Node.js, Express.js, better-sqlite3, systeminformation, bcryptjs, jsonwebtoken
- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Chart.js
- **Database**: SQLite (via better-sqlite3)
