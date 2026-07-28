// js/player/stats.js
window.G = window.G || {};
G.player = G.player || {};

class Stats {
  constructor(base) {
    this.maxHP = base.maxHP;
    this.hp = base.maxHP;
    this.atk = base.atk;
    this.def = base.def;
    this.speed = base.speed;
    this.critChance = base.critChance;
    this.critMultiplier = base.critMultiplier || 1.8; // dasar 1.8x, di-buff Hawk Eye

    // bonus dari equipment/item, ditambahkan terpisah biar gampang dihitung ulang
    this.bonus = { atk: 0, def: 0, speed: 0, maxHP: 0, critChance: 0, critMultiplier: 0 };
  }

  get totalAtk() { return this.atk + this.bonus.atk; }
  get totalDef() { return this.def + this.bonus.def; }
  get totalSpeed() { return this.speed + this.bonus.speed; }
  get totalMaxHP() { return this.maxHP + this.bonus.maxHP; }
  get totalCrit() { return G.utils.math.clamp(this.critChance + this.bonus.critChance, 0, 0.9); }
  get totalCritMultiplier() { return this.critMultiplier + this.bonus.critMultiplier; }

  applyLevelUp(levelGain) {
    this.maxHP += 8 * levelGain;
    this.atk += 2 * levelGain;
    this.def += 1 * levelGain;
    this.hp = this.totalMaxHP; // full heal saat level up
  }

  takeDamage(rawDamage) {
    // def meredam damage dalam PERSENTASE (bukan dipotong angka mentah), pakai formula
    // def / (def + K) — makin tinggi def, makin besar % yang diredam, tapi gak akan pernah
    // sampai 100% jadi damage besar tetap kerasa signifikan walau def-nya tinggi.
    const K = 40; // konstanta balance: def=40 -> reduction 50%, def=12 -> reduction ~23%
    const reduction = this.totalDef / (this.totalDef + K);
    const mitigated = Math.max(1, Math.round(rawDamage * (1 - reduction)));
    this.hp = G.utils.math.clamp(this.hp - mitigated, 0, this.totalMaxHP);
    return mitigated;
  }

  heal(amount) {
    this.hp = G.utils.math.clamp(this.hp + amount, 0, this.totalMaxHP);
  }

  isDead() {
    return this.hp <= 0;
  }
}

G.player.Stats = Stats;
