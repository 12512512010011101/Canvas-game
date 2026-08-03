// js/ui/hud.js
// HUD battle bergaya fantasy/RPG klasik: nameplate berukir + banner parchment.
window.G = window.G || {};
G.ui = G.ui || {};

G.ui.hud = {
  // Palet warna tema "ukiran kayu + emas"
  COLORS: {
    panelTop: 'rgba(42, 28, 16, 0.92)',
    panelBottom: 'rgba(24, 15, 8, 0.94)',
    goldOuter: '#e8c96a',
    goldInner: '#8a6a26',
    hpLight: '#ff6b5e',
    hpDark: '#8f1f1a',
    expLight: '#ffe28a',
    expDark: '#b8860b'
  },

  // --- Helper: panel berukir dengan border emas ganda ---
  drawFrame(ctx, x, y, w, h, radius = 8) {
    const r = radius;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();

    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, this.COLORS.panelTop);
    grad.addColorStop(1, this.COLORS.panelBottom);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.lineWidth = 2;
    ctx.strokeStyle = this.COLORS.goldOuter;
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.strokeStyle = this.COLORS.goldInner;
    ctx.beginPath();
    ctx.moveTo(x + r, y + 3);
    ctx.arcTo(x + w - 3, y + 3, x + w - 3, y + h - 3, r);
    ctx.arcTo(x + w - 3, y + h - 3, x + 3, y + h - 3, r);
    ctx.arcTo(x + 3, y + h - 3, x + 3, y + 3, r);
    ctx.arcTo(x + 3, y + 3, x + w - 3, y + 3, r);
    ctx.stroke();
    ctx.restore();
  },

  // --- Helper: medalion bundar buat portrait/emoji ras ---
  drawMedallion(ctx, cx, cy, radius, emoji) {
    ctx.save();
    const grad = ctx.createRadialGradient(cx, cy - radius * 0.3, radius * 0.2, cx, cy, radius);
    grad.addColorStop(0, '#3a2a18');
    grad.addColorStop(1, '#150d06');
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = this.COLORS.goldOuter;
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.COLORS.goldInner;
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = `${Math.floor(radius * 1.1)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji || '❔', cx, cy + 1);
    ctx.restore();
  },

  // --- Helper: gambar 1 bar (HP/EXP/Awakening) dengan gradient + label ---
  drawBar(ctx, x, y, w, h, pct, colorLight, colorDark, label) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x, y, w, h);

    const fillW = Math.max(0, w * Math.min(1, pct));
    if (fillW > 0) {
      const grad = ctx.createLinearGradient(x, y, x, y + h);
      grad.addColorStop(0, colorLight);
      grad.addColorStop(1, colorDark);
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, fillW, h);
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(232, 201, 106, 0.7)';
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    if (label) {
      ctx.font = `bold ${Math.max(9, h - 4)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(label, x + w / 2 + 1, y + h / 2 + 1);
      ctx.fillStyle = '#fff';
      ctx.fillText(label, x + w / 2, y + h / 2);
    }
    ctx.restore();
  },

  // --- Helper: icon dari icons_sheet (koin/heart), fallback ke emoji ---
  drawIcon(ctx, key, x, y, size, fallbackEmoji) {
    const sheet = G.items && G.items.iconImage;
    const rect = G.CONST.ICONS[key];
    if (sheet && rect) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sheet, rect.x, rect.y, rect.w, rect.h, x, y, size, size);
      ctx.restore();
    } else {
      ctx.font = `${size}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(fallbackEmoji || '', x, y);
    }
  },

  draw(ctx, player, waveManager) {
    ctx.save();
    const pad = 14;

    // ============ NAMEPLATE (kiri atas) ============
    const medR = 28;
    const medCx = pad + medR;
    const medCy = pad + medR;

    const plateX = pad + medR * 2 + 10;
    const plateY = pad;
    const plateW = 224;
    const plateH = medR * 2;

    this.drawFrame(ctx, plateX, plateY, plateW, plateH, 10);
    this.drawMedallion(ctx, medCx, medCy, medR, player.race.emoji);

    // Nama level + ras
    const raceLabel = player.mimicRaceIds && player.mimicRaceIds.length
      ? `${player.race.name} (+${player.mimicRaceIds.length})`
      : player.race.name;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillStyle = '#ffe9b0';
    ctx.fillText(`Lv.${player.levelSystem.level}  ${raceLabel}`, plateX + 10, plateY + 16);

    // HP bar
    const hpPct = Math.max(0, player.stats.hp / player.stats.totalMaxHP);
    this.drawBar(
      ctx, plateX + 10, plateY + 22, plateW - 20, 14,
      hpPct, this.COLORS.hpLight, this.COLORS.hpDark,
      `${Math.ceil(player.stats.hp)} / ${player.stats.totalMaxHP}`
    );
    // peringatan kritis: berkedip merah terang kalau HP < 20%
    if (hpPct < 0.2 && hpPct > 0) {
      const pulse = 0.35 + 0.35 * Math.abs(Math.sin(performance.now() / 180));
      ctx.save();
      ctx.globalAlpha = pulse;
      ctx.strokeStyle = '#ff2b2b';
      ctx.lineWidth = 2;
      ctx.strokeRect(plateX + 9, plateY + 21, plateW - 18, 16);
      ctx.restore();
    }

    // EXP bar (tipis, di bawah HP)
    this.drawBar(
      ctx, plateX + 10, plateY + 40, plateW - 20, 7,
      player.expSystem.progress, this.COLORS.expLight, this.COLORS.expDark, null
    );

    let badgeY = plateY + plateH + 8;

    // ============ BADGE STATUS (racun, awakening) ============
    if (player.poison.active) {
      const bw = 150, bh = 20;
      this.drawFrame(ctx, pad, badgeY, bw, bh, 6);
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#8fe27a';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(`☠ Teracun (${player.poison.timeLeft.toFixed(1)}s)`, pad + 8, badgeY + bh / 2 + 1);
      badgeY += bh + 6;
    }

    if (player.awakeningEligible) {
  const bw = 224, bh = 22;
  this.drawFrame(ctx, pad, badgeY, bw, bh, 6);

  const isJack = player.awakeningTypes?.includes('anomaly');

  if (isJack) {
    const buff = player.skillBuffs.jackOverclock;
    const pct = Math.min(1, player.awakeningMeter / G.CONST.AWAKENING.max);
    const ready = pct >= 1;

    const label = buff
      ? `🌀 Overclock x${buff.stacks} (${buff.timeLeft.toFixed(1)}s)${ready ? ' - Tekan F!' : ''}`
      : (ready
          ? '🌀 Tekan F untuk Overclock!'
          : `🌀 Overclock ${Math.floor(pct * 100)}%`);

    this.drawBar(
      ctx,
      pad + 4,
      badgeY + 4,
      bw - 8,
      bh - 8,
      pct,
      ready ? '#ffe28a' : '#c9a6ff',
      ready ? '#b8860b' : '#5b2a9e',
      null
    );

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, pad + 8, badgeY + bh / 2);
  } else {
    const pct = player.awakeningActive ? 1 : player.awakeningMeter / G.CONST.AWAKENING.max;
    const ready = !player.awakeningActive && pct >= 1;

    const label = player.awakeningActive
      ? `⚡ AWAKENING! (${player.awakeningTimer.toFixed(1)}s)`
      : (ready
          ? '⚡ Tekan F untuk Awakening!'
          : `⚡ Awakening ${Math.floor(pct * 100)}%`);

    this.drawBar(
      ctx,
      pad + 4,
      badgeY + 4,
      bw - 8,
      bh - 8,
      pct,
      player.awakeningActive ? '#ff8fe3' : (ready ? '#ffe28a' : '#c9a6ff'),
      player.awakeningActive ? '#a8127e' : (ready ? '#b8860b' : '#5b2a9e'),
      null
    );

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, pad + 8, badgeY + bh / 2);
  }

  badgeY += bh + 6;
    }
    

    // ============ BANNER WAVE + GOLD (kanan atas) ============
    const bannerW = 200;
    const bannerH = 54;
    const bx = G.CONST.CANVAS_W - pad - bannerW;
    const by = pad;
    this.drawFrame(ctx, bx, by, bannerW, bannerH, 10);

    const waveLabel = waveManager.state === 'intermission'
      ? `Wave ${waveManager.waveNumber + 1} dalam ${waveManager.betweenTimer.remaining.toFixed(1)}s`
      : `Wave ${waveManager.waveNumber}${waveManager.currentWave && waveManager.currentWave.isBoss ? ' — BOSS' : ''}`;

    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillStyle = waveManager.currentWave && waveManager.currentWave.isBoss ? '#ff8a65' : '#ffe9b0';
    ctx.fillText(waveLabel, bx + bannerW - 10, by + 22);

    this.drawIcon(ctx, 'coin', bx + 10, by + 30, 18, '🪙');
    ctx.textAlign = 'right';
    ctx.font = 'bold 15px Georgia, serif';
    ctx.fillStyle = '#ffd75e';
    ctx.fillText(`${player.gold}`, bx + bannerW - 10, by + 44);

    this.drawSkillBar(ctx, player);

    ctx.restore();
  },

  drawSkillBar(ctx, player) {
    if (!player.skillOrder || player.skillOrder.length === 0) return;

    const size = 42;
    const gap = 8;
    const count = player.skillOrder.length;
    const totalW = count * size + (count - 1) * gap;
    let x = (G.CONST.CANVAS_W - totalW) / 2;
    const y = G.CONST.CANVAS_H - size - 14;

    player.skillOrder.forEach((skillId, i) => {
      const skillDef = G.skills.getById(skillId);
      const level = player.skills[skillId] || 1;
      const cd = player.skillCooldowns[skillId] || 0;
      const stats = G.skills.getLevelStats(skillId, level);
      const ready = cd <= 0;
      const buffActive = !!player.skillBuffs[skillId];

      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x, y, size, size);
      ctx.strokeStyle = buffActive ? '#ff5fd1' : (ready ? '#6ee08a' : 'rgba(255,255,255,0.25)');
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, size, size);

      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = ready ? 1 : 0.4;
      ctx.fillText(skillDef ? skillDef.icon : '?', x + size / 2, y + size / 2 - 2);
      ctx.globalAlpha = 1;

      if (!ready) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        const pctLeft = cd / stats.cooldown;
        ctx.fillRect(x, y + size * (1 - pctLeft), size, size * pctLeft);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(cd.toFixed(1), x + size / 2, y + size / 2 - 2);
      }

      ctx.fillStyle = '#ffd75e';
      ctx.font = 'bold 9px sans-serif';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`${i + 1}`, x + size / 2, y - 3);
      ctx.fillStyle = '#9fd3ac';
      ctx.fillText(`Lv${level}`, x + size / 2, y + size + 11);
      const stackCount = player.skillBuffs[skillId] ? player.skillBuffs[skillId].stacks : 0;
      if (stackCount > 1) {
        ctx.fillStyle = '#ff5fd1';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`x${stackCount}`, x + 2, y + size - 3);
        ctx.textAlign = 'center';
      }

      ctx.restore();
      x += size + gap;
    });
  }
};
