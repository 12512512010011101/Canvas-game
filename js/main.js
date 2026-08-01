// js/main.js
window.G = window.G || {};

(async function () {
  const canvas = document.getElementById('game-canvas');
  canvas.width = G.CONST.CANVAS_W;
  canvas.height = G.CONST.CANVAS_H;

  G.core.input.init(canvas);
  G.core.touchControls.init(G.core.input);
  G.ui.raceSelect.init();

  const menuEl = document.getElementById('main-menu');
  const loadingEl = document.getElementById('loading-text');
  const startBtn = document.getElementById('btn-start');

  let assets;
  try {
    assets = await G.utils.helper.loadImages({
  playerSheet: 'assets/player/run_anim_sheet.png',
  iconsSheet: 'assets/items/icons_sheet.png',
  armourSheet: 'assets/items/armour.png',
  potionSheet: 'assets/items/potion.png',
  blueBullet: 'assets/items/blue_bullet.png',
  purpleBullet: 'assets/items/purple_bullet.png',
  goblinSheet: 'assets/enemy/goblin/goblin.png',
  witchSheet: 'assets/witch/witch.png',
  archerSheet: 'assets/archer/archer.png'
});
    loadingEl.textContent = 'Siap dimainkan!';
    startBtn.disabled = false;
  } catch (err) {
    loadingEl.textContent = 'Gagal memuat asset. Cek console untuk detail.';
    console.error(err);
    return;
  }

  const best = G.core.save.read();
  if (best) {
    document.getElementById('best-score').textContent =
      `Rekor terbaik — Wave ${best.bestWave || 0}, Level ${best.bestLevel || 1}`;
  }

  let game = null;

  function launchGame(raceId, mimicRaceIds) {
    menuEl.classList.remove('visible');
    canvas.classList.add('visible');
    document.getElementById('hud-hint').classList.add('visible');
    canvas.focus();

    if (!game) {
      game = new G.Game(canvas, assets, raceId, mimicRaceIds);
      game.start();
    } else {
      game.restart(raceId, mimicRaceIds);
    }
  }

  startBtn.addEventListener('click', () => {
    startBtn.blur(); // penting: lepas fokus biar Space gak ke-trigger klik tombol ini lagi
    G.ui.raceSelect.show((raceId, mimicRaceIds) => launchGame(raceId, mimicRaceIds));
  });

  // main lagi dari game-over: pilih race lagi (barangkali mau ganti race)
  document.getElementById('btn-gameover-restart').addEventListener('click', (e) => {
    e.currentTarget.blur();
    G.ui.raceSelect.show((raceId, mimicRaceIds) => launchGame(raceId, mimicRaceIds));
  });
})();