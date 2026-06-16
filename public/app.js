// 管风琴音频引擎
class OrganAudioEngine {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.reverbNode = null;
    this.initialized = false;
    this.activeOscillators = [];
  }

  async init() {
    if (this.initialized) return;
    
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.3;
    
    this.reverbNode = this.createReverb();
    this.masterGain.connect(this.reverbNode);
    this.reverbNode.connect(this.audioContext.destination);
    
    this.initialized = true;
  }

  resume() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  createReverb() {
    const convolver = this.audioContext.createConvolver();
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * 2;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      }
    }
    
    convolver.buffer = impulse;
    const dryGain = this.audioContext.createGain();
    const wetGain = this.audioContext.createGain();
    dryGain.gain.value = 0.7;
    wetGain.gain.value = 0.3;
    
    const merger = this.audioContext.createChannelMerger(2);
    convolver.connect(wetGain);
    wetGain.connect(merger, 0, 0);
    dryGain.connect(merger, 0, 1);
    
    return {
      connect: (dest) => {
        convolver.connect(dest);
        dryGain.connect(dest);
      },
      get input() {
        return {
          connect: (node) => {
            node.connect(convolver);
            node.connect(dryGain);
          }
        };
      }
    };
  }

  getStopConfig(stopId) {
    const configs = {
      'principal-8': { harmonics: [1, 0.5, 0.3, 0.15, 0.1], type: 'triangle', baseGain: 0.4 },
      'principal-4': { harmonics: [1, 0.6, 0.4, 0.2], type: 'triangle', baseGain: 0.3, octaveShift: 12 },
      'principal-2': { harmonics: [1, 0.7, 0.5], type: 'triangle', baseGain: 0.25, octaveShift: 24 },
      'bourdon-16': { harmonics: [1, 0.3, 0.1], type: 'sine', baseGain: 0.5, octaveShift: -12 },
      'flute-8': { harmonics: [1, 0.2, 0.05], type: 'sine', baseGain: 0.4 },
      'flute-4': { harmonics: [1, 0.3, 0.1], type: 'sine', baseGain: 0.35, octaveShift: 12 },
      'gedackt-8': { harmonics: [1, 0.25, 0.08], type: 'sine', baseGain: 0.35 },
      'salicional-8': { harmonics: [1, 0.8, 0.6, 0.4, 0.2], type: 'sawtooth', baseGain: 0.25 },
      'violin-4': { harmonics: [1, 0.9, 0.7, 0.5, 0.3], type: 'sawtooth', baseGain: 0.2, octaveShift: 12 },
      'cello-8': { harmonics: [1, 0.7, 0.5, 0.3, 0.1], type: 'sawtooth', baseGain: 0.3 },
      'oboe-8': { harmonics: [1, 1.2, 0.8, 0.6, 0.4, 0.2], type: 'square', baseGain: 0.25 },
      'trumpet-8': { harmonics: [1, 1.5, 1, 0.8, 0.5, 0.3], type: 'square', baseGain: 0.3 },
      'clarinet-8': { harmonics: [1, 0.5, 0.3, 0.2, 0.1], type: 'square', baseGain: 0.3 },
      'mixture-iii': { harmonics: [1, 0.8, 0.6], type: 'triangle', baseGain: 0.15, octaveShift: 19, ranks: 3 },
      'mixture-v': { harmonics: [1, 0.9, 0.7, 0.5, 0.3], type: 'triangle', baseGain: 0.12, octaveShift: 24, ranks: 5 },
      'tibia-8': { harmonics: [1, 0.4, 0.15, 0.05], type: 'sine', baseGain: 0.45 },
    };
    return configs[stopId] || { harmonics: [1], type: 'sine', baseGain: 0.3 };
  }

  noteToFrequency(midiNote) {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  playStop(stopId, midiNote, duration = 1.5) {
    if (!this.audioContext) return;
    
    const config = this.getStopConfig(stopId);
    const octaveShift = config.octaveShift || 0;
    const baseFreq = this.noteToFrequency(midiNote + octaveShift);
    
    const oscillators = [];
    
    for (let i = 0; i < config.harmonics.length; i++) {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = config.type;
      osc.frequency.value = baseFreq * (i + 1);
      gain.gain.value = config.baseGain * config.harmonics[i] / config.harmonics[0];
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      const now = this.audioContext.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(config.baseGain * config.harmonics[i] / config.harmonics[0], now + 0.02);
      
      osc.start(now);
      oscillators.push({ osc, gain });
    }
    
    if (config.ranks) {
      for (let r = 1; r < config.ranks; r++) {
        const detune = r * 7;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = config.type;
        osc.frequency.value = baseFreq * Math.pow(2, detune / 12);
        gain.gain.value = config.baseGain * 0.5;
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        const now = this.audioContext.currentTime;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(config.baseGain * 0.5, now + 0.02);
        
        osc.start(now);
        oscillators.push({ osc, gain });
      }
    }
    
    setTimeout(() => {
      const now = this.audioContext.currentTime;
      oscillators.forEach(({ osc, gain }) => {
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.stop(now + 0.35);
      });
    }, duration * 1000);
    
    return oscillators;
  }

  playCombination(stopIds, midiNotes = [60, 64, 67, 72], duration = 2) {
    if (!this.audioContext) return;
    
    const allOscillators = [];
    
    stopIds.forEach(stopId => {
      midiNotes.forEach(note => {
        const oscs = this.playStop(stopId, note, duration);
        if (oscs) allOscillators.push(...oscs);
      });
    });
    
    this.activeOscillators = allOscillators;
    return allOscillators;
  }

  playChord(midiNotes = [60, 64, 67, 72], duration = 1.5) {
    if (!this.audioContext) return;
    
    const oscillators = [];
    
    midiNotes.forEach(note => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = this.noteToFrequency(note);
      gain.gain.value = 0.2;
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      const now = this.audioContext.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.01);
      gain.gain.linearRampToValueAtTime(0, now + duration);
      
      osc.start(now);
      osc.stop(now + duration + 0.1);
      
      oscillators.push(osc);
    });
    
    return oscillators;
  }
}

