// ═══════════════════════════════════════════════════════════════════
//  DANGEROUS GAME — Browser Clone
//  game.js — Main engine
// ═══════════════════════════════════════════════════════════════════

const TILE_SIZE = 32;   // rendered tile size (scaled from 16px original)
const CANVAS_W  = 760;
const CANVAS_H  = 320;
const COLS_VIS  = Math.ceil(CANVAS_W / TILE_SIZE); // visible tile columns
const ROWS_VIS  = Math.ceil(CANVAS_H / TILE_SIZE);

// ── Tile flag helpers ─────────────────────────────────────────────
const TF = {
  isSolid:   t => t === 1 || t === 2,
  isKill:    t => t === 3 || t === 8,
  isTrophy:  t => t === 4,
  isKey:     t => t === 5,
  isDoor:    t => t === 6,
  isGun:     t => t === 7,
  isJetpack: t => t === 14,
  isLife:    t => t === 15,
};

// ── Audio (Web Audio API) ─────────────────────────────────────────
let audioCtx = null;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, duration, type = 'square', vol = 0.15) {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch(e) {}
}
function sfxJump()    { playTone(300, 0.12, 'square', 0.1); setTimeout(()=>playTone(500, 0.08,'square',0.08),60); }
function sfxShoot()   { playTone(800, 0.05, 'sawtooth', 0.08); }
function sfxHit()     { playTone(150, 0.25, 'sawtooth', 0.18); }
function sfxCollect() { playTone(600, 0.06); setTimeout(()=>playTone(900,0.06),60); setTimeout(()=>playTone(1200,0.1),120); }
function sfxDoor()    { [400,500,600,800].forEach((f,i)=>setTimeout(()=>playTone(f,0.15),i*80)); }
function sfxDie()     { [300,250,200,150,100].forEach((f,i)=>setTimeout(()=>playTone(f,0.12,'sawtooth',0.15),i*60)); }
function sfxLevelUp() { [400,500,600,700,900,1100].forEach((f,i)=>setTimeout(()=>playTone(f,0.18),i*70)); }

