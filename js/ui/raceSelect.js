// js/ui/raceSelect.js
window.G = window.G || {};
G.ui = G.ui || {};

G.ui.raceSelect = {
  el: null,
  gridEl: null,
  titleEl: null,
  _onChosen: null,

  init() {
    this.el = document.getElementById('race-select-overlay');
    this.gridEl = document.getElementById('race-grid');
    this.titleEl = document.getElementById('race-select-title');
  },

  starString(n) {
    return '⭐'.repeat(n) + '☆'.repeat(5 - n);
  },

  dmgStars(base) {
    if (base <= 2) return 2;
    if (base <= 3) return 3;
    if (base <= 6) return 4;
    return 5;
  },

  show(onChosen) {
    this._onChosen = onChosen;
    this.renderMainGrid();
    this.el.classList.add('visible');
  },

  hide() {
    this.el.classList.remove('visible');
  },

  renderMainGrid() {
    this.titleEl.textContent = 'Pilih Race';
    this.gridEl.innerHTML = G.player.RACES.map((r) => this.cardHtml(r)).join('');
    this.attachCardHandlers((raceId) => {
      if (raceId === 'anomaly') {
        this.renderMimicGrid([]);
      } else {
        this.finish(raceId, []);
      }
    });
  },

  renderMimicGrid(pickedSoFar) {
    const remaining = 2 - pickedSoFar.length;
    const pickedLabel = pickedSoFar.length
      ? ` (sudah pilih: ${pickedSoFar.join(', ')})`
      : '';
    const self = G.player.RACES.find((r) => r.id === 'anomaly');
    const selfLabel = self ? `${self.emoji} ${self.name}` : '🌀 Jack';
    this.titleEl.textContent = `${selfLabel} — Pilih ${remaining} Passive lagi yang Mau Di-copy${pickedLabel}`;

    const options = G.player.RACES.filter((r) => r.id !== 'anomaly' && !pickedSoFar.includes(r.id));
    this.gridEl.innerHTML = options.map((r) => this.cardHtml(r, true)).join('');
    this.attachCardHandlers((mimicId) => {
      const picked = [...pickedSoFar, mimicId];
      if (picked.length < 2) {
        this.renderMimicGrid(picked);
      } else {
        this.finish('anomaly', picked);
      }
    });
  },

  cardHtml(race, mimicMode = false) {
    return `
      <button class="race-card" data-race="${race.id}">
        <div class="race-card-head">${race.emoji} <strong>${race.name}</strong></div>
        ${race.description ? `<div class="race-card-desc">${race.description}</div>` : ''}
        <div class="race-card-stats">
          <div>DMG ${this.starString(this.dmgStars(race.baseDamage))} <span class="dmg-num">(${race.baseDamage})</span></div>
          <div>HP ${this.starString(race.hpStar)}</div>
          <div>DEF ${this.starString(race.defStar)}</div>
          <div>ATK SPD ${this.starString(race.atkSpdStar)}</div>
          <div>CRIT ${this.starString(race.critStar)}</div>
          <div>XP ${this.starString(race.xpStar)}</div>
        </div>
        <div class="race-card-passive">${mimicMode ? '' : '<strong>Passive:</strong> '}${race.passiveText}</div>
        ${race.tradeoffText ? `<div class="race-card-note">Trade-off: ${race.tradeoffText}</div>` : ''}
        ${race.weaknessText ? `<div class="race-card-note">Weakness: ${race.weaknessText}</div>` : ''}
        ${race.awakeningText ? `<div class="race-card-awakening">Awakening: ${race.awakeningText}</div>` : ''}
      </button>
    `;
  },

  attachCardHandlers(onPick) {
    this.gridEl.querySelectorAll('.race-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.blur();
        onPick(btn.dataset.race);
      });
    });
  },

  finish(raceId, mimicRaceIds) {
    this.hide();
    if (this._onChosen) this._onChosen(raceId, mimicRaceIds);
  }
};