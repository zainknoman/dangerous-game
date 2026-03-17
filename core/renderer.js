// core/renderer.js - Rendering System
import { G } from '../gameState.js';
import { CANVAS_W, COLS_VIS, ROWS_VIS, TILE_SIZE } from '../config/constants.js';
import { isKill } from '../config/tileBehavior.js';  // Temp for death tiles

export function render() {
  const ctx = G.ctx;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Background
  ctx.fillStyle = G.bgColor;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawStars(ctx);

  const cx = Math.floor(G.camX);
  const startCol = Math.floor(cx / TILE_SIZE);
  const endCol = startCol + COLS_VIS + 2;
  const startRow = 0;
  const endRow = ROWS_VIS + 2;

  renderTiles(startCol, endCol, startRow, endRow, cx);
  renderItems(cx);
  renderEnemies(cx);
  renderBullets(cx);
  renderPlayer(cx);
  renderParticles();

  updateHUD();
}

function renderTiles(startCol, endCol, startRow, endRow, cx) {
  for (let row = startRow; row < endRow && row < G.mapH; row++) {
    for (let col = startCol; col <= endCol && col < G.mapW; col++) {
      if (col < 0) continue;
      const t = G.map[row][col];
      if (t === 0) continue;

      const sx = col * TILE_SIZE - cx;
      const sy = row * TILE_SIZE;

      if (t === 3) {
        ctx.save();
        ctx.translate(sx, sy + TILE_SIZE - 16);
        ctx.scale(2, 2);
        ctx.drawImage(SPRITES['spike'], 0, 0);
        ctx.restore();
      } else if (t === 8) {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(2, 2);
        ctx.drawImage(SPRITES['tile_hazard'], 0, 0);
        ctx.restore();
      } else if (t === 2) {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(2, 2);
        ctx.drawImage(SPRITES['tile_brick'], 0, 0);
        ctx.restore();
      } else {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(2, 2);
        ctx.drawImage(SPRITES['tile_solid'], 0, 0);
        ctx.restore();
      }
    }
  }
}

// ... (extract other render funcs similarly - placeholder for now)
function renderItems(cx) { /* from game.js */ }
function renderEnemies(cx) { /* from game.js */ }
function renderBullets(cx) { /* from game.js */ }
function renderPlayer(cx) { /* from game.js */ }
function renderParticles() { /* from game.js */ }
function drawStars(ctx) { /* from game.js */ }
function updateHUD() { /* from game.js */ }

