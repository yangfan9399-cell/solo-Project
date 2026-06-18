import {
  getLevels, startGame, restoreGame, movePlayer, useEvent, settleGame
} from './api';
import { GameLevelId, GameState, ReplayStep, GameResult, Position } from './types';
import { levelInfo } from './levelsShared';

let sessionId: string | null = null;
let currentState: GameState | null = null;
let replay: ReplayStep[] = [];
let currentPlayer: 1 | 2 = 1;
let replayIndex: number = -1;
let isReplayMode: boolean = false;
let currentResult: GameResult | null = null;

const STORAGE_KEY = 'liuli_greenhouse_save';

function $(id: string): HTMLElement {
  return document.getElementById(id)!;
}

function showToast(msg: string, duration = 2000) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), duration);
}

function saveToLocal() {
  if (sessionId && replay.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      sessionId,
      replay,
      levelId: currentState?.levelId
    }));
  }
}

function loadFromLocal(): { replay: ReplayStep[]; levelId: GameLevelId } | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (data.replay && Array.isArray(data.replay)) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

function clearLocalSave() {
  localStorage.removeItem(STORAGE_KEY);
}

function posEquals(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

function getCellClass(type: string): string {
  return `cell cell-${type}`;
}

function renderBoard(state: GameState) {
  const boardEl = $('game-board') as HTMLElement;
  const { width, height, cells } = state.board;

  boardEl.style.gridTemplateColumns = `repeat(${width}, auto)`;
  boardEl.innerHTML = '';

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const cell = cells.find(c => c.position.x === x && c.position.y === y);
      if (!cell) continue;

      const div = document.createElement('div');
      let cls = getCellClass(cell.type);

      if (cell.activated) {
        cls += ' activated';
      }

      const p1Here = posEquals(state.player1.position, cell.position);
      const p2Here = posEquals(state.player2.position, cell.position);

      if (p1Here) {
        cls += ' cell-player1';
      }
      if (p2Here) {
        cls += ' cell-player2';
      }

      if (cell.type === 'switch' || cell.type === 'door' || cell.type === 'mechanism') {
        div.textContent = cell.label || '';
      }

      div.className = cls;
      div.title = cell.label || `(${x},${y})`;
      boardEl.appendChild(div);
    }
  }
}

function renderStats(state: GameState) {
  $('stat-line').textContent = String(state.lineValue);
  $('stat-measure').textContent = String(state.measureSlot);
  $('stat-balance').textContent = String(state.balanceMark);
  $('stat-wu').textContent = String(state.wuRisk);
  $('stat-ding').textContent = String(state.dingReward);
  $('stat-wei').textContent = String(state.weiFailFactor);
  $('turn-count').textContent = String(state.turn);
  $('p1-crystals').textContent = String(state.player1.crystals);
  $('p2-crystals').textContent = String(state.player2.crystals);
}

function formatEffect(effect: { [key: string]: number | undefined }): string {
  const parts: string[] = [];
  const labels: Record<string, string> = {
    lineValue: '描线值',
    measureSlot: '量测槽',
    balanceMark: '配平痕',
    wuRisk: '戊号风险',
    dingReward: '丁号奖励',
    weiFailFactor: '未号因子',
    crystals: '琉璃晶'
  };

  for (const [key, val] of Object.entries(effect)) {
    if (val === undefined || val === 0) continue;
    const label = labels[key] || key;
    const sign = val > 0 ? '+' : '';
    parts.push(`${label} ${sign}${val}`);
  }

  return parts.join(' · ');
}