// ── Sprite drawing (pixel art, no external image) ─────────────────
const SPRITES = {};
(function buildSprites() {
  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h; return c;
  }
  function px(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 1, 1);
  }

  // Janzi — 12×16 px
  function drawJanzi(ctx, frame, dir) {
    ctx.clearRect(0,0,12,16);
    if (dir === -1) { ctx.save(); ctx.scale(-1,1); ctx.translate(-12,0); }

    const b = '#4488ff', s = '#ffcc44', k = '#222', fl = '#ff6644';
    // Head
    [[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],
     [2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],
     [2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],
     [2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3]].forEach(([x,y])=>px(ctx,x,y,s));
    // Eyes
    px(ctx,4,2,k); px(ctx,7,2,k);
    // Body
    for(let y=4;y<10;y++) for(let x=2;x<10;x++) px(ctx,x,y,b);
    // Gun arm
    const ga = frame%2===0?[10,6,11,6,11,7]:[10,7,11,7,11,8];
    for(let i=0;i<ga.length;i+=2) px(ctx,ga[i],ga[i+1],'#888');
    // Legs
    if (frame===0) {
      for(let y=10;y<16;y++) { px(ctx,2,y,b); px(ctx,3,y,b); px(ctx,8,y,b); px(ctx,9,y,b); }
    } else {
      px(ctx,2,10,b);px(ctx,3,10,b);px(ctx,8,10,b);px(ctx,9,10,b);
      px(ctx,1,11,b);px(ctx,2,11,b);px(ctx,9,11,b);px(ctx,10,11,b);
      px(ctx,1,12,fl);px(ctx,2,12,fl);px(ctx,9,12,fl);px(ctx,10,12,fl);
    }
    if (dir===-1) ctx.restore();
  }

  const Janzi_FRAMES = 4;
  for (let f=0; f<Janzi_FRAMES; f++) {
    for (const d of [1,-1]) {
      const c = makeCanvas(12,16);
      drawJanzi(c.getContext('2d'), f, d);
      SPRITES[`Janzi_${f}_${d}`] = c;
    }
  }

  // Janzi dead (X eyes)
  const deadC = makeCanvas(12,16);
  const dctx = deadC.getContext('2d');
  drawJanzi(dctx, 0, 1);
  dctx.fillStyle = '#ff0000';
  dctx.fillRect(3,2,3,1); dctx.fillRect(4,1,1,3); // X left eye
  dctx.fillRect(6,2,3,1); dctx.fillRect(7,1,1,3); // X right eye
  SPRITES['Janzi_dead'] = deadC;

  // Enemy — 12×14 px green monster
  function makeEnemy(frame) {
    const c = makeCanvas(12,14);
    const ctx = c.getContext('2d');
    const g='#44cc44', dg='#228822', e='#ff0000', k='#000';
    // body
    for(let y=2;y<12;y++) for(let x=1;x<11;x++) px(ctx,x,y,g);
    // head bumps
    px(ctx,2,1,g);px(ctx,3,1,g);px(ctx,5,0,g);px(ctx,6,0,g);px(ctx,8,1,g);px(ctx,9,1,g);
    // eyes
    px(ctx,2,4,e);px(ctx,3,4,e);px(ctx,8,4,e);px(ctx,9,4,e);
    // mouth
    for(let x=3;x<9;x++) px(ctx,x,8,k);
    px(ctx,3,7,k);px(ctx,8,7,k);
    // legs
    if (frame===0) {
      for(let y=12;y<14;y++) { px(ctx,2,y,dg);px(ctx,3,y,dg);px(ctx,8,y,dg);px(ctx,9,y,dg); }
    } else {
      px(ctx,1,12,dg);px(ctx,2,12,dg);px(ctx,9,12,dg);px(ctx,10,12,dg);
      px(ctx,1,13,dg);px(ctx,2,13,dg);px(ctx,9,13,dg);px(ctx,10,13,dg);
    }
    return c;
  }
  SPRITES['enemy_0'] = makeEnemy(0);
  SPRITES['enemy_1'] = makeEnemy(1);

  // Trophy — 10×12 px gold
  const tC = makeCanvas(10,12);
  const tCtx = tC.getContext('2d');
  [[3,0],[4,0],[5,0],[6,0],
   [2,1],[3,1],[4,1],[5,1],[6,1],[7,1],
   [2,2],[7,2],[2,3],[7,3],
   [3,4],[4,4],[5,4],[6,4],
   [4,5],[5,5],[4,6],[5,6],
   [2,7],[3,7],[4,7],[5,7],[6,7],[7,7],
   [1,8],[2,8],[3,8],[4,8],[5,8],[6,8],[7,8],[8,8],
  ].forEach(([x,y])=>{ tCtx.fillStyle='#ffcc00'; tCtx.fillRect(x,y,1,1); });
  [[3,1],[4,1],[5,1],[3,2],[4,2]].forEach(([x,y])=>{ tCtx.fillStyle='#ffee88'; tCtx.fillRect(x,y,1,1); });
  SPRITES['trophy'] = tC;

  // Key — 8×10 px
  const kC = makeCanvas(8,10);
  const kCtx = kC.getContext('2d');
  [[2,0],[3,0],[4,0],[5,0],[1,1],[6,1],[1,2],[6,2],[1,3],[6,3],[2,4],[3,4],[4,4],[5,4],
   [3,5],[3,6],[3,7],[3,8],[4,7],[5,7]].forEach(([x,y])=>{ kCtx.fillStyle='#ddaa00'; kCtx.fillRect(x,y,1,1); });
  SPRITES['key'] = kC;

  // Door — 16×24 px
  const dC = makeCanvas(16,24);
  const drCtx = dC.getContext('2d');
  drCtx.fillStyle = '#663300';
  drCtx.fillRect(0,0,16,24);
  drCtx.fillStyle = '#994400';
  for(let y=2;y<22;y+=4) drCtx.fillRect(2,y,12,2);
  drCtx.fillStyle='#ffcc00'; drCtx.fillRect(11,11,2,2);
  drCtx.fillStyle='#331100'; drCtx.fillRect(0,0,1,24); drCtx.fillRect(15,0,1,24);
  SPRITES['door'] = dC;

  // Door open
  const doC = makeCanvas(16,24);
  const doCtx = doC.getContext('2d');
  doCtx.fillStyle='#001122'; doCtx.fillRect(0,0,16,24);
  doCtx.fillStyle='#002244';
  for(let y=0;y<24;y+=3) doCtx.fillRect(2,y,12,1);
  doCtx.fillStyle='#004488'; doCtx.fillRect(7,10,2,4);
  SPRITES['door_open'] = doC;

  // Gun — 10×6 px
  const gC = makeCanvas(10,6);
  const gCtx = gC.getContext('2d');
  [[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],
   [2,1],[3,1],[4,1],[2,3],[3,3],[4,3],[5,0],[6,0],[7,0],[5,1],[6,1],[7,1]
  ].forEach(([x,y])=>{ gCtx.fillStyle='#888888'; gCtx.fillRect(x,y,1,1); });
  SPRITES['gun'] = gC;

  // Jetpack — 10×14 px
  const jpC = makeCanvas(10,14);
  const jpCtx = jpC.getContext('2d');
  jpCtx.fillStyle='#4466ff';
  jpCtx.fillRect(2,0,6,10);
  jpCtx.fillStyle='#ff4400';
  jpCtx.fillRect(3,10,1,3); jpCtx.fillRect(6,10,1,3);
  jpCtx.fillStyle='#ffcc00';
  jpCtx.fillRect(3,11,1,2); jpCtx.fillRect(6,11,1,2);
  jpCtx.fillStyle='#aaccff';
  jpCtx.fillRect(4,2,2,3);
  SPRITES['jetpack'] = jpC;

  // Extra life — 8×8 heart
  const lC = makeCanvas(8,8);
  const lCtx = lC.getContext('2d');
  [[1,1],[2,1],[5,1],[6,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],
   [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],
   [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],
   [2,5],[3,5],[4,5],[5,5],[3,6],[4,6]
  ].forEach(([x,y])=>{ lCtx.fillStyle='#ff2244'; lCtx.fillRect(x,y,1,1); });
  SPRITES['life'] = lC;

  // Bullet — 4×2 px
  const bC = makeCanvas(4,2);
  const bCtx = bC.getContext('2d');
  bCtx.fillStyle='#ffff44'; bCtx.fillRect(0,0,4,2);
  SPRITES['bullet'] = bC;

  // Spike — 16×8 px
  const spC = makeCanvas(16,8);
  const spCtx = spC.getContext('2d');
  for(let i=0;i<4;i++) {
    spCtx.fillStyle='#aaaaaa';
    spCtx.beginPath();
    spCtx.moveTo(i*4+2,0); spCtx.lineTo(i*4,8); spCtx.lineTo(i*4+4,8);
    spCtx.fill();
    spCtx.fillStyle='#cccccc';
    spCtx.fillRect(i*4+1,4,2,1);
  }
  SPRITES['spike'] = spC;

  // Solid tile — 16×16 px
  function makeTile(bg, hi, sh) {
    const c = makeCanvas(16,16);
    const ctx = c.getContext('2d');
    ctx.fillStyle = bg; ctx.fillRect(0,0,16,16);
    ctx.fillStyle = hi;
    ctx.fillRect(0,0,16,1); ctx.fillRect(0,0,1,16);
    ctx.fillStyle = sh;
    ctx.fillRect(0,15,16,1); ctx.fillRect(15,0,1,16);
    return c;
  }
  SPRITES['tile_solid']  = makeTile('#5566aa','#8899cc','#334488');
  SPRITES['tile_brick']  = makeTile('#884422','#aa6644','#553311');
  SPRITES['tile_hazard'] = makeTile('#cc2200','#ff4400','#881100');

  // Stars / background particles stored separately
  SPRITES['ready'] = true;
})();