let audioEngine = null;

function getAudioEngine() {
  if (!audioEngine) {
    audioEngine = new OrganAudioEngine();
  }
  return audioEngine;
}

// API 工具函数
async function api(path, method = 'GET', data = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(path, options);
  return await response.json();
}

// 游戏状态管理
const gameState = {
  currentPage: 'home',
  player: null,
  levels: [],
  stops: [],
  session: null,
  targetCombinations: [],
  availableStops: [],
  currentRound: 0,
  selectedStops: [],
  phase: 'intro',
  timeLeft: 60,
  timer: null,
  hintUsed: false,
  results: [],
};

// 初始化
async function initApp() {
  const path = window.location.pathname;
  
  if (path === '/' || path === '/index.html') {
    await loadHomePage();
  } else if (path === '/levels') {
    await loadLevelsPage();
  } else if (path.startsWith('/play/')) {
    const levelId = parseInt(path.split('/')[2]);
    await loadPlayPage(levelId);
  } else if (path.startsWith('/result/')) {
    const sessionId = path.split('/')[2];
    await loadResultPage(sessionId);
  } else if (path === '/history') {
    await loadHistoryPage();
  } else if (path === '/wrong-answers') {
    await loadWrongAnswersPage();
  }
  
  updateActiveNav();
}

function updateActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.navbar-nav a').forEach(link => {
    const href = link.getAttribute('href');
    link.classList.remove('active');
    if (href === path || (path === '/' && href === '/')) {
      link.classList.add('active');
    }
  });
}

// 首页
async function loadHomePage() {
  gameState.currentPage = 'home';
  
  try {
    const [levelsData, playerData, streakData] = await Promise.all([
      api('/api/levels'),
      api('/api/player?id=player_demo'),
      api('/api/streak?playerId=player_demo'),
    ]);
    
    gameState.levels = levelsData.levels || [];
    gameState.stops = levelsData.stops || [];
    gameState.player = playerData.player;
    
    renderHomePage(streakData);
  } catch (e) {
    console.error('加载首页失败:', e);
  }
}