function renderEvents(state: GameState) {
  const container = $('events-container');
  container.innerHTML = '';

  const manualEvents = state.events.filter(e => e.trigger === 'manual');

  if (manualEvents.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 12px;">无可触发事件</p>';
    return;
  }

  for (const event of manualEvents) {
    const card = document.createElement('div');
    card.className = 'event-card';

    const title = document.createElement('h4');
    title.textContent = event.title;
    card.appendChild(title);

    const desc = document.createElement('p');
    desc.textContent = event.description;
    card.appendChild(desc);

    const effectText = formatEffect(event.effect);
    if (effectText) {
      const effectDiv = document.createElement('div');
      effectDiv.className = 'event-effect';
      effectDiv.innerHTML = `<span class="effect-tag">${effectText}</span>`;
      card.appendChild(effectDiv);
    }

    const canUse = state.measureSlot > 0 && state.status === 'playing' && !isReplayMode;

    if (event.choices && event.choices.length > 0) {
      const choicesDiv = document.createElement('div');
      choicesDiv.className = 'event-choices';

      for (let i = 0; i < event.choices.length; i++) {
        const choice = event.choices[i];
        const btn = document.createElement('button');
        btn.className = 'event-choice-btn';
        btn.textContent = `${choice.label} · ${formatEffect(choice.effect) || '无效果'}`;
        btn.disabled = !canUse;
        btn.onclick = () => handleUseEvent(event.id, i);
        choicesDiv.appendChild(btn);
      }

      card.appendChild(choicesDiv);
    } else {
      const btn = document.createElement('button');
      btn.className = 'btn-use-event';
      btn.textContent = '触发事件 (-1 量测槽)';
      btn.disabled = !canUse;
      btn.onclick = () => handleUseEvent(event.id);
      card.appendChild(btn);
    }

    container.appendChild(card);
  }
}

function renderReplayTimeline() {
  const timeline = $('replay-timeline');
  timeline.innerHTML = '';

  for (let i = 0; i < replay.length; i++) {
    const step = replay[i];
    const item = document.createElement('div');
    item.className = 'replay-item';
    if (i === replayIndex || (replayIndex === -1 && i === replay.length - 1)) {
      item.classList.add('current');
    }

    const num = document.createElement('span');
    num.className = 'replay-step-num';
    num.textContent = `#${step.step}`;

    const action = document.createElement('span');
    action.className = 'replay-action';
    action.textContent = step.action.description;

    item.appendChild(num);
    item.appendChild(action);

    item.onclick = () => jumpToStep(i);
    timeline.appendChild(item);
  }
}

function renderResult(result: GameResult | null) {
  const container = $('result-container');

  if (!result) {
    container.innerHTML = '<p class="result-placeholder">尚未结算</p>';
    return;
  }

  const content = document.createElement('div');
  content.className = 'result-content';

  const status = document.createElement('div');
  status.className = `result-status ${result.won ? 'win' : 'lose'}`;
  status.textContent = result.won ? '🎉 闯关成功' : '💔 闯关失败';
  content.appendChild(status);

  const details = document.createElement('p');
  details.className = 'result-details';
  details.textContent = result.details;
  content.appendChild(details);

  if (result.hiddenTriggered) {
    const hiddenBonus = document.createElement('div');
    hiddenBonus.className = 'hidden-bonus';
    hiddenBonus.textContent = '✨ 隐藏条件已触发！';
    content.appendChild(hiddenBonus);
  }

  const score = document.createElement('div');
  score.className = 'score-display';
  score.innerHTML = `
    <div class="score-label">协作评分</div>
    <div class="score-value">${result.cooperationScore}</div>
  `;
  content.appendChild(score);

  const stats = document.createElement('div');
  stats.className = 'result-stats';
  stats.innerHTML = `
    <span class="label">总步数</span><span class="value">${result.totalSteps}</span>
    <span class="label">最终描线值</span><span class="value">${result.finalLineValue}</span>
    <span class="label">配平痕</span><span class="value">${result.finalBalanceMark}</span>
    <span class="label">丁号奖励</span><span class="value">${result.dingReward}</span>
    <span class="label">戊号风险</span><span class="value">${result.wuRisk}</span>
    <span class="label">未号因子</span><span class="value">${result.weiFailFactor}</span>
  `;
  content.appendChild(stats);

  container.innerHTML = '';
  container.appendChild(content);
}