// ══════════════════════════════════════════════════════════════════
//  GAME STATE
// ══════════════════════════════════════════════════════════════════
const G = {
  canvas: null, ctx: null,
  state: 'menu',   // menu | playing | editor | gameover
  score: 0,
  hiScore: parseInt(localStorage.getItem('dd_hi') || '0'),
  lives: 3,
  level: 0,
  hasGun: false,
  hasJetpack: false,
  hasKey: false,
  trophiesLeft: 0,
  doorOpen: false,

  // Camera
  camX: 0,

  // Current level data
  map: null,
  mapW: 0, mapH: 0,
  bgColor: '#000',
  spawnX: 0, spawnY: 0,

  // Objects
  player: null,
  enemies: [],
  items: [],
  bullets: [],
  particles: [],

  // Input
  keys: {},
  invTimer: 0,    // player invincibility frames
  levelTransTimer: 0,
};

// ── Player ────────────────────────────────────────────────────────
function makePlayer(x, y) {
  return {
    x, y,
    vx: 0, vy: 0,
    w: 12, h: 16,    // logical size (pixels)
    dir: 1,
    onGround: false,
    frame: 0,
    frameTimer: 0,
    dead: false,
    jetFuel: 0,
    shooting: false,
    shootCooldown: 0,
  };
}

// ── Enemy ─────────────────────────────────────────────────────────
function makeEnemy(tx, ty) {
  return {
    x: tx * TILE_SIZE,
    y: ty * TILE_SIZE,
    vx: 1.2,
    vy: 0,
    w: 12, h: 14,
    dir: 1,
    frame: 0,
    frameTimer: 0,
    dead: false,
    deadTimer: 0,
    startX: tx * TILE_SIZE,
    patrolRange: 80,
  };
}

// ── Item ──────────────────────────────────────────────────────────
function makeItem(type, tx, ty) {
  return { type, x: tx * TILE_SIZE, y: ty * TILE_SIZE, collected: false, bobTimer: 0 };
}

// ── Bullet ────────────────────────────────────────────────────────
function makeBullet(x, y, dir) {
  return { x, y, vx: dir * 10, vy: 0, dead: false };
}

// ══════════════════════════════════════════════════════════════════
//  LEVEL LOADER
// ══════════════════════════════════════════════════════════════════
function loadLevel(idx) {
  const ld = LEVELS[idx];
  G.mapH = ld.tiles.length;
  G.mapW = ld.tiles[0].length;
  G.bgColor = ld.bgColor || '#000';

  // Deep copy tiles
  G.map = ld.tiles.map(row => [...row]);

  G.enemies = [];
  G.items = [];
  G.bullets = [];
  G.particles = [];
  G.trophiesLeft = 0;
  G.hasKey = false;
  G.doorOpen = false;
  G.hasJetpack = false;
  G.camX = 0;

  // Parse special tiles
  for (let row = 0; row < G.mapH; row++) {
    for (let col = 0; col < G.mapW; col++) {
      const t = G.map[row][col];
      if (t === 12) { // spawn
        G.spawnX = col * TILE_SIZE;
        G.spawnY = row * TILE_SIZE;
        G.map[row][col] = 0;
      } else if (t === 11) { // enemy
        G.enemies.push(makeEnemy(col, row));
        G.map[row][col] = 0;
      } else if (t === 4) {
        G.items.push(makeItem('trophy', col, row));
        G.trophiesLeft++;
        G.map[row][col] = 0;
      } else if (t === 5) {
        G.items.push(makeItem('key', col, row));
        G.map[row][col] = 0;
      } else if (t === 6) {
        G.items.push(makeItem('door', col, row));
        G.map[row][col] = 0;
      } else if (t === 7) {
        G.items.push(makeItem('gun', col, row));
        G.map[row][col] = 0;
      } else if (t === 14) {
        G.items.push(makeItem('jetpack', col, row));
        G.map[row][col] = 0;
      } else if (t === 15) {
        G.items.push(makeItem('life', col, row));
        G.map[row][col] = 0;
      }
    }
  }

  G.player = makePlayer(G.spawnX, G.spawnY);
  if (!G.hasGun) G.hasGun = false;
  G.invTimer = 0;
}

// ══════════════════════════════════════════════════════════════════
//  COLLISION HELPERS
// ══════════════════════════════════════════════════════════════════
function tileAt(px, py) {
  const col = Math.floor(px / TILE_SIZE);
  const row = Math.floor(py / TILE_SIZE);
  if (col < 0 || col >= G.mapW || row < 0 || row >= G.mapH) return 1; // treat OOB as solid
  return G.map[row][col];
}

function isSolid(px, py) { return TF.isSolid(tileAt(px, py)); }

function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
}

