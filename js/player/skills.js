// js/player/skills.js
// Sistem "pilih 1 dari 3 skill tiap kelipatan 5 level" + eksekusi efeknya.
window.G = window.G || {};
G.player = G.player || {};

const FACING = {
  down: { x: 0, y: 1 },
  up: { x: 0, y: -1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

// Jarak titik (px,py) ke segmen garis (ax,ay)-(bx,by). Dipakai Shadow Dash
// buat ngecek musuh mana aja yang "dilewati" pas dash.
function pointToSegmentDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = G.utils.math.clamp(t, 0, 1);
  const cx = ax + dx * t, cy = ay + dy * t;
  return G.utils.math.distance(px, py, cx, cy);
}

function rollDamage(player, base) {
  const isCrit = Math.random() < player.stats.totalCrit;
  const dealt = Math.round(base * (isCrit ? player.stats.totalCritMultiplier : 1));
  return { dealt, isCrit };
}

// Efek tiap skill. Semua fungsi menerima (player, level, enemies, onHit).
const EFFECTS = {
  tornado(player, level, enemies, onHit) {
    const s = G.skills.getLevelStats('tornado', level);
    const radius = s.radiusYard * G.CONST.YARD;
    const baseDmg = player.stats.totalAtk * s.damagePct * player.getArmorAtkMult();

    enemies.forEach((e) => {
      if (e.dead) return;
      if (G.utils.math.distance(player.x, player.y, e.x, e.y) > radius) return;

      const { dealt, isCrit } = rollDamage(player, baseDmg);
      e.takeDamage(dealt);
      if (onHit) onHit(e, dealt, isCrit);

      e.pullTarget = player;
      e.pullTimer = s.pullDuration;
      e.controlTimer = Math.max(e.controlTimer, s.pullDuration + 0.15);
      e._pullSpeed = 260;
      e._pendingKnockbackPx = s.knockbackYard * G.CONST.YARD;
    });
  },

  tortoise(player, level) {
    const s = G.skills.getLevelStats('tortoise', level);
    player.applySkillBuff('tortoise', { damageReduction: s.damageReductionPct }, s.duration);
  },

  courage(player, level) {
    const s = G.skills.getLevelStats('courage', level);
    player.applySkillBuff('courage', {
      atk: Math.round(player.stats.totalAtk * s.atkPct),
      maxHP: Math.round(player.stats.totalMaxHP * s.hpPct),
      speed: Math.round(player.stats.totalSpeed * s.speedPct)
    }, s.duration);
  },

  elfblessing(player, level) {
    const s = G.skills.getLevelStats('elfblessing', level);
    player.applySkillBuff('elfblessing', { debuffImmune: true }, s.duration);
    // Elf's Blessing juga langsung nyembuhin status debuff yang lagi aktif saat di-cast.
    player.curePoison();
  },

  hawkeye(player, level) {
    const s = G.skills.getLevelStats('hawkeye', level);
    player.applySkillBuff('hawkeye', {
      critChance: s.critChancePct,
      critMultiplier: s.critDamagePct
    }, s.duration);
  },

  intimidate(player, level, enemies) {
    const s = G.skills.getLevelStats('intimidate', level);
    const radius = s.radiusYard * G.CONST.YARD;

    enemies.forEach((e) => {
      if (e.dead) return;
      if (G.utils.math.distance(player.x, player.y, e.x, e.y) > radius) return;
      e.atkDebuffMult = Math.min(e.atkDebuffMult, 1 - s.atkDebuffPct);
      e.atkDebuffTimer = Math.max(e.atkDebuffTimer, s.duration);
    });
  },

  earthsplitter(player, level, enemies, onHit) {
    const s = G.skills.getLevelStats('earthsplitter', level);
    const range = s.rangeYard * G.CONST.YARD;
    const dir = FACING[player.animator.direction] || FACING.down;
    const baseDmg = player.stats.totalAtk * s.damagePct * player.getArmorAtkMult();

    enemies.forEach((e) => {
      if (e.dead) return;
      const toEnemy = { x: e.x - player.x, y: e.y - player.y };
      const dist = Math.hypot(toEnemy.x, toEnemy.y);
      if (dist > range || dist === 0) return;

      const norm = { x: toEnemy.x / dist, y: toEnemy.y / dist };
      const dot = norm.x * dir.x + norm.y * dir.y;
      if (dot < 0.35) return; // cuma musuh di area depan (~±70 derajat dari arah hadap)

      const { dealt, isCrit } = rollDamage(player, baseDmg);
      e.takeDamage(dealt);
      if (onHit) onHit(e, dealt, isCrit);

      e.controlTimer = Math.max(e.controlTimer, s.knockUp);
      e.slowMult = Math.min(e.slowMult, 1 - s.slowPct);
      e.slowTimer = Math.max(e.slowTimer, s.slowDuration);
    });
  },

  shadowdash(player, level, enemies, onHit) {
    const s = G.skills.getLevelStats('shadowdash', level);
    const dir = FACING[player.animator.direction] || FACING.down;
    const dist = s.dashYard * G.CONST.YARD;
    const startX = player.x, startY = player.y;
    const targetX = player.x + dir.x * dist;
    const targetY = player.y + dir.y * dist;
    const baseDmg = player.stats.totalAtk * s.damagePct * player.getArmorAtkMult();

    enemies.forEach((e) => {
      if (e.dead) return;
      const distToLine = pointToSegmentDist(e.x, e.y, startX, startY, targetX, targetY);
      if (distToLine > e.radius + 26) return;

      const { dealt, isCrit } = rollDamage(player, baseDmg);
      e.takeDamage(dealt);
      if (onHit) onHit(e, dealt, isCrit);
    });

    player.x = targetX;
    player.y = targetY;
    player.invulnTimer = Math.max(player.invulnTimer, s.untargetable);
  },

  bladedance(player, level, enemies, onHit) {
    const s = G.skills.getLevelStats('bladedance', level);
    const radius = s.radiusYard * G.CONST.YARD;
    const armorMult = player.getArmorAtkMult();
    const perHitDmg = player.stats.totalAtk * s.perHitPct * armorMult;
    const bonusDmg = player.stats.totalAtk * s.bonusPct * armorMult;

    enemies.forEach((e) => {
      if (e.dead) return;
      if (G.utils.math.distance(player.x, player.y, e.x, e.y) > radius) return;

      for (let i = 0; i < s.hitCount; i++) {
        if (e.dead) break;
        const { dealt, isCrit } = rollDamage(player, perHitDmg);
        e.takeDamage(dealt);
        if (onHit) onHit(e, dealt, isCrit);
      }

      // Semua musuh dalam radius otomatis kena seluruh hit, jadi bonus selalu berlaku.
      if (!e.dead) {
        const { dealt, isCrit } = rollDamage(player, bonusDmg);
        e.takeDamage(dealt);
        if (onHit) onHit(e, dealt, isCrit);
        e.slowMult = Math.min(e.slowMult, 1 - s.slowPct);
        e.slowTimer = Math.max(e.slowTimer, s.slowDuration);
      }
    });
  }
};

G.player.skills = {
  // Pilih `count` skill acak yang belum maksimal (baik yang belum dimiliki, atau
  // yang masih bisa naik level) buat ditawarkan pas level up.
  rollChoices(player, count) {
    const eligible = G.skills.LIST.filter((s) => (player.skills[s.id] || 0) < G.CONST.SKILL.maxLevel);
    const shuffled = [...eligible];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(G.core.rng.next() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count).map((skill) => ({
      skill,
      currentLevel: player.skills[skill.id] || 0
    }));
  },

  learn(player, skillId) {
    const current = player.skills[skillId] || 0;
    if (current >= G.CONST.SKILL.maxLevel) return false;

    player.skills[skillId] = current + 1;
    if (current === 0) player.skillOrder.push(skillId); // urutan pertama dapet = slot hotkey 1..9
    return true;
  },

  update(player, dt, input, enemies, onHit) {
    // cooldown
    Object.keys(player.skillCooldowns).forEach((id) => {
      if (player.skillCooldowns[id] > 0) {
        player.skillCooldowns[id] = Math.max(0, player.skillCooldowns[id] - dt);
      }
    });

    // buff timer (tortoise, courage, hawkeye, elfblessing)
    player.updateSkillBuffs(dt);

    // input hotkey 1-9 sesuai urutan skillOrder
    const digitCodes = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9'];
    for (let i = 0; i < player.skillOrder.length; i++) {
      if (!input.wasPressed(digitCodes[i])) continue;
      this.tryCast(player, player.skillOrder[i], enemies, onHit);
    }
  },

  tryCast(player, skillId, enemies, onHit) {
    const cd = player.skillCooldowns[skillId] || 0;
    if (cd > 0) return false;

    const level = player.skills[skillId] || 0;
    if (level <= 0) return false;

    const effect = EFFECTS[skillId];
    if (!effect) return false;

    effect(player, level, enemies, onHit);

    const stats = G.skills.getLevelStats(skillId, level);
    player.skillCooldowns[skillId] = stats.cooldown;
    return true;
  }
};
