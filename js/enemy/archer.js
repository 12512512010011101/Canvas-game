// js/enemy/archer.js
window.G = window.G || {};
G.enemy = G.enemy || {};

class Archer extends G.enemy.Enemy {
  constructor(x, y, hpMult = 0.5, dmgMult = 1) {
    super(x, y, {
      radius: 11,
      speed: 60,
      hp: Math.round(12 * hpMult),   // sedikit lebih tebal (dulu 10)
      damage: Math.round(4 * dmgMult), // dikit lebih sakit (dulu 3)
      expReward: 5,
      color: '#8e44ad', // fallback kalau sprite gagal load
      type: 'archer',
      attackCooldown: 1.6
    });
    this.preferredDist = 160;
    this.frameIndex = 0;
    this.frameTimer = 0;
  }

  update(dt, player, spawnProjectile) {
    super.update(dt, player);

    if (this.controlTimer > 0) return;

    G.enemy.ai.keepDistance(this, player, this.preferredDist, this.getSpeed(), dt);

    const dist = G.utils.math.distance(this.x, this.y, player.x, player.y);
    if (dist < 260 && this.attackTimer <= 0) {
      this.attackTimer = this.attackCooldown;
      const dir = G.utils.math.normalize(player.x - this.x, player.y - this.y);
      spawnProjectile({
        x: this.x, y: this.y,
        vx: dir.x * 180, vy: dir.y * 180,
        damage: this.damage * this.atkDebuffMult,
        owner: 'enemy',
        radius: 4
      });
    }

    this.frameTimer += dt;
    if (this.frameTimer >= 0.18) {
      this.frameTimer = 0;
      const sheet = G.CONST.ARCHER_SHEET;
      this.frameIndex = (this.frameIndex + 1) % sheet.cols;
    }
  }

  drawShape(ctx, screen) {
    const img = G.enemy.sprites && G.enemy.sprites.archer;
    if (!img) { super.drawShape(ctx, screen); return; }

    const sheet = G.CONST.ARCHER_SHEET;
    const row = sheet.walkRow;
    const fx = this.frameIndex * sheet.frameW;
    const fy = row * sheet.frameH;
    const drawH = sheet.drawHeight;
    const drawW = drawH * (sheet.frameW / sheet.frameH);

    ctx.save();
    if (this.hitFlash > 0) {
      ctx.filter = 'brightness(2) saturate(0)';
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      img,
      fx, fy, sheet.frameW, sheet.frameH,
      Math.round(screen.x - drawW / 2), Math.round(screen.y - drawH / 2),
      drawW, drawH
    );
    ctx.restore();
  }
}

G.enemy.Archer = Archer;