function renderHomePage(streakData) {
  const app = document.getElementById('app');
  const player = gameState.player || {};
  const streak = streakData?.streak || 0;
  
  app.innerHTML = `
    <div class="container">
      <section class="hero card">
        <div class="hero-content">
          <h1 class="hero-title">🎵 管风琴音栓记忆游戏</h1>
          <p class="hero-subtitle">
            通过听音辨色，记忆管风琴音栓的组合，训练你的音乐耳朵和记忆力
          </p>
          <div class="hero-actions">
            <a href="/levels" class="btn btn-primary btn-lg">开始游戏</a>
            <a href="/levels" class="btn btn-outline btn-lg">选择关卡</a>
          </div>
        </div>
      </section>
      
      <div class="stats-grid grid">
        <div class="stat-card card">
          <div class="stat-value">${gameState.levels.length}</div>
          <div class="stat-label">关卡总数</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value">${gameState.stops.length}</div>
          <div class="stat-label">音栓种类</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value">${streak}</div>
          <div class="stat-label">当前连胜</div>
        </div>
        <div class="stat-card card">
          <div class="stat-value">${player.totalScore || 0}</div>
          <div class="stat-label">总积分</div>
        </div>
      </div>
      
      <section class="card">
        <h2 class="section-title">🎮 游戏玩法</h2>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;">
          <div style="text-align: center; padding: 1rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">👂</div>
            <h3 style="margin-bottom: 0.5rem;">听音</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem;">仔细聆听目标音栓组合的音色</p>
          </div>
          <div style="text-align: center; padding: 1rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🧠</div>
            <h3 style="margin-bottom: 0.5rem;">记忆</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem;">记住音色特征，思考对应的音栓</p>
          </div>
          <div style="text-align: center; padding: 1rem;">
            <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎹</div>
            <h3 style="margin-bottom: 0.5rem;">复现</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem;">选择正确的音栓组合来复现音色</p>
          </div>
        </div>
      </section>
    </div>
  `;
}

// 关卡选择页面
async function loadLevelsPage() {
  gameState.currentPage = 'levels';
  
  try {
    const [levelsData, playerData] = await Promise.all([
      api('/api/levels'),
      api('/api/player?id=player_demo'),
    ]);
    
    gameState.levels = levelsData.levels || [];
    gameState.stops = levelsData.stops || [];
    gameState.player = playerData.player;
    
    renderLevelsPage();
  } catch (e) {
    console.error('加载关卡页面失败:', e);
  }
}

function renderLevelsPage() {
  const app = document.getElementById('app');
  const player = gameState.player || {};
  const highestLevel = player.highestLevel || 1;
  
  const levelsHtml = gameState.levels.map(level => {
    const isLocked = level.id > highestLevel + 1;
    const stars = level.stars || 0;
    
    return `
      <div class="card level-card ${isLocked ? 'locked' : ''}" data-level="${level.id}">
        <div class="level-header">
          <span class="level-number">第 ${level.id} 关</span>
          <span class="level-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</span>
        </div>
        <h3 class="level-name">${level.name}</h3>
        <p class="level-description">${level.description}</p>
        <div class="level-meta">
          <span class="difficulty-badge difficulty-${level.difficulty}">难度 ${level.difficulty}</span>
          <span style="color: var(--text-muted); font-size: 0.9rem;">
            ${level.targetCombinations.length} 个组合
          </span>
        </div>
        ${isLocked ? '<div style="text-align: center; margin-top: 1rem; color: var(--text-muted);">🔒 解锁上一关后开启</div>' : ''}
      </div>
    `;
  }).join('');
  
  app.innerHTML = `
    <div class="container">
      <h1 class="section-title">🎯 关卡选择</h1>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">
        从简单的单音栓开始，逐步挑战更复杂的组合。每一关都有新的音栓等你发现！
      </p>
      <div class="levels-grid">
        ${levelsHtml}
      </div>
    </div>
  `;
  
  document.querySelectorAll('.level-card:not(.locked)').forEach(card => {
    card.addEventListener('click', () => {
      const levelId = card.dataset.level;
      window.location.href = `/play/${levelId}`;
    });
  });
}

// 游戏页面
async function loadPlayPage(levelId) {
  gameState.currentPage = 'play';
  gameState.currentRound = 0;
  gameState.selectedStops = [];
  gameState.phase = 'intro';
  gameState.hintUsed = false;
  gameState.results = [];
  
  try {
    const [levelsData, sessionData] = await Promise.all([
      api('/api/levels'),
      api('/api/session', 'POST', { playerId: 'player_demo', levelId }),
    ]);
    
    gameState.levels = levelsData.levels || [];
    gameState.stops = levelsData.stops || [];
    gameState.session = sessionData.session;
    gameState.targetCombinations = sessionData.targetCombinations || [];
    gameState.availableStops = sessionData.availableStops || [];
    gameState.currentRound = 0;
    
    const level = gameState.levels.find(l => l.id === levelId);
    gameState.level = level;
    
    renderPlayPage();
  } catch (e) {
    console.error('加载游戏页面失败:', e);
  }
}