// ── Resolve entity movement with tile collision ───────────────────
function moveEntity(ent, gravity = true) {
  const spd = 1; // sub-step iterations
  const TS = TILE_SIZE;

  if (gravity) ent.vy = Math.min(ent.vy + 0.45, 12);

  // Horizontal
  ent.x += ent.vx;
  // Check corners
  const left  = ent.x;
  const right = ent.x + ent.w - 1;
  const top   = ent.y;
  const bot   = ent.y + ent.h - 1;

  if (ent.vx > 0 && (isSolid(right, top+2) || isSolid(right, bot-2))) {
    ent.x = Math.floor(right / TS) * TS - ent.w;
    ent.vx = 0;
  }
  if (ent.vx < 0 && (isSolid(left, top+2) || isSolid(left, bot-2))) {
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
  if (ent.vy >= 0 && (isSolid(left2+2, bot2) || isSolid(right2-2, bot2))) {
    ent.y = Math.floor(bot2 / TS) * TS - ent.h;
    ent.vy = 0;
    ent.onGround = true;
  }
  if (ent.vy < 0 && (isSolid(left2+2, top2) || isSolid(right2-2, top2))) {
    ent.y = Math.ceil(top2 / TS) * TS;
    ent.vy = 0;
  }
}

// ══════════════════════════════════════════════════════════════════
//  PLAYER UPDATE
// ══════════════════════════════════════════════════════════════════
function updatePlayer(dt) {
  const p = G.player;
  if (p.dead) return;

  const speed = 2.8;
  let moving = false;

  // Horizontal
  if (G.keys['ArrowLeft'] || G.keys['KeyA']) {
    p.vx = -speed; p.dir = -1; moving = true;
  } else if (G.keys['ArrowRight'] || G.keys['KeyD']) {
    p.vx = speed; p.dir = 1; moving = true;
  } else {
    p.vx *= 0.7;
    if (Math.abs(p.vx) < 0.1) p.vx = 0;
  }

  // Jump / jetpack
  if (G.hasJetpack && p.jetFuel > 0) {
    if (G.keys['Space'] || G.keys['ArrowUp']) {
      p.vy = -3.5;
      p.jetFuel = Math.max(0, p.jetFuel - 1.5);
      spawnParticle(p.x + p.w/2, p.y + p.h, '#ff6600', 0, 2);
    }
  } else if (G.keys['Space'] || G.keys['ArrowUp']) {
    if (p.onGround) {
      p.vy = -9;
      sfxJump();
      G.keys['Space'] = false;
      G.keys['ArrowUp'] = false;
    }
  }

  // Shoot
  if ((G.keys['ControlLeft'] || G.keys['ControlRight'] || G.keys['KeyZ']) && G.hasGun) {
    if (p.shootCooldown <= 0) {
      G.bullets.push(makeBullet(
        p.x + (p.dir === 1 ? p.w : -4),
        p.y + 5, p.dir
      ));
      sfxShoot();
      p.shootCooldown = 12;
    }
  }
  if (p.shootCooldown > 0) p.shootCooldown--;

  // Jetpack recharge when on ground
  if (p.onGround && G.hasJetpack) p.jetFuel = Math.min(100, p.jetFuel + 0.5);

  moveEntity(p);

  // Keep in map bounds
  if (p.x < 0) { p.x = 0; p.vx = 0; }
  if (p.x + p.w > G.mapW * TILE_SIZE) { p.x = G.mapW * TILE_SIZE - p.w; p.vx = 0; }

  // Camera follow
  const targetCamX = p.x - CANVAS_W / 2 + (p.w * TILE_SIZE) / 2;
  G.camX += (targetCamX - G.camX) * 0.15;
  G.camX = Math.max(0, Math.min(G.camX, G.mapW * TILE_SIZE - CANVAS_W));

  // Animation
  if (moving || !p.onGround) {
    p.frameTimer++;
    if (p.frameTimer > 6) { p.frame = (p.frame + 1) % 4; p.frameTimer = 0; }
  } else {
    p.frame = 0;
  }

  // Death tiles
  if (G.invTimer <= 0) {
    const tx = Math.floor((p.x + p.w/2) / TILE_SIZE);
    const ty = Math.floor((p.y + p.h - 1) / TILE_SIZE);
    if (TF.isKill(tileAt(p.x + p.w/2, p.y + p.h - 2))) killPlayer();
    if (TF.isKill(tileAt(p.x + p.w/2, p.y))) killPlayer();
  }

  // Fall out of world
  if (p.y > G.mapH * TILE_SIZE + 64) killPlayer();

  if (G.invTimer > 0) G.invTimer--;
}

// ══════════════════════════════════════════════════════════════════
//  ITEM PICKUP
// ══════════════════════════════════════════════════════════════════
function updateItems() {
  const p = G.player;
  if (p.dead) return;

  for (const item of G.items) {
    if (item.collected) continue;
    item.bobTimer += 0.06;

    if (!rectOverlap(p.x, p.y, p.w, p.h, item.x, item.y, TILE_SIZE, TILE_SIZE)) continue;

    item.collected = true;
    sfxCollect();

    switch(item.type) {
      case 'trophy':
        G.score += 500;
        G.trophiesLeft--;
        addScoreParticle(item.x, item.y, '+500');
        break;
      case 'key':
        G.hasKey = true;
        showMsg('KEY!');
        addScoreParticle(item.x, item.y, 'KEY!');
        break;
      case 'door':
        if (G.hasKey && G.trophiesLeft === 0) {
          sfxDoor();
          showMsg('NEXT LEVEL!');
          G.doorOpen = true;
          G.score += 1000;
          G.levelTransTimer = 120;
        } else if (!G.hasKey) {
          item.collected = false; // can't enter yet
          showMsg('NEED KEY!');
        } else {
          item.collected = false;
          showMsg(`${G.trophiesLeft} TROPHIES LEFT!`);
        }
        break;
      case 'gun':
        G.hasGun = true;
        showMsg('GUN!');
        addScoreParticle(item.x, item.y, 'GUN!');
        break;
      case 'jetpack':
        G.hasJetpack = true;
        p.jetFuel = 100;
        showMsg('JETPACK!');
        break;
      case 'life':
        G.lives++;
        showMsg('+1 UP!');
        addScoreParticle(item.x, item.y, '+1 UP!');
        break;
    }
  }
}

// ══════════════════════════════════════════════════════════════════
//  ENEMIES
// ══════════════════════════════════════════════════════════════════
function updateEnemies() {
  const p = G.player;
  const camLeft = G.camX - 100;
  const camRight = G.camX + CANVAS_W + 100;

  for (const e of G.enemies) {
    if (e.x < camLeft || e.x > camRight) continue;

    if (e.dead) {
      e.deadTimer--;
      if (e.deadTimer <= 0) e.dead = false;
      continue;
    }

    e.vx = e.dir * 1.4;
    moveEntity(e);

    if (e.vx === 0 || !e.onGround) {
      e.dir *= -1;
      e.x += e.dir * 2;
    }
    if (Math.abs(e.x - e.startX) > e.patrolRange) e.dir *= -1;

    e.frameTimer++;
    if (e.frameTimer > 8) { e.frame = (e.frame+1)%2; e.frameTimer = 0; }

    if (G.invTimer <= 0 && !p.dead &&
        rectOverlap(p.x+2, p.y+2, p.w-4, p.h-4, e.x, e.y, e.w, e.h)) {
      killPlayer();
    }
  }
}

// ══════════════════════════════════════════════════════════════════
//  BULLETS
// ══════════════════════════════════════════════════════════════════
function updateBullets() {
  for (const b of G.bullets) {
    if (b.dead) continue;
    b.x += b.vx;

    // Hit wall
    if (isSolid(b.x, b.y) || isSolid(b.x + 2, b.y) || isSolid(b.x, b.y + 2)) {
      b.dead = true;
      spawnParticle(b.x, b.y, '#ffff44', 0, 0);
      continue;
    }
    // Off screen
    if (b.x < G.camX - 32 || b.x > G.camX + CANVAS_W + 32) { b.dead = true; continue; }

    // Hit enemy
    for (const e of G.enemies) {
      if (e.dead) continue;
      if (rectOverlap(b.x, b.y, 4, 2, e.x, e.y, e.w, e.h)) {
        b.dead = true;
        e.dead = true;
        e.deadTimer = 30;
        G.score += 300;
        addScoreParticle(e.x, e.y, '+300');
        for (let i=0;i<6;i++) spawnParticle(e.x+6, e.y+7, '#44cc44', (Math.random()-0.5)*3, -Math.random()*3);
        sfxCollect();
      }
    }
  }
  // Prune
  G.bullets = G.bullets.filter(b => !b.dead);
}

// ══════════════════════════════════════════════════════════════════
//  PARTICLES
// ══════════════════════════════════════════════════════════════════
function spawnParticle(x, y, color, vx, vy) {
  G.particles.push({ x, y, vx: vx+(Math.random()-0.5)*1.5, vy: vy-Math.random()*1.5, color, life: 20+Math.random()*20, maxLife: 30 });
}
function addScoreParticle(x, y, txt) {
  G.particles.push({ x, y, vx: 0, vy: -0.8, color:'#ffcc00', life:60, maxLife:60, text:txt });
}
function updateParticles() {
  for (const p of G.particles) {
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.1;
    p.life--;
  }
  if (G.particles.length > 200) G.particles.splice(0, G.particles.length - 200);
  G.particles = G.particles.filter(p => p.life > 0);
}

// ══════════════════════════════════════════════════════════════════
//  DEATH / RESPAWN
// ══════════════════════════════════════════════════════════════════
function killPlayer() {
  if (G.invTimer > 0 || G.player.dead) return;
  sfxDie();
  G.player.dead = true;
  G.lives--;
  for (let i=0;i<12;i++) spawnParticle(G.player.x+6, G.player.y+8, '#ff4444', (Math.random()-0.5)*4, -Math.random()*4);

  setTimeout(() => {
    if (G.lives <= 0) {
      if (G.score > G.hiScore) { G.hiScore = G.score; localStorage.setItem('dd_hi', G.hiScore); }
      switchState('gameover');
    } else {
      G.player = makePlayer(G.spawnX, G.spawnY);
      G.hasGun = false;
      G.hasJetpack = false;
      G.invTimer = 120;
      showMsg('READY!');
    }
  }, 1500);
}

// ══════════════════════════════════════════════════════════════════
//  RENDER
// ══════════════════════════════════════════════════════════════════
function render() {
  const ctx = G.ctx;
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // Background
  ctx.fillStyle = G.bgColor;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Stars
  drawStars(ctx);

  const cx = Math.floor(G.camX);

  // ── Tiles ── (visible only)
  const startCol = Math.floor(cx / TILE_SIZE);
  const endCol   = startCol + COLS_VIS + 2;
  const startRow = 0;  // Fixed height, no vert scroll
  const endRow   = ROWS_VIS + 2;

  for (let row = startRow; row < endRow && row < G.mapH; row++) {
    for (let col = startCol; col <= endCol && col < G.mapW; col++) {
      if (col < 0 || col >= G.mapW) continue;
      const t = G.map[row][col];
      if (t === 0) continue;

      const sx = col * TILE_SIZE - cx;
      const sy = row * TILE_SIZE;

      if (t === 3) { // spike
        ctx.save();
        ctx.translate(sx, sy + TILE_SIZE - 8*2);
        ctx.scale(2, 2);
        ctx.drawImage(SPRITES['spike'], 0, 0);
        ctx.restore();
      } else if (t === 8) { // hazard
        ctx.save();
        ctx.translate(sx, sy);
        ctx.scale(2, 2);
        ctx.drawImage(SPRITES['tile_hazard'], 0, 0);
        ctx.restore();
      } else if (t === 2) {
        ctx.save(); ctx.translate(sx, sy); ctx.scale(2,2);
        ctx.drawImage(SPRITES['tile_brick'],0,0); ctx.restore();
      } else { // solid
        ctx.save(); ctx.translate(sx, sy); ctx.scale(2,2);
        ctx.drawImage(SPRITES['tile_solid'],0,0); ctx.restore();
      }
    }
  }

  // ── Items ──
  for (const item of G.items) {
    if (item.collected) continue;
    const sx = item.x - cx;
    if (sx < -TILE_SIZE || sx > CANVAS_W + TILE_SIZE) continue;
    const bob = Math.sin(item.bobTimer) * 3;

    ctx.save();
    const sy = item.y + bob;
    ctx.translate(sx, sy);

    switch(item.type) {
      case 'trophy':
        ctx.scale(2.8, 2.8);
        ctx.drawImage(SPRITES['trophy'], 0, 0);
        // Glow
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.abs(Math.sin(item.bobTimer)) * 0.2;
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 12;
        ctx.translate(sx, sy);
        ctx.scale(2.8,2.8); ctx.drawImage(SPRITES['trophy'],0,0);
        break;
      case 'key':
        ctx.scale(3,3); ctx.drawImage(SPRITES['key'],0,0); break;
      case 'door':
        ctx.scale(2,1.33); ctx.drawImage(SPRITES['door_open'],0,0); break;
      case 'gun':
        ctx.scale(3,3); ctx.drawImage(SPRITES['gun'],0,0); break;
      case 'jetpack':
        ctx.scale(3,2); ctx.drawImage(SPRITES['jetpack'],0,0); break;
      case 'life':
        ctx.scale(4,4); ctx.drawImage(SPRITES['life'],0,0); break;
    }
    ctx.restore();
  }

  // ── Enemies ──
  for (const e of G.enemies) {
    if (e.dead) continue;
    const sx = e.x - cx;
    if (sx < -32 || sx > CANVAS_W + 32) continue;
    ctx.save();
    ctx.translate(sx, e.y);
    if (e.dir === -1) { ctx.scale(-1,1); ctx.translate(-e.w*2, 0); }
    ctx.scale(2.2, 2.2);
    ctx.drawImage(SPRITES[`enemy_${e.frame}`], 0, 0);
    ctx.restore();
  }

  // ── Bullets ──
  for (const b of G.bullets) {
    const sx = b.x - cx;
    if (sx < -32 || sx > CANVAS_W + 32) continue;
    ctx.save();
    ctx.shadowColor='#ffff88'; ctx.shadowBlur=8;
    ctx.scale(2,2);
    ctx.drawImage(SPRITES['bullet'], Math.floor(sx/2), Math.floor(b.y/2));
    ctx.restore();
  }

  // ── Player ──
  const p = G.player;
  const psx = p.x - cx;
  if (!p.dead) {
    ctx.save();
    if (G.invTimer > 0 && Math.floor(G.invTimer/4)%2 === 0) ctx.globalAlpha = 0.3;
    ctx.translate(psx, p.y);
    if (p.dir === -1) { ctx.scale(-1,1); ctx.translate(-p.w*2.5, 0); }
    ctx.scale(2.5,2);
    ctx.drawImage(SPRITES[`Janzi_${p.frame}_1`], 0, 0);
    ctx.restore();
  } else {
    ctx.save();
    ctx.translate(psx, p.y);
    ctx.scale(2.5,2);
    ctx.drawImage(SPRITES['Janzi_dead'], 0, 0);
    ctx.restore();
  }

  // ── Particles ──
  for (const pt of G.particles) {
    if (pt.text) {
      ctx.globalAlpha = pt.life / pt.maxLife;
      ctx.fillStyle = pt.color;
      ctx.font = '7px "Press Start 2P", monospace';
      ctx.fillText(pt.text, pt.x - cx, pt.y);
      ctx.globalAlpha = 1;
    } else {
      ctx.globalAlpha = pt.life / pt.maxLife;
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.floor(pt.x - cx), Math.floor(pt.y), 3, 3);
      ctx.globalAlpha = 1;
    }
  }

  updateHUD();
}

