// js/player/player.js
window.G = window.G || {};
G.player = G.player || {};

class Player {
  constructor(x, y, image, raceId = 'human', mimicRaceIds = []) {
    this.x = x;
    this.y = y;
    this.radius = 14;

    this.raceId = raceId;
    this.mimicRaceIds = Array.isArray(mimicRaceIds) ? mimicRaceIds : (mimicRaceIds ? [mimicRaceIds] : []);
    this.race = G.player.RACES.find((r) => r.id === raceId) || G.player.RACES[0];

    const base = G.player.buildStatsFromRace(this.race);
    this.stats = new G.player.Stats(base);
    this.expMultiplier = base.expMultiplier;
    this.attackCooldownMult = base.attackCooldownMult;

    this.expSystem = new G.player.ExpSystem();
    this.levelSystem = new G.player.LevelSystem(this.stats, this.expSystem);
    this.animator = new G.player.Animator(image);

    this.attackTimer = 0;
    this.swingTimer = 0;
    this.isSwinging = false;
    this.isMoving = false;
    this.gunTimer = 0;

    this.equippedWeapon = 'sword';
    this.inventory = [];
    this.gold = 0;

    this.invulnTimer = 0;

    this.poison = { active: false, dps: 0, timeLeft: 0, tickTimer: 0 };

    this.demonKillStacks = 0;
    this._primordialStacks = 0;
    this._domainTickTimer = 0;
    this.reviveReady = this.hasPassive('undead');
    this.reviveCooldown = 0;

    this.armorStacks = {};
    this._armorAppliedBonus = { def: 0, maxHP: 0, critChance: 0 };

    this.awakeningTypes = this.computeAwakeningTypes();
    this.awakeningEligible = this.awakeningTypes.length > 0;
    this.awakeningMeter = 0;
    this.awakeningActive = false;
    this.awakeningTimer = 0;
    this._awakenAnomalyBonus = null;
    this._awakenUndeadBonus = null;
    this._awakenElfBonus = null;
    this._awakenDwarfBonus = null;
    this._awakenBeastBonus = null;

    // --- Skill system (pilihan tiap kelipatan 5 level) ---
    this.skills = {};            // { skillId: level }
    this.skillOrder = [];        // urutan didapat = urutan hotkey 1..9
    this.skillCooldowns = {};    // { skillId: sisa cooldown detik }
    this.skillBuffs = {};        // buff aktif dari skill (tortoise/courage/hawkeye/elfblessing)
    this.pendingSkillChoices = 0; // berapa kali modal pilihan skill masih harus ditampilkan
    this.damageReductionBonus = 0; // dari Tortoise Shield
    this.debuffImmuneCount = 0;    // >0 = kebal debuff (Elf's Blessing)
  }

  hasPassive(raceId) {
    return this.raceId === raceId || this.mimicRaceIds.includes(raceId);
  }

  computeAwakeningTypes() {
    const types = [];
    if (this.hasPassive('human')) types.push('human');
    if (this.hasPassive('vampire')) types.push('vampire');
    if (this.hasPassive('demon')) types.push('demon');
    if (this.hasPassive('undead')) types.push('undead');
    if (this.hasPassive('elf')) types.push('elf');
    if (this.hasPassive('dwarf')) types.push('dwarf');
    if (this.hasPassive('beast')) types.push('beast');
    if (types.length === 0 && this.raceId === 'anomaly') types.push('anomaly');
    return types;
  }

  update(dt, input, enemies, worldW, worldH, callbacks = {}) {
    G.player.movement.update(this, input, dt, worldW, worldH);
    this.animator.update(dt);

    G.player.attack.update(this, dt, enemies, callbacks.onHitEnemy);
    G.player.gun.update(this, dt, enemies, callbacks.spawnProjectile);

    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    this.updatePoison(dt);
    this.updateRevive(dt);
    this.updateAwakening(dt, input);
    this.updateVampireRegen(dt);
    this.updateDemonDomain(dt, enemies, callbacks.onHitEnemy);
G.player.skills.update(
    this,
    dt,
    input,
    enemies,
    callbacks.onHitEnemy,
    callbacks.spawnEffect
);
  }