function renderPlayPage() {
  const app = document.getElementById('app');
  const level = gameState.level;
  const totalRounds = gameState.targetCombinations.length;
  
  const stopsMap = {};
  gameState.stops.forEach(s => stopsMap[s.id] = s);
  
  const availableStopsHtml = gameState.availableStops.map(stopId => {
    const stop = stopsMap[stopId];
    if (!stop) return '';
    const isSelected = gameState.selectedStops.includes(stopId);
    const typeIcons = {
      principal: '🎺',
      flute: '🦴',
      string: '🎻',
      reed: '🌾',
      mixture: '✨',
    };
    
    return `
      <button class="stop-button ${isSelected ? 'selected' : ''}" data-stop="${stopId}">
        <span class="stop-icon">${typeIcons[stop.type] || '🎵'}</span>
        <span class="stop-name">${stop.name}</span>
        <span class="stop-type">${stop.type}</span>
      </button>
    `;
  }).join('');
  
  let phaseContent = '';
  
  if (gameState.phase === 'intro') {
    phaseContent = `
      <div class="game-phase">
        <h2 class="phase-title">第 ${level.id} 关：${level.name}</h2>
        <p class="phase-hint">${level.description}</p>
        <p style="color: var(--text-muted); margin-bottom: 2rem;">
          共 ${totalRounds} 轮挑战，准备好了吗？
        </p>
        <button class="big-button" id="startBtn">
          🎵 开始游戏
        </button>
      </div>
    `;
  } else if (gameState.phase === 'listening') {
    phaseContent = `
      <div class="game-phase">
        <h2 class="phase-title">第 ${gameState.currentRound + 1} / ${totalRounds} 轮</h2>
        <p class="phase-hint">仔细聆听目标音色...</p>
        <button class="big-button" id="playTargetBtn">
          👂 再听一次
        </button>
        <div style="margin-top: 2rem;">
          <button class="btn btn-outline" id="readyBtn">
            我记住了，开始选择
          </button>
        </div>
      </div>
    `;
  } else if (gameState.phase === 'selecting') {
    const timerClass = gameState.timeLeft <= 10 ? 'warning' : '';
    phaseContent = `
      <div class="hint-section">
        <button class="hint-btn ${gameState.hintUsed ? 'used' : ''}" id="hintBtn" ${gameState.hintUsed ? 'disabled' : ''}>
          💡 ${gameState.hintUsed ? '已使用提示' : '使用提示 (-40%分数)'}
        </button>
      </div>
      
      <h3 style="text-align: center; margin-bottom: 1rem;">选择音栓组合</h3>
      <div class="stop-grid">
        ${availableStopsHtml}
      </div>
      
      <div style="text-align: center; margin-top: 2rem;">
        <p style="color: var(--text-muted); margin-bottom: 1rem;">
          已选择 <strong>${gameState.selectedStops.length}</strong> 个音栓
        </p>
        <button class="big-button" id="submitBtn" ${gameState.selectedStops.length === 0 ? 'disabled' : ''}>
          ✅ 提交答案
        </button>
      </div>
    `;
  } else if (gameState.phase === 'result') {
    const result = gameState.results[gameState.results.length - 1];
    const similarity = result ? Math.round(result.similarity * 100) : 0;
    const isCorrect = result?.isCorrect;
    
    phaseContent = `
      <div class="game-phase">
        <h2 class="phase-title">${isCorrect ? '🎉 完全正确！' : '🤔 继续加油'}</h2>
        <div class="result-score" style="margin: 2rem 0;">
          <div class="score-number">${result?.score || 0}</div>
          <div class="score-label">本轮得分</div>
          <div style="margin-top: 1rem; font-size: 1.1rem;">
            相似度: <strong>${similarity}%</strong>
          </div>
        </div>
        
        <div class="stops-compare" style="max-width: 500px; margin: 0 auto;">
          <div>
            <div class="stops-label">正确答案</div>
            <div class="stops-target">
              ${gameState.targetCombinations[gameState.currentRound].map(s => `
                <span class="stop-tag correct">${stopsMap[s]?.name || s}</span>
              `).join('')}
            </div>
          </div>
          <div>
            <div class="stops-label">你的答案</div>
            <div class="stops-target">
              ${gameState.selectedStops.map(s => {
                const isRight = gameState.targetCombinations[gameState.currentRound].includes(s);
                return `<span class="stop-tag ${isRight ? 'correct' : 'wrong'}">${stopsMap[s]?.name || s}</span>`;
              }).join('')}
            </div>
          </div>
        </div>
        
        <div style="margin-top: 2rem;">
          ${gameState.currentRound < totalRounds - 1 ? `
            <button class="big-button" id="nextRoundBtn">
              下一轮 →
            </button>
          ` : `
            <button class="big-button" id="finishBtn">
              查看结算
            </button>
          `}
        </div>
      </div>
    `;
  } else if (gameState.phase === 'finished') {
    phaseContent = `
      <div class="game-phase">
        <h2 class="phase-title">🎉 挑战完成！</h2>
        <p class="phase-hint">正在加载结算页面...</p>
      </div>
    `;
  }
  
  const progress = (gameState.currentRound / totalRounds) * 100;
  
  app.innerHTML = `
    <div class="container game-container">
      <div class="card">
        <div class="game-header">
          <span class="game-round">第 ${gameState.currentRound + 1} / ${totalRounds} 轮</span>
          ${gameState.phase === 'selecting' ? `<span class="game-timer ${timerClass}">⏱️ ${gameState.timeLeft}s</span>` : ''}
        </div>
        
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
        
        ${phaseContent}
      </div>
      
      ${gameState.phase === 'selecting' || gameState.phase === 'listening' ? `
        <div style="text-align: center; margin-top: 1.5rem;">
          <button class="btn btn-outline btn-sm" id="auditionBtn">
            🎧 试听我的选择
          </button>
        </div>
      ` : ''}
    </div>
  `;
  
  bindGameEvents();
}