// ── Static star field ─────────────────────────────────────────────
const STARS = Array.from({length:60}, ()=>({
  x: Math.random()*CANVAS_W, y: Math.random()*CANVAS_H,
  r: Math.random()*1.5+0.5, a: Math.random()*0.7+0.1,
  parallax: Math.random()*0.3
}));

function drawStars(ctx) {
  for (const s of STARS) {
    const sx = ((s.x - G.camX * s.parallax) % CANVAS_W + CANVAS_W) % CANVAS_W;
    ctx.globalAlpha = s.a;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx, s.y, s.r, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── HUD update ────────────────────────────────────────────────────
function updateHUD() {
  document.getElementById('hud-score').textContent   = String(G.score).padStart(7,'0');
  document.getElementById('hud-hi').textContent      = String(G.hiScore).padStart(7,'0');
  document.getElementById('hud-lives').textContent   = '♥'.repeat(Math.max(0,G.lives));
  document.getElementById('hud-level').textContent   = LEVELS[G.level].name;
  document.getElementById('hud-trophy').textContent  = G.trophiesLeft;
  document.getElementById('hud-gun').textContent     = G.hasGun ? 'YES' : 'NO';
  document.getElementById('hud-key').textContent     = G.hasKey ? 'YES' : 'NO';
}

// ══════════════════════════════════════════════════════════════════
//  MESSAGE OVERLAY
// ══════════════════════════════════════════════════════════════════
function showMsg(txt, duration=90) {
  G.msgText = txt;
  G.msgTimer = duration;
  const el = document.getElementById('msg-overlay');
  el.textContent = txt;
  el.classList.add('visible');
}
function clearMsg() {
  G.msgText = '';
  G.msgTimer = 0;
  document.getElementById('msg-overlay').classList.remove('visible');
}

// ══════════════════════════════════════════════════════════════════
//  MAIN LOOP
// ══════════════════════════════════════════════════════════════════
function gameLoop(ts) {
  if (G.state !== 'playing') return;
  G.animFrame = requestAnimationFrame(gameLoop);

  const dt = Math.min((ts - G.lastTime) / 16.67, 3);
  G.lastTime = ts;
  G.frameCount++;

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
        // Completed all levels!
        G.level = 0;
        if (G.score > G.hiScore) { G.hiScore = G.score; localStorage.setItem('dd_hi', G.hiScore); }
        switchState('gameover');
        return;
      }
      sfxLevelUp();
      loadLevel(G.level);
      showMsg(LEVELS[G.level].name, 120);
    }
  }

  render();
}

