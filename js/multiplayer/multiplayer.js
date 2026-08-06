// js/multiplayer/multiplayer.js
// Fase 2: sistem party (Buat Party dapet kode / Join Party pake kode) + host tracking.
// Host = sumber kebenaran musuh/HP (dikirim lewat game.js, bukan file ini).
window.G = window.G || {};

G.multiplayer = {
  socket: null,
  connected: false,

  roomCode: null,
  isHost: false,
  hostId: null,

  remotePlayers: {}, // { socketId: { name, raceId, x, y, direction, moving } }

  // Ganti ini ke URL server Render kamu pas udah deploy.
  SERVER_URL: 'http://localhost:3001',

  _ensureSocket() {
    if (this.socket) return;
    this.socket = io(this.SERVER_URL);

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('[MP] konek ke server, id:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.log('[MP] putus dari server');
    });

    this.socket.on('partyCreated', (data) => {
      this.roomCode = data.roomCode;
      console.log('[MP] party dibuat, kode:', data.roomCode);
      if (this.onPartyCreated) this.onPartyCreated(data.roomCode);
    });

    this.socket.on('joinError', (data) => {
      console.warn('[MP] gagal join:', data.message);
      if (this.onJoinError) this.onJoinError(data.message);
    });

    this.socket.on('hostInfo', (data) => {
      this.hostId = data.hostId;
      this.isHost = data.hostId === this.socket.id;
      console.log('[MP] host sekarang:', this.isHost ? '(saya)' : this.hostId);
      if (this.onHostChange) this.onHostChange(this.isHost);
    });

    this.socket.on('currentPlayers', (players) => {
      players.forEach((p) => { this.remotePlayers[p.id] = p; });
    });

    this.socket.on('newPlayer', (p) => {
      this.remotePlayers[p.id] = p;
      console.log('[MP] pemain baru gabung:', p.name);
    });

    this.socket.on('playerMoved', (p) => {
      this.remotePlayers[p.id] = p;
    });

    this.socket.on('playerLeft', ({ id }) => {
      delete this.remotePlayers[id];
    });

    // --- Fase 2: sync musuh ---
    // Guest nerima ini dari host lewat server
    this.socket.on('enemyState', (enemies) => {
      if (this.onEnemyState) this.onEnemyState(enemies);
    });

    // Host nerima laporan "ada yang mukul musuh" dari guest lewat server
    this.socket.on('attackEnemy', (payload) => {
      if (this.onAttackReport) this.onAttackReport(payload);
    });

    // Guest nerima reward exp dari host (pas host konfirmasi kill-nya dari serangan guest ini)
    this.socket.on('killReward', ({ exp }) => {
      if (this.onKillReward) this.onKillReward(exp);
    });
  },

  // Bikin party baru. x,y opsional (posisi awal, boleh dikosongin, nanti dikoreksi otomatis
  // lewat sendPosition begitu game jalan).
  createParty(name, raceId, x, y) {
    this._ensureSocket();
    const emitNow = () => this.socket.emit('createParty', { name, raceId, x: x || 0, y: y || 0 });
    if (this.socket.connected) emitNow();
    else this.socket.once('connect', emitNow);
  },

  // Join party pake kode yang dikasih host
  joinParty(roomCode, name, raceId, x, y) {
    this._ensureSocket();
    const emitNow = () => {
      this.roomCode = roomCode;
      this.socket.emit('joinParty', { roomCode, name, raceId, x: x || 0, y: y || 0 });
    };
    if (this.socket.connected) emitNow();
    else this.socket.once('connect', emitNow);
  },

  sendPosition(x, y, direction, moving) {
    if (!this.connected || !this.roomCode) return;
    this.socket.emit('move', { x, y, direction, moving });
  },

  // Dipanggil HOST doang, kirim snapshot musuh ke semua guest
  sendEnemyState(enemies) {
    if (!this.connected || !this.roomCode || !this.isHost) return;
    this.socket.emit('enemyState', enemies);
  },

  // Dipanggil GUEST doang, lapor "saya mukul musuh id X sekian damage"
  reportAttack(enemyId, damage, isCrit) {
    if (!this.connected || !this.roomCode || this.isHost) return;
    this.socket.emit('attackEnemy', { enemyId, damage, isCrit: !!isCrit });
  },
  // Dipanggil HOST doang, kasih tau server siapa yang dapet exp dari kill ini
  sendKillReward(toId, exp) {
    if (!this.connected || !this.roomCode || !this.isHost || !toId) return;
    this.socket.emit('killReward', { toId, exp });
  },

  getRemotePlayers() {
    return Object.values(this.remotePlayers);
  },

  reset() {
    this.remotePlayers = {};
    this.roomCode = null;
    this.isHost = false;
    this.hostId = null;
  }

  // Callback yang bisa dipasang dari luar (game.js / UI party menu):
  //   G.multiplayer.onPartyCreated = (roomCode) => { ... }
  //   G.multiplayer.onJoinError    = (message) => { ... }
  //   G.multiplayer.onHostChange   = (isHost) => { ... }
  //   G.multiplayer.onEnemyState   = (enemies) => { ... }   // dipanggil di GUEST
  //   G.multiplayer.onAttackReport = (payload) => { ... }   // dipanggil di HOST
};