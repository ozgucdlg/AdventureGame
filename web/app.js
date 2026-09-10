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

  const logEl = document.getElementById('log');
  const optionsEl = document.getElementById('options');
  const textRow = document.getElementById('textInputRow');
  const nameInput = document.getElementById('nameInput');
  const nameSubmit = document.getElementById('nameSubmit');
  const restartBtn = document.getElementById('restartBtn');
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

      btn.addEventListener('click', () => sendAction(opt.type, opt.value));
      optionsEl.appendChild(btn);
    }
  }

  function setOptionsEnabled(enabled) {
    optionsEl.querySelectorAll('button').forEach((b) => { b.disabled = !enabled; });
  }

  function renderArena(view) {
    const inBattle = view.state === 'BATTLE_DECISION' || view.state === 'COMBAT';
    arena.hidden = !inBattle;
    if (!inBattle) return;
    if (view.player) {
      arenaPlayerSprite.textContent = spriteFor(view.player.class);
      arenaPlayerName.textContent = view.player.name || 'You';
    }
    if (view.enemy) {
      arenaEnemySprite.textContent = spriteFor(view.enemy.name);
      arenaEnemyName.textContent = view.enemy.name + ' (' + view.enemy.index + '/' + view.enemy.total + ')';
    } else {
      arenaEnemySprite.textContent = '❔';
      arenaEnemyName.textContent = '???';
    }
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
      arenaPlayerBox.classList.add('lunge');
      arenaEnemyBox.classList.add('hit');
      floatDamage(arenaEnemyBox, dmgText(ev.amount), 'enemy-dmg');
      setTimeout(() => {
        arenaPlayerBox.classList.remove('lunge');
        arenaEnemyBox.classList.remove('hit');
      }, 400);
    } else if (ev.type === 'enemyAttack') {
      arenaEnemyBox.classList.add('lunge');
      arenaPlayerBox.classList.add('hit');
      floatDamage(arenaPlayerBox, dmgText(ev.amount), 'player-dmg');
      setTimeout(() => {
        arenaEnemyBox.classList.remove('lunge');
        arenaPlayerBox.classList.remove('hit');
      }, 400);
    } else if (ev.type === 'enemyDefeated') {
      arenaEnemyBox.classList.add('defeated');
      setTimeout(() => arenaEnemyBox.classList.remove('defeated'), 550);
    } else if (ev.type === 'gameOver') {
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

  begin();
})();
