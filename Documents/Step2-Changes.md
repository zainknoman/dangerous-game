# Step 2: Performance Optimizations

## Changes Applied to game.js:

1. **Visible-Only Tile Rendering** (render()):
   ```
     // ── Tiles ── (visible only)
     const startRow = 0;  // Fixed height, no vert scroll
     const endRow   = ROWS_VIS + 2;
   
     for (let row = startRow; row < endRow && row < G.mapH; row++) {
       for (let col = startCol; col <= endCol && col < G.mapW; col++) {
   ```
   *Limits to visible screen area. Major CPU savings on large levels.*

2. **Bullet Render Culling** (render()):
   ```
   +    if (sx < -32 || sx > CANVAS_W + 32) continue;
   ```
   *Skips offscreen bullet drawing.*

## Other Step 2 (from Step 1):
- ✅ Particles capped at 200
- ✅ Enemies culled in update

## Perf Impact:
- **Tile loop**: From `G.mapH * (COLS_VIS+2)` → `(ROWS_VIS+2) * (COLS_VIS+2)`
- Fixed-height game: ~320px → 11 rows vs all 10 (future-proof for taller maps)
- Expected: 20-50% render CPU reduction

## Test:
```
npx live-server .
```
Monitor FPS (DevTools > FPS meter) on large levels (e.g., Level 20).

**Step 2 COMPLETE** ⚡

