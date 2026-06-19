import type { GameState, GameEvent } from '../types';
import { executeEvent, skipStep, getState } from '../state';

export function renderEventPanel(state: GameState): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'panel';

  const title = document.createElement('div');
  title.className = 'panel-title';
  title.textContent = '事件匣';
  panel.appendChild(title);

  if (state.isGameOver) {
    const msg = document.createElement('div');
    msg.style.textAlign = 'center';
    msg.style.padding = '20px';
    msg.style.color = 'var(--text-secondary)';
    msg.textContent = state.isWin ? '本局已完成！请查看结算簿。' : '游戏已结束。';
    panel.appendChild(msg);
    return panel;
  }

  const eventsList = document.createElement('div');
  eventsList.className = 'events-list';

  state.availableEvents.forEach((event) => {
    eventsList.appendChild(createEventCard(event, state));
  });

  panel.appendChild(eventsList);

  const skipBtn = document.createElement('button');
  skipBtn.className = 'skip-btn';
  skipBtn.textContent = '跳过本步（+3 丁号奖励）';
  skipBtn.addEventListener('click', () => {
    skipStep();
  });
  panel.appendChild(skipBtn);

  return panel;
}

function createEventCard(event: GameEvent, state: GameState): HTMLElement {
  const card = document.createElement('div');
  const canAfford = state.rewardDing >= event.cost;
  card.className = `event-card ${event.type} ${canAfford ? '' : 'disabled'}`;

  const header = document.createElement('div');
  header.className = 'event-header';

  const name = document.createElement('div');
  name.className = 'event-name';
  name.textContent = event.name;
  header.appendChild(name);

  const cost = document.createElement('div');
  cost.className = `event-cost ${event.cost === 0 ? 'free' : ''}`;
  cost.textContent = event.cost === 0 ? '免费' : `消耗 ${event.cost}`;
  header.appendChild(cost);

  card.appendChild(header);

  const desc = document.createElement('div');
  desc.className = 'event-description';
  desc.textContent = event.description;
  card.appendChild(desc);

  const effects = document.createElement('div');
  effects.className = 'event-effects';
  effects.innerHTML = getEffectTags(event).join('');
  card.appendChild(effects);

  if (canAfford) {
    card.addEventListener('click', () => {
      executeEvent(event.id);
    });
    card.style.cursor = 'pointer';
  }

  return card;
}

function getEffectTags(event: GameEvent): string[] {
  const tags: string[] = [];
  const { effect } = event;

  if (effect.mergeValue !== undefined) {
    const isPositive = effect.mergeValue > 0;
    tags.push(`<span class="effect-tag ${isPositive ? 'positive' : 'negative'}">归并值 ${effect.mergeValue > 0 ? '+' : ''}${effect.mergeValue}</span>`);
  }

  if (effect.slots?.lit) {
    const target = effect.slots.target === 'random' ? '随机' : effect.slots.target === 'all' ? '全部' : '首个';
    tags.push(`<span class="effect-tag positive">点亮槽 +1 (${target})</span>`);
  }

  if (effect.patrol !== undefined) {
    tags.push(`<span class="effect-tag positive">巡测推进 ${effect.patrol}</span>`);
  }

  if (effect.riskYin !== undefined) {
    const isPositive = effect.riskYin < 0;
    tags.push(`<span class="effect-tag ${isPositive ? 'positive' : 'negative'}">寅号风险 ${effect.riskYin > 0 ? '+' : ''}${effect.riskYin}</span>`);
  }

  if (effect.rewardDing !== undefined) {
    const isPositive = effect.rewardDing > 0;
    tags.push(`<span class="effect-tag ${isPositive ? 'positive' : 'negative'}">丁号奖励 ${effect.rewardDing > 0 ? '+' : ''}${effect.rewardDing}</span>`);
  }

  if (effect.failGui !== undefined) {
    const isPositive = effect.failGui < 0;
    tags.push(`<span class="effect-tag ${isPositive ? 'positive' : 'negative'}">癸号因子 ${effect.failGui > 0 ? '+' : ''}${effect.failGui}</span>`);
  }

  return tags;
}
