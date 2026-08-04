// js/player/animation.js
// Mengatur pengambilan frame dari assets/player/run_anim_sheet.png
window.G = window.G || {};
G.player = G.player || {};

class Animator {
  constructor(image) {
    this.image = image;
    this.sheet = G.CONST.PLAYER_SHEET;
    this.rowMap = G.CONST.PLAYER_ROW_MAP;

    this.direction = 'down';
    this.moving = false;
    this.frameIndex = 0;
    this.frameTimer = 0;
    this.frameDuration = 0.1; // detik per frame saat lari
  }

  setState(direction, moving) {
    this.direction = direction;
    this.moving = moving;
  }

  update(dt) {
    if (!this.moving) {
      this.frameIndex = 0;
      return;
    }
    this.frameTimer += dt;
    if (this.frameTimer >= this.frameDuration) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % this.sheet.cols;
    }
  }

  draw(ctx, x, y) {
    const { frameW, frameH, scale } = this.sheet;
    const rowInfo = this.rowMap[this.direction] || this.rowMap.down;
    const row = this.moving ? rowInfo.runRow : rowInfo.idleRow;
    const col = this.moving ? this.frameIndex : 0;

    const sx = col * frameW;
    const sy = row * frameH;
    const drawW = frameW * scale;
    const drawH = frameH * scale;

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.image,
      sx, sy, frameW, frameH,
      Math.round(x - drawW / 2), Math.round(y - drawH / 2),
      drawW, drawH
    );
  }
}

G.player.Animator = Animator;

// --- Animator khusus buat race yang punya art sendiri (Demon/Elf/Beast/Dwarf) ---
// Beda sama Animator biasa: sheet-nya BUKAN grid 4-arah (atas/bawah/kiri/kanan), cuma
// 1 sudut pandang (menghadap kanan) dengan sedikit frame buat animasi napas/idle.
// Jadi arah kiri disimulasikan dengan FLIP horizontal, dan arah atas/bawah pakai
// sprite yang sama apa adanya (keterbatasan asset, bukan bug).
class PortraitAnimator {
  constructor(image, frameW, frameH, frameCount, drawHeight) {
    this.image = image;
    this.frameW = frameW;
    this.frameH = frameH;
    this.frameCount = frameCount;
    this.drawHeight = drawHeight;

    this.direction = 'down';
    this.moving = false;
    this.frameIndex = 0;
    this.frameTimer = 0;
  }

  setState(direction, moving) {
    this.direction = direction;
    this.moving = moving;
  }

  update(dt) {
    this.frameTimer += dt;
    // gerak -> gantian frame lebih cepat (kesan jalan), diam -> pelan (kesan napas)
    const frameDuration = this.moving ? 0.15 : 0.5;
    if (this.frameTimer >= frameDuration) {
      this.frameTimer = 0;
      this.frameIndex = (this.frameIndex + 1) % this.frameCount;
    }
  }

  draw(ctx, x, y) {
    const { frameW, frameH, drawHeight } = this;
    const drawW = drawHeight * (frameW / frameH);
    const sx = this.frameIndex * frameW;
    const sy = 0;
    const flip = this.direction === 'left';

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(x), Math.round(y));
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(
      this.image,
      sx, sy, frameW, frameH,
      -drawW / 2, -drawHeight / 2,
      drawW, drawHeight
    );
    ctx.restore();
  }
}

G.player.PortraitAnimator = PortraitAnimator;

// Factory: pilih animator yang cocok berdasarkan race. Kalau race punya art sendiri
// (ada di G.CONST.RACE_ANIM dan gambarnya berhasil dimuat), pakai PortraitAnimator.
// Kalau enggak, fallback ke Animator biasa (run_anim_sheet.png, 4 arah).
G.player.createAnimator = function (images, raceId) {
  const info = G.CONST.RACE_ANIM[raceId];
  const img = images && images.raceSprites && images.raceSprites[raceId];
  if (info && img) {
    return new G.player.PortraitAnimator(img, info.frameW, info.frameH, info.frames, info.drawHeight);
  }
  return new G.player.Animator(images.playerSheet);
};