  pickupArmor(id, setId, pieceType) {
    this.armorStacks[id] = (this.armorStacks[id] || 0) + 1;
    this.recalcArmorBonuses();
  }

  hasFullArmorSet(setId) {
    const pieces = G.items.registry.filter((it) => it.type === 'armor_set' && it.setId === setId);
    return pieces.length > 0 && pieces.every((p) => (this.armorStacks[p.id] || 0) > 0);
  }

  getArmorSetTotal(setId) {
    const set = G.items.ARMOR_SETS[setId];
    if (!set) return 0;
    const pieces = G.items.registry.filter((it) => it.type === 'armor_set' && it.setId === setId);
    let total = 0;
    pieces.forEach((p) => {
      const stacks = this.armorStacks[p.id] || 0;
      if (stacks > 0) total += set.pieceBase + (stacks - 1) * set.pieceStack;
    });
    if (this.hasFullArmorSet(setId)) total += set.setBonus;
    return total;
  }

  getArmorAtkMult() {
    return 1 + this.getArmorSetTotal('crimson');
  }

  recalcArmorBonuses() {
    this.stats.bonus.def -= this._armorAppliedBonus.def;
    this.stats.bonus.critChance -= this._armorAppliedBonus.critChance;

    const newDef = this.getArmorSetTotal('obsidian');
    const newCrit = this.getArmorSetTotal('amethyst');
    const newMaxHP = this.getArmorSetTotal('golden');

    this.stats.bonus.def += newDef;
    this.stats.bonus.critChance += newCrit;

    const maxHPDelta = newMaxHP - this._armorAppliedBonus.maxHP;
    this.stats.bonus.maxHP += maxHPDelta;
    if (maxHPDelta > 0) this.stats.hp += maxHPDelta;

    this._armorAppliedBonus = { def: newDef, maxHP: newMaxHP, critChance: newCrit };
  }

  updateVampireRegen(dt) {
    if (!this.hasPassive('vampire')) return;
    const level = this.levelSystem.level;
    const maxHP = this.stats.totalMaxHP;

    let regenPerSec;
    if (this.awakeningActive && this.awakeningTypes.includes('vampire')) {
      regenPerSec = Math.min(2 + level * 2 * maxHP, maxHP * 0.15);
    } else {
      regenPerSec = Math.min(0.5 + level * 1.5, maxHP * 0.07);
    }
    this.stats.hp = G.utils.math.clamp(this.stats.hp + regenPerSec * dt, 0, maxHP);
  }

  getDemonDomainRadius() {
    const base = G.CONST.DOMAIN.demonBaseRadius;
    const expanded = this.awakeningActive && this.awakeningTypes.includes('demon');
    return expanded ? base * 2 : base;
  }

  updateDemonDomain(dt, enemies, onDamageEnemy) {
    if (!this.hasPassive("demon")) return;

    this._domainTickTimer += dt;

    // Tick setiap 0.25 detik
    if (this._domainTickTimer < 0.25) return;
    this._domainTickTimer = 0;

    const radius = this.getDemonDomainRadius();

    // BASE DAMAGE DOMAIN
    let damage =
        (this.levelSystem.level * 2) +
        (this.stats.totalAtk * 0.30);

    // Stack Demon
    damage *= (1 + this.demonKillStacks * 0.0005);

    // Armor Crimson
    damage *= this.getArmorAtkMult();

    // Awakening Demon
    if (this.awakeningActive && this.awakeningTypes.includes("demon")) {
        damage *= (1.15 + this._primordialStacks * 0.005);
    }

    damage = Math.round(damage);

    enemies.forEach(enemy => {
      if (enemy.dead) return;
      const dist = G.utils.math.distance(this.x, this.y, enemy.x, enemy.y);
      if (dist > radius) return;
      enemy.takeDamage(damage);
      if (onDamageEnemy) onDamageEnemy(enemy, damage, false);
    });
  }

  chargeAwakening(amount) {
    if (!this.awakeningEligible || this.awakeningActive) return;
    this.awakeningMeter = Math.min(G.CONST.AWAKENING.max, this.awakeningMeter + amount);
  }

  canActivateAwakening() {
    return this.awakeningEligible && !this.awakeningActive && this.awakeningMeter >= G.CONST.AWAKENING.max;
  }

