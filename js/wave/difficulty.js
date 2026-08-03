// js/wave/difficulty.js
window.G = window.G || {};
G.wave = G.wave || {};

G.wave.difficulty = {

hpMultiplierFor(waveNumber) {
  return 1 + (waveNumber * 0.5);
},

dmgMultiplierFor(waveNumber) {
  return 1 + (waveNumber * 0.2);
},

  // Jumlah musuh
  enemyCountFor(waveNumber) {
    return Math.round(
      G.CONST.WAVE.baseEnemyCount +
      waveNumber * G.CONST.WAVE.countPerWave
    );
  },

  isBossWave(waveNumber) {
    return waveNumber % 5 === 0;
  }

};