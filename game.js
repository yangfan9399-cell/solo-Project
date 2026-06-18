// 苔藓邮站路径解谜游戏 - 核心逻辑
(function () {
  'use strict';

  const TILE_TYPES = {
    PATH: 'path',
    MOSS: 'moss',
    ROCK: 'rock',
    START: 'start',
    END: 'end',
    REWARD: 'reward',
    RISK: 'risk',
    FAIL: 'fail'
  };

  const TILE_ICONS = {
    path: '',
    moss: '🌿',
    rock: '🪨',
    start: '🚩',
    end: '🏁',
    reward: '💎',
    risk: '⚠️',
    fail: '💀'
  };

  const LEVELS = {
    ji: {
      id: 'ji',
      name: '己局 · 教学',
      description: '初入苔藓邮站，学习邮路基本规则。',
      rows: 6,
      cols: 8,
      startPos: { row: 0, col: 0 },
      endPos: { row: 5, col: 7 },
      initialSlot: 20,
      initialConvert: 0,
      winConvert: 50,
      winFormula: '折算值 >= 50 且 抵达终点',
      failCondition: '己号风险 >= 5',
      tiles: [
        ['start', 'path', 'path', 'moss', 'path', 'path', 'reward', 'path'],
        ['path', 'rock', 'path', 'path', 'rock', 'path', 'path', 'path'],
        ['path', 'path', 'risk', 'path', 'path', 'moss', 'path', 'path'],
        ['moss', 'path', 'path', 'rock', 'path', 'path', 'path', 'moss'],
        ['path', 'path', 'reward', 'path', 'path', 'risk', 'path', 'path'],
        ['path', 'moss', 'path', 'path', 'path', 'path', 'path', 'end']
      ],
      tileValues: {
        path: { convert: 1, slot: -1, risk: 0, reward: 0, fail: 0, trace: 1 },
        moss: { convert: 3, slot: -2, risk: 0, reward: 0, fail: 0, trace: 2 },
        reward: { convert: 10, slot: -1, risk: 0, reward: 1, fail: 0, trace: 1 },
        risk: { convert: -2, slot: -1, risk: 1, reward: 0, fail: 0, trace: 1 },
        fail: { convert: 0, slot: 0, risk: 0, reward: 0, fail: 1, trace: 0 },
        start: { convert: 0, slot: 0, risk: 0, reward: 0, fail: 0, trace: 0 },
        end: { convert: 5, slot: 0, risk: 0, reward: 0, fail: 0, trace: 1 }
      },
      events: [
        { id: 'ji_tutorial_1', trigger: 'first_step', title: '邮站指引', desc: '欢迎来到苔藓邮站！点击相邻格子前行，每走一步消耗1点定标槽。', type: 'info' },
        { id: 'ji_tutorial_2', trigger: 'first_moss', title: '苔藓发现', desc: '苔藓格折算值+3，但多消耗1点定标槽。苔藓是邮站的生命之源。', type: 'info' },
        { id: 'ji_tutorial_3', trigger: 'first_reward', title: '壬号奖励', desc: '获得壬号奖励！这是珍贵的邮差徽章，可大幅提升折算值。', type: 'good' },
        { id: 'ji_tutorial_4', trigger: 'first_risk', title: '己号风险', desc: '踩到己号风险点！风险累积过高会导致任务失败。', type: 'bad' }
      ],
      hidden: {
        description: '己局为教学关，无隐藏条件。'
      }
    },

    ren: {
      id: 'ren',
      name: '壬局 · 资源短缺',
      description: '定标槽紧缺，必须精打细算每一步。',
      rows: 7,
      cols: 9,
      startPos: { row: 0, col: 0 },
      endPos: { row: 6, col: 8 },
      initialSlot: 15,
      initialConvert: 0,
      winConvert: 40,
      winFormula: '折算值 >= 40 且 定标槽 > 0 且 抵达终点',
      failCondition: '定标槽耗尽 或 己号风险 >= 4',
      tiles: [
        ['start', 'path', 'rock', 'path', 'path', 'rock', 'path', 'path', 'path'],
        ['path', 'moss', 'path', 'path', 'rock', 'path', 'moss', 'rock', 'path'],
        ['path', 'rock', 'rock', 'path', 'path', 'path', 'path', 'path', 'reward'],
        ['path', 'path', 'path', 'risk', 'rock', 'path', 'rock', 'moss', 'path'],
        ['rock', 'moss', 'rock', 'path', 'path', 'path', 'path', 'path', 'path'],
        ['path', 'path', 'path', 'rock', 'reward', 'rock', 'risk', 'path', 'path'],
        ['path', 'risk', 'path', 'path', 'path', 'moss', 'path', 'path', 'end']
      ],
      tileValues: {
        path: { convert: 1, slot: -1, risk: 0, reward: 0, fail: 0, trace: 1 },
        moss: { convert: 2, slot: -3, risk: 0, reward: 0, fail: 0, trace: 2 },
        reward: { convert: 8, slot: -2, risk: 0, reward: 1, fail: 0, trace: 1 },
        risk: { convert: -3, slot: -2, risk: 1, reward: 0, fail: 0, trace: 1 },
        fail: { convert: 0, slot: 0, risk: 0, reward: 0, fail: 1, trace: 0 },
        start: { convert: 0, slot: 0, risk: 0, reward: 0, fail: 0, trace: 0 },
        end: { convert: 5, slot: 0, risk: 0, reward: 0, fail: 0, trace: 1 }
      },
      events: [
        { id: 'ren_start', trigger: 'start', title: '资源警报', desc: '本局定标槽紧缺！每一步都要深思熟虑。', type: 'warning' },
        { id: 'ren_low_slot', trigger: 'slot_below_5', title: '槽位告急', desc: '定标槽不足5点！请谨慎选择路线。', type: 'bad' },
        { id: 'ren_moss_warn', trigger: 'first_moss', title: '苔藓消耗', desc: '壬局中苔藓消耗3点定标槽，请权衡收益。', type: 'warning' }
      ],
      hidden: {
        description: '若踏遍全部5个苔藓格，到达终点时额外+15折算值。'
      }
    },

    geng: {
      id: 'geng',
      name: '庚局 · 隐藏条件',
      description: '暗伏的庚号失败因子，触发隐藏条件将直接失败。',
      rows: 8,
      cols: 10,
      startPos: { row: 0, col: 0 },
      endPos: { row: 7, col: 9 },
      initialSlot: 25,
      initialConvert: 0,
      winConvert: 60,
      winFormula: '折算值 >= 60 且 庚号失败因子 = 0 且 抵达终点',
      failCondition: '庚号失败因子 > 0 或 己号风险 >= 6',
      tiles: [
        ['start', 'path', 'path', 'moss', 'rock', 'path', 'path', 'fail', 'path', 'path'],
        ['path', 'rock', 'reward', 'path', 'path', 'rock', 'path', 'path', 'path', 'path'],
        ['path', 'path', 'path', 'rock', 'path', 'path', 'moss', 'rock', 'risk', 'path'],
        ['moss', 'path', 'risk', 'path', 'path', 'fail', 'path', 'path', 'path', 'path'],
        ['path', 'rock', 'path', 'path', 'rock', 'path', 'path', 'rock', 'path', 'reward'],
        ['path', 'path', 'moss', 'path', 'path', 'path', 'reward', 'path', 'path', 'path'],
        ['risk', 'path', 'rock', 'fail', 'path', 'rock', 'path', 'moss', 'rock', 'path'],
        ['path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'end']
      ],
      tileValues: {
        path: { convert: 1, slot: -1, risk: 0, reward: 0, fail: 0, trace: 1 },
        moss: { convert: 4, slot: -2, risk: 0, reward: 0, fail: 0, trace: 2 },
        reward: { convert: 12, slot: -1, risk: 0, reward: 1, fail: 0, trace: 1 },
        risk: { convert: -3, slot: -1, risk: 1, reward: 0, fail: 0, trace: 1 },
        fail: { convert: -20, slot: -3, risk: 0, reward: 0, fail: 1, trace: 1 },
        start: { convert: 0, slot: 0, risk: 0, reward: 0, fail: 0, trace: 0 },
        end: { convert: 5, slot: 0, risk: 0, reward: 0, fail: 0, trace: 1 }
      },
      events: [
        { id: 'geng_warning', trigger: 'start', title: '庚号警戒', desc: '本局暗藏庚号失败因子！踩到💀格子将直接失败。', type: 'bad' },
        { id: 'geng_hint', trigger: 'step_5', title: '邮站密语', desc: '老邮差说："苔藓环绕之处，方为安全之径。"', type: 'info' },
        { id: 'geng_hint2', trigger: 'step_10', title: '地图残片', desc: '据说庚号格子都不在苔藓相邻处…', type: 'info' }
      ],
      hidden: {
        description: '若收集全部3个壬号奖励且零己号风险，触发完美结局：折算值翻倍。'
      }
    }
  };

  const STORAGE_KEY = 'moss-post-station-save-v1';

  let gameState = null;
  let isPlaying = false;
  let replayTimer = null;
  let modalConfirmCallback = null;

  function createInitialState(levelId) {
    const level = LEVELS[levelId];
    return {
      levelId: levelId,
      convert: level.initialConvert,
      slot: level.initialSlot,
      trace: 0,
      risk: 0,
      reward: 0,
      fail: 0,
      playerPos: { ...level.startPos },
      path: [{ ...level.startPos }],
      visited: new Set([posKey(level.startPos.row, level.startPos.col)]),
      events: [],
      triggeredEvents: new Set(),
      mossCount: 0,
      rewardCount: 0,
      isFinished: false,
      isWin: false,
      failReason: null,
      timestamp: Date.now()
    };
  }

  function posKey(r, c) {
    return r + ',' + c;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      data.visited = new Set(data.visited || []);
      data.triggeredEvents = new Set(data.triggeredEvents || []);
      return data;
    } catch (e) {
      console.warn('加载存档失败', e);
      return null;
    }
  }

  function saveState() {
    try {
      const data = {
        ...gameState,
        visited: Array.from(gameState.visited),
        triggeredEvents: Array.from(gameState.triggeredEvents)
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('保存失败', e);
    }
  }

  function clearState() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function getLevel() {
    return LEVELS[gameState.levelId];
  }

  function getTile(row, col) {
    const level = getLevel();
    if (row < 0 || row >= level.rows || col < 0 || col >= level.cols) return null;
    return level.tiles[row][col];
  }

  function isAdjacent(pos1, pos2) {
    const dr = Math.abs(pos1.row - pos2.row);
    const dc = Math.abs(pos1.col - pos2.col);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
  }

  function canMoveTo(row, col) {
    if (gameState.isFinished) return false;
    if (isPlaying) return false;
    const tile = getTile(row, col);
    if (!tile) return false;
    if (tile === 'rock') return false;
    if (!isAdjacent(gameState.playerPos, { row, col })) return false;
    if (gameState.slot <= 0) return false;
    return true;
  }

  function moveTo(row, col) {
    if (!canMoveTo(row, col)) return false;
    const level = getLevel();
    const tile = getTile(row, col);
    const values = level.tileValues[tile];
    const isFirstVisit = !gameState.visited.has(posKey(row, col));

    gameState.playerPos = { row, col };
    gameState.path.push({ row, col });
    gameState.trace += values.trace;
    gameState.slot += values.slot;

    if (isFirstVisit) {
      gameState.visited.add(posKey(row, col));
      gameState.convert += values.convert;
      gameState.risk += values.risk;
      gameState.reward += values.reward;
      gameState.fail += values.fail;

      if (tile === 'moss') gameState.mossCount++;
      if (tile === 'reward') gameState.rewardCount++;
    }

    checkTileEvents(tile, isFirstVisit);
    checkStepEvents();
    checkGameEnd(tile);
    saveState();
    render();
    return true;
  }

  function checkTileEvents(tile, isFirstVisit) {
    const level = getLevel();
    const triggered = gameState.triggeredEvents;

    level.events.forEach(evt => {
      if (triggered.has(evt.id)) return;
      let fire = false;
      if (evt.trigger === 'start' && gameState.path.length === 1) {
        fire = true;
      } else if (evt.trigger === 'first_step' && gameState.path.length === 2) {
        fire = true;
      } else if (evt.trigger === 'first_moss' && tile === 'moss' && isFirstVisit) {
        fire = true;
      } else if (evt.trigger === 'first_reward' && tile === 'reward' && isFirstVisit) {
        fire = true;
      } else if (evt.trigger === 'first_risk' && tile === 'risk' && isFirstVisit) {
        fire = true;
      }
      if (fire) {
        addEvent(evt);
        triggered.add(evt.id);
      }
    });
  }

  function checkStepEvents() {
    const level = getLevel();
    const step = gameState.path.length - 1;
    const triggered = gameState.triggeredEvents;

    level.events.forEach(evt => {
      if (triggered.has(evt.id)) return;
      let fire = false;
      if (evt.trigger === 'step_5' && step === 5) fire = true;
      if (evt.trigger === 'step_10' && step === 10) fire = true;
      if (evt.trigger === 'slot_below_5' && gameState.slot < 5) fire = true;
      if (fire) {
        addEvent(evt);
        triggered.add(evt.id);
      }
    });
  }

  function addEvent(evt) {
    gameState.events.unshift({
      id: evt.id,
      title: evt.title,
      desc: evt.desc,
      type: evt.type,
      step: gameState.path.length - 1,
      timestamp: Date.now()
    });
  }

  function checkGameEnd(tile) {
    var needSettle = false;

    if (gameState.fail > 0) {
      needSettle = true;
    } else if (gameState.risk >= getRiskThreshold()) {
      needSettle = true;
    } else if (gameState.slot <= 0 && tile !== 'end') {
      needSettle = true;
    } else if (tile === 'end') {
      needSettle = true;
    }

    if (needSettle) {
      gameState.isFinished = true;
      requestSettle();
    }
  }

  function getRiskThreshold() {
    const level = getLevel();
    if (level.id === 'ji') return 5;
    if (level.id === 'ren') return 4;
    if (level.id === 'geng') return 6;
    return 10;
  }

  function calculateFinalConvert() {
    const level = getLevel();
    let base = gameState.convert;

    if (level.id === 'ren') {
      if (gameState.mossCount >= 5) {
        base += 15;
        addEvent({
          id: 'ren_hidden_bonus',
          title: '隐藏奖励',
          desc: '踏遍全部5个苔藓格！额外获得+15折算值。',
          type: 'good'
        });
      }
    }

    if (level.id === 'geng') {
      if (gameState.rewardCount >= 3 && gameState.risk === 0) {
        base = base * 2;
        addEvent({
          id: 'geng_perfect',
          title: '🌟 完美结局',
          desc: '收集全部壬号奖励且零己号风险！折算值翻倍。',
          type: 'good'
        });
      }
    }

    return base;
  }

  function requestSettle() {
    var levelId = gameState.levelId;
    var pathData = gameState.path.map(function (p) { return { row: p.row, col: p.col }; });

    addEvent({
      id: 'settle_request_' + Date.now(),
      title: '后端结算中',
      desc: '正在向苔藓邮站结算中心提交路径数据…',
      type: 'info'
    });
    render();

    fetch('/api/settle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ levelId: levelId, path: pathData })
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (!data.success) {
        console.warn('后端结算失败:', data.error);
        addEvent({
          id: 'settle_error_' + Date.now(),
          title: '后端结算异常',
          desc: data.error || '结算中心返回错误，切换至本地备用结算…',
          type: 'warning'
        });
        applyLocalSettle();
        return;
      }
      addEvent({
        id: 'settle_success_' + Date.now(),
        title: '后端结算完成',
        desc: '结算中心已按折算值与路径步骤重算完毕。',
        type: 'info'
      });
      applyBackendSettle(data.result);
    })
    .catch(function (err) {
      console.warn('后端请求异常，回退本地结算:', err);
      addEvent({
        id: 'settle_network_' + Date.now(),
        title: '网络连接异常',
        desc: '无法连接结算中心，已切换至本地备用结算。',
        type: 'warning'
      });
      applyLocalSettle();
    });
  }

  function applyBackendSettle(result) {
    gameState.convert = result.convert;
    gameState.slot = result.slot;
    gameState.trace = result.trace;
    gameState.risk = result.risk;
    gameState.reward = result.reward;
    gameState.fail = result.fail;
    gameState.mossCount = result.mossCount;
    gameState.rewardCount = result.rewardCount;
    gameState.isFinished = result.isFinished;
    gameState.isWin = result.isWin;
    gameState.failReason = result.failReason;

    if (result.settleEvents && result.settleEvents.length > 0) {
      result.settleEvents.forEach(function (evt) {
        addEvent({
          id: 'backend_' + Date.now() + '_' + Math.random(),
          title: evt.title,
          desc: evt.desc,
          type: evt.type
        });
      });
    }

    saveState();
    render();
  }

  function applyLocalSettle() {
    var level = getLevel();
    var finalConvert = calculateFinalConvert();
    gameState.convert = finalConvert;

    addEvent({
      id: 'settle_local_' + Date.now(),
      title: '本地备用结算',
      desc: '后端不可用，已切换至本地备用结算逻辑。',
      type: 'warning'
    });

    if (gameState.fail > 0) {
      gameState.isFinished = true;
      gameState.isWin = false;
      gameState.failReason = '触发庚号失败因子！';
      addSettlementEvent('fail');
    } else if (gameState.risk >= getRiskThreshold()) {
      gameState.isFinished = true;
      gameState.isWin = false;
      gameState.failReason = '己号风险已达临界值！';
      addSettlementEvent('fail');
    } else if (finalConvert >= level.winConvert) {
      gameState.isFinished = true;
      gameState.isWin = true;
      addSettlementEvent('win');
    } else {
      gameState.isFinished = true;
      gameState.isWin = false;
      gameState.failReason = '折算值未达到通关标准！';
      addSettlementEvent('fail');
    }

    saveState();
    render();
  }

  function addSettlementEvent(type) {
    const evt = type === 'win'
      ? {
          id: 'settle_win',
          title: '🎉 通关成功',
          desc: '邮包安全送达！结算簿已记录本次成绩。',
          type: 'good'
        }
      : {
          id: 'settle_fail',
          title: '💔 任务失败',
          desc: gameState.failReason || '任务失败，请再接再厉。',
          type: 'bad'
        };
    addEvent(evt);
  }

  function undoStep() {
    if (gameState.path.length <= 1) return false;
    if (gameState.isFinished) return false;
    if (isPlaying) return false;

    const lastPos = gameState.path.pop();
    const prevPos = gameState.path[gameState.path.length - 1];
    const level = getLevel();
    const tile = getTile(lastPos.row, lastPos.col);
    const values = level.tileValues[tile];

    gameState.playerPos = { ...prevPos };
    gameState.trace -= values.trace;
    gameState.slot -= values.slot;

    const wasFirstVisit = !wasVisitedBefore(lastPos.row, lastPos.col, gameState.path.length);
    if (wasFirstVisit) {
      gameState.visited.delete(posKey(lastPos.row, lastPos.col));
      gameState.convert -= values.convert;
      gameState.risk -= values.risk;
      gameState.reward -= values.reward;
      gameState.fail -= values.fail;
      if (tile === 'moss') gameState.mossCount--;
      if (tile === 'reward') gameState.rewardCount--;
    }

    saveState();
    render();
    return true;
  }

  function wasVisitedBefore(row, col, pathIndex) {
    for (let i = 0; i < pathIndex; i++) {
      const p = gameState.path[i];
      if (p.row === row && p.col === col) return true;
    }
    return false;
  }

  function restartLevel() {
    if (isPlaying && replayTimer) {
      clearInterval(replayTimer);
      replayTimer = null;
      isPlaying = false;
    }
    gameState = createInitialState(gameState.levelId);
    triggerStartEvents();
    saveState();
    render();
  }

  function switchLevel(levelId) {
    if (!LEVELS[levelId]) return;
    if (isPlaying && replayTimer) {
      clearInterval(replayTimer);
      replayTimer = null;
      isPlaying = false;
    }
    gameState = createInitialState(levelId);
    triggerStartEvents();
    saveState();
    render();
  }

  function triggerStartEvents() {
    const level = getLevel();
    const triggered = gameState.triggeredEvents;

    level.events.forEach(evt => {
      if (triggered.has(evt.id)) return;
      if (evt.trigger === 'start') {
        addEvent(evt);
        triggered.add(evt.id);
      }
    });
  }

  function render() {
    renderChips();
    renderBoard();
    renderEvents();
    renderReplay();
    renderSettlement();
    renderLevelButtons();
    renderButtons();
  }

  function renderChips() {
    setText('chip-convert', gameState.convert);
    setText('chip-slot', gameState.slot);
    setText('chip-trace', gameState.trace);
    setText('chip-risk', gameState.risk);
    setText('chip-reward', gameState.reward);
    setText('chip-fail', gameState.fail);
  }

  function renderBoard() {
    const level = getLevel();
    const board = document.getElementById('board');
    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${level.cols}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${level.rows}, 1fr)`;

    for (let r = 0; r < level.rows; r++) {
      for (let c = 0; c < level.cols; c++) {
        const tile = level.tiles[r][c];
        const cell = document.createElement('div');
        cell.className = `tile tile-${tile}`;
        cell.dataset.row = r;
        cell.dataset.col = c;

        const icon = TILE_ICONS[tile];
        if (icon) {
          const iconEl = document.createElement('span');
          iconEl.className = 'tile-emoji';
          iconEl.textContent = icon;
          cell.appendChild(iconEl);
        }

        if (gameState.visited.has(posKey(r, c))) {
          cell.classList.add('visited');
        }

        if (gameState.playerPos.row === r && gameState.playerPos.col === c) {
          cell.classList.add('player');
          const playerEl = document.createElement('span');
          playerEl.className = 'player-emoji';
          playerEl.textContent = '📮';
          cell.appendChild(playerEl);
        }

        if (canMoveTo(r, c)) {
          cell.classList.add('can-move');
        }

        cell.addEventListener('click', () => {
          if (canMoveTo(r, c)) {
            moveTo(r, c);
          }
        });

        board.appendChild(cell);
      }
    }
  }

  function renderEvents() {
    const list = document.getElementById('event-list');
    const count = document.getElementById('event-count');
    count.textContent = gameState.events.length;

    if (gameState.events.length === 0) {
      list.innerHTML = '<div class="event-empty">暂无事件，开始探索邮路吧…</div>';
      return;
    }

    list.innerHTML = '';
    gameState.events.forEach(evt => {
      const item = document.createElement('div');
      item.className = `event-item event-${evt.type}`;
      item.innerHTML = `
        <div class="event-header">
          <span class="event-title">${evt.title}</span>
          <span class="event-step">第${evt.step}步</span>
        </div>
        <div class="event-desc">${evt.desc}</div>
      `;
      list.appendChild(item);
    });
  }

  function renderReplay() {
    const track = document.getElementById('replay-track');
    const stepCount = document.getElementById('step-count');
    const steps = gameState.path.length - 1;
    stepCount.textContent = steps + ' 步';

    if (steps === 0) {
      track.innerHTML = '<div class="replay-empty">尚未踏出第一步…</div>';
      return;
    }

    track.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'replay-tiles';

    gameState.path.forEach((pos, idx) => {
      const tile = getTile(pos.row, pos.col);
      const node = document.createElement('div');
      node.className = `replay-node replay-${tile}`;
      node.title = `第${idx}步: (${pos.row},${pos.col})`;
      if (idx === gameState.path.length - 1) {
        node.classList.add('current');
      }
      if (idx > 0) {
        const arrow = document.createElement('div');
        arrow.className = 'replay-arrow';
        arrow.textContent = '→';
        container.appendChild(arrow);
      }
      container.appendChild(node);
    });

    track.appendChild(container);
  }

  function renderSettlement() {
    var status = document.getElementById('settle-status');
    var verdict = document.getElementById('settle-verdict');

    setText('settle-convert', gameState.convert);
    setText('settle-steps', gameState.path.length - 1);
    setText('settle-reward', gameState.reward);
    setText('settle-risk', gameState.risk);
    setText('settle-fail', gameState.fail);

    if (!gameState.isFinished) {
      status.textContent = '进行中';
      status.className = 'settle-status status-progress';
      verdict.textContent = '抵达终点后由后端式结算器重算';
      verdict.className = 'settle-verdict';
    } else if (gameState.isWin) {
      status.textContent = '✓ 成功';
      status.className = 'settle-status status-win';
      verdict.innerHTML = '🎉 <strong>通关成功</strong><br><small>后端已按折算值与路径步骤重算确认</small>';
      verdict.className = 'settle-verdict verdict-win';
    } else {
      status.textContent = '✗ 失败';
      status.className = 'settle-status status-fail';
      var reason = gameState.failReason || '任务失败，请再接再厉。';
      verdict.innerHTML = '💔 <strong>任务失败</strong><br><small>' + reason + '</small>';
      verdict.className = 'settle-verdict verdict-fail';
    }
  }

  function renderLevelButtons() {
    document.querySelectorAll('.level-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.level === gameState.levelId);
    });
  }

  function renderButtons() {
    const canUndo = gameState.path.length > 1 && !gameState.isFinished && !isPlaying;
    document.getElementById('btn-undo').disabled = !canUndo;
    document.getElementById('btn-restart').disabled = isPlaying;
    document.getElementById('btn-reset').disabled = gameState.path.length <= 1 || isPlaying;
    document.getElementById('btn-play').disabled = gameState.path.length <= 1 || isPlaying;
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function showModal(title, body, onConfirm) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    modalConfirmCallback = onConfirm || null;
    document.getElementById('modal-overlay').classList.add('show');
  }

  function hideModal() {
    document.getElementById('modal-overlay').classList.remove('show');
    modalConfirmCallback = null;
  }

  function playReplay() {
    if (gameState.path.length <= 1) return;
    if (isPlaying) return;
    const steps = [...gameState.path];
    const levelId = gameState.levelId;
    let idx = 0;

    isPlaying = true;
    gameState = createInitialState(levelId);
    triggerStartEvents();
    render();

    replayTimer = setInterval(() => {
      idx++;
      if (idx >= steps.length) {
        clearInterval(replayTimer);
        replayTimer = null;
        isPlaying = false;
        render();
        return;
      }
      const pos = steps[idx];
      moveTo(pos.row, pos.col);
    }, 500);
  }

  function init() {
    const saved = loadState();
    if (saved && LEVELS[saved.levelId]) {
      gameState = saved;
    } else {
      gameState = createInitialState('ji');
    }

    document.querySelectorAll('.level-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (isPlaying) return;
        const levelId = btn.dataset.level;
        const level = LEVELS[levelId];
        showModal(level.name,
          `<p>${level.description}</p>
           <p><strong>胜利条件：</strong>${level.winFormula}</p>
           <p><strong>失败条件：</strong>${level.failCondition}</p>
           <p><small>隐藏条件：${level.hidden.description}</small></p>
           <p style="margin-top:1em;color:#666">是否切换到此局？当前进度将丢失。</p>`,
          () => switchLevel(levelId)
        );
      });
    });

    document.getElementById('btn-undo').addEventListener('click', undoStep);
    document.getElementById('btn-restart').addEventListener('click', () => {
      if (isPlaying) return;
      showModal(
        '重新开始',
        '<p>确定要重新开始本局吗？当前进度将丢失。</p>',
        () => restartLevel()
      );
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      if (isPlaying) return;
      if (gameState.path.length > 1) {
        restartLevel();
      }
    });

    document.getElementById('btn-play').addEventListener('click', playReplay);

    document.getElementById('modal-confirm').addEventListener('click', () => {
      if (modalConfirmCallback) {
        try {
          modalConfirmCallback();
        } finally {
          hideModal();
        }
      } else {
        hideModal();
      }
    });
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') hideModal();
    });

    render();

    if (gameState.events.length === 0) {
      triggerStartEvents();
      saveState();
      render();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
