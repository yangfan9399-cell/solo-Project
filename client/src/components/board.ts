import type { GameState, StageInfo, GameSlot } from '../types';
import { getState } from '../state';

export function renderBoardPanel(state: GameState, stageInfo?: StageInfo): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'panel board-panel';

  const title = document.createElement('div');
  title.className = 'panel-title';
  title.textContent = `局面盘 · ${getStageName(state.stageId)}`;
  panel.appendChild(title);

  const stats = document.createElement('div');
  stats.className = 'board-stats';

  stats.appendChild(createStatCard('银盐归并值', state.mergeValue.toString(), 'merge'));
  stats.appendChild(createStatCard('寅号风险', state.riskYin.toString(), 'risk', state.riskYin, getRiskThreshold(state.stageId)));
  stats.appendChild(createStatCard('丁号奖励', state.rewardDing.toString(), 'reward', state.rewardDing, 50));
  stats.appendChild(createStatCard('癸号失败因子', state.failGui.toString(), 'fail', state.failGui, getFailThreshold(state.stageId)));
  stats.appendChild(createStatCard('点亮槽', `${state.slots.filter(s => s.lit).length}/${state.slots.length}`, ''));
  stats.appendChild(createStatCard('巡测位置', `#${state.patrol.position + 1}`, ''));

  panel.appendChild(stats);

  const slotsContainer = document.createElement('div');
  slotsContainer.className = 'slots-container';

  const slotsTitle = document.createElement('div');
  slotsTitle.className = 'slots-title';
  slotsTitle.textContent = '银盐暗房点亮槽';
  slotsContainer.appendChild(slotsTitle);

  const slotsRow = document.createElement('div');
  slotsRow.className = 'slots-row';

  const patrolIndicator = document.createElement('div');
  patrolIndicator.className = 'patrol-indicator';
  patrolIndicator.textContent = '🔍';
  patrolIndicator.style.left = `${state.patrol.position * 56 + 24}px`;
  slotsRow.appendChild(patrolIndicator);

  state.slots.forEach((slot, index) => {
    const slotEl = document.createElement('div');
    slotEl.className = `slot ${slot.lit ? 'lit' : ''}`;
    slotEl.style.animationDelay = `${index * 0.05}s`;

    const icon = document.createElement('div');
    icon.className = 'slot-icon';
    icon.textContent = slot.lit ? '💡' : '⬛';
    slotEl.appendChild(icon);

    const val = document.createElement('div');
    val.className = 'slot-value';
    val.textContent = slot.value.toString();
    slotEl.appendChild(val);

    slotsRow.appendChild(slotEl);
  });

  slotsContainer.appendChild(slotsRow);

  const patrolText = document.createElement('div');
  patrolText.className = 'patrol-trace-text';
  const direction = state.patrol.direction === 1 ? '→' : '←';
  patrolText.textContent = `巡测痕方向: ${direction}  位置: 第${state.patrol.position + 1}槽`;
  slotsContainer.appendChild(patrolText);

  panel.appendChild(slotsContainer);

  const stepInfo = document.createElement('div');
  stepInfo.className = 'step-info';
  stepInfo.innerHTML = `
    <div>当前步数: <span>第 ${state.stepIndex} 步</span></div>
    <div>状态: <span>${state.isGameOver ? (state.isWin ? '🎉 胜利' : '💔 失败') : '⏳ 进行中'}</span></div>
  `;
  panel.appendChild(stepInfo);

  return panel;
}

function createStatCard(label: string, value: string, type: string, current?: number, max?: number): HTMLElement {
  const card = document.createElement('div');
  card.className = 'stat-card';

  const labelEl = document.createElement('div');
  labelEl.className = 'stat-label';
  labelEl.textContent = label;
  card.appendChild(labelEl);

  const valueEl = document.createElement('div');
  valueEl.className = `stat-value ${type}`;
  valueEl.textContent = value;
  card.appendChild(valueEl);

  if (current !== undefined && max !== undefined) {
    const bar = document.createElement('div');
    bar.className = 'stat-bar';
    const fill = document.createElement('div');
    fill.className = `stat-bar-fill ${type}`;
    const percent = Math.min(100, (current / max) * 100);
    fill.style.width = `${percent}%`;
    bar.appendChild(fill);
    card.appendChild(bar);
  }

  return card;
}

function getStageName(stageId: string): string {
  const s = getState().stages.find(s => s.id === stageId);
  return s?.name || stageId;
}

function getRiskThreshold(stageId: string): number {
  if (stageId === 'yin') return 50;
  if (stageId === 'ding') return 40;
  return 45;
}

function getFailThreshold(stageId: string): number {
  if (stageId === 'yin') return 60;
  if (stageId === 'ding') return 50;
  return 55;
}
