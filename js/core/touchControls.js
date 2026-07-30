// js/core/touchControls.js
window.G = window.G || {};
G.core = G.core || {};

G.core.touchControls = {
  input: null,
  isTouch: false,
  skillButtons: [],
  skillRowEl: null,

  init(input) {
    this.input = input;
    this.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (!this.isTouch) return;

    document.body.classList.add('touch-device');
    this.skillRowEl = document.getElementById('touch-skill-row');
    this._setupJoystick();
    this._setupButtons();
  },

  _setupJoystick() {
    const base = document.getElementById('touch-joystick-base');
    const knob = document.getElementById('touch-joystick-knob');
    if (!base || !knob) return;

    const maxDist = 40;
    let dragging = false;
    let originX = 0;
    let originY = 0;

    const setKnob = (dx, dy) => {
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    };

    const resetKnob = () => {
      setKnob(0, 0);
      this.input.touchAxis.x = 0;
      this.input.touchAxis.y = 0;
    };

    const handleMove = (clientX, clientY) => {
      const dx = clientX - originX;
      const dy = clientY - originY;
      const dist = Math.min(maxDist, Math.hypot(dx, dy));
      const angle = Math.atan2(dy, dx);
      setKnob(Math.cos(angle) * dist, Math.sin(angle) * dist);

      if (dist > 6) {
        this.input.touchAxis.x = Math.cos(angle);
        this.input.touchAxis.y = Math.sin(angle);
      } else {
        this.input.touchAxis.x = 0;
        this.input.touchAxis.y = 0;
      }
    };

    base.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      const rect = base.getBoundingClientRect();
      originX = rect.left + rect.width / 2;
      originY = rect.top + rect.height / 2;
      dragging = true;
      handleMove(t.clientX, t.clientY);
    }, { passive: false });

    base.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      e.preventDefault();
      const t = e.changedTouches[0];
      handleMove(t.clientX, t.clientY);
    }, { passive: false });

    const endHandler = () => {
      dragging = false;
      resetKnob();
    };
    base.addEventListener('touchend', endHandler);
    base.addEventListener('touchcancel', endHandler);
  },

  _setupButtons() {
    const map = {
      'touch-btn-e': 'KeyE',
      'touch-btn-i': 'KeyI',
      'touch-btn-c': 'KeyC',
      'touch-btn-f': 'KeyF',
      'touch-btn-esc': 'Escape'
    };

    Object.entries(map).forEach(([id, code]) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.input.simulateKeyPress(code);
        btn.classList.add('active');
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.classList.remove('active');
      });
    });
  },

  // Dipanggil tiap frame dari game.js. Bikin ulang tombol skill kalau jumlah
  // skill yang dimiliki player berubah (baru dapet skill baru dari level up),
  // terus update cooldown/level-nya tiap frame.
  syncSkillBar(player) {
    if (!this.isTouch || !this.skillRowEl || !player) return;

    const order = player.skillOrder || [];

    if (this.skillButtons.length !== order.length) {
      this._rebuildSkillButtons(order);
    }

    order.forEach((skillId, i) => {
      const ref = this.skillButtons[i];
      if (!ref) return;

      const def = G.skills.getById(skillId);
      const level = player.skills[skillId] || 1;
      const cd = player.skillCooldowns[skillId] || 0;
      const stats = G.skills.getLevelStats(skillId, level);
      const ready = cd <= 0;
      const buffActive = !!player.skillBuffs[skillId];

      ref.icon.textContent = def ? def.icon : '?';
      ref.lv.textContent = `Lv${level}`;

      if (ready) {
        ref.cd.style.height = '0%';
        ref.cd.textContent = '';
        ref.btn.classList.remove('on-cooldown');
      } else {
        const pct = Math.max(0, Math.min(100, (cd / stats.cooldown) * 100));
        ref.cd.style.height = `${pct}%`;
        ref.cd.textContent = cd.toFixed(1);
        ref.btn.classList.add('on-cooldown');
      }

      ref.btn.classList.toggle('buff-active', buffActive);
    });
  },

  _rebuildSkillButtons(order) {
    this.skillRowEl.innerHTML = '';
    this.skillButtons = order.map((skillId, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'touch-skill-btn';

      const key = document.createElement('span');
      key.className = 'touch-skill-key';
      key.textContent = `${i + 1}`;

      const icon = document.createElement('span');
      icon.className = 'touch-skill-icon';

      const lv = document.createElement('span');
      lv.className = 'touch-skill-lv';

      const cd = document.createElement('span');
      cd.className = 'touch-skill-cd';

      btn.appendChild(cd);
      btn.appendChild(icon);
      btn.appendChild(key);
      btn.appendChild(lv);

      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.input.simulateKeyPress(`Digit${i + 1}`);
        btn.classList.add('active');
      }, { passive: false });

      btn.addEventListener('touchend', (e) => {
        e.preventDefault();
        btn.classList.remove('active');
      });

      this.skillRowEl.appendChild(btn);
      return { btn, icon, lv, cd };
    });
  }
};