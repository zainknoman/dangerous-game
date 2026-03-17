# DG-FIRE Architecture Overview

## High-Level Design
DG-FIRE is a **hybrid client-server retro platformer**:
- **Frontend**: Self-contained browser app (HTML5 Canvas, Vanilla JS).
- **Backend**: Flask REST API for user auth + level sharing/sync.
- **Data**: JSON levels (localStorage ↔ SQLite via API).

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Browser       │    │   LocalStorage   │    │   SQLite DB     │
│  (Game + Editor)│◄──►│  (Levels, Custom │◄──►│  (Users, Levels)│
│                 │    │     Enemies)     │    │                 │
└─────────┬───────┘    └──────────────────┘    └───────┬────────┘
          │                                          │
          │ HTTP/REST + JWT Auth                     │
          ▼                                          ▼
┌─────────────────┐                          ┌─────────────────┐
│ npx live-server  │◄───────────────────────►│ backend/run.bat │
│   (Frontend)     │                          │   (Flask:5000)  │
└─────────────────┘                          └─────────────────┘
```

## Frontend Components (Modular JS)
```
DangerousGameV2.html
├── main.js (Entry: DOM wiring, state mgmt)
├── game.js (Core: Physics, Render, Editor)
├── gameState.js (G: Global state)
├── levels.js (20+ JSON levels)
├── core/
│   ├── gameLoop.js (RAF loop)
│   ├── physics.js (Collision, Gravity)
│   ├── renderer.js (Canvas, Procedural sprites)
│   └── EditorState.js (Level editor)
├── entities/
│   ├── Player.js (Movement, Jump, Shoot/Jetpack)
│   └── Enemy.js (Patrol AI)
├── config/
│   ├── constants.js
│   └── tileBehavior.js
└── style.css (CRT shader, Retro UI)
```
- **Engine**: 60FPS RAF, tile-based (32px), procedural pixel sprites (no assets).
- **Editor**: Live paint/import/export JSON, custom enemies.

## Backend Components (Flask Blueprints)
```
backend/
├── app.py (Flask init, JWT, CORS)
├── models.py
│   ├── User (username, premium)
│   └── Level (name, data:JSON, user_id)
├── routes/
│   ├── users.py (/api/register, /api/login → JWT)
│   └── levels.py (/api/levels GET/POST/<id>)
├── config.py (SECRET_KEY, SQLALCHEMY_DB)
├── requirements.txt
└── run.bat (venv activate, pip install, flask run)
```
- **API**: Auth-protected level CRUD. Ready for sharing/user levels.
- **DB**: SQLite (`instance/dgfire.db`).

## Data Flow Examples
1. **Play Offline**: Levels from `levels.js` → localStorage.
2. **Edit & Sync**:
   ```
   Editor → JSON.stringify(map) → POST /api/levels (JWT)
   → Level(data) saved → GET /api/levels → Editor import
   ```
3. **Multiplayer Future**: User levels → Public browse → Challenge friends.

## Tech Decisions
| Aspect | Choice | Why |
|--------|--------|-----|
| Frontend | Vanilla JS/ES6 | No build, instant play |
| Render | Canvas 2D | Performant pixel art |
| Backend | Flask + SQLAlchemy | Simple, batteries-included |
| Auth | JWT | Stateless API |
| DB | SQLite | Zero-config dev/prod |

## Scalability Path
- **Phase 1**: Local → API sync (current).
- **Phase 2**: Premium users (Stripe → is_premium).
- **Phase 3**: Redis cache, PostgreSQL, Level leaderboards.
- **Deploy**: Frontend (Netlify), Backend (Railway), CDN sprites (none needed!).

See [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for setup/contributing.

