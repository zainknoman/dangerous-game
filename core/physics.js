// core/physics.js - Movement & Collision
import { TILE_SIZE } from '../config/constants.js';
import { isSolid } from '../config/tileBehavior.js';
import { G } from '../gameState.js';  // Global game state

export function tileAt(px, py, map) {
  const col = Math.floor(px / TILE_SIZE);
  const row = Math.floor(py / TILE_SIZE);
  if (col < 0 || col >= map.mapW || row < 0 || row >= map.mapH) return 1;
  return map.map[row][col];
}

export function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function moveEntity(ent, gravity = true, map = G) {
  const TS = TILE_SIZE;

  if (gravity) ent.vy = Math.min(ent.vy + 0.45, 12);

  // Horizontal
  ent.x += ent.vx;
  const left  = ent.x;
  const right = ent.x + ent.w - 1;
  const top   = ent.y;
  const bot   = ent.y + ent.h - 1;

  if (ent.vx > 0 && (isSolid(tileAt(right, top + 2, map)) || isSolid(tileAt(right, bot - 2, map)))) {
    ent.x = Math.floor(right / TS) * TS - ent.w;
    ent.vx = 0;
  }
  if (ent.vx < 0 && (isSolid(tileAt(left, top + 2, map)) || isSolid(tileAt(left, bot - 2, map)))) {
    ent.x = Math.ceil(left / TS) * TS;
    ent.vx = 0;
  }

  // Vertical
  ent.y += ent.vy;
  const left2  = ent.x;
  const right2 = ent.x + ent.w - 1;
  const top2   = ent.y;
  const bot2   = ent.y + ent.h - 1;

  ent.onGround = false;
  if (ent.vy >= 0 && (isSolid(tileAt(left2 + 2, bot2, map)) || isSolid(tileAt(right2 - 2, bot2, map)))) {
    ent.y = Math.floor(bot2 / TS) * TS - ent.h;
    ent.vy = 0;
    ent.onGround = true;
  }
  if (ent.vy < 0 && (isSolid(tileAt(left2 + 2, top2, map)) || isSolid(tileAt(right2 - 2, top2, map)))) {
    ent.y = Math.ceil(top2 / TS) * TS;
    ent.vy = 0;
  }
}

