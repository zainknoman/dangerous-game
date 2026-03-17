// entities/Player.js
import { moveEntity } from '../core/physics.js';
import { G } from '../gameState.js';
import { makeBullet, spawnParticle, sfxJump, sfxShoot } from '../gameState.js';  // Temp global

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.w = 12;
    this.h = 16;
    this.dir = 1;
    this.onGround = false;
    this.frame = 0;
    this.frameTimer = 0;
    this.dead = false;
    this.jetFuel = 0;
    this.shootCooldown = 0;
  }

  update(dt) {
    if (this.dead) return;

    const speed = 2.8;
    let moving = false;

    if (G.keys['ArrowLeft'] || G.keys['KeyA']) {
      this.vx = -speed;
      this.dir = -1;
      moving = true;
    } else if (G.keys['ArrowRight'] || G.keys['KeyD']) {
      this.vx = speed;
      this.dir = 1;
      moving = true;
    } else {
      this.vx *= 0.7;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    if (G.hasJetpack && this.jetFuel > 0) {
      if (G.keys['Space'] || G.keys['ArrowUp']) {
        this.vy = -3.5;
        this.jetFuel = Math.max(0, this.jetFuel - 1.5);
        spawnParticle(this.x + this.w / 2, this.y + this.h, '#ff6600', 0, 2);
      }
    } else if (G.keys['Space'] || G.keys['ArrowUp']) {
      if (this.onGround) {
        this.vy = -9;
        sfxJump();
        G.keys['Space'] = false;
        G.keys['ArrowUp'] = false;
      }
    }

    if ((G.keys['ControlLeft'] || G.keys['ControlRight'] || G.keys['KeyZ']) && G.hasGun) {
      if (this.shootCooldown <= 0) {
        G.bullets.push(makeBullet(
          this.x + (this.dir === 1 ? this.w : -4),
          this.y + 5, this.dir
        ));
        sfxShoot();
        this.shootCooldown = 12;
      }
    }
    if (this.shootCooldown > 0) this.shootCooldown--;

    if (this.onGround && G.hasJetpack) this.jetFuel = Math.min(100, this.jetFuel + 0.5);

    moveEntity(this);

    if (this.x < 0) { this.x = 0; this.vx = 0; }
    if (this.x + this.w > G.mapW * TILE_SIZE) { this.x = G.mapW * TILE_SIZE - this.w; this.vx = 0; }

    const targetCamX = this.x - CANVAS_W / 2 + (this.w * TILE_SIZE) / 2;
    G.camX += (targetCamX - G.camX) * 0.15;
    G.camX = Math.max(0, Math.min(G.camX, G.mapW * TILE_SIZE - CANVAS_W));

    if (moving || !this.onGround) {
      this.frameTimer++;
      if (this.frameTimer > 6) {
        this.frame = (this.frame + 1) % 4;
        this.frameTimer = 0;
      }
    } else {
      this.frame = 0;
    }

    if (G.invTimer <= 0) {
      if (isKill(tileAt(this.x + this.w / 2, this.y + this.h - 2))) killPlayer();
      if (isKill(tileAt(this.x + this.w / 2, this.y))) killPlayer();
    }

    if (this.y > G.mapH * TILE_SIZE + 64) killPlayer();

    if (G.invTimer > 0) G.invTimer--;
  }
}

