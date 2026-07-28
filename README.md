# Canvas Game — Pixel Roguelike

Game roguelike top-down sederhana pakai HTML5 Canvas + vanilla JS (tanpa framework/bundler).
Struktur file mengikuti yang kamu kasih. Semua modul JS pakai pola namespace global
`window.G` (bukan ES module) supaya bisa langsung jalan dari `index.html` tanpa server
build — cukup buka pakai Live Server / `python -m http.server`.

## Cara jalanin

*Silahkan kunjungi* : https://12512512010011101.github.io/Canvas-game/

Karena browser modern block `fetch()` gambar dari `file://` untuk beberapa kasus, paling aman
jalanin lewat local server:

```bash
cd canvas-game
python3 -m http.server 8000
# buka http://localhost:8000
```

Atau pakai ekstensi "Live Server" di VS Code.

## Kontrol

- **WASD / Arrow Keys** — gerak
- **Space / Klik kiri** — serang ke arah hadap
- **E** — buka chest kalau lagi di dekatnya
- **I** — buka/tutup inventory
- **C** — buka/tutup panel statistik
- **Esc** — pause

## Yang sudah jalan

- Player bergerak & animasi lari 4-arah dari `run_anim_sheet.png`
- Sistem serang, level up, EXP, stats (ATK/DEF/Speed/Crit)
- Musuh: Goblin (melee cepat), Archer (nembak dari jarak), Boss (muncul tiap wave kelipatan 5)
- Wave manager otomatis spawn musuh & kasih jeda antar wave
- Chest muncul tiap wave beres, isinya item random (pakai `icons_sheet.png`) + gold
- Item system: weapon (sword/bow/axe), armor (shield), consumable (potion), passive (luck/gold)
- HUD (HP/EXP/level/wave), inventory panel, stats panel, pause menu, game over + highscore (localStorage)

## Catatan tentang sprite

- **`run_anim_sheet.png`** (64×128) diasumsikan grid **4 kolom × 8 baris**, tiap frame 16×16px.
  Mapping baris ke arah ada di `js/utils/constants.js` → `PLAYER_ROW_MAP`. Kalau pas dicoba
  arah lari kelihatan salah (misal nengok kiri padahal lagi ke kanan), tinggal geser angka
  `idleRow`/`runRow` di situ — nggak perlu ubah kode lain.
- **`icons_sheet.png`** (272×176) berisi banyak icon senjata & item. Koordinat crop tiap icon
  ada di `G.CONST.ICONS` (juga di `constants.js`) — beberapa masih perkiraan, silakan sesuaikan
  `x, y` kalau posisinya meleset dikit dari icon yang dimaksud.
- Musuh belum punya sprite (belum di-upload), jadi sementara digambar sebagai lingkaran warna.
  Gampang diganti: tinggal ubah method `drawShape()` di `js/enemy/enemy.js` untuk pakai
  `ctx.drawImage()` begitu ada sprite sheet musuh.

## Belum diisi / bisa dikembangkan lagi

- `assets/enemy/`, `assets/effects/`, `assets/ui/`, `assets/audio/` masih kosong — folder sudah
  disiapkan sesuai struktur, tinggal taruh asset & sambungkan.
- Suara/musik belum ada (folder `audio/` kosong, belum ada `sfx.js` pemutar suara).
- Tile map masih grid polos, belum ada tileset dunia sungguhan.
