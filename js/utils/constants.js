// js/utils/constants.js
// Konfigurasi global game. Ubah nilai di sini untuk tuning cepat.

window.G = window.G || {};
G.utils = G.utils || {};

G.CONST = {
  CANVAS_W: 960,
  CANVAS_H: 540,
  TILE_SIZE: 32,

  // --- Player sprite sheet (assets/player/run_anim_sheet.png) ---
  // Sheet terdeteksi berukuran 64x128 = grid 4 kolom x 8 baris, tiap frame 16x16.
  // Asumsi mapping baris: tiap arah pakai 2 baris (idle di baris genap, run di baris ganjil).
  // Kalau posisi karakter kelihatan salah arah, tinggal ubah PLAYER_ROW_MAP di bawah.
  PLAYER_SHEET: {
    frameW: 16,
    frameH: 16,
    cols: 4,
    rows: 8,
    scale: 2.5 // ukuran render di canvas = 16*2.5 = 40px
  },
PLAYER_ROW_MAP: {
    down:  { idleRow: 0, runRow: 1 },
    left:  { idleRow: 2, runRow: 3 },
    right: { idleRow: 4, runRow: 5 },
    up:    { idleRow: 6, runRow: 7 }
  },

  // --- Enemy sprites (bukan grid rapi, jadi rect frame ditulis manual) ---
  // assets/enemy/goblin/goblin.png -> cuma ada 2 pose valid di kanvas 2304x192,
  // sisanya kosong. Kalau nanti nambah frame baru, tinggal tambah rect di array ini.
  GOBLIN_SHEET: {
    frameW: 32,
    frameH: 32,
    cols: 6,
    rows: 3,
    walkRow: 0,   // baris yang dipakai buat animasi jalan (ganti kalau row 0 bukan yang jalan)
    attackRow: null, // isi angka row (0/1/2) kalau ada row khusus attack
    drawHeight: 56
  },
  // assets/witch/witch.png -> kanvas asli 2240x320, cell asli 80x64 (BUKAN 32x32 —
  // sudah diukur manual dari file pngnya). walkRow=0 isinya cuma 10 frame yang valid,
  // sisanya kolom kosong, makanya dipakai array walkFrames, bukan cols mentah.
  WITCH_SHEET: {
    frameW: 80,
    frameH: 64,
    cols: 28,
    rows: 5,
    walkRow: 0,
    walkFrames: [0, 1, 2, 3, 5, 7, 8, 9, 10, 12], // kolom yang isinya frame valid di walkRow
    drawHeight: 56
  },
  // assets/enemy/archer/archer.png -> sprite baru buat Archer (sebelumnya cuma lingkaran
  // ungu polos). Di-crop manual dari asset marksman/archer.png (sheet aslinya 1600x4500,
  // grid 16 kolom x 15 baris @ 100x300/cell, tapi banyak cell kosong). Cuma 2 frame pose
  // yang dipakai (kotak archer siap panah), disusun jadi 1 file kecil 198x203 (2 kolom).
  ARCHER_SHEET: {
    frameW: 99,
    frameH: 203,
    cols: 2,
    rows: 1,
    walkRow: 0,
    drawHeight: 52
  },

  // --- Icon sheet (assets/items/icons_sheet.png) ---
  // Berisi weapon icons (kiri, grid 16x16) & item icons (kanan, grid lebih besar ~16-24px).
  // Rect di bawah adalah perkiraan (x, y, w, h) hasil crop manual — silakan geser dikit
  // kalau meleset, tinggal edit angkanya saja, tidak usah sentuh kode lain.
  ICONS: {
    sword:   { x: 16,  y: 32, w: 16, h: 16 },
    dagger:  { x: 16,  y: 96, w: 16, h: 16 },
    axe:     { x: 0,   y: 16, w: 16, h: 16 }, // pickaxe dipakai sbg placeholder axe
    bow:     { x: 32,  y: 96, w: 16, h: 16 },
    shield:  { x: 176, y: 48, w: 16, h: 16 },
    potion:  { x: 224, y: 48, w: 16, h: 16 },
    gem:     { x: 208, y: 0,  w: 16, h: 16 },
    key:     { x: 240, y: 0,  w: 16, h: 16 },
    heart:   { x: 224, y: 128,w: 16, h: 16 },
    coin:    { x: 176, y: 0,  w: 16, h: 16 },
    clover:  { x: 240, y: 128,w: 16, h: 16 } // untuk item "luck"
  },

  DIRECTIONS: ['down', 'left', 'right', 'up'],

  PLAYER_BASE: {
    maxHP: 100,
    atk: 10,
    def: 2,
    speed: 140, // px/detik
    critChance: 0.05
  },

  WAVE: {
    baseEnemyCount: 20,   // minimal 50 musuh per wave (sesuai request)
    countPerWave: 4,      // makin nambah terus tiap wave
    timeBetweenWaves: 4,  // detik jeda setelah wave clear
    spawnWindowSeconds: 8 // semua musuh di 1 wave selesai muncul dalam ~8 detik, walau jumlahnya banyak
  },

  STORAGE_KEY: 'canvas_game_save_v1',
  // Awakening: FIXED DURATION buat SEMUA race (termasuk Jack).
  // Tekan F (meter penuh) -> aktif `duration` detik -> otomatis nonaktif sendiri.
  // (Stacking buff race Jack itu HAL LAIN — itu di sistem skill buff di skill bar,
  // lihat SKILL.jackBuffStackDuration & js/player/skills.js, bukan di sini.)
  AWAKENING: {
    max: 100,
    duration: 7,
    chargeFromDamageDealt: 0.3,
    chargeFromDamageTaken: 0.3
  },
  DOMAIN: {
    demonBaseRadius: 90,   // radius area bakar Demon (px), dobel pas Domain Expansion aktif
    vampireRadius: 90      // radius serangan area Vampire pas Blood Domain aktif
  },

  // 1 yard = 15px. Dipilih biar konsisten sama skala AoE yang udah ada
  // (radius Demon/Vampire domain = 90px = 6 yard).
  YARD: 15,

  SKILL: {
    levelInterval: 1,
    maxLevel: 5,
    choiceCount: 3,
    // Skill buff (Tortoise/Courage/Hawk Eye/Elf's Blessing) sekarang TOGGLE:
    // - Race biasa: pencet -> aktif SELAMANYA, pencet lagi -> nonaktif + masuk cooldown skill itu.
    // - Race Jack: pencet lagi (selagi aktif) -> nambah 1 stack, durasi di-refresh ke
    //   jackBuffStackDuration detik (BUKAN durasi normal skill, dan BUKAN cooldown).
    //   Kalau udah di stack maksimal (15) terus dipencet lagi, buff langsung mati.
    jackBuffStackDuration: 6
  },
  BULLET_ICON: { x: 220, y: 130, w: 60, h: 60 },

  GUN: {
    purpleAtLevel: 20,
    cooldown: 1.1,
    range: 320,
    speed: 420,
    damageMult: 0.5
  },

  ARMOUR_SHEET: { w: 128, h: 256, cellW: 32, cellH: 32 },
  POTION_SHEET: { w: 64, h: 192, cellW: 16, cellH: 32 }



  
};