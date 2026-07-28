// js/enemy/boss.js
window.G = window.G || {};
G.enemy = G.enemy || {};

class Boss extends G.enemy.Enemy {
  constructor(x, y, waveNumber) {
    const mult = 1 + waveNumber * 0.15;
    super(x, y, {
      radius: 22,
      speed: 55,
      hp: Math.round(1400 * mult),
      damage: Math.round(14 * mult),
      expReward: 120,
      color: '#d35400',
      type: 'boss',
      attackCooldown: 1.2
    });
    this.phaseTimer = 0;
    this.slamCooldown = 0;
  }

  update(dt, player, spawnProjectile, onPlayerDamage) {
    super.update(dt, player);
    this.phaseTimer += dt;
    if (this.slamCooldown > 0) this.slamCooldown -= dt;

    if (this.controlTimer > 0) return;

    G.enemy.ai.chase(this, player, this.getSpeed(), dt);
    this.tryAttackPlayer(player, onPlayerDamage);

    // setiap 3 detik, tembak 4 proyektil menyebar (pola serangan kedua)
    if (this.slamCooldown <= 0) {
      this.slamCooldown = 3;
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
    super.drawShape(ctx, screen);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BOSS', screen.x, screen.y - this.radius - 14);
  }
}

G.enemy.Boss = Boss;
