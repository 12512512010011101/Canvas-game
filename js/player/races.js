// js/player/races.js
// Data semua race yang bisa dipilih. Star rating (1-5) diterjemahkan ke angka stat
// lewat tabel STAR di bawah. Base Damage pakai angka eksplisit dari desain (bukan star).
window.G = window.G || {};
G.player = G.player || {};

const STAR = {
  hp:     { 1: 70, 2: 90, 3: 110, 4: 130, 5: 150 },
  def:    { 1: 1,  2: 2,  3: 3,   4: 5,   5: 7 },
  // makin tinggi star, makin kecil cooldown serang (makin cepat nyerang)
  atkspd: { 1: 1.3, 2: 1.15, 3: 1.0, 4: 0.85, 5: 0.7 },
  crit:   { 1: 0.03, 2: 0.05, 3: 0.08, 4: 0.12, 5: 0.18 },
  xp:     { 1: 0.8, 2: 0.9, 3: 1.0, 4: 1.15, 5: 1.3 },
  move:   { 1: 100, 2: 115, 3: 140, 4: 160, 5: 180 }
};

G.player.RACES = [
  {
    id: 'human', name: 'Human', emoji: '👤',
    baseDamage: 3, hpStar: 4, defStar: 3, atkSpdStar: 3, critStar: 2, xpStar: 5, moveStar: 3,
    passiveText: 'Semakin HP rendah semakin besar damage. XP Gain meningkat.',
    awakeningText: 'Rage (maks +130% damage saat HP kritis)'
  },
  {
    id: 'undead', name: 'Undead', emoji: '🧟',
    baseDamage: 6, hpStar: 4, defStar: 4, atkSpdStar: 2, critStar: 3, xpStar: 3, moveStar: 3,
    passiveText: 'Revive sekali tiap 120 detik.',
    tradeoffText: 'Efek heal berkurang 50%',
    awakeningText: 'Undying Will: tidak bisa mati (HP minimal 1) selama aktif. Defense +50%.'
  },
  {
    id: 'elf', name: 'Elf', emoji: '🧝',
    baseDamage: 6, hpStar: 3, defStar: 2, atkSpdStar: 5, critStar: 3, xpStar: 3, moveStar: 3,
    passiveText: 'Attack Speed tertinggi. Efek potion +15%.',
    awakeningText: "Nature's Grace: Attack Speed & Move Speed +30%, efek potion naik jadi +50%."
  },
  {
    id: 'dwarf', name: 'Dwarf', emoji: '⛏️',
    baseDamage: 6, hpStar: 4, defStar: 5, atkSpdStar: 3, critStar: 3, xpStar: 3, moveStar: 2,
    passiveText: 'Legendary Drop +15%.',
    awakeningText: "Mountain's Wrath: Defense +40%, Damage +30%, Legendary Drop chance x2 selama aktif."
  },
  {
    id: 'beast', name: 'Beast', emoji: '🐺',
    baseDamage: 9, hpStar: 4, defStar: 3, atkSpdStar: 3, critStar: 3, xpStar: 3, moveStar: 3,
    passiveText: 'Damage dasar tertinggi.',
    awakeningText: 'Feral Instinct: Damage +50%, Attack Speed +25%, tiap kill heal 5% Max HP.'
  },
  {
    id: 'demon', name: 'Demon', emoji: '😈',
    baseDamage: 6, hpStar: 3, defStar: 2, atkSpdStar: 5, critStar: 3, xpStar: 3, moveStar: 3,
    passiveText: 'Domain Api: area di sekitar pemain terus membakar musuh (DOT = Level × 0.05/detik). Attack Speed sangat tinggi. +0.05% Damage tiap kill (menumpuk terus).',
    awakeningText: 'Domain Expansion: radius domain x2. Primordial Demon: resistance damage +25%, damage +15% (naik +0.5% tiap hit selama aktif).'
  },
  {
    id: 'vampire', name: 'Vampire', emoji: '🧛',
    baseDamage: 6, hpStar: 3, defStar: 3, atkSpdStar: 4, critStar: 3, xpStar: 3, moveStar: 3,
    passiveText: 'Regenerasi dari darah musuh: 1 HP/detik (+0.05/level), maksimal 7% Max HP/detik.',
    weaknessText: 'Kena racun 2x lebih parah',
    awakeningText: 'Blood Domain: serangan jadi area di sekitar pemain. Regen berubah jadi dari damage diterima: 2 HP/detik (+0.05% MaxHP/level), maksimal 15% Max HP/detik.'
  },
  {
  id: 'anomaly', name: 'Jack', emoji: '🌀',
    baseDamage: 2, hpStar: 3, defStar: 3, atkSpdStar: 3, critStar: 3, xpStar: 3, moveStar: 3,
    description: '"Discrimination disgusted him. He grew weary of a system that sought to control him. So he took control of himself, and in doing so, gained the ability to wield every branch of knowledge."',
    passiveText: 'Semua stat +15%.',
    awakeningText: 'Overclock: tiap meter penuh & tekan F, dapat 1 stack ATK/DEF/SPD/Max HP +5% (naik 20%/stack, maks 15 stack). Tiap stack bertahan 60 detik, di-refresh kalau di-charge & tekan F lagi sebelum abis.'
  }
];

// Ubah data star/angka di atas jadi objek stat mentah yang dipahami Stats class.
G.player.buildStatsFromRace = function (race) {
  const stats = {
    maxHP: STAR.hp[race.hpStar],
    atk: race.baseDamage,
    def: STAR.def[race.defStar],
    speed: STAR.move[race.moveStar],
    critChance: STAR.crit[race.critStar],
    attackCooldownMult: STAR.atkspd[race.atkSpdStar],
    expMultiplier: STAR.xp[race.xpStar]
  };

  // Anomaly: "Semua stat +15%" — dikalikan di sini biar gak perlu logic khusus di tempat lain
  if (race.id === 'anomaly') {
    stats.maxHP = Math.round(stats.maxHP * 1.15);
    stats.atk = Math.round(stats.atk * 1.15);
    stats.def = Math.round(stats.def * 1.15);
    stats.speed = Math.round(stats.speed * 1.15);
    stats.critChance = stats.critChance * 1.15;
    stats.attackCooldownMult = stats.attackCooldownMult / 1.15; // makin cepat nyerang
    stats.expMultiplier = stats.expMultiplier * 1.15;
  }

  return stats;
};