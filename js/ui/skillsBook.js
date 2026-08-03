// js/ui/skillsBook.js
// Referensi semua skill (buka dari main menu, tombol "📖 Skills") — cuma buat dibaca,
// gak ada aksi pilih. Menampilkan angka level 1 & level maksimal (5) biar jelas
// seberapa kuat tiap skill pas udah di-maksimalin.
window.G = window.G || {};
G.ui = G.ui || {};

// Skill yang bertipe "buff diri sendiri" — sama kayak BUFF_SKILL_IDS di js/player/skills.js.
// (didefinisikan ulang di sini biar file ini gak bergantung urutan <script> ke skills.js)
const SKILLS_BOOK_BUFF_IDS = ['tortoise', 'courage', 'elfblessing', 'hawkeye'];

G.ui.skillsBook = {
  el: null,
  gridEl: null,

  init() {
    this.el = document.getElementById('skills-book-overlay');
    this.gridEl = document.getElementById('skills-book-grid');

    document.getElementById('btn-skills-book').addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.show();
    });
    document.getElementById('btn-skills-book-close').addEventListener('click', (e) => {
      e.currentTarget.blur();
      this.hide();
    });
    // klik area gelap di luar menu-box buat nutup juga
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.hide();
    });
  },

  cardHtml(skill) {
    const isBuff = SKILLS_BOOK_BUFF_IDS.includes(skill.id);
    const lvl1 = G.skills.getLevelStats(skill.id, 1);
    const lvlMax = G.skills.getLevelStats(skill.id, G.skills.MAX_LEVEL);

    const toggleNote = isBuff
      ? `<div class="skill-card-toggle">🔁 Toggle: pencet aktifin (selamanya), pencet lagi nonaktifin + cooldown.</div>`
      : '';
    const jackNote = isBuff
      ? `<div class="skill-card-jack">🌀 Jack: pencet lagi = tambah stack (maks 15, tiap stack 6 detik), bukan cooldown.</div>`
      : '';

    return `
      <div class="race-card static">
        <div class="race-card-head">${skill.icon} <strong>${skill.name}</strong></div>
        <div class="race-card-passive">${skill.description}</div>
        ${toggleNote}
        ${jackNote}
        <div class="race-card-stats">
          <div><strong>Lv1:</strong> ${G.skills.describe(skill.id, lvl1)}</div>
          <div><strong>Lv${G.skills.MAX_LEVEL} (maks):</strong> ${G.skills.describe(skill.id, lvlMax)}</div>
        </div>
      </div>
    `;
  },

  show() {
    this.gridEl.innerHTML = G.skills.LIST.map((s) => this.cardHtml(s)).join('');
    this.el.classList.add('visible');
  },

  hide() {
    this.el.classList.remove('visible');
  }
};