function updateAllUI(state: GameState) {
  renderBoard(state);
  renderStats(state);
  renderEvents(state);
  renderReplayTimeline();
}

function setCurrentPlayer(p: 1 | 2) {
  currentPlayer = p;
  const btn1 = $('btn-p1');
  const btn2 = $('btn-p2');
  btn1.classList.toggle('active', p === 1);
  btn2.classList.toggle('active', p === 2);
}

async function handleMove(direction: Position) {
  if (!sessionId || !currentState || currentState.status !== 'playing' || isReplayMode) return;

  try {
    const res = await movePlayer(sessionId, currentPlayer, direction);
    if (res.moved && res.replayStep) {
      currentState = res.state;
      replay.push(res.replayStep);
      replayIndex = -1;
      updateAllUI(currentState);
      saveToLocal();

      if (currentState.status !== 'playing') {
        showToast(currentState.status === 'win' ? '🎉 恭喜通关！' : '💔 游戏结束');
      }
    } else {
      showToast(res.description);
    }
  } catch (e: any) {
    showToast(e.message || '移动失败');
  }
}

async function handleUseEvent(eventId: string, choiceIndex?: number) {
  if (!sessionId || !currentState || currentState.status !== 'playing' || isReplayMode) return;

  try {
    const res = await useEvent(sessionId, eventId, choiceIndex);
    if (res.success && res.replayStep) {
      currentState = res.state;
      replay.push(res.replayStep);
      replayIndex = -1;
      updateAllUI(currentState);
      saveToLocal();
      showToast(res.description);
    } else {
      showToast(res.description);
    }
  } catch (e: any) {
    showToast(e.message || '事件触发失败');
  }
}

function jumpToStep(index: number) {
  if (index < 0 || index >= replay.length) return;

  replayIndex = index;
  const step = replay[index];
  currentState = step.state;
  isReplayMode = index < replay.length - 1;

  updateAllUI(currentState);
}

function handleReplayStart() {
  if (replay.length === 0) return;
  jumpToStep(0);
  showToast('已回到第0步');
}

function handleReplayPrev() {
  if (replay.length === 0) return;
  const target = replayIndex === -1 ? replay.length - 2 : replayIndex - 1;
  if (target < 0) return;
  jumpToStep(target);
}

function handleReplayNext() {
  if (replay.length === 0) return;
  const target = replayIndex === -1 ? replay.length - 1 : replayIndex + 1;
  if (target >= replay.length) return;
  jumpToStep(target);
}

function handleReplayResume() {
  if (replay.length === 0) return;
  isReplayMode = false;
  replayIndex = -1;
  currentState = replay[replay.length - 1].state;
  updateAllUI(currentState);
  showToast('已恢复到最新状态');
}

async function handleSettle() {
  if (!sessionId || !currentState) return;

  try {
    const result = await settleGame(sessionId);
    currentResult = result;
    renderResult(result);
  } catch (e: any) {
    showToast(e.message || '结算失败');
  }
}

async function handleStartLevel(levelId: GameLevelId) {
  try {
    const res = await startGame(levelId);
    sessionId = res.sessionId;
    currentState = res.state;
    replay = res.replay;
    replayIndex = -1;
    isReplayMode = false;
    currentResult = null;
    currentPlayer = 1;

    $('level-select').classList.add('hidden');
    $('game-area').classList.remove('hidden');

    $('level-name').textContent = levelInfo[levelId].name;
    const diffEl = $('level-difficulty');
    diffEl.textContent = levelInfo[levelId].difficulty;
    diffEl.className = `difficulty level-${levelId}`;

    setCurrentPlayer(1);
    updateAllUI(currentState);
    renderResult(null);
    saveToLocal();
  } catch (e: any) {
    showToast(e.message || '开始游戏失败');
  }
}

