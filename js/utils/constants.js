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
  AWAKENING: {
    max: 100,                    // meter penuh di angka ini
    duration: 6,                 // detik awakening aktif
    chargeFromDamageDealt: 0.3,  // tiap 1 damage yang DIBERIKAN, meter naik segini
    chargeFromDamageTaken: 0.3,   // tiap 1 damage yang DITERIMA, meter naik segini (lebih cepat, lebih beresiko)
  },
  DOMAIN: {
    demonBaseRadius: 90,   // radius area bakar Demon (px), dobel pas Domain Expansion aktif
    vampireRadius: 90      // radius serangan area Vampire pas Blood Domain aktif
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
