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

  const battleScreen = document.getElementById('battleScreen');
  const impactFlash = document.getElementById('impactFlash');
  const vsIntro = document.getElementById('vsIntro');
  const battlePlayerBox = document.getElementById('battlePlayer');
  const battleEnemyBox = document.getElementById('battleEnemy');
  const battlePlayerSprite = document.getElementById('battlePlayerSprite');
  const battleEnemySprite = document.getElementById('battleEnemySprite');
  const battleActionsEl = document.getElementById('battleActions');
  const battleLogEl = document.getElementById('battleLog');
  const hudPlayerIcon = document.getElementById('hudPlayerIcon');
  const hudPlayerName = document.getElementById('hudPlayerName');
  const hudPlayerBar = document.getElementById('hudPlayerBar');
  const hudPlayerSub = document.getElementById('hudPlayerSub');
  const hudEnemyIcon = document.getElementById('hudEnemyIcon');
  const hudEnemyName = document.getElementById('hudEnemyName');
  const hudEnemyBar = document.getElementById('hudEnemyBar');
  const hudEnemySub = document.getElementById('hudEnemySub');
  let wasInBattle = false;

  function appendLog(lines) {
    for (const line of lines) {
      const div = document.createElement('div');
      div.className = 'log-line';
      div.textContent = line;
      logEl.appendChild(div);
    }
    logEl.scrollTop = logEl.scrollHeight;
  }

  function renderOptionsInto(container, view) {
    container.innerHTML = '';
    if (!view.options || view.options.length === 0) {
      container.hidden = true;
      return;
    }
    container.hidden = false;
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
      container.appendChild(btn);
    }
  }

  function renderOptions(view) {
    const inBattle = view.state === 'BATTLE_DECISION' || view.state === 'COMBAT';
    if (inBattle) {
      optionsEl.innerHTML = '';
      optionsEl.hidden = true;
      renderOptionsInto(battleActionsEl, view);
    } else {
      battleActionsEl.innerHTML = '';
      battleActionsEl.hidden = true;
      renderOptionsInto(optionsEl, view);
    }
  }

  function setOptionsEnabled(enabled) {
    optionsEl.querySelectorAll('button').forEach((b) => { b.disabled = !enabled; });
    battleActionsEl.querySelectorAll('button').forEach((b) => { b.disabled = !enabled; });
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

  function appendBattleLog(lines) {
    for (const line of lines) {
      const div = document.createElement('div');
      div.className = 'battle-log-line';
      div.textContent = line;
      battleLogEl.appendChild(div);
    }
    while (battleLogEl.children.length > 4) {
      battleLogEl.removeChild(battleLogEl.firstChild);
    }
  }

  function renderBattleScreen(view) {
    const inBattle = view.state === 'BATTLE_DECISION' || view.state === 'COMBAT';
    const show = inBattle || hasTerminalEvent(view.events);

    if (!show) {
      battleScreen.hidden = true;
      wasInBattle = false;
      return;
    }

    battleScreen.hidden = false;
    battleScreen.dataset.scene = view.scene || 'MainMenu';
    appendBattleLog(view.log || []);

    if (view.player) {
      hudPlayerIcon.textContent = spriteFor(view.player.class);
      hudPlayerName.textContent = view.player.name || 'You';
      const pct = Math.max(0, Math.min(100, (view.player.health / Math.max(1, view.player.maxHealth)) * 100));
      hudPlayerBar.style.width = pct + '%';
      hudPlayerSub.textContent = view.player.health + '/' + view.player.maxHealth + ' HP · ⚔️ ' + view.player.totalDamage;
      battlePlayerSprite.textContent = spriteFor(view.player.class);
    }

    if (view.enemy) {
      hudEnemyIcon.textContent = spriteFor(view.enemy.name);
      hudEnemyName.textContent = view.enemy.name + ' (' + view.enemy.index + '/' + view.enemy.total + ')';
      const epct = Math.max(0, Math.min(100, (view.enemy.health / Math.max(1, view.enemy.maxHealth)) * 100));
      hudEnemyBar.style.width = epct + '%';
      hudEnemySub.textContent = Math.max(0, view.enemy.health) + '/' + view.enemy.maxHealth + ' HP · ⚔️ ' + view.enemy.damage;
      battleEnemySprite.textContent = spriteFor(view.enemy.name);
    } else if (inBattle) {
      hudEnemyIcon.textContent = '❔';
      hudEnemyName.textContent = '???';
      hudEnemyBar.style.width = '100%';
      hudEnemySub.textContent = '-';
      battleEnemySprite.textContent = '❔';
    }
    // else: enemy already null because the battle just ended (victory/gameOver) --
    // leave the last-shown sprite/HUD in place so the outcome animation stays visible.

    if (!wasInBattle && inBattle) {
      battleScreen.classList.remove('death-vignette');
      vsIntro.hidden = false;
      void vsIntro.offsetWidth; // restart the animation
      vsIntro.style.animation = 'none';
      requestAnimationFrame(() => { vsIntro.style.animation = ''; });
      setTimeout(() => { vsIntro.hidden = true; }, 900);
    }
    wasInBattle = inBattle;
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

  function flash(cls) {
    impactFlash.classList.remove('flash-white', 'flash-red');
    void impactFlash.offsetWidth;
    impactFlash.classList.add(cls);
  }

  function shakeScreen() {
    battleScreen.classList.remove('shake');
    void battleScreen.offsetWidth;
    battleScreen.classList.add('shake');
  }

  function spawnBlood(box, count) {
    for (let i = 0; i < count; i++) {
      const drop = document.createElement('div');
      drop.className = 'blood-drop';
      drop.style.left = (45 + Math.random() * 10) + '%';
      drop.style.top = (30 + Math.random() * 15) + '%';
      const angle = (Math.random() * Math.PI * 2);
      const dist = 60 + Math.random() * 80;
      drop.style.setProperty('--bx', (Math.cos(angle) * dist) + 'px');
      drop.style.setProperty('--by', (Math.abs(Math.sin(angle)) * dist * 0.6 + 50) + 'px');
      drop.style.setProperty('--br', (Math.random() * 180 - 90) + 'deg');
      box.appendChild(drop);
      drop.addEventListener('animationend', () => drop.remove());
    }
  }

  function spawnBloodPool(box) {
    const existing = box.querySelector('.blood-pool');
    if (existing) existing.remove();
    const pool = document.createElement('div');
    pool.className = 'blood-pool';
    box.appendChild(pool);
    setTimeout(() => pool.remove(), 1300);
  }

  function runEvent(ev) {
    if (ev.type === 'playerAttack') {
      Sound.playerAttack();
      flash('flash-white');
      battlePlayerBox.classList.add('lunge');
      battleEnemyBox.classList.add('hit');
      floatDamage(battleEnemyBox, dmgText(ev.amount), 'enemy-dmg');
      if (ev.amount > 0) spawnBlood(battleEnemyBox, 6);
      setTimeout(() => {
        battlePlayerBox.classList.remove('lunge');
        battleEnemyBox.classList.remove('hit');
      }, 400);
    } else if (ev.type === 'enemyAttack') {
      Sound.hit();
      flash('flash-red');
      shakeScreen();
      battleEnemyBox.classList.add('lunge');
      battlePlayerBox.classList.add('hit');
      floatDamage(battlePlayerBox, dmgText(ev.amount), 'player-dmg');
      if (ev.amount > 0) spawnBlood(battlePlayerBox, 6);
      setTimeout(() => {
        battleEnemyBox.classList.remove('lunge');
        battlePlayerBox.classList.remove('hit');
      }, 400);
    } else if (ev.type === 'enemyDefeated') {
      Sound.defeat();
      shakeScreen();
      spawnBloodPool(battleEnemyBox);
      battleEnemyBox.classList.add('defeated');
      setTimeout(() => battleEnemyBox.classList.remove('defeated'), 550);
    } else if (ev.type === 'victory') {
      Sound.victory();
      battlePlayerBox.classList.add('cheer');
      burstParticles(battlePlayerBox, ['✨', '🎉', '⭐']);
      setTimeout(() => battlePlayerBox.classList.remove('cheer'), 1200);
    } else if (ev.type === 'gameOver') {
      Sound.gameOver();
      shakeScreen();
      battleScreen.classList.add('death-vignette');
      spawnBlood(battlePlayerBox, 10);
      battlePlayerBox.classList.add('defeated');
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
    renderBattleScreen(view);
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
      setTimeout(() => { battleScreen.hidden = true; }, totalDelay + 300);
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
