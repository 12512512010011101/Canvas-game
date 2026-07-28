// js/enemy/archer.js
window.G = window.G || {};
G.enemy = G.enemy || {};

class Archer extends G.enemy.Enemy {
  constructor(x, y, hpMult = 0.5, dmgMult = 1) {
    super(x, y, {
      radius: 11,
      speed: 60,
      hp: Math.round(10 * hpMult),
      damage: Math.round(3 * dmgMult), // diturunin dari 5 -> 3
      expReward: 5,
      color: '#8e44ad',
      type: 'archer',
      attackCooldown: 1.6
    });
    this.preferredDist = 160;
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
  }
}

G.enemy.Archer = Archer;
