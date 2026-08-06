// js/enemy/spawn.js
window.G = window.G || {};
G.enemy = G.enemy || {};

G.enemy.spawn = {
  _idCounter: 0,

  // Menentukan titik spawn di luar layar, di sekitar posisi player, dalam batas dunia.
  randomEdgePosition(player, worldW, worldH, margin = 60) {
    const side = G.core.rng.int(0, 3);
    const camRange = 500; // jarak spawn dari player
    let x, y;
    switch (side) {
      case 0: x = player.x - camRange; y = player.y + G.core.rng.range(-camRange, camRange); break;
      case 1: x = player.x + camRange; y = player.y + G.core.rng.range(-camRange, camRange); break;
      case 2: x = player.x + G.core.rng.range(-camRange, camRange); y = player.y - camRange; break;
      default: x = player.x + G.core.rng.range(-camRange, camRange); y = player.y + camRange; break;
    }
    x = G.utils.math.clamp(x, margin, worldW - margin);
    y = G.utils.math.clamp(y, margin, worldH - margin);
    return { x, y };
  },

  create(type, x, y, waveNumber, hpMult, dmgMult) {
    let e;
    if (type === 'goblin') e = new G.enemy.Goblin(x, y, hpMult, dmgMult);
    else if (type === 'archer') e = new G.enemy.Archer(x, y, hpMult, dmgMult);
    else if (type === 'poison') e = new G.enemy.PoisonEnemy(x, y, hpMult, dmgMult);
    else if (type === 'boss') e = new G.enemy.Boss(x, y, waveNumber);
    else e = new G.enemy.Goblin(x, y, hpMult, dmgMult);

    // ID unik per musuh -- dipakai buat sinkronisasi multiplayer (host <-> guest ngerujuk
    // musuh yang sama pake id ini, bukan berdasar urutan array yang bisa beda-beda).
    e.id = 'e' + (++this._idCounter);
    return e;
  }
};