  updateAwakening(dt, input) {
    if (input.wasPressed('KeyF') && this.canActivateAwakening()) {
      this.activateAwakening();
    }
    if (this.awakeningActive) {
      this.awakeningTimer -= dt;
      if (this.awakeningTimer <= 0) this.deactivateAwakening();
    }
  }

  activateAwakening() {
    this.awakeningActive = true;
    this.awakeningTimer = G.CONST.AWAKENING.duration;
    this.awakeningMeter = 0;

    if (this.awakeningTypes.includes('demon')) {
      this._primordialStacks = 0;
    }
    if (this.awakeningTypes.includes('anomaly')) {
      const bonus = {
        atk: Math.round(this.stats.totalAtk * 0.3),
        def: Math.round(this.stats.totalDef * 0.3),
        speed: Math.round(this.stats.totalSpeed * 0.3),
        critChance: 0.1
      };
      this._awakenAnomalyBonus = bonus;
      this.stats.bonus.atk += bonus.atk;
      this.stats.bonus.def += bonus.def;
      this.stats.bonus.speed += bonus.speed;
      this.stats.bonus.critChance += bonus.critChance;
    }

    // Undying Will: Defense +50%, plus tidak bisa mati (dicek di takeDamage)
    if (this.awakeningTypes.includes('undead')) {
      const bonus = { def: Math.round(this.stats.totalDef * 0.5) };
      this._awakenUndeadBonus = bonus;
      this.stats.bonus.def += bonus.def;
    }

    // Nature's Grace: Attack Speed & Move Speed +30% (efek potion +50% dicek langsung di heal())
    if (this.awakeningTypes.includes('elf')) {
      const bonus = { speed: Math.round(this.stats.totalSpeed * 0.3) };
      this._awakenElfBonus = bonus;
      this.stats.bonus.speed += bonus.speed;
      this.attackCooldownMult = (this.attackCooldownMult || 1) / 1.3;
    }

    // Mountain's Wrath: Defense +40%, Damage +30% (Legendary Drop x2 dicek di chestRNG)
    if (this.awakeningTypes.includes('dwarf')) {
      const bonus = {
        def: Math.round(this.stats.totalDef * 0.4),
        atk: Math.round(this.stats.totalAtk * 0.3)
      };
      this._awakenDwarfBonus = bonus;
      this.stats.bonus.def += bonus.def;
      this.stats.bonus.atk += bonus.atk;
    }

    // Feral Instinct: Damage +50%, Attack Speed +25% (heal on kill dicek di registerKill)
    if (this.awakeningTypes.includes('beast')) {
      const bonus = { atk: Math.round(this.stats.totalAtk * 0.5) };
      this._awakenBeastBonus = bonus;
      this.stats.bonus.atk += bonus.atk;
      this.attackCooldownMult = (this.attackCooldownMult || 1) / 1.25;
    }
  }

  deactivateAwakening() {
    this.awakeningActive = false;
    this.awakeningTimer = 0;

    if (this.awakeningTypes.includes('anomaly') && this._awakenAnomalyBonus) {
      const b = this._awakenAnomalyBonus;
      this.stats.bonus.atk -= b.atk;
      this.stats.bonus.def -= b.def;
      this.stats.bonus.speed -= b.speed;
      this.stats.bonus.critChance -= b.critChance;
      this._awakenAnomalyBonus = null;
    }

    if (this.awakeningTypes.includes('undead') && this._awakenUndeadBonus) {
      this.stats.bonus.def -= this._awakenUndeadBonus.def;
      this._awakenUndeadBonus = null;
    }

    if (this.awakeningTypes.includes('elf') && this._awakenElfBonus) {
      this.stats.bonus.speed -= this._awakenElfBonus.speed;
      this.attackCooldownMult *= 1.3;
      this._awakenElfBonus = null;
    }

    if (this.awakeningTypes.includes('dwarf') && this._awakenDwarfBonus) {
      this.stats.bonus.def -= this._awakenDwarfBonus.def;
      this.stats.bonus.atk -= this._awakenDwarfBonus.atk;
      this._awakenDwarfBonus = null;
    }

    if (this.awakeningTypes.includes('beast') && this._awakenBeastBonus) {
      this.stats.bonus.atk -= this._awakenBeastBonus.atk;
      this.attackCooldownMult *= 1.25;
      this._awakenBeastBonus = null;
    }
  }

