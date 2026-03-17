// entities/Enemy.js - Standard & Custom Enemies
import { moveEntity } from '../core/physics.js';
import { G, makeBullet, spawnParticle, sfxCollect, addScoreParticle } from '../gameState.js';  // Temp
import { CANVAS_W } from '../config/constants.js';

export class Enemy {
  constructor(tx, ty, customData = null) {
    this.x = tx * TILE_SIZE;
  this.y = ty * TILE_SIZE - (this.behavior === 'flying' ? 0 : 2 * TILE_SIZE);  // Ground settle
    this.vx = 1.2;
    this.vy = 0;
    this.w = 12;
    this.h = 14;
    this.dir = 1;
    this.frame = 0;
    this.frameTimer = 0;
    this.dead = false;
    this.deadTimer = 0;
    this.startX = tx * TILE_SIZE;
    this.patrolRange = customData?.patrolRange || 80;
    this.tileId = customData?.tileId || null;
    this.behavior = customData?.behavior || 'patrol';
    this.speed = customData?.speed || 1.4;
    this.scoreVal = customData?.score || 300;
    this.jumpTimer = 50;
  }

  update() {
    if (this.dead) {
      this.deadTimer--;
      return;
    }

    // Offscreen culling
    const camLeft = G.camX - 100;
    const camRight = G.camX + CANVAS_W + 100;
    if (this.x < camLeft || this.x > camRight) return;

    const spd = this.speed;

    switch (this.behavior) {
      case 'flying':
        this.x += this.dir * spd;
        this.y += Math.sin(Date.now() * 0.003 + this.startX * 0.01) * 0.7;
        if (Math.abs(this.x - this.startX) > this.patrolRange) this.dir *= -1;
        break;
      case 'jumper':
        const prevVx = this.vx;
        this.vx = this.dir * spd;
        moveEntity(this);
        if (this.vx === 0 && prevVx !== 0) {
          this.dir *= -1;
          this.x += this.dir * 4;
        }
        if (Math.abs(this.x - this.startX) > this.patrolRange) {
          this.dir *= -1;
          this.x += this.dir * 4;
        }
        if (this.onGround) {
          this.jumpTimer--;
          if (this.jumpTimer <= 0) {
            this.vy = -8.5;
            this.jumpTimer = 50 + Math.floor(Math.random() * 40);
          }
        }
        break;
      default:  // patrol/fast
        const prevx = this.vx;
        this.vx = this.dir * spd;
        moveEntity(this);
        if (this.vx === 0 && prevx !== 0) {
          this.dir *= -1;
          this.x += this.dir * 4;
        }
        if (Math.abs(this.x - this.startX) > this.patrolRange) {
          this.dir *= -1;
          this.x += this.dir * 4;
        }
    }

    this.frameTimer++;
    const rate = this.behavior === 'fast' ? 4 : 8;
    if (this.frameTimer > rate) {
      this.frame = (this.frame + 1) % 2;
      this.frameTimer = 0;
    }
  }

  hitByBullet(bullet) {
    bullet.dead = true;
    this.dead = true;
    this.deadTimer = 30;
    const pts = this.scoreVal;
    G.score += pts;
    addScoreParticle(this.x, this.y, '+' + pts);
    const pc = this.tileId ? TILE_COLORS[this.tileId] || '#44cc44' : '#44cc44';
    for (let i = 0; i < 6; i++) {
      spawnParticle(this.x + 6, this.y + 7, pc, (Math.random() - 0.5) * 3, -Math.random() * 3);
    }
    sfxCollect();
  }
}