// ══════════════════════════════════════════════════════════════════
//  STATE MANAGEMENT
// ══════════════════════════════════════════════════════════════════
function switchState(state) {
  cancelAnimationFrame(G.animFrame);
  G.state = state;

  document.querySelectorAll('[id^="screen-"]').forEach(s => s.classList.remove('active'));

  if (state === 'menu') {
    document.getElementById('screen-menu').classList.add('active');
    document.getElementById('menu-hi').innerHTML = `HI-SCORE: <span>${String(G.hiScore).padStart(7,'0')}</span>`;
  } else if (state === 'playing') {
    document.getElementById('screen-game').classList.add('active');
    G.lastTime = performance.now();
    showMsg(LEVELS[G.level].name, 120);
    G.animFrame = requestAnimationFrame(gameLoop);
  } else if (state === 'editor') {
    document.getElementById('screen-editor').classList.add('active');
    initEditor();
  } else if (state === 'gameover') {
    document.getElementById('screen-gameover').classList.add('active');
    document.getElementById('go-score').textContent = String(G.score).padStart(7,'0');
    document.getElementById('go-hi').textContent    = String(G.hiScore).padStart(7,'0');
  }
}

// ══════════════════════════════════════════════════════════════════
//  LEVEL EDITOR
// ══════════════════════════════════════════════════════════════════
let ED = {
  levelIdx: 0,
  selectedTile: 1,
  painting: false,
  erasing: false,
  zoom: 2,
  map: null,
  mapW: 0,
  mapH: 0,
  canvas: null,
  ctx: null,
};

