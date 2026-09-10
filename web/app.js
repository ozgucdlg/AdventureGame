(function () {
  const state = { sessionId: null };

  const SPRITES = {
    Samurai: '🥷',
    Archer: '🏹',
    Cavailer: '🛡️',
    Cavalier: '🛡️',
    Zombie: '🧟',
    Vampire: '🧛',
    Bear: '🐻'
  };
  function spriteFor(name) {
    return SPRITES[name] || '❔';
  }

  const OPTION_ICONS = {
    Samurai: '🥷', Archer: '🏹', Cavalier: '🛡️',
    'Safe House': '🏠', Cave: '🕳️', Forest: '🌲', Lake: '🌊', Store: '🏪',
    Fight: '⚔️', Flee: '🏃', Attack: '🗡️',
    Guns: '🔫', Armor: '🛡️', Exit: '🚪',
    Tabanca: '🔫', Kilic: '🗡️', Tufek: '🔫',
    'Light Armor': '🥋', 'Middle Armor': '🦺', 'Heavy Armor': '🛡️',
    'Play Again': '🔁'
  };

  const ANIM_STEP = 650;

  const SCENE_LABELS = {
    Intro: '📍 Intro',
    MainMenu: '📍 Camp',
    SafeHouse: '🏠 Safe House',
    Cave: '🕳️ Cave',
    Forest: '🌲 Forest',
    River: '🌊 River',
    Store: '🏪 Store',
    GameOver: '💀 Defeat',
    Victory: '🏆 Victory'
  };

  // Small self-contained sound engine (Web Audio API, synthesized -- no audio files).
  const Sound = (function () {
    let ctx = null, masterGain = null, musicGain = null, sfxGain = null;
    let ambientTimer = null, ambientStep = 0, muted = false;
    const AMBIENT_NOTES = [220, 262, 294, 330];

    function ensureCtx() {
      if (!ctx) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        ctx = new Ctx();
        masterGain = ctx.createGain();
        masterGain.gain.value = muted ? 0 : 1;
        masterGain.connect(ctx.destination);
        musicGain = ctx.createGain();
        musicGain.gain.value = 0.06;
        musicGain.connect(masterGain);
        sfxGain = ctx.createGain();
        sfxGain.gain.value = 0.25;
        sfxGain.connect(masterGain);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function tone(freq, dur, type, dest, delay, vol) {
      const c = ensureCtx();
      if (!c) return;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = type || 'square';
      osc.frequency.value = freq;
      osc.connect(g);
      g.connect(dest);
      const t0 = c.currentTime + (delay || 0);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(vol == null ? 1 : vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    }

    function click() {
      const c = ensureCtx();
      if (!c) return;
      tone(520, 0.06, 'square', sfxGain);
    }
    function playerAttack() {
      const c = ensureCtx();
      if (!c) return;
      tone(660, 0.08, 'square', sfxGain);
    }
    function hit() {
      const c = ensureCtx();
      if (!c) return;
      tone(140, 0.12, 'sawtooth', sfxGain);
      tone(90, 0.15, 'square', sfxGain, 0.02);
    }
    function defeat() {
      const c = ensureCtx();
      if (!c) return;
      [440, 370, 300, 220].forEach((f, i) => tone(f, 0.18, 'triangle', sfxGain, i * 0.09));
    }
    function victory() {
      const c = ensureCtx();
      if (!c) return;
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'square', sfxGain, i * 0.11));
    }
    function gameOver() {
      const c = ensureCtx();
      if (!c) return;
      tone(180, 0.5, 'sawtooth', sfxGain);
      tone(120, 0.6, 'sawtooth', sfxGain, 0.15);
    }
    function startAmbient() {
      const c = ensureCtx();
      if (!c || ambientTimer) return;
      ambientTimer = setInterval(() => {
        const f = AMBIENT_NOTES[ambientStep % AMBIENT_NOTES.length];
        tone(f, 1.8, 'sine', musicGain, 0, 0.5);
        ambientStep++;
      }, 1400);
    }
    function setMuted(m) {
      muted = m;
      if (masterGain) masterGain.gain.value = m ? 0 : 1;
    }
    function isMuted() {
      return muted;
    }

    return { ensureCtx, click, playerAttack, hit, defeat, victory, gameOver, startAmbient, setMuted, isMuted };
  })();

  const logEl = document.getElementById('log');
  const optionsEl = document.getElementById('options');
  const textRow = document.getElementById('textInputRow');
  const nameInput = document.getElementById('nameInput');
  const nameSubmit = document.getElementById('nameSubmit');
  const restartBtn = document.getElementById('restartBtn');
  const muteBtn = document.getElementById('muteBtn');
  const sceneBadge = document.getElementById('sceneBadge');
  const logPanel = document.getElementById('logPanel');
  const playerCard = document.getElementById('playerCard');
  const enemyCard = document.getElementById('enemyCard');

  const arena = document.getElementById('arena');
  const arenaPlayerBox = document.getElementById('arenaPlayer');
  const arenaEnemyBox = document.getElementById('arenaEnemy');
  const arenaPlayerSprite = document.getElementById('arenaPlayerSprite');
  const arenaPlayerName = document.getElementById('arenaPlayerName');
  const arenaEnemySprite = document.getElementById('arenaEnemySprite');
  const arenaEnemyName = document.getElementById('arenaEnemyName');

  function appendLog(lines) {
    for (const line of lines) {
      const div = document.createElement('div');
      div.className = 'log-line';
      div.textContent = line;
      logEl.appendChild(div);
    }
    logEl.scrollTop = logEl.scrollHeight;
  }

  function renderOptions(view) {
    optionsEl.innerHTML = '';
    if (!view.options || view.options.length === 0) {
      optionsEl.hidden = true;
      return;
    }
    optionsEl.hidden = false;
    for (const opt of view.options) {
      const btn = document.createElement('button');
      btn.className = 'option-btn';

      const title = document.createElement('span');
      title.className = 'option-title';
      const icon = OPTION_ICONS[opt.label];
      title.textContent = (icon ? icon + ' ' : '') + opt.label;
      btn.appendChild(title);

      if (opt.detail) {
        const detail = document.createElement('span');
        detail.className = 'option-detail';
        detail.textContent = opt.detail;
        btn.appendChild(detail);
      }

      btn.addEventListener('click', () => {
        Sound.click();
        sendAction(opt.type, opt.value);
      });
      optionsEl.appendChild(btn);
    }
  }

  function setOptionsEnabled(enabled) {
    optionsEl.querySelectorAll('button').forEach((b) => { b.disabled = !enabled; });
  }

  function renderScene(view) {
    const scene = view.scene || 'MainMenu';
    logPanel.dataset.scene = scene;
    sceneBadge.textContent = SCENE_LABELS[scene] || ('📍 ' + scene);
  }

  function burstParticles(box, emojis) {
    for (let i = 0; i < emojis.length; i++) {
      const el = document.createElement('div');
      el.className = 'floating-particle';
      el.textContent = emojis[i];
      el.style.left = (40 + Math.random() * 20) + '%';
      el.style.top = '10%';
      el.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px');
      box.appendChild(el);
      el.addEventListener('animationend', () => el.remove());
    }
  }

  function hasTerminalEvent(events) {
    return (events || []).some((e) => e.type === 'victory' || e.type === 'gameOver');
  }

  function renderArena(view) {
    const inBattle = view.state === 'BATTLE_DECISION' || view.state === 'COMBAT';
    const show = inBattle || hasTerminalEvent(view.events);
    if (!show) {
      arena.hidden = true;
      return;
    }
    arena.hidden = false;
    if (view.player) {
      arenaPlayerSprite.textContent = spriteFor(view.player.class);
      arenaPlayerName.textContent = view.player.name || 'You';
    }
    if (view.enemy) {
      arenaEnemySprite.textContent = spriteFor(view.enemy.name);
      arenaEnemyName.textContent = view.enemy.name + ' (' + view.enemy.index + '/' + view.enemy.total + ')';
    } else if (inBattle) {
      arenaEnemySprite.textContent = '❔';
      arenaEnemyName.textContent = '???';
    }
    // else: enemy already null because the battle just ended (victory/gameOver) --
    // leave the last-shown sprite in place so its animation stays visible.
  }

  function floatDamage(box, text, cls) {
    const el = document.createElement('div');
    el.className = 'floating-damage ' + (cls || '');
    el.textContent = text;
    box.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  function dmgText(amount) {
    return amount > 0 ? ('-' + amount) : 'Blocked!';
  }

  function runEvent(ev) {
    if (ev.type === 'playerAttack') {
      Sound.playerAttack();
      arenaPlayerBox.classList.add('lunge');
      arenaEnemyBox.classList.add('hit');
      floatDamage(arenaEnemyBox, dmgText(ev.amount), 'enemy-dmg');
      setTimeout(() => {
        arenaPlayerBox.classList.remove('lunge');
        arenaEnemyBox.classList.remove('hit');
      }, 400);
    } else if (ev.type === 'enemyAttack') {
      Sound.hit();
      arenaEnemyBox.classList.add('lunge');
      arenaPlayerBox.classList.add('hit');
      floatDamage(arenaPlayerBox, dmgText(ev.amount), 'player-dmg');
      setTimeout(() => {
        arenaEnemyBox.classList.remove('lunge');
        arenaPlayerBox.classList.remove('hit');
      }, 400);
    } else if (ev.type === 'enemyDefeated') {
      Sound.defeat();
      arenaEnemyBox.classList.add('defeated');
      setTimeout(() => arenaEnemyBox.classList.remove('defeated'), 550);
    } else if (ev.type === 'victory') {
      Sound.victory();
      arenaPlayerBox.classList.add('cheer');
      burstParticles(arenaPlayerBox, ['✨', '🎉', '⭐']);
      setTimeout(() => arenaPlayerBox.classList.remove('cheer'), 1200);
    } else if (ev.type === 'gameOver') {
      Sound.gameOver();
      arenaPlayerBox.classList.add('defeated');
    }
  }

  function playEvents(events) {
    if (!events || events.length === 0) return 0;
    let delay = 0;
    for (const ev of events) {
      setTimeout(() => runEvent(ev), delay);
      delay += ANIM_STEP;
    }
    return delay;
  }

  function renderPlayer(p) {
    if (!p || !p.class) {
      playerCard.hidden = true;
      return;
    }
    playerCard.hidden = false;
    document.getElementById('pName').textContent = spriteFor(p.class) + ' ' + p.name;
    document.getElementById('pClass').textContent = p.class;
    document.getElementById('pHealth').textContent = p.health + ' / ' + p.maxHealth;
    const pct = Math.max(0, Math.min(100, (p.health / Math.max(1, p.maxHealth)) * 100));
    document.getElementById('pHealthBar').style.width = pct + '%';
    document.getElementById('pDamage').textContent = p.totalDamage;
    document.getElementById('pMoney').textContent = p.money;
    document.getElementById('pWeapon').textContent = p.weapon || '—';
    document.getElementById('pArmor').textContent = p.armor || '—';
    document.getElementById('invFood').classList.toggle('on', p.food);
    document.getElementById('invWater').classList.toggle('on', p.water);
    document.getElementById('invFirewood').classList.toggle('on', p.firewood);
  }

  function renderEnemy(e) {
    if (!e) {
      enemyCard.hidden = true;
      return;
    }
    enemyCard.hidden = false;
    document.getElementById('eName').textContent = spriteFor(e.name) + ' ' + e.name;
    document.getElementById('eHealth').textContent = e.health;
    const pct = Math.max(0, Math.min(100, (e.health / Math.max(1, e.maxHealth)) * 100));
    document.getElementById('eHealthBar').style.width = pct + '%';
    document.getElementById('eDamage').textContent = e.damage;
    document.getElementById('eProgress').textContent = e.index + ' of ' + e.total;
  }

  function render(view) {
    appendLog(view.log || []);
    renderScene(view);
    renderArena(view);
    renderPlayer(view.player);
    renderEnemy(view.enemy);
    renderOptions(view);

    textRow.hidden = view.inputType !== 'text';
    if (view.inputType === 'text') {
      nameInput.value = '';
      nameInput.focus();
    }

    restartBtn.hidden = !view.gameOver;

    const totalDelay = playEvents(view.events);
    if (totalDelay > 0) {
      setOptionsEnabled(false);
      setTimeout(() => setOptionsEnabled(true), totalDelay);
    }

    const inBattle = view.state === 'BATTLE_DECISION' || view.state === 'COMBAT';
    if (!inBattle && hasTerminalEvent(view.events)) {
      setTimeout(() => { arena.hidden = true; }, totalDelay + 300);
    }
  }

  async function post(url, params) {
    const body = new URLSearchParams(params).toString();
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    return res.json();
  }

  async function sendAction(type, value) {
    const view = await post('/api/action', { sessionId: state.sessionId, type, value });
    render(view);
  }

  async function begin() {
    const view = await post('/api/new', {});
    state.sessionId = view.sessionId;
    render(view);
  }

  nameSubmit.addEventListener('click', () => {
    const val = nameInput.value.trim();
    if (!val) return;
    sendAction('name', val);
  });
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') nameSubmit.click();
  });
  restartBtn.addEventListener('click', () => sendAction('restart', ''));

  let audioStarted = false;
  function startAudioOnce() {
    if (audioStarted) return;
    audioStarted = true;
    Sound.ensureCtx();
    Sound.startAmbient();
  }
  document.addEventListener('click', startAudioOnce, { once: true });

  muteBtn.addEventListener('click', () => {
    const nowMuted = !Sound.isMuted();
    Sound.setMuted(nowMuted);
    muteBtn.textContent = nowMuted ? '🔇' : '🔊';
  });

  begin();
})();
