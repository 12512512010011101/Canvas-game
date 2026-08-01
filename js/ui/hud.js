// js/ui/hud.js
window.G = window.G || {};
G.ui = G.ui || {};

G.ui.hud = {
  draw(ctx, player, waveManager) {
    ctx.save();

    const pad = 16;
    const barW = 220;
    let y = pad;

    const hpH = 16;
    const hpPct = Math.max(0, player.stats.hp / player.stats.totalMaxHP);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(pad, y, barW, hpH);
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(pad, y, barW * hpPct, hpH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad, y, barW, hpH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.ceil(player.stats.hp)} / ${player.stats.totalMaxHP}`, pad + barW / 2, y + 12);
    y += hpH + 6;

    const expH = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(pad, y, barW, expH);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(pad, y, barW * player.expSystem.progress, expH);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(pad, y, barW, expH);
    y += expH + 8;

    ctx.textAlign = 'left';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(`Level ${player.levelSystem.level}`, pad, y + 12);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#bbb';
    const raceLabel = player.mimicRaceIds && player.mimicRaceIds.length
      ? `${player.race.emoji} ${player.race.name} (copy: ${player.mimicRaceIds.join(' + ')})`
      : `${player.race.emoji} ${player.race.name}`;
    ctx.fillText(raceLabel, pad + 90, y + 12);
    y += 22;

    if (player.poison.active) {
      ctx.fillStyle = '#7cd66b';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`☠ Teracun (${player.poison.timeLeft.toFixed(1)}s)`, pad, y + 10);
      y += 20;
    }

    if (player.awakeningEligible) {
      const isJack = player.awakeningTypes.includes('anomaly');

      if (isJack) {
        const buff = player.skillBuffs.jackOverclock;
        const pct = Math.min(1, player.awakeningMeter / G.CONST.AWAKENING.max);
        const ready = pct >= 1;

        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = buff ? '#ff5fd1' : (ready ? '#ffd75e' : '#c9a6ff');
        let label;
        if (buff) {
          label = `🌀 Overclock x${buff.stacks} (${buff.timeLeft.toFixed(1)}s)`;
          if (ready) label += ' — Tekan F buat nambah stack!';
        } else {
          label = ready ? '🌀 Tekan F untuk Overclock!' : `🌀 Overclock charge ${Math.floor(pct * 100)}%`;
        }
        ctx.fillText(label, pad, y + 9);
        y += 12;

        const barH = 8;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(pad, y, barW, barH);
        ctx.fillStyle = ready ? '#ffd75e' : '#8b5cf6';
        ctx.fillRect(pad, y, barW * pct, barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(pad, y, barW, barH);
        y += barH + 6;
      } else {
        const pct = player.awakeningActive ? 1 : player.awakeningMeter / G.CONST.AWAKENING.max;
        const ready = !player.awakeningActive && pct >= 1;

        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = player.awakeningActive ? '#ff5fd1' : (ready ? '#ffd75e' : '#c9a6ff');
        const label = player.awakeningActive
          ? `⚡ AWAKENING AKTIF! (${player.awakeningTimer.toFixed(1)}s)`
          : (ready ? '⚡ Tekan F untuk Awakening!' : `⚡ Awakening ${Math.floor(pct * 100)}%`);
        ctx.fillText(label, pad, y + 9);
        y += 12;

        const barH = 8;
        ctx.fillStyle = 'rgba(0,0,0,0.55)';
        ctx.fillRect(pad, y, barW, barH);
        ctx.fillStyle = player.awakeningActive ? '#ff5fd1' : (ready ? '#ffd75e' : '#8b5cf6');
        ctx.fillRect(pad, y, barW * pct, barH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(pad, y, barW, barH);
        y += barH + 6;
      }
    }

    ctx.textAlign = 'right';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillStyle = '#fff';
    const waveLabel = waveManager.state === 'intermission'
      ? `Wave ${waveManager.waveNumber + 1} datang dalam ${waveManager.betweenTimer.remaining.toFixed(1)}s`
      : `Wave ${waveManager.waveNumber}${waveManager.currentWave && waveManager.currentWave.isBoss ? ' — BOSS' : ''}`;
    ctx.fillText(waveLabel, G.CONST.CANVAS_W - pad, pad + 12);
    ctx.fillText(`Gold: ${player.gold}`, G.CONST.CANVAS_W - pad, pad + 30);

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