const TILE_NAMES = {
  0:'Empty', 1:'Ground', 2:'Brick', 3:'Spike', 4:'Trophy', 5:'Key',
  6:'Door', 7:'Gun', 8:'Lava', 9:'Ladder', 10:'Platform', 11:'Enemy',
  12:'Spawn', 14:'Jetpack', 15:'Life'
};

const TILE_COLORS = {
  0:'#000', 1:'#5566aa', 2:'#884422', 3:'#888888', 4:'#ffcc00',
  5:'#ddaa00', 6:'#663300', 7:'#888888', 8:'#cc2200', 9:'#226622',
  10:'#445544', 11:'#44cc44', 12:'#00aaff', 14:'#4466ff', 15:'#ff2244'
};

function initEditor() {
  ED.canvas = document.getElementById('editorCanvas');
  ED.ctx = ED.canvas.getContext('2d');
  ED.levelIdx = 0;
  loadEditorLevel(0);
  buildPalette();
  renderEditor();
}

function loadEditorLevel(idx) {
  const ld = LEVELS[idx];
  ED.mapH = ld.tiles.length;
  ED.mapW = ld.tiles[0].length;
  ED.map = ld.tiles.map(r => [...r]);
  ED.canvas.width  = ED.mapW * TILE_SIZE;
  ED.canvas.height = ED.mapH * TILE_SIZE;
  renderEditor();
}

function buildPalette() {
  const pal = document.getElementById('tile-palette');
  pal.innerHTML = '';
  const tileList = [0,1,2,3,4,5,6,7,8,11,12,14,15];
  for (const tid of tileList) {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    c.title = TILE_NAMES[tid] || tid;
    const ctx = c.getContext('2d');
    ctx.fillStyle = TILE_COLORS[tid] || '#333';
    ctx.fillRect(0,0,32,32);
    ctx.fillStyle = '#ffffff44';
    ctx.font = '7px monospace';
    ctx.fillText(TILE_NAMES[tid]?.slice(0,3) || tid, 2, 22);
    c.className = 'tile-btn' + (tid === ED.selectedTile ? ' selected' : '');
    c.addEventListener('click', () => {
      ED.selectedTile = tid;
      document.querySelectorAll('.tile-btn').forEach(b => b.classList.remove('selected'));
      c.classList.add('selected');
    });
    pal.appendChild(c);
  }
}

function renderEditor() {
  if (!ED.ctx) return;
  const ctx = ED.ctx;
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,ED.canvas.width, ED.canvas.height);

  for (let row=0; row<ED.mapH; row++) {
    for (let col=0; col<ED.mapW; col++) {
      const t = ED.map[row][col];
      const x = col * TILE_SIZE;
      const y = row * TILE_SIZE;
      ctx.fillStyle = TILE_COLORS[t] || '#111';
      ctx.fillRect(x,y,TILE_SIZE,TILE_SIZE);
      ctx.strokeStyle = '#1a1a2e';
      ctx.strokeRect(x,y,TILE_SIZE,TILE_SIZE);
      if (t !== 0) {
        ctx.fillStyle = '#ffffff33';
        ctx.font = '7px monospace';
        ctx.fillText(t, x+2, y+12);
      }
    }
  }
}

