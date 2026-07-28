// js/ui/skillSelect.js
window.G = window.G || {};
G.ui = G.ui || {};

G.ui.skillSelect = {
  el: null,
  gridEl: null,
  levelEl: null,
  visible: false,
  _onPick: null,

  init() {
    this.el = document.getElementById('skill-select-overlay');
    this.gridEl = document.getElementById('skill-select-grid');
    this.levelEl = document.getElementById('skill-select-level');
  },

  show(player, options, onPick) {
    this._onPick = onPick;
    this.visible = true;
    this.levelEl.textContent = player.levelSystem.level;
    this.gridEl.innerHTML = options.map((o) => this.cardHtml(o)).join('');
    this.attachHandlers();
    this.el.classList.add('visible');
  },

  cardHtml(opt) {
    const s = opt.skill;
    const nextLevel = opt.currentLevel + 1;
    const stats = G.skills.getLevelStats(s.id, nextLevel);
    const tag = opt.currentLevel > 0
      ? `Level ${opt.currentLevel} → ${nextLevel}`
      : 'Skill Baru — Level 1';

    return `
      <button class="race-card skill-card" data-skill="${s.id}">
        <div class="race-card-head">${s.icon} <strong>${s.name}</strong></div>
        <div class="race-card-note skill-card-tag">${tag}</div>
        <div class="race-card-passive">${s.description}</div>
        <div class="race-card-stats skill-card-stats">${G.skills.describe(s.id, stats)}</div>
      </button>
    `;
  },

  attachHandlers() {
    this.gridEl.querySelectorAll('.skill-card').forEach((btn) => {
      btn.onclick = () => {
        const skillId = btn.dataset.skill;
        this.hide();
        if (this._onPick) this._onPick(skillId);
      };
    });
  },

  hide() {
    this.visible = false;
    this.el.classList.remove('visible');
  }
};
