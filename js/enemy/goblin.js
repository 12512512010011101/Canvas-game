// js/enemy/goblin.js
window.G = window.G || {};
G.enemy = G.enemy || {};

class Goblin extends G.enemy.Enemy {
  constructor(x, y, hpMult = 2, dmgMult = 1) {
super(x, y, {
  radius: 11,
  speed: 95,
  hp: Math.round(48 * hpMult),   // sedikit lebih tebal (dulu 40)
  damage: Math.round(4 * dmgMult), // dikit lebih sakit (dulu 3)
  expReward: 4,
  color: '#27ae60',
  type: 'goblin',
  attackCooldown: 0.8
});
    this.frameIndex = 0;
    this.frameTimer = 0;
  }

  update(dt, player, onPlayerDamage) {
    super.update(dt, player);

    if (this.controlTimer > 0) {
      // lagi ke-pull / knock up dari skill player, gak bisa gerak/nyerang
      return;
    }

    G.enemy.ai.chase(this, player, this.getSpeed(), dt);
    this.tryAttackPlayer(player, onPlayerDamage);

    this.frameTimer += dt;
    if (this.frameTimer >= 0.12) {
      this.frameTimer = 0;
      const sheet = G.CONST.GOBLIN_SHEET;
      this.frameIndex = (this.frameIndex + 1) % sheet.cols;
    }
  }

  drawShape(ctx, screen) {
    const img = G.enemy.sprites && G.enemy.sprites.goblin;
    if (!img) { super.drawShape(ctx, screen); return; }

    const sheet = G.CONST.GOBLIN_SHEET;
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

G.enemy.Goblin = Goblin;