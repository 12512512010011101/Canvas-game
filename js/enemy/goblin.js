// js/enemy/goblin.js
window.G = window.G || {};
G.enemy = G.enemy || {};

class Goblin extends G.enemy.Enemy {
  constructor(x, y, hpMult = 2, dmgMult = 1) {
    super(x, y, {
      radius: 11,
      speed: 95,
      hp: Math.round(40 * hpMult),
      damage: Math.round(3 * dmgMult), // diturunin dari 6 -> 3 karena musuh jauh lebih banyak sekarang
      expReward: 4, // diturunin juga biar exp gak meledak karena jumlah musuh banyak
      color: '#27ae60',
      type: 'goblin',
      attackCooldown: 0.8
    });
    this.frameIndex = 0;
    this.frameTimer = 0;
  }

  update(dt, player, onPlayerDamage) {
    super.update(dt, player);
    G.enemy.ai.chase(this, player, this.speed, dt);
    this.tryAttackPlayer(player, onPlayerDamage);

    // toggle antar 2 pose biar keliatan jalan, bukan diem kaku
    this.frameTimer += dt;
    if (this.frameTimer >= 0.25) {
      this.frameTimer = 0;
      this.frameIndex = this.frameIndex === 0 ? 1 : 0;
    }
  }

  drawShape(ctx, screen) {
    const img = G.enemy.sprites && G.enemy.sprites.goblin;
    if (!img) { super.drawShape(ctx, screen); return; } // fallback lingkaran kalau sprite belum ke-load

    const sheet = G.CONST.GOBLIN_SHEET;
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

G.enemy.Goblin = Goblin;