function bindGameEvents() {
  const startBtn = document.getElementById('startBtn');
  if (startBtn) {
    startBtn.addEventListener('click', startRound);
  }
  
  const playTargetBtn = document.getElementById('playTargetBtn');
  if (playTargetBtn) {
    playTargetBtn.addEventListener('click', playTargetSound);
  }
  
  const readyBtn = document.getElementById('readyBtn');
  if (readyBtn) {
    readyBtn.addEventListener('click', () => {
      gameState.phase = 'selecting';
      gameState.timeLeft = 60;
      startTimer();
      renderPlayPage();
    });
  }
  
  const hintBtn = document.getElementById('hintBtn');
  if (hintBtn && !gameState.hintUsed) {
    hintBtn.addEventListener('click', useHint);
  }
  
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.addEventListener('click', submitAnswer);
  }
  
  const nextRoundBtn = document.getElementById('nextRoundBtn');
  if (nextRoundBtn) {
    nextRoundBtn.addEventListener('click', () => {
      gameState.currentRound++;
      gameState.selectedStops = [];
      gameState.hintUsed = false;
      gameState.phase = 'listening';
      stopTimer();
      renderPlayPage();
      playTargetSound();
    });
  }
  
  const finishBtn = document.getElementById('finishBtn');
  if (finishBtn) {
    finishBtn.addEventListener('click', finishGame);
  }
  
  const auditionBtn = document.getElementById('auditionBtn');
  if (auditionBtn) {
    auditionBtn.addEventListener('click', () => {
      if (gameState.selectedStops.length > 0) {
        playCombinationSound(gameState.selectedStops);
      }
    });
  }
  
  document.querySelectorAll('.stop-button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (gameState.phase !== 'selecting') return;
      
      const stopId = btn.dataset.stop;
      if (gameState.selectedStops.includes(stopId)) {
        gameState.selectedStops = gameState.selectedStops.filter(s => s !== stopId);
      } else {
        gameState.selectedStops.push(stopId);
      }
      renderPlayPage();
    });
  });
}

async function startRound() {
  const engine = getAudioEngine();
  await engine.init();
  
  gameState.phase = 'listening';
  renderPlayPage();
  playTargetSound();
}

function playTargetSound() {
  const engine = getAudioEngine();
  engine.init();
  engine.resume();
  
  const target = gameState.targetCombinations[gameState.currentRound];
  const notes = gameState.level?.phraseNotes || [60, 64, 67, 72];
  
  engine.playCombination(target, notes, 2.5);
}

function playCombinationSound(stops) {
  const engine = getAudioEngine();
  engine.resume();
  
  const notes = gameState.level?.phraseNotes || [60, 64, 67, 72];
  engine.playCombination(stops, notes, 2);
}

function useHint() {
  if (gameState.hintUsed) return;
  
  gameState.hintUsed = true;
  
  const target = gameState.targetCombinations[gameState.currentRound];
  if (target.length > 0 && !gameState.selectedStops.includes(target[0])) {
    gameState.selectedStops.push(target[0]);
  }
  
  renderPlayPage();
}

function startTimer() {
  stopTimer();
  gameState.timer = setInterval(() => {
    if (gameState.timeLeft > 0) {
      gameState.timeLeft--;
      const timerEl = document.querySelector('.game-timer');
      if (timerEl) {
        timerEl.textContent = `⏱️ ${gameState.timeLeft}s`;
        if (gameState.timeLeft <= 10) {
          timerEl.classList.add('warning');
        }
      }
    } else {
      stopTimer();
      submitAnswer();
    }
  }, 1000);
}

