// main.js - Application Entry Point (refactored from game.js)
import './game.js';  // Legacy functions (audio, sprites, etc.)
import { G } from './gameState.js';
import { startGameLoop, stopGameLoop } from './core/gameLoop.js';
import { loadLevel, switchState, initEditor } from './game.js';  // Transition helpers
import { LEVELS } from './levels.js';

// Constants (already in config, duplicated for legacy)
const CANVAS_W = 760;
const CANVAS_H = 320;
const TILE_SIZE = 32;

// Global exports for HTML compatibility (legacy)
window.G = G;
window.loadLevel = loadLevel;
window.switchState = switchState;
window.initEditor = initEditor;
window.startGameLoop = startGameLoop;
window.gameLoop = startGameLoop;  // Alias for legacy

// Init on DOM load
window.addEventListener('load', () => {
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) {
    console.error('Canvas #gameCanvas not found');
    return;
  }
  G.canvas = canvas;
  G.ctx = canvas.getContext('2d');
  if (!G.ctx) {
    console.error('Failed to get 2D context');
    return;
  }
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  // Audio init on user gesture
  document.addEventListener('click', getAudio, { once: true });

  // Wire buttons with null checks
  const wireButton = (id, handler) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  };

  wireButton('btn-play', () => {
    G.score = 0;
    G.lives = 3;
    G.level = 0;
    G.hasGun = false;
    G.hasJetpack = false;
    loadLevel(0);
    switchState('playing');
  });

  wireButton('btn-editor', () => switchState('editor'));

  wireButton('btn-menu', () => switchState('menu'));
  wireButton('btn-gomenu', () => switchState('menu'));

  wireButton('btn-retry', () => {
    G.score = 0;
    G.lives = 3;
    G.level = 0;
    G.hasGun = false;
    G.hasJetpack = false;
    loadLevel(0);
    switchState('playing');
  });

  wireButton('btn-ed-menu', () => switchState('menu'));
  wireButton('btn-ed-play', playTestLevel);
  wireButton('btn-ed-export', exportLevel);
  wireButton('btn-ed-import', () => document.getElementById('ed-import-input')?.click());
  wireButton('btn-ed-clear', () => {
    if (ED?.map) {
      ED.map = Array.from({length: ED.mapH}, () => Array(ED.mapW).fill(0));
      renderEditor();
    }
  });
  wireButton('btn-ed-fill', () => {
    if (ED?.map) {
      for (let col = 0; col < ED.mapW; col++) {
        ED.map[ED.mapH - 1][col] = 1;
        ED.map[ED.mapH - 2][col] = 1;
      }
      renderEditor();
    }
  });

  // Editor import
  const importInput = document.getElementById('ed-import-input');
  if (importInput) importInput.addEventListener('change', importLevel);

  // Editor level select
  const sel = document.getElementById('ed-level-select');
  if (sel) {
    LEVELS.forEach((l, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = l.name;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', e => {
      ED.levelIdx = parseInt(e.target.value);
      loadEditorLevel(ED.levelIdx);
    });
  }

  // Editor canvas events
  const edWrap = document.getElementById('editor-canvas-wrap');
  if (edWrap) {
    edWrap.addEventListener('mousedown', e => {
      if (ED) {
        ED.painting = true;
        ED.erasing = e.button === 2;
        editorPaint(e.clientX, e.clientY);
      }
    });
    // ... other events similarly with null checks
  }

  // Input
  document.addEventListener('keydown', e => {
    G.keys[e.code] = true;
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code) && G.state === 'playing') {
      e.preventDefault();
    }
    if (['ControlLeft','ControlRight'].includes(e.code)) e.preventDefault();
    if (e.code === 'Escape' && G.state === 'playing') {
      stopGameLoop();
      G.state = 'menu';
      switchState('menu');
    }
  });
  document.addEventListener('keyup', e => G.keys[e.code] = false);

  switchState('menu');
});

// Legacy ED object (for editor)
import('./core/EditorState.js').then(module => {
  window.ED = new module.EditorState();
}).catch(e => {
  console.error('EditorState load failed:', e);
  window.ED = {};
});

// Legacy functions (move to modules later)
function playTestLevel() { /* impl from game.js */ }
function exportLevel() { /* impl */ }
function importLevel() { /* impl */ }
function editorPaint() { /* impl */ }
function renderEditor() { /* impl */ }
// etc.

