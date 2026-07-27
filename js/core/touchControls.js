// js/core/touchControls.js
window.G = window.G || {};
G.core = G.core || {};

G.core.touchControls = {
  input: null,
  isTouch: false,

  init(input) {
    this.input = input;
    this.isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    if (!this.isTouch) return;

    document.body.classList.add('touch-device');
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
  }
};  