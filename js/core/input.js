// js/core/input.js
window.G = window.G || {};
G.core = G.core || {};

class Input {
  constructor() {
    this.keys = new Set();
    this.justPressed = new Set();
    this.mouse = { x: 0, y: 0, down: false, justClicked: false };
    this.touchAxis = { x: 0, y: 0 };
    this._canvas = null;
  }

  init(canvas) {
    this._canvas = canvas;
    const GAME_KEYS = new Set([
      'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyI', 'KeyC', 'KeyF', 'Escape',
      'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9'
    ]);
    window.addEventListener('keydown', (e) => {
      if (GAME_KEYS.has(e.code)) {
        e.preventDefault();
      }
      if (!this.keys.has(e.code)) this.justPressed.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      this.mouse.y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    });
    canvas.addEventListener('mousedown', () => {
      this.mouse.down = true;
      this.mouse.justClicked = true;
    });
    window.addEventListener('mouseup', () => {
      this.mouse.down = false;
    });
  }

  isDown(code) {
    return this.keys.has(code);
  }
  wasPressed(code) {
    return this.justPressed.has(code);
  }

  simulateKeyPress(code) {
    this.justPressed.add(code);
  }

  endFrame() {
    this.justPressed.clear();
    this.mouse.justClicked = false;
  }

  getAxis() {
    let x = 0, y = 0;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) y -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) y += 1;

    if (this.touchAxis.x !== 0 || this.touchAxis.y !== 0) {
      x = this.touchAxis.x;
      y = this.touchAxis.y;
    }
    return { x, y };
  }
}

G.core.Input = Input;
G.core.input = new Input();