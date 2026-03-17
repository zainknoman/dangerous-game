 # 🚀 DangerousGameV2 - Retro Platformer + Level Editor

Browser-based platformer inspired by classic games like Dangerous Dave. Collect all trophies → get key → reach door to win!

## ✨ Features
- **20+ handcrafted levels** with increasing difficulty
- **Live level editor** - paint tiles, import/export JSON levels
- **Custom enemy creator** - design behaviors (patrol/fast/flying/jumper), colors, save locally
- **Procedural pixel art** sprites (no images needed)
- **Smooth physics** - gravity, collision, smooth camera, jump feel
- **Powerups** - Gun (shoot enemies), Jetpack (fly), Extra lives
- **Polish** - Particles, CRT scanlines, chiptune SFX, hi-score persistence

## 🎮 How to Play
1. Open `DangerousGameV2.html` in any modern browser
2. **Controls**:
   - ← → **Move**
   - ↑ / **SPACE** **Jump**
   - **CTRL / Z** **Shoot** (with gun)
   - **ESC** **Menu**
3. **Objective**: Collect all yellow trophies → grab key → reach door

## ✎ Level Editor (Pro Feature)
```
MENU → LEVEL EDITOR
- LEFT mouse: Paint selected tile
- RIGHT mouse: Erase  
- Palette: Select tiles/enemies (incl. custom)
- ADD CHARACTER: Create custom enemies
- PLAY TEST: Test current level
- EXPORT JSON: Download level file
- IMPORT JSON: Load custom levels
```

**Level files in `/Levels/`** - edit JSON directly!

## 📱 Mobile/Touch
- Optimized viewport
- Touch: Virtual dpad + buttons appear automatically

## 🛠 Development
See detailed [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)

### Quick Start (Frontend Only)
```
# Browser-open DangerousGameV2.html (no install)
```

### Full Stack Quick Start
```
# Backend (API)
cd backend
./run.bat   # http://localhost:5000

# Frontend (dev server, new tab)
npx live-server .  # http://localhost:8080
```

### Full Structure
```
DangerousGameV2.html  # Frontend: Game + Editor
├── game.js          # Core engine
├── levels.js        # Local levels
├── main.js          # Entry point
├── core/            # Physics, render, loop
├── entities/        # Player, Enemy
└── backend/         # Flask API: Users, Levels, SQLite
    ├── app.py
    ├── routes/
    └── models.py
```
See [ARCHITECTURE.md](ARCHITECTURE.md)

### Customization
```js
// Add level
LEVELS.push({
  name: "My Level",
  tiles: [ [1,1,...], [...] ],  // 10 rows wide
});

// Custom enemy tile IDs start at 20+
```

## 🧪 Testing Checklist
- ✅ All 20 levels completable
- ✅ Editor round-trip (export/import)
- ✅ Custom chars persist/load
- ✅ Performance: 60FPS scrolling
- ✅ Audio works post-user-interaction

## 🔮 Roadmap (From Code Analysis)
```
Phase 1 [DONE]: Backend API ready ✅
Phase 2 [NEXT]: Frontend ↔ API integration (level sync)
Phase 3 [FUTURE]: Premium features, leaderboards
Phase 4 [MONEY]: Stripe + cloud deploy
```
[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) for API details.

## 🎨 Credits
- **Engine/Author**: Solo dev (you!)
- **Sprites**: Procedural pixel art
- **Font**: Press Start 2P (Google Fonts)
- **Inspo**: Dangerous Dave, Mario Maker

⭐ **Fork it! Share levels via API! Build your game empire!** 🚀

**Docs:**
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
