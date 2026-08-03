// js/skills/skillData.js
// Data 9 Epic Skill. Angka dasar (level 1) persis sesuai desain yang diminta.
// Untuk level 2-5, angkanya di-scale otomatis lewat LEVEL_SCALE di bawah
// (bukan diminta di desain asli, jadi ini asumsi tuning biar skill kerasa
// naik tiap level — silakan diubah angkanya kalau mau beda).
window.G = window.G || {};
G.skills = G.skills || {};

G.skills.MAX_LEVEL = 5;

// Field yang namanya berakhiran "Pct" di-scale pakai tabel "power".
// Field "duration"/"*Duration" di-scale pakai tabel "duration".
// Field "cooldown" di-scale pakai tabel "cooldown" (makin kecil = makin cepat).
// Field lain (radius/range/dash/knockback/knockUp/hitCount/untargetable) TETAP,
// biar area & CC-nya gak jadi OP cuma gara-gara level naik.
G.skills.LEVEL_SCALE = {
  power:    { 1: 1.00, 2: 1.10, 3: 1.20, 4: 1.32, 5: 1.45 },
  duration: { 1: 1.00, 2: 1.08, 3: 1.16, 4: 1.24, 5: 1.32 },
  cooldown: { 1: 1.00, 2: 0.94, 3: 0.88, 4: 0.82, 5: 0.75 }
};

G.skills.LIST = [
  {
    id: 'tornado', name: 'Tornado', icon: '🌪️',
    description: 'Menciptakan pusaran angin yang menarik lalu melempar musuh.',
    base: { damagePct: 1.40, radiusYard: 6, pullDuration: 1, knockbackYard: 3, cooldown: 15 }
  },
  {
    id: 'tortoise', name: 'Tortoise Shield', icon: '🛡️',
    description: 'Memperkuat pertahanan pengguna.',
    base: { damageReductionPct: 0.45, duration: 8, cooldown: 25 }
  },
  {
    id: 'courage', name: "Warrior's Courage", icon: '🔥',
    description: 'Meningkatkan semangat bertarung.',
    base: { atkPct: 0.10, hpPct: 0.10, speedPct: 0.10, duration: 20, cooldown: 30 }
  },
  {
    id: 'elfblessing', name: "Elf's Blessing", icon: '🍃',
    description: 'Memberikan kekebalan dari seluruh debuff (poison, burn, bleed, slow, dll).',
    base: { duration: 8, cooldown: 20 }
  },
  {
    id: 'hawkeye', name: 'Hawk Eye', icon: '🦅',
    description: 'Meningkatkan kemampuan menyerang.',
    base: { critChancePct: 0.20, critDamagePct: 0.20, duration: 20, cooldown: 30 }
  },
  {
    id: 'intimidate', name: 'Intimidate', icon: '😱',
    description: 'Mengeluarkan aura yang melemahkan serangan musuh di sekitar.',
    base: { radiusYard: 6, atkDebuffPct: 0.30, duration: 8, cooldown: 25 }
  },
  {
    id: 'earthsplitter', name: 'Earth Splitter', icon: '⛰️',
    description: 'Menghantam tanah di depan hingga menciptakan retakan besar.',
    base: { damagePct: 1.80, rangeYard: 12, knockUp: 1, slowPct: 0.20, slowDuration: 3, cooldown: 18 }
  },
  {
    id: 'shadowdash', name: 'Shadow Dash', icon: '💨',
    description: 'Meluncur ke depan dengan kecepatan tinggi sambil menebas musuh.',
    base: { dashYard: 8, damagePct: 1.60, untargetable: 0.3, cooldown: 15 }
  },
  {
    id: 'bladedance', name: 'Blade Dance', icon: '🗡️',
    description: 'Berputar 360° mengayunkan senjata, menebas seluruh musuh di sekitar.',
    base: { radiusYard: 5, hitCount: 5, perHitPct: 0.40, bonusPct: 0.20, slowPct: 0.20, slowDuration: 2, cooldown: 18 }
  }
];

G.skills.getById = function (id) {
  return G.skills.LIST.find((s) => s.id === id) || null;
};

// Ambil angka stat skill yang udah di-scale sesuai level (1-5).
G.skills.getLevelStats = function (id, level) {
  const def = G.skills.getById(id);
  if (!def) return null;

  const lvl = G.utils.math.clamp(Math.round(level) || 1, 1, G.skills.MAX_LEVEL);
  const scale = G.skills.LEVEL_SCALE;
  const out = { ...def.base };

  Object.keys(out).forEach((key) => {
    if (key === 'cooldown') {
      out[key] = +(out[key] * scale.cooldown[lvl]).toFixed(2);
    } else if (key === 'duration' || key.endsWith('Duration')) {
      out[key] = +(out[key] * scale.duration[lvl]).toFixed(2);
    } else if (key.endsWith('Pct')) {
      out[key] = +(out[key] * scale.power[lvl]).toFixed(4);
    }
  });

  return out;
};

// Teks deskripsi angka buat ditampilkan di kartu pemilihan skill / skill bar.
G.skills.describe = function (id, stats) {
  const pct = (n) => `${Math.round(n * 100)}%`;
  switch (id) {
    case 'tornado':
      return `Damage: ${pct(stats.damagePct)} ATK · Radius: ${stats.radiusYard} yard · Pull 1s · Knockback ${stats.knockbackYard} yard · Cooldown: ${stats.cooldown}s`;
    case 'tortoise':
      return `Damage Reduction: ${pct(stats.damageReductionPct)} · Durasi: ${stats.duration}s · Cooldown: ${stats.cooldown}s`;
    case 'courage':
      return `ATK +${pct(stats.atkPct)} · Max HP +${pct(stats.hpPct)} · Speed +${pct(stats.speedPct)} · Durasi: ${stats.duration}s · Cooldown: ${stats.cooldown}s`;
    case 'elfblessing':
      return `Kebal seluruh debuff · Durasi: ${stats.duration}s · Cooldown: ${stats.cooldown}s`;
    case 'hawkeye':
      return `Crit Chance +${pct(stats.critChancePct)} · Crit Damage +${pct(stats.critDamagePct)} · Durasi: ${stats.duration}s · Cooldown: ${stats.cooldown}s`;
    case 'intimidate':
      return `Radius: ${stats.radiusYard} yard · Musuh ATK -${pct(stats.atkDebuffPct)} · Durasi: ${stats.duration}s · Cooldown: ${stats.cooldown}s`;
    case 'earthsplitter':
      return `Damage: ${pct(stats.damagePct)} ATK · Jarak: ${stats.rangeYard} yard · Knock Up ${stats.knockUp}s · Slow ${pct(stats.slowPct)} selama ${stats.slowDuration}s · Cooldown: ${stats.cooldown}s`;
    case 'shadowdash':
      return `Dash: ${stats.dashYard} yard · Damage: ${pct(stats.damagePct)} ATK · Untargetable ${stats.untargetable}s · Cooldown: ${stats.cooldown}s`;
    case 'bladedance':
      return `${stats.hitCount} hit x ${pct(stats.perHitPct)} ATK · Bonus +${pct(stats.bonusPct)} ATK & Slow ${pct(stats.slowPct)} kalau semua hit kena · Cooldown: ${stats.cooldown}s`;
    default:
      return '';
  }
};
