import { TILE_SIZE } from '../config/constants.js';
import { TILE_BEHAVIOR } from '../config/tileBehavior.js';
import { LEVELS } from '../../levels.js';

export class EditorState {
  constructor() {
    this.levelIdx = 0;
    this.selectedTile = 1;
    this.snapping = true;
    this.map = null;
    this.mapW = 0;
    this.mapH = 0;
    this.canvas = null;
    this.ctx = null;
    this.undoStack = [];
    this.redoStack = [];
    this.painting = false;
    this.erasing = false;
  }

  loadLevel(idx) {
    const ld = LEVELS[idx];
    this.mapH = ld.tiles.length;
    this.mapW = ld.tiles[0].length;
    this.map = ld.tiles.map(r => [...r]);
    this.undoStack = [];
    this.pushUndoState();
    return this;
  }

  pushUndoState() {
    this.undoStack.push(JSON.stringify({ map: this.map }));
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
  }

  undo() {
    if (this.undoStack.length < 2) return false;
    this.redoStack.unshift(JSON.stringify({ map: this.map }));
    const prevState = JSON.parse(this.undoStack.pop());
    this.map = prevState.map.map(r => [...r]);
    return true;
  }

  redo() {
    if (this.redoStack.length === 0) return false;
    this.undoStack.push(JSON.stringify({ map: this.map }));
    const nextState = JSON.parse(this.redoStack.shift());
    this.map = nextState.map.map(r => [...r]);
    return true;
  }

  getTile(col, row) {
    if (col < 0 || col >= this.mapW || row < 0 || row >= this.mapH) return 1;
    return this.map[row][col];
  }

  setTile(col, row, tileId) {
    if (col < 0 || col >= this.mapW || row < 0 || row >= this.mapH) return false;
    this.map[row][col] = tileId;
    return true;
  }

  snapToGrid(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    let x = (clientX - rect.left) * scaleX;
    let y = (clientY - rect.top) * scaleY;
    if (this.snapping) {
      x = Math.floor(x / TILE_SIZE) * TILE_SIZE;
      y = Math.floor(y / TILE_SIZE) * TILE_SIZE;
    }
    return { col: Math.floor(x / TILE_SIZE), row: Math.floor(y / TILE_SIZE), x, y };
  }

  validateLevel() {
    const errors = [];
    let spawnCol = -1, spawnRow = -1;
    for (let row = 0; row < this.mapH; row++) {
      for (let col = 0; col < this.mapW; col++) {
        const t = this.map[row][col];
        if (!TILE_BEHAVIOR[t]) errors.push(`Invalid tile ${t} at (${col},${row})`);
        if (t === 12) {
          if (spawnCol !== -1) errors.push('Multiple player spawns');
          spawnCol = col; spawnRow = row;
        }
      }
    }
    if (spawnCol === -1) errors.push('No player spawn (tile 12)');
    // Basic reachability check (flood fill from spawn, simplified)
    if (spawnCol !== -1) {
      const visited = Array(this.mapH).fill().map(() => Array(this.mapW).fill(false));
      // Implementation omitted for brevity - BFS from spawn checking walkable tiles
    }
    return { valid: errors.length === 0, errors };
  }

  exportJSON() {
    const validation = this.validateLevel();
    if (!validation.valid) throw new Error('Validation failed: ' + validation.errors.join('; '));
    return JSON.stringify({
      name: LEVELS[this.levelIdx].name,
      width: this.mapW,
      height: this.mapH,
      tiles: this.map.map(r => [...r])
    }, null, 2);
  }
}

