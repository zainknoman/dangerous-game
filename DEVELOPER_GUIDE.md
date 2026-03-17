# DG-FIRE Developer Guide

## 🚀 Quick Start (Full Stack)

### Prerequisites
- Node.js (for `npx live-server` frontend dev)
- Python 3.10+ (backend)
- Git

### 1. Clone & Explore
```
git clone <repo> DG-FIRE
cd DG-FIRE
```

### 2. Backend Setup (Flask API)
```cmd
cd backend
# Windows (run.bat handles venv)
run.bat

# Or manual:
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
flask run  # or python app.py
```
✅ Server: http://localhost:5000/ → `{"message": "DG-FIRE Backend Ready"}`

### 3. Frontend Dev Server
```cmd
# Terminal 2 (root dir)
npx live-server .  # Serves DangerousGameV2.html + hot reload
```
✅ Open http://localhost:8080 → Play game/editor.

### 4. Full Stack (API Integration)
- Backend:5000 running.
- Frontend connects automatically (CORS enabled).
- Test API: Use Postman/Curl for auth/levels.

## 🧪 Testing

### Backend API (Postman/Curl)
```
# Register
curl -X POST http://localhost:5000/api/register -H "Content-Type: application/json" -d "{\"username\":\"test\",\"password\":\"test\"}"

# Login → JWT token
curl -X POST http://localhost:5000/api/login -H "Content-Type: application/json" -d "{\"username\":\"test\",\"password\":\"test\"}"

# Save level (with token)
curl -X POST http://localhost:5000/api/levels -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d "{\"name\":\"Test\",\"data\":{\"tiles\":[[1]]}}"
```

### Frontend
- Browser console: Check `G` object, no errors.
- Editor: Export/import JSON.
- Performance: 60FPS (Chrome DevTools → FPS meter).

### DB Inspect
```
# SQLite browser or
sqlite3 instance/dgfire.db "SELECT * FROM level;"
```

## 🔧 API Reference

### Auth (JWT)
| Endpoint | Method | Body | Auth | Desc |
|----------|--------|------|------|------|
| `/api/register` | POST | `{username, password}` | - | Create user |
| `/api/login` | POST | `{username, password}` | - | Get JWT token |

### Levels
| Endpoint | Method | Auth | Desc |
|----------|--------|------|------|
| `/api/levels` | GET | - | List levels |
| `/api/levels` | POST | JWT | Save level `{name, data}` |
| `/api/levels/<id>` | GET | - | Load level JSON |

**Data Schema**: `Level.data` = JSON string of `{tiles: [[int]]}`.

## 💻 Development Workflow
1. **Frontend**: Edit JS/CSS → `npx live-server` auto-reloads.
2. **Backend**: Edit Python → Restart `flask run`.
3. **Levels**: Edit `levels.js` or JSON files → Reload page.
4. **Commit**: `git add . && git commit -m "feat:..."`

### Code Style
- **JS**: ES6 modules, 2-space indent, JSDoc.
- **Python**: PEP8 (black formatter).
- **Commits**: Conventional (feat:, fix:, docs:).

## 🤝 Contributing
1. Fork → Branch (`feat/my-feature`).
2. Implement + Tests.
3. PR: Describe changes, screenshots/GIFs.
4. Backend changes: Bump requirements.txt if needed.

## 🚀 Deployment
### Frontend (Static)
```
npx live-server . --port=8080  # Dev
# Prod: Netlify/Vercel drag-drop HTML folder
```

### Backend
```
# Railway/Render/Heroku
- Push to GitHub
- Link repo, add env vars (SECRET_KEY)
- SQLite → PostgreSQL for prod
```

### Docker (Future)
```
# docker-compose up (frontend nginx + backend gunicorn)
```

## 🐛 Troubleshooting
| Issue | Fix |
|-------|-----|
| `ModuleNotFoundError` | `backend/run.bat` (venv fix) |
| CORS error | Backend running + CORS enabled |
| Audio no-play | User gesture (click first) |
| DB locked | Stop Flask, delete `instance/dgfire.db` |

## 📚 Related Docs
- [ARCHITECTURE.md](ARCHITECTURE.md): Diagrams/flow.
- [README.md](../README.md): User-facing overview.
- Backend: [app.py](../backend/app.py)

**Happy coding! 🎮✨**

