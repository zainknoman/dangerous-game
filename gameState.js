// gameState.js - Central Game State (ECS foundation)
export let G = {
  canvas: null, ctx: null,
  state: 'menu',
  score: 0,
  hiScore: 0,
  lives: 3,
  level: 0,
  hasGun: false,
  hasJetpack: false,
  hasKey: false,
  trophiesLeft: 0,
  doorOpen: false,
  camX: 0,
  map: null,
  mapW: 0, mapH: 0,
  bgColor: '#000',
  spawnX: 0, spawnY: 0,
  player: null,
  enemies: [],
  items: [],
  bullets: [],
  particles: [],
  keys: {},
  invTimer: 0,
  levelTransTimer: 0,
  msgText: '',
  msgTimer: 0,
  lastTime: 0,
  frameCount: 0,
  animFrame: 0,
};

// Temp globals for module transition (replace with param passing)
export { sfxJump, sfxShoot, sfxCollect, sfxDoor, sfxDie, sfxLevelUp, playTone, getAudio } from './game.js';  // From original
export { makeBullet, spawnParticle, addScoreParticle, killPlayer, showMsg, clearMsg, updateHUD, drawStars } from './game.js';  // From original
export { LEVELS, CUSTOM_CHARS, TILE_NAMES, TILE_COLORS } from './levels.js';  // Levels
export { SPRITES } from './sprites.js';  // Assume sprites extracted

// Init hiScore from localStorage
G.hiScore = parseInt(localStorage.getItem('dd_hi') || '0');