  // --- Buff generik dari skill aktif (Tortoise Shield, Warrior's Courage, Hawk Eye, Elf's Blessing) ---
  applySkillBuff(id, bonus, duration) {
    this.removeSkillBuff(id); // refresh kalau di-cast ulang sebelum habis
    this.skillBuffs[id] = { bonus, timeLeft: duration };

    if (bonus.atk) this.stats.bonus.atk += bonus.atk;
    if (bonus.def) this.stats.bonus.def += bonus.def;
    if (bonus.speed) this.stats.bonus.speed += bonus.speed;
    if (bonus.maxHP) {
      this.stats.bonus.maxHP += bonus.maxHP;
      this.stats.hp += bonus.maxHP;
    }
    if (bonus.critChance) this.stats.bonus.critChance += bonus.critChance;
    if (bonus.critMultiplier) this.stats.bonus.critMultiplier += bonus.critMultiplier;
    if (bonus.damageReduction) this.damageReductionBonus += bonus.damageReduction;
    if (bonus.debuffImmune) this.debuffImmuneCount += 1;
  }

  removeSkillBuff(id) {
    const active = this.skillBuffs[id];
    if (!active) return;
    const bonus = active.bonus;

    if (bonus.atk) this.stats.bonus.atk -= bonus.atk;
    if (bonus.def) this.stats.bonus.def -= bonus.def;
    if (bonus.speed) this.stats.bonus.speed -= bonus.speed;
    if (bonus.maxHP) {
      this.stats.bonus.maxHP -= bonus.maxHP;
      this.stats.hp = Math.min(this.stats.hp, this.stats.totalMaxHP);
    }
    if (bonus.critChance) this.stats.bonus.critChance -= bonus.critChance;
    if (bonus.critMultiplier) this.stats.bonus.critMultiplier -= bonus.critMultiplier;
    if (bonus.damageReduction) this.damageReductionBonus -= bonus.damageReduction;
    if (bonus.debuffImmune) this.debuffImmuneCount = Math.max(0, this.debuffImmuneCount - 1);

    delete this.skillBuffs[id];
  }

  updateSkillBuffs(dt) {
    Object.keys(this.skillBuffs).forEach((id) => {
      const b = this.skillBuffs[id];
      b.timeLeft -= dt;
      if (b.timeLeft <= 0) this.removeSkillBuff(id);
    });
  }

  updateRevive(dt) {
    if (!this.hasPassive('undead') || this.reviveReady) return;
    this.reviveCooldown -= dt;
    if (this.reviveCooldown <= 0) this.reviveReady = true;
  }

  tryRevive() {
    if (!this.hasPassive('undead') || !this.reviveReady) return false;
    this.stats.hp = Math.round(this.stats.totalMaxHP * 0.5);
    this.reviveReady = false;
    this.reviveCooldown = 120;
    return true;
  }

  registerKill() {
    this.demonKillStacks += 1;
    if (this.awakeningActive && this.awakeningTypes.includes('beast')) {
      this.heal(this.stats.totalMaxHP * 0.05);
    }
  }

  heal(amount) {
    let final = amount;
    if (this.hasPassive('undead')) final *= 0.5;
    if (this.hasPassive('elf')) {
      const elfAwakened = this.awakeningActive && this.awakeningTypes.includes('elf');
      final *= elfAwakened ? 1.5 : 1.15;
    }
    this.stats.heal(final);
  }

  updatePoison(dt) {
    if (!this.poison.active) return;
    this.poison.timeLeft -= dt;
    this.poison.tickTimer += dt;
    if (this.poison.tickTimer >= 1) {
      this.poison.tickTimer -= 1;
      this.stats.hp = G.utils.math.clamp(this.stats.hp - this.poison.dps, 0, this.stats.totalMaxHP);
    }
    if (this.poison.timeLeft <= 0) this.curePoison();
  }