function stopTimer() {
  if (gameState.timer) {
    clearInterval(gameState.timer);
    gameState.timer = null;
  }
}

async function submitAnswer() {
  stopTimer();
  
  const timeTaken = 60 - gameState.timeLeft;
  
  try {
    const result = await api('/api/session', 'PATCH', {
      action: 'submitRound',
      sessionId: gameState.session.id,
      roundNumber: gameState.currentRound,
      targetStops: gameState.targetCombinations[gameState.currentRound],
      playerStops: [...gameState.selectedStops],
      timeTaken,
      hintUsed: gameState.hintUsed,
    });
    
    if (result.roundResult) {
      gameState.results.push(result.roundResult);
    }
    
    gameState.phase = 'result';
    renderPlayPage();
  } catch (e) {
    console.error('提交答案失败:', e);
  }
}

async function finishGame() {
  gameState.phase = 'finished';
  renderPlayPage();
  
  try {
    const result = await api('/api/session', 'PATCH', {
      action: 'finishSession',
      sessionId: gameState.session.id,
    });
    
    window.location.href = `/result/${gameState.session.id}`;
  } catch (e) {
    console.error('结束游戏失败:', e);
  }
}

// 结算页面
async function loadResultPage(sessionId) {
  gameState.currentPage = 'result';
  
  try {
    const levelsData = await api('/api/levels');
    gameState.levels = levelsData.levels || [];
    gameState.stops = levelsData.stops || [];
    
    renderResultPage(sessionId);
  } catch (e) {
    console.error('加载结算页面失败:', e);
  }
}

