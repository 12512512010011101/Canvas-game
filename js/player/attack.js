// js/player/attack.js
window.G = window.G || {};
G.player = G.player || {};

const DIR_VECTOR = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

G.player.attack = {
  cooldown: 0.35,

  update(player, dt, enemies, onHit) {
    if (player.attackTimer > 0) player.attackTimer -= dt;
    if (player.swingTimer > 0) {
      player.swingTimer -= dt;
      if (player.swingTimer <= 0) player.isSwinging = false;
    }

    if (player.attackTimer <= 0) {
      this.performAttack(player, enemies, onHit);
      player.attackTimer = this.cooldown * (player.attackCooldownMult || 1);
      player.isSwinging = true;
      player.swingTimer = 0.18;
    }
  },

  performAttack(player, enemies, onHit) {
    const dir = DIR_VECTOR[player.animator.direction] || DIR_VECTOR.down;
    const range = 46;
    const hitX = player.x + dir.x * range * 0.6;
    const hitY = player.y + dir.y * range * 0.6;

    const vampireDomain = player.awakeningActive && player.awakeningTypes.includes('vampire');
    const domainRadius = G.CONST.DOMAIN.vampireRadius;

    const demonAwaken = player.awakeningActive && player.awakeningTypes.includes('demon');

    let dmgMult = 1 * player.getArmorAtkMult();

    if (player.hasPassive('human')) {
      if (player.awakeningActive && player.awakeningTypes.includes('human')) {
        dmgMult += 1.3;
      } else {
        const hpPct = player.stats.hp / player.stats.totalMaxHP;
        dmgMult += (1 - hpPct) * 1.3;
      }
    }
    if (player.hasPassive('demon')) {
      
    }

    enemies.forEach((enemy) => {
      if (enemy.dead) return;

      let inRange;
      if (vampireDomain) {
        inRange = G.utils.math.distance(player.x, player.y, enemy.x, enemy.y) < domainRadius;
      } else {
        inRange = G.utils.math.distance(hitX, hitY, enemy.x, enemy.y) < range;
      }
      if (!inRange) return;

      const isCrit = Math.random() < player.stats.totalCrit;
      const dmg = Math.round(player.stats.totalAtk * (isCrit ? player.stats.totalCritMultiplier : 1) * dmgMult);
      enemy.takeDamage(dmg);

      player.chargeAwakening(dmg * G.CONST.AWAKENING.chargeFromDamageDealt);

      if (demonAwaken) {
        player._primordialStacks += 1;
      }

      if (onHit) onHit(enemy, dmg, isCrit);
    });
  }
};