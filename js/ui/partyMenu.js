// js/ui/partyMenu.js
// Ngatur modal "Main Bareng" (Buat Party / Join Party / Main Solo).
// Dipanggil dari main.js SETELAH race dipilih, SEBELUM game beneran dimulai.
window.G = window.G || {};
G.ui = G.ui || {};

G.ui.partyMenu = {
  init() {
    this.el = document.getElementById('party-modal');
    this.stepChoose = document.getElementById('party-step-choose');
    this.stepJoin = document.getElementById('party-step-join');
    this.stepWaiting = document.getElementById('party-step-waiting');
    this.codeInput = document.getElementById('party-code-input');
    this.codeDisplay = document.getElementById('party-code-display');
    this.joinError = document.getElementById('party-join-error');

    document.getElementById('btn-create-party').addEventListener('click', () => this._createParty());
    document.getElementById('btn-join-party').addEventListener('click', () => this._showStep('join'));
    document.getElementById('btn-party-cancel').addEventListener('click', () => this._finishSolo());
    document.getElementById('btn-join-party-submit').addEventListener('click', () => this._joinParty());
    document.getElementById('btn-join-party-back').addEventListener('click', () => this._showStep('choose'));
    document.getElementById('btn-party-start').addEventListener('click', () => this._finish());
  },

  // raceId/mimicRaceIds: race yang udah dipilih pemain sebelum modal ini muncul
  // onDone(raceId, mimicRaceIds): dipanggil begitu siap lanjut ke game (solo/host/guest)
  show(raceId, mimicRaceIds, onDone) {
    this._raceId = raceId;
    this._mimicRaceIds = mimicRaceIds;
    this._onDone = onDone;
    this.joinError.textContent = '';
    this.codeInput.value = '';
    this._showStep('choose');
    this.el.classList.add('visible');
  },

  hide() {
    this.el.classList.remove('visible');
  },

  _showStep(step) {
    this.stepChoose.style.display = step === 'choose' ? 'block' : 'none';
    this.stepJoin.style.display = step === 'join' ? 'block' : 'none';
    this.stepWaiting.style.display = step === 'waiting' ? 'block' : 'none';
  },

  _createParty() {
    G.multiplayer.onPartyCreated = (roomCode) => {
      this.codeDisplay.textContent = roomCode;
      this._showStep('waiting');
    };
    G.multiplayer.createParty('Player', this._raceId);
  },

  _joinParty() {
    const code = this.codeInput.value.trim();
    if (!code) return;

    this.joinError.textContent = 'Nyambung...';
    G.multiplayer.onJoinError = (msg) => {
      this.joinError.textContent = msg;
    };
    G.multiplayer.joinParty(code, 'Player', this._raceId);

    // gak ada event "berhasil join" yang eksplisit selain hostInfo/currentPlayers,
    // jadi kita kasih jeda dikit: kalau dalam 500ms gak ada error, anggap berhasil & lanjut
    const errBefore = this.joinError.textContent;
    setTimeout(() => {
      if (this.joinError.textContent === errBefore) this._finish();
    }, 500);
  },

  _finish() {
    this.hide();
    if (this._onDone) this._onDone(this._raceId, this._mimicRaceIds);
  },

  _finishSolo() {
    this.hide();
    if (this._onDone) this._onDone(this._raceId, this._mimicRaceIds);
  }
};