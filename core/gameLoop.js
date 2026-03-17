// core/gameLoop.js - Main Game Loop
import { G } from '../gameState.js';
import { render } from './renderer.js';
import { updatePlayer, updateEnemies, updateBullets, updateItems, updateParticles } from '../game.js';  // Transition: use modular updates later
import { CANVAS_W } from '../config/constants.js';

let lastTime = 0;

export function startGameLoop() {
  lastTime = performance.now();
  G.animFrame = requestAnimationFrame(gameLoop);
}

export function stopGameLoop() {
  if (G.animFrame) {
    cancelAnimationFrame(G.animFrame);
    G.animFrame = 0;
  }
}

function gameLoop(ts) {
  if (G.state !== 'playing') {
    return requestAnimationFrame(gameLoop);  // Keep loop running but skip logic
  }

  const dt = Math.min((ts - lastTime) / 16.67, 3);
  lastTime = ts;

  updatePlayer(dt);
  updateEnemies();
  updateBullets();
  updateItems();
  updateParticles();

  if (G.msgTimer > 0) {
    G.msgTimer--;
    if (G.msgTimer === 0) clearMsg();
  }

  if (G.levelTransTimer > 0) {
    G.levelTransTimer--;
    if (G.levelTransTimer === 0) {
      G.level++;
      if (G.level >= LEVELS.length) {
        G.level = 0;
        if (G.score > G.hiScore) {
          G.hiScore = G.score;
          localStorage.setItem('dd_hi', G.hiScore);
        }
        switchState('gameover');
        return;
      }
      sfxLevelUp();
      loadLevel(G.level);
      showMsg(LEVELS[G.level].name, 120);
    }
  }

  render();

  G.animFrame = requestAnimationFrame(gameLoop);
}