  applyPoison(dps, duration) {
    if (this.debuffImmuneCount > 0) return; // lagi kebal debuff (Elf's Blessing)
    const finalDps = this.hasPassive('vampire') ? dps * 2 : dps;
    this.poison.active = true;
    this.poison.dps = Math.max(this.poison.dps, finalDps);
    this.poison.timeLeft = Math.max(this.poison.timeLeft, duration);
  }

  curePoison() {
    this.poison.active = false;
    this.poison.dps = 0;
    this.poison.timeLeft = 0;
    this.poison.tickTimer = 0;
  }

  takeDamage(amount) {
    if (this.invulnTimer > 0) return 0;

    let incoming = amount;
    if (this.damageReductionBonus > 0) {
      incoming *= (1 - G.utils.math.clamp(this.damageReductionBonus, 0, 0.9));
    }
    if (this.awakeningActive && this.awakeningTypes.includes('demon')) {
      incoming *= 0.75;
    }

    let dealt = this.stats.takeDamage(incoming);

    if (this.awakeningActive && this.awakeningTypes.includes('undead') && this.stats.hp <= 0) {
      this.stats.hp = 1;
    }

    this.invulnTimer = 0.6;
    this.chargeAwakening(dealt * G.CONST.AWAKENING.chargeFromDamageTaken);
    return dealt;
  }

  grantExp(amount) {
    const oldLevel = this.levelSystem.level;
    const gained = this.levelSystem.grantExp(Math.round(amount * this.expMultiplier));

    if (gained > 0) {
      const interval = G.CONST.SKILL.levelInterval;
      const oldMilestone = Math.floor(oldLevel / interval);
      const newMilestone = Math.floor(this.levelSystem.level / interval);
      if (newMilestone > oldMilestone) {
        this.pendingSkillChoices += (newMilestone - oldMilestone);
      }
    }

    return gained;
  }

  addItem(itemId) {
    this.inventory.push(itemId);
  }

  draw(ctx, camera) {
    const screen = camera.worldToScreen(this.x, this.y);

    if (this.poison.active) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(performance.now() / 150) * 0.1;
      ctx.fillStyle = '#7cd66b';
      ctx.beginPath();
      ctx.arc(screen.x, screen.y + 14, this.radius + 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (this.hasPassive('demon')) {
      const r = this.getDemonDomainRadius();
      const expanded = this.awakeningActive && this.awakeningTypes.includes('demon');
      ctx.save();
      ctx.globalAlpha = expanded ? 0.35 : 0.15;
      ctx.strokeStyle = '#e67e22';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.awakeningActive && this.awakeningTypes.includes('vampire')) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#c0392b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, G.CONST.DOMAIN.vampireRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.awakeningActive) {
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(performance.now() / 100) * 0.15;
      ctx.strokeStyle = '#ff5fd1';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, this.radius + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // --- Aura buff dari skill (Tortoise Shield / Warrior's Courage / Elf's Blessing / Hawk Eye) ---
    const buffAuras = [
      { id: 'tortoise', color: '#4aa3ff', dash: false },
      { id: 'courage', color: '#ff8a3d', dash: false },
      { id: 'elfblessing', color: '#7cd66b', dash: [3, 3] },
      { id: 'hawkeye', color: '#ffd75e', dash: [2, 4] }
    ];
    buffAuras.forEach((aura, i) => {
      if (!this.skillBuffs[aura.id]) return;
      ctx.save();
      ctx.globalAlpha = 0.4 + Math.sin(performance.now() / 180) * 0.15;
      ctx.strokeStyle = aura.color;
      ctx.lineWidth = 2;
      if (aura.dash) ctx.setLineDash(aura.dash);
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, this.radius + 14 + i * 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 20) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    this.animator.draw(ctx, screen.x, screen.y);
    ctx.globalAlpha = 1;

    if (this.isSwinging) {
      const icon = G.items.iconImage;
      const rect = G.CONST.ICONS[this.equippedWeapon] || G.CONST.ICONS.sword;
      if (icon) {
        const dir = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] }[this.animator.direction];
        const ox = screen.x + dir[0] * 26;
        const oy = screen.y + dir[1] * 26;
        ctx.drawImage(icon, rect.x, rect.y, rect.w, rect.h, ox - 12, oy - 12, 24, 24);
      }
    }
  }
}

G.player.Player = Player;