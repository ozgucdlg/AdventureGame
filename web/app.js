(function () {
  const state = { sessionId: null };

  const logEl = document.getElementById('log');
  const optionsEl = document.getElementById('options');
  const textRow = document.getElementById('textInputRow');
  const nameInput = document.getElementById('nameInput');
  const nameSubmit = document.getElementById('nameSubmit');
  const restartBtn = document.getElementById('restartBtn');
  const playerCard = document.getElementById('playerCard');
  const enemyCard = document.getElementById('enemyCard');

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
      title.textContent = opt.label;
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

  function renderPlayer(p) {
    if (!p || !p.class) {
      playerCard.hidden = true;
      return;
    }
    playerCard.hidden = false;
    document.getElementById('pName').textContent = p.name;
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
    document.getElementById('eName').textContent = e.name;
    document.getElementById('eHealth').textContent = e.health;
    const pct = Math.max(0, Math.min(100, (e.health / Math.max(1, e.maxHealth)) * 100));
    document.getElementById('eHealthBar').style.width = pct + '%';
    document.getElementById('eDamage').textContent = e.damage;
    document.getElementById('eProgress').textContent = e.index + ' of ' + e.total;
  }

  function render(view) {
    appendLog(view.log || []);
    renderPlayer(view.player);
    renderEnemy(view.enemy);
    renderOptions(view);

    textRow.hidden = view.inputType !== 'text';
    if (view.inputType === 'text') {
      nameInput.value = '';
      nameInput.focus();
    }

    restartBtn.hidden = !view.gameOver;
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