function renderResultPage(sessionId) {
  const app = document.getElementById('app');
  
  const storedData = localStorage.getItem(`session_${sessionId}`);
  const sessionData = storedData ? JSON.parse(storedData) : null;
  
  const mockResults = gameState.results.length > 0 ? gameState.results : [
    { score: 85, similarity: 0.85, isCorrect: false, playerStops: ['principal-8'], targetStops: ['principal-8', 'flute-8'] },
    { score: 100, similarity: 1, isCorrect: true, playerStops: ['flute-8'], targetStops: ['flute-8'] },
    { score: 70, similarity: 0.7, isCorrect: false, playerStops: ['gedackt-8'], targetStops: ['bourdon-16'] },
  ];
  
  const totalScore = mockResults.reduce((sum, r) => sum + r.score, 0);
  const maxScore = mockResults.length * 100;
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
  const correctCount = mockResults.filter(r => r.isCorrect).length;
  const stars = percentage >= 90 ? 3 : percentage >= 75 ? 2 : percentage >= 60 ? 1 : 0;
  const passed = percentage >= 60;
  
  const stopsMap = {};
  gameState.stops.forEach(s => stopsMap[s.id] = s);
  
  app.innerHTML = `
    <div class="container" style="max-width: 700px;">
      <div class="card">
        <div class="result-score">
          <div class="score-stars">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
          <div class="score-number">${Math.round(totalScore)}</div>
          <div class="score-label">总得分</div>
          <div style="margin-top: 1rem; color: ${passed ? 'var(--success)' : 'var(--danger)'}; font-weight: 600;">
            ${passed ? '🎉 恭喜通关！' : '💪 再接再厉'}
          </div>
        </div>
        
        <div class="stats-grid" style="grid-template-columns: repeat(3, 1fr);">
          <div class="stat-card">
            <div class="stat-value">${correctCount}/${mockResults.length}</div>
            <div class="stat-label">正确率</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${Math.round(percentage)}%</div>
            <div class="stat-label">得分率</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${stars}</div>
            <div class="stat-label">获得星数</div>
          </div>
        </div>
        
        <h3 class="section-title">回合详情</h3>
        <div class="round-results">
          ${mockResults.map((result, i) => {
            const similarity = Math.round(result.similarity * 100);
            const statusClass = result.isCorrect ? 'correct' : similarity >= 60 ? 'partial' : 'wrong';
            return `
              <div class="round-result-item ${statusClass}">
                <div class="round-info">
                  <span class="round-number">${i + 1}</span>
                  <div>
                    <div style="font-size: 0.85rem; color: var(--text-muted);">
                      目标: ${result.targetStops?.map(s => stopsMap[s]?.name || s).join(', ') || '-'}
                    </div>
                  </div>
                </div>
                <span class="round-score">${result.score}</span>
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="game-actions">
          <a href="/levels" class="btn btn-outline">返回关卡</a>
          <a href="/play/${gameState.level?.id || 1}" class="btn btn-primary">再玩一次</a>
        </div>
      </div>
    </div>
  `;
}

// 历史战绩页面
async function loadHistoryPage() {
  gameState.currentPage = 'history';
  
  try {
    const [playerData, streakData, levelsData] = await Promise.all([
      api('/api/player?id=player_demo'),
      api('/api/streak?playerId=player_demo'),
      api('/api/levels'),
    ]);
    
    gameState.player = playerData.player;
    gameState.levels = levelsData.levels || [];
    
    renderHistoryPage(streakData);
  } catch (e) {
    console.error('加载历史页面失败:', e);
  }
}

function renderHistoryPage(streakData) {
  const app = document.getElementById('app');
  const player = gameState.player || {};
  const streak = streakData?.streak || 0;
  
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7Days.push({
      date: date.toISOString().split('T')[0],
      active: i <= streak - 1,
    });
  }
  
  app.innerHTML = `
    <div class="container">
      <h1 class="section-title">📊 战绩中心</h1>
      
      <div class="card">
        <div class="player-profile">
          <div class="player-avatar">🎵</div>
          <div class="player-info">
            <h3>${player.name || '管风琴学徒'}</h3>
            <p>ID: ${player.id || 'player_demo'}</p>
          </div>
        </div>
        
        <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr);">
          <div class="stat-card">
            <div class="stat-value">${player.totalScore || 0}</div>
            <div class="stat-label">总积分</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${player.highestLevel || 1}</div>
            <div class="stat-label">最高关卡</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${player.bestStreak || streak}</div>
            <div class="stat-label">最佳连胜</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${player.totalPlays || 0}</div>
            <div class="stat-label">游戏次数</div>
          </div>
        </div>
      </div>
      
      <div class="card" style="margin-top: 1.5rem;">
        <h3 class="section-title" style="margin-top: 0;">🔥 每日连胜</h3>
        <p style="color: var(--text-muted); margin-bottom: 1rem;">
          当前连胜 <strong style="color: var(--warning);">${streak}</strong> 天，继续保持！
        </p>
        <div class="streak-calendar">
          ${last7Days.map(d => `
            <div class="calendar-day ${d.active ? 'active' : ''}" title="${d.date}">
              ${new Date(d.date).getDate()}
            </div>
          `).join('')}
        </div>
        <p style="font-size: 0.85rem; color: var(--text-muted); text-align: center; margin-top: 1rem;">
          最近 7 天游戏记录
        </p>
      </div>
      
      <div class="card" style="margin-top: 1.5rem;">
        <h3 class="section-title" style="margin-top: 0;">🏆 成就系统</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">
          <div style="text-align: center; padding: 1rem; background: var(--bg-light); border-radius: 0.75rem; opacity: ${player.totalScore >= 100 ? 1 : 0.4};">
            <div style="font-size: 2rem;">🎵</div>
            <div style="font-weight: 600; font-size: 0.9rem; margin-top: 0.5rem;">初露锋芒</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">累计得分 100</div>
          </div>
          <div style="text-align: center; padding: 1rem; background: var(--bg-light); border-radius: 0.75rem; opacity: ${player.highestLevel >= 3 ? 1 : 0.4};">
            <div style="font-size: 2rem;">🎯</div>
            <div style="font-weight: 600; font-size: 0.9rem; margin-top: 0.5rem;">渐入佳境</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">通关第3关</div>
          </div>
          <div style="text-align: center; padding: 1rem; background: var(--bg-light); border-radius: 0.75rem; opacity: ${streak >= 3 ? 1 : 0.4};">
            <div style="font-size: 2rem;">🔥</div>
            <div style="font-weight: 600; font-size: 0.9rem; margin-top: 0.5rem;">三日连庄</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">连续3天游戏</div>
          </div>
          <div style="text-align: center; padding: 1rem; background: var(--bg-light); border-radius: 0.75rem; opacity: 0.4;">
            <div style="font-size: 2rem;">👑</div>
            <div style="font-weight: 600; font-size: 0.9rem; margin-top: 0.5rem;">管风琴大师</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">通关全部关卡</div>
          </div>
        </div>
      </div>
      
      <div class="card" style="margin-top: 1.5rem;">
        <h3 class="section-title" style="margin-top: 0;">📋 最近游戏</h3>
        <div class="history-list">
          <a href="/result/sess-1" class="history-item">
            <div>
              <strong>第 1 关 · 初识音栓</strong>
              <div style="font-size: 0.85rem; color: var(--text-muted);">
                2026-06-15 · 得分 380 · ⭐⭐☆
              </div>
            </div>
            <span style="color: var(--success);">✓ 通关</span>
          </a>
          <a href="/result/sess-2" class="history-item">
            <div>
              <strong>第 2 关 · 双栓组合</strong>
              <div style="font-size: 0.85rem; color: var(--text-muted);">
                2026-06-14 · 得分 290 · ⭐☆☆
              </div>
            </div>
            <span style="color: var(--warning);">△ 未通关</span>
          </a>
        </div>
      </div>
    </div>
  `;
}

// 错题本页面
async function loadWrongAnswersPage() {
  gameState.currentPage = 'wrong-answers';
  
  try {
    const [wrongData, levelsData] = await Promise.all([
      api('/api/wrong-answers?playerId=player_demo'),
      api('/api/levels'),
    ]);
    
    gameState.levels = levelsData.levels || [];
    gameState.stops = levelsData.stops || [];
    
    renderWrongAnswersPage(wrongData.wrongAnswers || []);
  } catch (e) {
    console.error('加载错题本失败:', e);
  }
}

function renderWrongAnswersPage(wrongAnswers) {
  const app = document.getElementById('app');
  
  const stopsMap = {};
  gameState.stops.forEach(s => stopsMap[s.id] = s);
  
  const groupedByLevel = {};
  wrongAnswers.forEach(wa => {
    if (!groupedByLevel[wa.levelId]) {
      groupedByLevel[wa.levelId] = [];
    }
    groupedByLevel[wa.levelId].push(wa);
  });
  
  app.innerHTML = `
    <div class="container">
      <h1 class="section-title">📝 错题本</h1>
      <p style="color: var(--text-muted); margin-bottom: 2rem;">
        这里记录了你答错的音栓组合，多听多练，熟能生巧！
      </p>
      
      ${wrongAnswers.length === 0 ? `
        <div class="card" style="text-align: center; padding: 3rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
          <h3>太棒了！</h3>
          <p style="color: var(--text-muted);">暂无错题，继续保持！</p>
        </div>
      ` : `
        ${Object.entries(groupedByLevel).map(([levelId, items]) => `
          <div class="card" style="margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 1rem;">
              第 ${levelId} 关：${gameState.levels.find(l => l.id === parseInt(levelId))?.name || '未知关卡'}
              <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: normal;">
                (${items.length} 道错题)
              </span>
            </h3>
            
            ${items.map((wa, i) => {
              const correctStops = wa.targetStops || [];
              const playerStops = wa.playerStops || [];
              
              return `
                <div class="wrong-answer-item">
                  <div class="wrong-answer-header">
                    <span style="font-weight: 600;">第 ${i + 1} 题</span>
                    <span style="font-size: 0.85rem; color: var(--text-muted);">
                      相似度: ${Math.round((wa.similarity || 0) * 100)}%
                    </span>
                  </div>
                  <div class="stops-compare">
                    <div>
                      <div class="stops-label">正确答案</div>
                      <div class="stops-target">
                        ${correctStops.map(s => `
                          <span class="stop-tag correct">${stopsMap[s]?.name || s}</span>
                        `).join('')}
                      </div>
                    </div>
                    <div>
                      <div class="stops-label">你的答案</div>
                      <div class="stops-target">
                        ${playerStops.map(s => {
                          const isRight = correctStops.includes(s);
                          return `<span class="stop-tag ${isRight ? 'correct' : 'wrong'}">${stopsMap[s]?.name || s}</span>`;
                        }).join('')}
                        ${correctStops.filter(s => !playerStops.includes(s)).map(s => `
                          <span class="stop-tag missed">${stopsMap[s]?.name || s} (遗漏)</span>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                  <div style="margin-top: 0.75rem;">
                    <button class="btn btn-sm btn-outline review-btn" data-stops='${JSON.stringify(correctStops)}'>
                      🔊 再听一次正确答案
                    </button>
                    ${wa.reviewed ? '<span style="color: var(--success); margin-left: 1rem; font-size: 0.85rem;">✓ 已复习</span>' : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `).join('')}
      `}
    </div>
  `;
  
  document.querySelectorAll('.review-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const stops = JSON.parse(e.target.dataset.stops);
      const engine = getAudioEngine();
      await engine.init();
      engine.resume();
      engine.playCombination(stops, [60, 64, 67, 72], 2.5);
    });
  });
}

// 页面加载
document.addEventListener('DOMContentLoaded', initApp);
