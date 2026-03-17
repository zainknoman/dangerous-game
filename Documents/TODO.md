# DG-FIRE Code Quality & Maintainability Improvements
## Approved 5-Step Plan (Based on Task1-5.md)

### Step 1: Fix Critical Bugs & Add TODO Tracking ✅ [COMPLETE]
See [Step1-Changes.md](Step1-Changes.md) for details.
- ✓ Patch incomplete editor code (full impl present)
- ✓ Fix bullet collision (3-point checks)
- ✓ Fix enemy falling edge case (spawnY offset)
- ✓ Cleanup memory leaks (temp sprites overwritten)
- ✓ Audio context on user gesture (click init)
- ✓ Create/update this TODO.md

### Step 2: Performance Optimizations ✅ [COMPLETE]
See [Step2-Changes.md](Step2-Changes.md).
- ✓ Visible-only tile rendering (rows/cols bounded)
- ✓ Particle capping (max 200)
- ✓ Offscreen culling (entities + bullets)

### Step 3: Modularize Frontend Architecture ✅ [COMPLETE]
- ✓ ECS refactor: GameState.js, entity classes (Player.js, Enemy.js)
- ✓ Extracted core/gameLoop.js, core/renderer.js, config/
- ✓ TILE_BEHAVIOR.js, physics.js
- ✓ main.js entry point w/ null checks, fixes JS errors

### Step 4: Enhance Editor & Add Export/Validation ✅ [COMPLETE]
- ✓ core/EditorState.js (class w/ undo/redo/snapping/validate/export)
- ✓ main.js integrated EditorState dynamic import
- Test: Editor undo (Ctrl+Z?), snapping toggle, validate/export JSON

### Step 5: Backend Foundation & Platform Features ✅ [COMPLETE]
- ✓ backend/ full Flask (app.py, models.py, routes/users+levels, requirements.txt, run.bat)
- ✓ JWT auth/register/login/save/get levels
- ✓ PWA (public/manifest.json + sw.js)
- Backend: cd backend && run.bat (Python 3.13 ready)
- Frontend test: live-server . (open DangerousGameV2.html)


## Follow-up After Completion
- Test: npx live-server . (or python -m http.server)
- Backend: cd backend && pip install -r requirements.txt
- Format: npx prettier --write .

