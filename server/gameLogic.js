const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CURRENT_FILE = path.join(DATA_DIR, 'current.json');
function getSaveFile(gameId) {
  return path.join(DATA_DIR, `save_${gameId}.json`);
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const GAMES = {
  yi: {
    id: 'yi',
    name: '乙局 · 教学之章',
    description: '初学者入门，资源充足，熟悉琉璃温室的基本运作方式。',
    difficulty: '教学',
    initialState: {
      sealedValue: 100,
      rewriteSlots: 5,
      translationTraces: 3,
      yiRisk: 0,
      renReward: 0,
      ziFailure: 0,
      turn: 1,
      maxTurns: 8
    },
    winCondition: { type: 'sealedValue', target: 150 },
    loseCondition: { type: 'yiRisk', target: 100 },
    events: [
      { id: 'yi_e1', name: '晨光折射', desc: '阳光穿过琉璃，封存值+15', effect: { sealedValue: 15 }, cost: { rewriteSlots: 0 } },
      { id: 'yi_e2', name: '温湿调节', desc: '消耗1复写槽，封存值+25，乙号风险+5', effect: { sealedValue: 25, yiRisk: 5 }, cost: { rewriteSlots: 1 } },
      { id: 'yi_e3', name: '转译校准', desc: '消耗1转译痕，复写槽+2', effect: { rewriteSlots: 2 }, cost: { translationTraces: 1 } },
      { id: 'yi_e4', name: '静置沉淀', desc: '封存值+8，无消耗', effect: { sealedValue: 8 }, cost: {} },
      { id: 'yi_e5', name: '风险缓冲', desc: '消耗1复写槽，乙号风险-10', effect: { yiRisk: -10 }, cost: { rewriteSlots: 1 } },
      { id: 'yi_e6', name: '壬号观测', desc: '封存值+5，壬号奖励+3', effect: { sealedValue: 5, renReward: 3 }, cost: {} }
    ],
    mapNodes: [
      { id: 'n1', x: 15, y: 30, label: '入光口' },
      { id: 'n2', x: 40, y: 20, label: '折射层' },
      { id: 'n3', x: 65, y: 35, label: '调温腔' },
      { id: 'n4', x: 35, y: 55, label: '储水槽' },
      { id: 'n5', x: 70, y: 60, label: '封存室' },
      { id: 'n6', x: 85, y: 45, label: '出口闸' }
    ],
    hiddenCondition: null
  },

  ren: {
    id: 'ren',
    name: '壬局 · 匮乏之试',
    description: '资源短缺，每一步都需精打细算，考验调度智慧。',
    difficulty: '困难',
    initialState: {
      sealedValue: 60,
      rewriteSlots: 2,
      translationTraces: 1,
      yiRisk: 15,
      renReward: 0,
      ziFailure: 0,
      turn: 1,
      maxTurns: 10
    },
    winCondition: { type: 'renReward', target: 20 },
    loseCondition: { type: 'sealedValue', target: 0 },
    events: [
      { id: 'ren_e1', name: '微光收集', desc: '封存值+10，壬号奖励+1', effect: { sealedValue: 10, renReward: 1 }, cost: {} },
      { id: 'ren_e2', name: '强制转译', desc: '消耗2复写槽，转译痕+2，封存值-5', effect: { translationTraces: 2, sealedValue: -5 }, cost: { rewriteSlots: 2 } },
      { id: 'ren_e3', name: '风险投注', desc: '乙号风险+15，壬号奖励+5', effect: { yiRisk: 15, renReward: 5 }, cost: {} },
      { id: 'ren_e4', name: '精准调配', desc: '消耗1转译痕，封存值+20，复写槽+1', effect: { sealedValue: 20, rewriteSlots: 1 }, cost: { translationTraces: 1 } },
      { id: 'ren_e5', name: '节能模式', desc: '封存值+5，复写槽+1', effect: { sealedValue: 5, rewriteSlots: 1 }, cost: {} },
      { id: 'ren_e6', name: '壬号共鸣', desc: '消耗3复写槽，壬号奖励+8', effect: { renReward: 8 }, cost: { rewriteSlots: 3 } }
    ],
    mapNodes: [
      { id: 'n1', x: 10, y: 50, label: '枯竭源' },
      { id: 'n2', x: 30, y: 25, label: '残光层' },
      { id: 'n3', x: 50, y: 50, label: '中继腔' },
      { id: 'n4', x: 35, y: 70, label: '渗滤槽' },
      { id: 'n5', x: 70, y: 35, label: '聚光塔' },
      { id: 'n6', x: 80, y: 65, label: '壬号核' },
      { id: 'n7', x: 55, y: 80, label: '备用舱' }
    ],
    hiddenCondition: null
  },

  zi: {
    id: 'zi',
    name: '子局 · 隐秘之境',
    description: '隐藏条件等待触发，子号失败因子潜伏其中，探索真正的结局。',
    difficulty: '隐藏',
    initialState: {
      sealedValue: 80,
      rewriteSlots: 4,
      translationTraces: 2,
      yiRisk: 10,
      renReward: 5,
      ziFailure: 0,
      turn: 1,
      maxTurns: 12
    },
    winCondition: { type: 'sealedValue', target: 200 },
    loseCondition: { type: 'ziFailure', target: 100 },
    events: [
      { id: 'zi_e1', name: '琉璃共振', desc: '封存值+12，子号失败因子+5', effect: { sealedValue: 12, ziFailure: 5 }, cost: {} },
      { id: 'zi_e2', name: '深层复写', desc: '消耗2复写槽，封存值+30，子号失败因子+8，转译痕+1', effect: { sealedValue: 30, ziFailure: 8, translationTraces: 1 }, cost: { rewriteSlots: 2 } },
      { id: 'zi_e3', name: '转译净化', desc: '消耗2转译痕，子号失败因子-15', effect: { ziFailure: -15 }, cost: { translationTraces: 2 } },
      { id: 'zi_e4', name: '乙号屏障', desc: '消耗1复写槽，乙号风险-8，封存值+10', effect: { yiRisk: -8, sealedValue: 10 }, cost: { rewriteSlots: 1 } },
      { id: 'zi_e5', name: '壬号增幅', desc: '壬号奖励+4，封存值+8', effect: { renReward: 4, sealedValue: 8 }, cost: {} },
      { id: 'zi_e6', name: '隐秘通道', desc: '消耗2转译痕，封存值+50，子号失败因子+20', effect: { sealedValue: 50, ziFailure: 20 }, cost: { translationTraces: 2 } },
      { id: 'zi_e7', name: '稳态维持', desc: '封存值+6，所有风险-2', effect: { sealedValue: 6, yiRisk: -2, ziFailure: -2 }, cost: {} }
    ],
    mapNodes: [
      { id: 'n1', x: 20, y: 20, label: '表层门' },
      { id: 'n2', x: 50, y: 15, label: '幻彩廊' },
      { id: 'n3', x: 75, y: 25, label: '观测台' },
      { id: 'n4', x: 25, y: 50, label: '回廊' },
      { id: 'n5', x: 50, y: 45, label: '中枢' },
      { id: 'n6', x: 80, y: 55, label: '禁忌室' },
      { id: 'n7', x: 30, y: 75, label: '地下池' },
      { id: 'n8', x: 60, y: 80, label: '子号核' },
      { id: 'n9', x: 85, y: 75, label: '真·出口' }
    ],
    hiddenCondition: {
      type: 'ziFailure_and_sealed',
      ziFailureMin: 50,
      sealedValueMin: 150,
      reward: '隐藏结局：琉璃之心觉醒，获得特殊成就「破晓之子」'
    }
  }
};

function getGameConfig(gameId) {
  return GAMES[gameId] || null;
}

function listGames() {
  return Object.values(GAMES).map(g => ({
    id: g.id,
    name: g.name,
    description: g.description,
    difficulty: g.difficulty
  }));
}

function loadSaveGame(gameId) {
  ensureDataDir();
  const saveFile = getSaveFile(gameId);
  if (fs.existsSync(saveFile)) {
    try {
      const data = fs.readFileSync(saveFile, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return null;
    }
  }
  return null;
}

function getCurrentGameId() {
  ensureDataDir();
  if (fs.existsSync(CURRENT_FILE)) {
    try {
      const data = fs.readFileSync(CURRENT_FILE, 'utf8');
      const j = JSON.parse(data);
      return j.gameId || null;
    } catch (e) {
      return null;
    }
  }
  return null;
}

function setCurrentGameId(gameId) {
  ensureDataDir();
  fs.writeFileSync(CURRENT_FILE, JSON.stringify({ gameId }, null, 2), 'utf8');
}

function saveGameState(state) {
  ensureDataDir();
  const saveFile = getSaveFile(state.gameId);
  fs.writeFileSync(saveFile, JSON.stringify(state, null, 2), 'utf8');
  setCurrentGameId(state.gameId);
}

function clearSaveGame(gameId) {
  ensureDataDir();
  const saveFile = getSaveFile(gameId);
  if (fs.existsSync(saveFile)) {
    fs.unlinkSync(saveFile);
  }
  const cur = getCurrentGameId();
  if (cur === gameId && fs.existsSync(CURRENT_FILE)) {
    fs.unlinkSync(CURRENT_FILE);
  }
}

function calculateSettlement(gameId, finalState, history) {
  const game = getGameConfig(gameId);
  if (!game) return null;

  const result = {
    gameId,
    gameName: game.name,
    finalState: { ...finalState },
    steps: history.length,
    win: false,
    lose: false,
    hiddenTriggered: false,
    message: '',
    score: 0
  };

  const win = game.winCondition;
  const lose = game.loseCondition;

  if (win.type === 'sealedValue') {
    result.win = finalState.sealedValue >= win.target;
  } else if (win.type === 'renReward') {
    result.win = finalState.renReward >= win.target;
  }

  if (lose.type === 'yiRisk') {
    result.lose = finalState.yiRisk >= lose.target;
  } else if (lose.type === 'sealedValue') {
    result.lose = finalState.sealedValue <= lose.target;
  } else if (lose.type === 'ziFailure') {
    result.lose = finalState.ziFailure >= lose.target;
  }

  if (game.hiddenCondition) {
    const hc = game.hiddenCondition;
    if (hc.type === 'ziFailure_and_sealed') {
      if (finalState.ziFailure >= hc.ziFailureMin && finalState.sealedValue >= hc.sealedValueMin) {
        result.hiddenTriggered = true;
        result.hiddenMessage = hc.reward;
      }
    }
  }

  if (result.hiddenTriggered) {
    result.message = '隐藏结局触发！' + result.hiddenMessage;
    result.score = finalState.sealedValue * 2 + finalState.renReward * 10 - finalState.ziFailure;
  } else if (result.win) {
    result.message = '胜利！你成功完成了资源配给。';
    result.score = finalState.sealedValue + finalState.renReward * 5 - finalState.yiRisk;
  } else if (result.lose) {
    result.message = '失败...琉璃温室的平衡被打破了。';
    result.score = 0;
  } else {
    result.message = '未完成所有回合。';
    result.score = Math.max(0, finalState.sealedValue - 50);
  }

  return result;
}

function applyEvent(state, event) {
  const newState = { ...state };

  for (const [key, value] of Object.entries(event.cost)) {
    if (newState[key] === undefined || newState[key] < value) {
      return { success: false, reason: `${key} 不足` };
    }
  }

  for (const [key, value] of Object.entries(event.cost)) {
    newState[key] -= value;
  }

  for (const [key, value] of Object.entries(event.effect)) {
    if (newState[key] !== undefined) {
      newState[key] += value;
    }
  }

  if (newState.sealedValue < 0) newState.sealedValue = 0;
  if (newState.rewriteSlots < 0) newState.rewriteSlots = 0;
  if (newState.translationTraces < 0) newState.translationTraces = 0;
  if (newState.yiRisk < 0) newState.yiRisk = 0;
  if (newState.ziFailure < 0) newState.ziFailure = 0;
  if (newState.renReward < 0) newState.renReward = 0;

  newState.turn = state.turn + 1;

  return { success: true, newState };
}

module.exports = {
  GAMES,
  getGameConfig,
  listGames,
  loadSaveGame,
  getCurrentGameId,
  setCurrentGameId,
  saveGameState,
  clearSaveGame,
  calculateSettlement,
  applyEvent
};