function handleBack() {
  $('level-select').classList.remove('hidden');
  $('game-area').classList.add('hidden');
  sessionId = null;
  currentState = null;
  replay = [];
  currentResult = null;
  clearLocalSave();
}

function renderLevelCards(levels: Record<GameLevelId, { name: string; description: string; difficulty: string }>) {
  const container = $('level-cards');
  container.innerHTML = '';

  (['wu', 'ding', 'wei'] as GameLevelId[]).forEach(id => {
    const info = levels[id];
    const card = document.createElement('div');
    card.className = `level-card level-${id}`;
    card.innerHTML = `
      <span class="difficulty">${info.difficulty}</span>
      <h3>${info.name}</h3>
      <p>${info.description}</p>
    `;
    card.onclick = () => handleStartLevel(id);
    container.appendChild(card);
  });
}

function setupKeyboard() {
  const dirMap: Record<string, Position> = {
    'ArrowUp': { x: 0, y: -1 },
    'ArrowDown': { x: 0, y: 1 },
    'ArrowLeft': { x: -1, y: 0 },
    'ArrowRight': { x: 1, y: 0 },
    'w': { x: 0, y: -1 },
    's': { x: 0, y: 1 },
    'a': { x: -1, y: 0 },
    'd': { x: 1, y: 0 },
    'W': { x: 0, y: -1 },
    'S': { x: 0, y: 1 },
    'A': { x: -1, y: 0 },
    'D': { x: 1, y: 0 }
  };

  const playerSwitchMap: Record<string, 1 | 2> = {
    '1': 1,
    '2': 2
  };

  document.addEventListener('keydown', (e) => {
    if ($('game-area').classList.contains('hidden')) return;
    if (isReplayMode) return;

    if (dirMap[e.key]) {
      e.preventDefault();
      handleMove(dirMap[e.key]);
    } else if (playerSwitchMap[e.key] !== undefined) {
      e.preventDefault();
      setCurrentPlayer(playerSwitchMap[e.key]);
    }
  });
}

function setupDpad() {
  const dirMap: Record<string, Position> = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  document.querySelectorAll('.dpad-btn[data-dir]').forEach(btn => {
    btn.addEventListener('click', () => {
      const dir = btn.getAttribute('data-dir')!;
      if (dirMap[dir]) {
        handleMove(dirMap[dir]);
      }
    });
  });
}

function setupButtons() {
  $('btn-p1').onclick = () => setCurrentPlayer(1);
  $('btn-p2').onclick = () => setCurrentPlayer(2);
  $('btn-back').onclick = handleBack;
  $('btn-settle').onclick = handleSettle;

  $('btn-replay-start').onclick = handleReplayStart;
  $('btn-replay-prev').onclick = handleReplayPrev;
  $('btn-replay-next').onclick = handleReplayNext;
  $('btn-replay-resume').onclick = handleReplayResume;
}

async function tryRestoreGame() {
  const saved = loadFromLocal();
  if (!saved) return false;

  try {
    const res = await restoreGame(saved.replay);
    sessionId = res.sessionId;
    currentState = res.state;
    replay = res.replay;
    replayIndex = -1;
    isReplayMode = false;
    currentResult = null;
    currentPlayer = 1;

    $('level-select').classList.add('hidden');
    $('game-area').classList.remove('hidden');

    const levelId = saved.levelId;
    $('level-name').textContent = levelInfo[levelId].name;
    const diffEl = $('level-difficulty');
    diffEl.textContent = levelInfo[levelId].difficulty;
    diffEl.className = `difficulty level-${levelId}`;

    setCurrentPlayer(1);
    updateAllUI(currentState);
    renderResult(null);

    showToast('已恢复上次游戏进度');
    return true;
  } catch {
    clearLocalSave();
    return false;
  }
}

async function init() {
  setupKeyboard();
  setupDpad();
  setupButtons();

  renderLevelCards(levelInfo);

  const restored = await tryRestoreGame();
  if (!restored) {
    $('level-select').classList.remove('hidden');
  }
}

init();
