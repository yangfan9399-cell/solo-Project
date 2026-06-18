const API = {
  base: '',

  async request(method, path, data) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (data) opts.body = JSON.stringify(data);
    const res = await fetch(this.base + path, opts);
    const json = await res.json();
    return json;
  },

  getLevels() { return this.request('GET', '/api/levels'); },
  getLevel(id) { return this.request('GET', `/api/levels/${id}`); },
  getSaves() { return this.request('GET', '/api/saves'); },
  getSave(id) { return this.request('GET', `/api/saves/${id}`); },
  createSave(data) { return this.request('POST', '/api/saves', data); },
  updateSave(id, data) { return this.request('PUT', `/api/saves/${id}`, data); },
  deleteSave(id) { return this.request('DELETE', `/api/saves/${id}`); },
  initGame(levelId) { return this.request('POST', '/api/game/init', { levelId }); },
  doAction(levelId, gameState, action) {
    return this.request('POST', '/api/game/action', { levelId, gameState, action });
  },
  calculateSettlement(levelId, gameState, replay) {
    return this.request('POST', '/api/settlement/calculate', { levelId, gameState, replay });
  },
};

const Store = {
  KEY: 'stardust_chessboard_state',
  get() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  set(state) {
    localStorage.setItem(this.KEY, JSON.stringify(state));
  },
  clear() {
    localStorage.removeItem(this.KEY);
  }
};

const Game = {
  state: null,
  level: null,
  replay: [],
  saveId: null,
  messageLog: [],

  async startNewLevel(levelId) {
    const res = await API.initGame(levelId);
    if (res.success) {
      this.level = res.data.level;
      this.state = res.data.gameState;
      this.replay = [];
      this.messageLog = [];
      this.saveId = null;
      this.persist();
      return true;
    }
    return false;
  },

  loadSave(saveData) {
    this.level = null;
    this.state = saveData.gameState;
    this.replay = saveData.replay || [];
    this.saveId = saveData.id;
    this.messageLog = [];
    this.persist();
  },

  restoreFromLocal() {
    const saved = Store.get();
    if (saved) {
      this.level = saved.level;
      this.state = saved.state;
      this.replay = saved.replay || [];
      this.saveId = saved.saveId;
      this.messageLog = saved.messageLog || [];
      return true;
    }
    return false;
  },

  persist() {
    Store.set({
      level: this.level,
      state: this.state,
      replay: this.replay,
      saveId: this.saveId,
      messageLog: this.messageLog
    });
  },

  async save() {
    const data = {
      levelId: this.getLevelId(),
      gameState: this.state,
      replay: this.replay,
      metadata: {
        levelName: this.level?.name || '未知关卡',
        turn: this.state.turn,
        phase: this.state.phase
      }
    };
    let res;
    if (this.saveId) {
      res = await API.updateSave(this.saveId, data);
    } else {
      res = await API.createSave(data);
      if (res.success) this.saveId = res.data.id;
    }
    if (res.success) this.persist();
    return res.success;
  },

  getLevelId() {
    return this.level?.id || (this.state ? this._deriveLevelId() : null);
  },

  _deriveLevelId() {
    const bs = this.state.boardSize;
    const start1 = this.state.players[0];
    if (bs === 5 && start1.x === 0 && start1.y === 0 && this.state.players[1].x === 4) return 'chen';
    if (bs === 6 && start1.x === 0 && start1.y === 0 && this.state.players[1].x === 5 && this.state.players[1].y === 5) return 'mao';
    if (bs === 6 && start1.x === 0 && start1.y === 0 && this.state.players[1].x === 5 && this.state.players[1].y === 0) return 'xin';
    return 'chen';
  },

  async doAction(action) {
    if (!this.state) return { valid: false, message: '未初始化' };
    const levelId = this.getLevelId();
    const res = await API.doAction(levelId, this.state, action);
    if (res.success && res.data.valid) {
      const newState = res.data.state;
      this.replay.push({
        action,
        stateBefore: JSON.parse(JSON.stringify(this.state)),
        stateAfter: JSON.parse(JSON.stringify(newState)),
        message: res.data.message,
        events: res.data.events || [],
        timestamp: Date.now()
      });
      if (res.data.message) {
        this.messageLog.unshift({
          type: action.type,
          text: res.data.message,
          time: Date.now()
        });
        if (res.data.events) {
          res.data.events.forEach(e => {
            this.messageLog.unshift({
              type: e.type,
              text: e.message,
              time: Date.now()
            });
          });
        }
      }
      this.state = newState;
      this.persist();
      return { valid: true, message: res.data.message, events: res.data.events || [] };
    }
    return { valid: false, message: res.data?.message || '操作失败' };
  },

  getAvailableEvents(levelData) {
    if (!levelData || !this.state) return [];
    return levelData.events?.filter(e => {
      if (this.state.eventsTriggered.includes(e.id)) return { ...e, status: 'triggered' };
      if (e.condition && !checkEventCondition(this.state, e.condition)) return { ...e, status: 'locked' };
      return { ...e, status: 'available' };
    }).map(e => ({
      ...e,
      status: this.state.eventsTriggered.includes(e.id) ? 'triggered' :
              (e.condition && !checkEventCondition(this.state, e.condition)) ? 'locked' : 'available'
    })) || [];
  },

  currentPlayer() {
    return this.state?.players?.find(p => p.id === this.state.currentPlayer);
  }
};

function checkEventCondition(state, cond) {
  if (cond.minXunran !== undefined && state.xunran < cond.minXunran) return false;
  if (cond.maxChenRisk !== undefined && state.chenRisk > cond.maxChenRisk) return false;
  if (cond.minMaoReward !== undefined && state.maoReward < cond.minMaoReward) return false;
  if (cond.turn !== undefined && state.turn < cond.turn) return false;
  if (cond.litCells !== undefined) {
    const lit = state.cells.filter(c => c.lit).length;
    if (lit < cond.litCells) return false;
  }
  return true;
}

const UI = {
  formatTime(ts) {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  },
  formatDate(ts) {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${this.formatTime(ts)}`;
  },
  pct(value, max = 100) {
    return Math.max(0, Math.min(100, (value / max) * 100));
  },
  levelColor(id) {
    return { chen: 'var(--accent-green)', mao: 'var(--accent-gold)', xin: 'var(--accent-red)' }[id] || 'var(--accent-purple)';
  },
  difficultyClass(d) {
    return { '简单': 'easy', '中等': 'medium', '困难': 'hard' }[d] || 'easy';
  }
};

const Pages = {
  current: 'board',
  set(page) {
    this.current = page;
    document.querySelectorAll('.nav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.page === page);
    });
    document.querySelectorAll('.page-content').forEach(c => {
      c.style.display = c.dataset.page === page ? 'block' : 'none';
    });
  }
};

if (typeof window !== 'undefined') {
  window.API = API;
  window.Store = Store;
  window.Game = Game;
  window.UI = UI;
  window.Pages = Pages;
}
