// js/game.js
window.G = window.G || {};

class Game {
  constructor(canvas, assets, raceId = 'human', mimicRaceIds = []) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.assets = assets;
    this.raceId = raceId;
    this.mimicRaceIds = mimicRaceIds;

    this.worldW = G.CONST.CANVAS_W * 2.2;
    this.worldH = G.CONST.CANVAS_H * 2.2;

    this.camera = new G.core.Camera(G.CONST.CANVAS_W, G.CONST.CANVAS_H, this.worldW, this.worldH);
    this.input = G.core.input;

    this.projectiles = [];
    this.chests = [];
    this.floatingTexts = [];
    this.skillEffects = [];

    this.running = false;
    this.lastTime = 0;

    this._setupPlayer();
    this._setupWaveManager();
    this._setupUI();
  }

_setupPlayer() {
    this.player = new G.player.Player(this.worldW / 2, this.worldH / 2, this.assets.playerSheet, this.raceId, this.mimicRaceIds);
    G.items.iconImage = this.assets.iconsSheet;
    G.enemy.sprites = { goblin: this.assets.goblinSheet, witch: this.assets.witchSheet, archer: this.assets.archerSheet };
    const starter = G.items.getById('sword_iron');
    starter.applyTo(this.player);
    this.player.addItem(starter.id);
  }

  _setupWaveManager() {
    this.waveManager = new G.wave.WaveManager(this.worldW, this.worldH);
    this.waveManager.onWaveClear = (waveNum) => {
      const tier = waveNum % 5 === 0 ? 2 : 1;
      this.chests.push(new G.chest.Chest(this.player.x + G.core.rng.range(-80, 80), this.player.y + G.core.rng.range(-80, 80), tier));
      this.pushFloatingText(this.player.x, this.player.y - 40, `Wave ${waveNum} Selesai!`, '#f1c40f');
    };
    this.waveManager.begin();
  }

  _setupUI() {
    G.ui.hud;
    G.ui.inventory.init();
    G.ui.inventory.onItemUsed = (item) => {
      this.pushFloatingText(this.player.x, this.player.y - 40, `Pakai ${item.name}`, '#6ee08a');
    };
    G.ui.statsMenu.init();
    G.chest.chestUI.init();
    G.ui.skillSelect.init();
    G.ui.pause.init({
      onRestart: () => this.restart(),
      onSave: () => {
        G.core.save.write({
          bestWave: Math.max(this.waveManager.waveNumber, (G.core.save.read() || {}).bestWave || 0),
          bestLevel: Math.max(this.player.levelSystem.level, (G.core.save.read() || {}).bestLevel || 1)
        });
        this.pushFloatingText(this.player.x, this.player.y - 40, 'Game disimpan', '#2ecc71');
      }
    });
    G.ui.gameOver.init({ onRestart: () => this.restart() });
  }

  pushFloatingText(x, y, text, color) {
    this.floatingTexts.push({ x, y, text, color, life: 1.2, vy: -30 });
  }

  spawnProjectile(config) {
    this.projectiles.push({ ...config, life: 4 });
  }

  spawnSkillEffect(config) {
    this.skillEffects.push(config);
  }

  handleGlobalKeys() {
    if (this.input.wasPressed('Escape')) G.ui.pause.toggle();
    if (this.input.wasPressed('KeyI')) G.ui.inventory.toggle(this.player);
    if (this.input.wasPressed('KeyC')) G.ui.statsMenu.toggle(this.player);
    if (this.input.wasPressed('KeyE')) this.tryOpenChest();
  }

  tryOpenChest() {
    for (const chest of this.chests) {
      if (!chest.opened && chest.playerNearby(this.player)) {
        const loot = chest.open(this.player);
        if (loot) {
          loot.items.forEach((item) => {
            if (item.type === 'armor_set') {
              item.applyTo(this.player);
            } else if (item.type === 'consumable') {
              this.player.addItem(item.id);
            } else {
              if (!this.player.inventory.includes(item.id)) {
                item.applyTo(this.player);
                this.player.addItem(item.id);
              }
            }
          });
          this.player.gold += loot.gold;
          G.chest.chestUI.show(loot);

          if (G.ui.inventory.visible) G.ui.inventory.render(this.player);
        }
        break;
      }
    }
  }

  updateProjectiles(dt) {
    this.projectiles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });

    this.projectiles.forEach((p) => {
      if (p.owner !== 'enemy' || p.life <= 0) return;
      const dist = G.utils.math.distance(p.x, p.y, this.player.x, this.player.y);
      if (dist < p.radius + this.player.radius) {
        this.player.takeDamage(p.damage);
        p.life = 0;
      }
    });

    this.projectiles.forEach((p) => {
      if (p.owner !== 'player' || p.life <= 0) return;
      this.waveManager.enemies.forEach((enemy) => {
        if (enemy.dead || p.life <= 0) return;
        const dist = G.utils.math.distance(p.x, p.y, enemy.x, enemy.y);
        if (dist < p.radius + enemy.radius) {
          enemy.takeDamage(p.damage);
          p.life = 0;
          this.pushFloatingText(enemy.x, enemy.y - 16, `${p.damage}`, '#4aa3ff');
          if (enemy.dead) {
            this.player.registerKill();
            const levels = this.player.grantExp(enemy.expReward);
            if (levels > 0) this.pushFloatingText(this.player.x, this.player.y - 30, 'LEVEL UP!', '#2ecc71');
          }
        }
      });
    });

    this.projectiles = this.projectiles.filter((p) => p.life > 0);
  }

  update(dt) {
    if (G.ui.pause.paused || G.ui.skillSelect.visible) return;

    this.handleGlobalKeys();

    this.player.update(dt, this.input, this.waveManager.enemies, this.worldW, this.worldH, {
      spawnProjectile: (cfg) => this.spawnProjectile(cfg),
      spawnEffect: (cfg) => this.spawnSkillEffect(cfg),
      onHitEnemy: (enemy, dmg, isCrit) => {
        this.pushFloatingText(enemy.x, enemy.y - 16, `${dmg}${isCrit ? '!' : ''}`, isCrit ? '#f39c12' : '#fff');
        if (enemy.dead) {
          this.player.registerKill();
          const levels = this.player.grantExp(enemy.expReward);
          if (levels > 0) this.pushFloatingText(this.player.x, this.player.y - 30, 'LEVEL UP!', '#2ecc71');
        }
      }
    });

    this.waveManager.update(dt, this.player);
    this.waveManager.enemies.forEach((enemy) => {
      if (enemy.type === 'archer') {
        enemy.update(dt, this.player, (cfg) => this.spawnProjectile(cfg));
      } else if (enemy.type === 'boss') {
        enemy.update(dt, this.player, (cfg) => this.spawnProjectile(cfg), () => {});
      } else {
        enemy.update(dt, this.player, () => {});
      }
    });

    const enemies = this.waveManager.enemies;
    for (let i = 0; i < enemies.length; i++) {
      for (let j = i + 1; j < enemies.length; j++) {
        G.core.collision.resolveCircle(enemies[i], enemies[j]);
      }
    }

    this.updateProjectiles(dt);

    this.floatingTexts.forEach((f) => {
      f.y += f.vy * dt;
      f.life -= dt;
    });
    this.floatingTexts = this.floatingTexts.filter((f) => f.life > 0);

    this.skillEffects.forEach((e) => { e.life -= dt; });
    this.skillEffects = this.skillEffects.filter((e) => e.life > 0);

    this.camera.follow(this.player.x, this.player.y);

    if (this.player.pendingSkillChoices > 0) {
      this.openSkillChoice();
      return;
    }

    if (this.player.stats.isDead()) {
      if (this.player.tryRevive()) {
        this.pushFloatingText(this.player.x, this.player.y - 40, 'REVIVE!', '#c48bf5');
      } else {
        this.running = false;
        G.ui.gameOver.show(this.waveManager, this.player);
      }
    }
  }

  openSkillChoice() {
    const options = G.player.skills.rollChoices(this.player, G.CONST.SKILL.choiceCount);
    if (options.length === 0) {
      // semua skill udah maksimal, gak ada lagi yang bisa ditawarkan
      this.player.pendingSkillChoices = 0;
      return;
    }
    G.ui.skillSelect.show(this.player, options, (skillId) => {
      G.player.skills.learn(this.player, skillId);
      this.player.pendingSkillChoices = Math.max(0, this.player.pendingSkillChoices - 1);
      const def = G.skills.getById(skillId);
      const level = this.player.skills[skillId];
      this.pushFloatingText(this.player.x, this.player.y - 40, `${def.icon} ${def.name} Lv${level}!`, '#ffd75e');
    });
  }

  drawBackground() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1c2b1e';
    ctx.fillRect(0, 0, G.CONST.CANVAS_W, G.CONST.CANVAS_H);

    const tile = G.CONST.TILE_SIZE;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    const offsetX = -this.camera.x % tile;
    const offsetY = -this.camera.y % tile;
    for (let x = offsetX; x < G.CONST.CANVAS_W; x += tile) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, G.CONST.CANVAS_H); ctx.stroke();
    }
    for (let y = offsetY; y < G.CONST.CANVAS_H; y += tile) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(G.CONST.CANVAS_W, y); ctx.stroke();
    }
  }

  draw() {
    const ctx = this.ctx;
    this.drawBackground();

    this.chests.forEach((c) => c.draw(ctx, this.camera, c.playerNearby(this.player)));

    const drawables = [...this.waveManager.enemies, this.player].sort((a, b) => a.y - b.y);
    drawables.forEach((d) => d.draw(ctx, this.camera));

    this.drawSkillEffects(ctx);

    this.projectiles.forEach((p) => {
      const s = this.camera.worldToScreen(p.x, p.y);
      if (p.owner === 'player' && p.sprite && this.assets[p.sprite]) {
        const rect = G.CONST.BULLET_ICON;
        const size = p.radius * 4;
        ctx.save();
        const angle = Math.atan2(p.vy, p.vx);
        ctx.translate(s.x, s.y);
        ctx.rotate(angle);
        ctx.drawImage(this.assets[p.sprite], rect.x, rect.y, rect.w, rect.h, -size / 2, -size / 2, size, size);
        ctx.restore();
      } else {
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(s.x, s.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    this.floatingTexts.forEach((f) => {
      const s = this.camera.worldToScreen(f.x, f.y);
      ctx.globalAlpha = Math.max(0, f.life);
      ctx.fillStyle = f.color;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(f.text, s.x, s.y);
      ctx.globalAlpha = 1;
    });

    G.ui.hud.draw(ctx, this.player, this.waveManager);
    G.core.touchControls.syncSkillBar(this.player);
  
  }

  drawSkillEffects(ctx) {
    this.skillEffects.forEach((e) => {
      const t = G.utils.math.clamp(e.life / e.maxLife, 0, 1); // 1 = baru muncul, 0 = mau hilang
      const s = this.camera.worldToScreen(e.x !== undefined ? e.x : e.x1, e.y !== undefined ? e.y : e.y1);

      ctx.save();

      if (e.type === 'tornado') {
        // 3 cincin putus-putus berputar, radiusnya menyusut (visualisasi tarikan angin)
        ctx.globalAlpha = 0.55 * t;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 2;
        const shrink = e.radius * (0.35 + 0.65 * t);
        for (let i = 0; i < 3; i++) {
          const spin = (performance.now() / 150) * (i % 2 === 0 ? 1 : -1) + i;
          ctx.setLineDash([10, 8]);
          ctx.lineDashOffset = spin * 10;
          ctx.beginPath();
          ctx.arc(s.x, s.y, shrink * (1 - i * 0.22), 0, Math.PI * 2);
          ctx.stroke();
        }
      } else if (e.type === 'burst_ring') {
        // ring melebar & memudar, dipakai buat buff self-cast (Tortoise/Courage/Elf/Hawk Eye)
        ctx.globalAlpha = t;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, e.radius * (1 - t) + e.radius * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      } else if (e.type === 'shockwave') {
        // ring melebar dari 0 sampai radius penuh (Intimidate)
        ctx.globalAlpha = 0.7 * t;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(s.x, s.y, e.radius * (1 - t), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 0.15 * t;
        ctx.fillStyle = e.color;
        ctx.fill();
      } else if (e.type === 'cone') {
        // wedge/fan di arah hadap player (Earth Splitter)
        const baseAngle = Math.atan2(e.dir.y, e.dir.x);
        const spread = Math.PI * 0.45;
        ctx.globalAlpha = 0.4 * t;
        ctx.fillStyle = e.color;
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.arc(s.x, s.y, e.range, baseAngle - spread, baseAngle + spread);
        ctx.closePath();
        ctx.fill();
      } else if (e.type === 'trail') {
        // afterimage garis dari titik awal ke titik akhir dash (Shadow Dash)
        const s2 = this.camera.worldToScreen(e.x2, e.y2);
        ctx.globalAlpha = 0.7 * t;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 10 * t + 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s2.x, s2.y);
        ctx.stroke();
      } else if (e.type === 'spin') {
        // beberapa bilah berputar cepat di sekitar player (Blade Dance)
        ctx.globalAlpha = 0.8 * t;
        ctx.strokeStyle = e.color;
        ctx.lineWidth = 3;
        const spin = performance.now() / 40;
        for (let i = 0; i < 4; i++) {
          const ang = spin + (i * Math.PI) / 2;
          ctx.beginPath();
          ctx.arc(s.x, s.y, e.radius, ang, ang + Math.PI * 0.4);
          ctx.stroke();
        }
      }

      ctx.restore();
    });
  }

  loop(timestamp) {
    if (!this.running) return;
    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000 || 0);
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();
    this.input.endFrame();

    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  restart(raceId, mimicRaceIds) {
    G.ui.pause.hide();
    G.ui.gameOver.hide();
    G.ui.skillSelect.hide();
    this.raceId = raceId || this.raceId;
    this.mimicRaceIds = mimicRaceIds !== undefined ? mimicRaceIds : this.mimicRaceIds;

    this.waveManager = new G.wave.WaveManager(this.worldW, this.worldH);
    this._setupWaveManager();
    this._setupPlayer();
    this.chests = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.skillEffects = [];
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }
}

G.Game = Game;