function editorPaint(ex, ey) {
  const rect = ED.canvas.getBoundingClientRect();
  const scaleX = ED.canvas.width / rect.width;
  const scaleY = ED.canvas.height / rect.height;
  const x = (ex - rect.left) * scaleX;
  const y = (ey - rect.top)  * scaleY;
  const col = Math.floor(x / TILE_SIZE);
  const row = Math.floor(y / TILE_SIZE);
  if (col >= 0 && col < ED.mapW && row >= 0 && row < ED.mapH) {
    ED.map[row][col] = ED.erasing ? 0 : ED.selectedTile;
    renderEditor();
    document.getElementById('ed-coords').textContent = `Col:${col} Row:${row} Tile:${TILE_NAMES[ED.map[row][col]]||ED.map[row][col]}`;
  }
}

function exportLevel() {
  const json = JSON.stringify({
    name: LEVELS[ED.levelIdx].name,
    width: ED.mapW, height: ED.mapH,
    tiles: ED.map
  }, null, 2);
  const blob = new Blob([json], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `level_${ED.levelIdx+1}.json`;
  a.click();
}

function importLevel(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      LEVELS[ED.levelIdx].tiles = data.tiles;
      LEVELS[ED.levelIdx].name  = data.name || LEVELS[ED.levelIdx].name;
      loadEditorLevel(ED.levelIdx);
    } catch(err) { alert('Invalid JSON'); }
  };
  reader.readAsText(file);
}

function playTestLevel() {
  // Patch current editor map into the game
  LEVELS[ED.levelIdx].tiles = ED.map.map(r=>[...r]);
  G.level = ED.levelIdx;
  G.score = 0; G.lives = 3; G.hasGun = false; G.hasJetpack = false;
  loadLevel(G.level);
  switchState('playing');
}

// ══════════════════════════════════════════════════════════════════
//  INPUT
// ══════════════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
  G.keys[e.code] = true;
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
    if (G.state === 'playing') e.preventDefault();
  }
  if (e.code === 'ControlLeft' || e.code === 'ControlRight') e.preventDefault();
  if (e.code === 'Escape' && G.state === 'playing') {
    cancelAnimationFrame(G.animFrame);
    G.state = 'menu';
    switchState('menu');
  }
});
document.addEventListener('keyup', e => { G.keys[e.code] = false; });

// ══════════════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════════════
window.addEventListener('load', () => {
  G.canvas = document.getElementById('gameCanvas');
  G.ctx = G.canvas.getContext('2d');
  G.canvas.width  = CANVAS_W;
  G.canvas.height = CANVAS_H;

  // ── Button wiring ──
  document.getElementById('btn-play').addEventListener('click', () => {
    G.score = 0; G.lives = 3; G.level = 0; G.hasGun = false; G.hasJetpack = false;
    loadLevel(0);
    switchState('playing');
  });
  document.getElementById('btn-editor').addEventListener('click', () => switchState('editor'));
  document.getElementById('btn-menu').addEventListener('click', () => switchState('menu'));
  document.getElementById('btn-gomenu').addEventListener('click', () => switchState('menu'));
  document.getElementById('btn-retry').addEventListener('click', () => {
    G.score = 0; G.lives = 3; G.level = 0; G.hasGun = false; G.hasJetpack = false;
    loadLevel(0);
    switchState('playing');
  });
  document.getElementById('btn-ed-menu').addEventListener('click', () => switchState('menu'));
  document.getElementById('btn-ed-play').addEventListener('click', playTestLevel);
  document.getElementById('btn-ed-export').addEventListener('click', exportLevel);
  document.getElementById('btn-ed-import').addEventListener('click', () => {
    document.getElementById('ed-import-input').click();
  });
  document.getElementById('ed-import-input').addEventListener('change', importLevel);
  document.getElementById('btn-ed-clear').addEventListener('click', () => {
    ED.map = Array.from({length:ED.mapH}, () => Array(ED.mapW).fill(0));
    renderEditor();
  });
  document.getElementById('btn-ed-fill').addEventListener('click', () => {
    // Fill bottom 2 rows with ground
    for (let col=0;col<ED.mapW;col++) {
      ED.map[ED.mapH-1][col] = 1;
      ED.map[ED.mapH-2][col] = 1;
    }
    renderEditor();
  });

  // Level selector in editor
  const sel = document.getElementById('ed-level-select');
  LEVELS.forEach((l,i) => {
    const opt = document.createElement('option');
    opt.value = i; opt.textContent = l.name;
    sel.appendChild(opt);
  });
  sel.addEventListener('change', e => {
    ED.levelIdx = parseInt(e.target.value);
    loadEditorLevel(ED.levelIdx);
  });

  // Editor canvas events
  const edWrap = document.getElementById('editor-canvas-wrap');
  edWrap.addEventListener('mousedown', e => {
    ED.painting = true;
    ED.erasing = e.button === 2;
    editorPaint(e.clientX, e.clientY);
  });
  edWrap.addEventListener('mousemove', e => {
    if (ED.painting) editorPaint(e.clientX, e.clientY);
  });
  edWrap.addEventListener('mouseup', () => { ED.painting = false; });
  edWrap.addEventListener('mouseleave', () => { ED.painting = false; });
  edWrap.addEventListener('contextmenu', e => { e.preventDefault(); ED.erasing=true; editorPaint(e.clientX,e.clientY); return false; });

  switchState('menu');
});
