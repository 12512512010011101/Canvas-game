// js/enemy/boss.js
window.G = window.G || {};
G.enemy = G.enemy || {};

class Boss extends G.enemy.Enemy {
  constructor(x, y, waveNumber) {
    const mult = 1 + waveNumber * 0.15;
super(x, y, {
  radius: 22,
  speed: 55,
  hp: Math.round(1650 * mult),   // sedikit lebih tebal (dulu 1400)
  damage: Math.round(16 * mult), // dikit lebih sakit (dulu 14)
  expReward: 120,
  color: '#d35400',
  type: 'boss',
  attackCooldown: 1.2
});
    this.phaseTimer = 0;
    this.slamCooldown = 0;

    this.frameIndex = 0;
    this.frameTimer = 0;
    this.attackFlashTimer = 0; // >0 = lagi nampilin pose nyerang (row attackRow)
  }

  update(dt, player, spawnProjectile, onPlayerDamage) {
    super.update(dt, player);
    this.phaseTimer += dt;
    if (this.slamCooldown > 0) this.slamCooldown -= dt;
    if (this.attackFlashTimer > 0) this.attackFlashTimer -= dt;

    this.frameTimer += dt;
    if (this.frameTimer >= 0.15) {
      this.frameTimer = 0;
      const sheet = G.CONST.BOSS_SHEET;
      this.frameIndex = (this.frameIndex + 1) % sheet.cols;
    }

    if (this.controlTimer > 0) return;

    G.enemy.ai.chase(this, player, this.getSpeed(), dt);
    this.tryAttackPlayer(player, onPlayerDamage);

    // setiap 3 detik, tembak 4 proyektil menyebar (pola serangan kedua)
    if (this.slamCooldown <= 0) {
      this.slamCooldown = 3;
      this.attackFlashTimer = 0.6; // tampilin pose nyerang sebentar pas nembak
      for (let i = 0; i < 4; i++) {
        const ang = (Math.PI * 2 * i) / 4 + this.phaseTimer;
        spawnProjectile({
          x: this.x, y: this.y,
          vx: Math.cos(ang) * 140, vy: Math.sin(ang) * 140,
          damage: Math.round(this.damage * 0.6 * this.atkDebuffMult),
          owner: 'enemy',
          radius: 5
        });
      }
    }
  }

  drawShape(ctx, screen) {
    const img = G.enemy.sprites && G.enemy.sprites.boss;
    if (!img) {
      super.drawShape(ctx, screen);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('BOSS', screen.x, screen.y - this.radius - 14);
      return;
    }

    const sheet = G.CONST.BOSS_SHEET;
    const row = this.attackFlashTimer > 0 ? sheet.attackRow : sheet.idleRow;
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

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BOSS', screen.x, screen.y - drawH / 2 - 12);
  }
}

G.enemy.Boss = Boss;
