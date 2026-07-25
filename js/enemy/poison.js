// js/enemy/poison.js
window.G = window.G || {};
G.enemy = G.enemy || {};

class PoisonEnemy extends G.enemy.Enemy {
  constructor(x, y, hpMult = 2, dmgMult = 1) {
    super(x, y, {
      radius: 11,
      speed: 80,
      hp: Math.round(30 * hpMult),
      damage: Math.round(5 * dmgMult), // damage kontak langsung dibikin kecil, racunnya yang berbahaya
      expReward: 5,
      color: '#e67e22', // oranye, sesuai request
      type: 'poison',
      attackCooldown: 1
    });
    this.poisonDamage = Math.max(3, Math.round(2 * dmgMult));
    this.poisonDuration = 10; // detik racun aktif di player
    this.frameIndex = 0;
    this.frameTimer = 0;
  }

  update(dt, player, onPlayerDamage) {
    super.update(dt, player);
    G.enemy.ai.chase(this, player, this.speed, dt);
    this.tryAttackPlayer(player, onPlayerDamage);

    this.frameTimer += dt;
    if (this.frameTimer >= 0.25) {
      this.frameTimer = 0;
      this.frameIndex = this.frameIndex === 0 ? 1 : 0;
    }
  }

  // override: selain damage kontak, juga nempelin status racun ke player
  tryAttackPlayer(player, onDamage) {
    const dist = G.utils.math.distance(this.x, this.y, player.x, player.y);
    if (dist < this.radius + player.radius + 4 && this.attackTimer <= 0) {
      const dealt = player.takeDamage(this.damage);
      player.applyPoison(this.poisonDamage, this.poisonDuration);
      this.attackTimer = this.attackCooldown;
      if (onDamage) onDamage(dealt, false, true); // argumen ke-3: kena racun
    }
  }

  drawShape(ctx, screen) {
    const img = G.enemy.sprites && G.enemy.sprites.witch;
    if (!img) { super.drawShape(ctx, screen); return; }

    const sheet = G.CONST.WITCH_SHEET;
    const f = sheet.frames[this.frameIndex] || sheet.frames[0];
    const drawH = sheet.drawHeight;
    const drawW = drawH * (f.w / f.h);

    ctx.save();
    if (this.hitFlash > 0) {
      ctx.filter = 'brightness(2) saturate(0)';
    }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      img,
      f.x, f.y, f.w, f.h,
      Math.round(screen.x - drawW / 2), Math.round(screen.y - drawH / 2),
      drawW, drawH
    );
    ctx.restore();
  }
}

G.enemy.PoisonEnemy = PoisonEnemy;