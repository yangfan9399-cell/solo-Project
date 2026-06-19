import type { StageInfo } from '../types';
import { startGame } from '../state';

export function renderStageSelect(stages: StageInfo[]): HTMLElement {
  const container = document.createElement('div');
  container.className = 'stage-select';

  stages.forEach((stage) => {
    const card = document.createElement('div');
    card.className = 'stage-card';

    const name = document.createElement('div');
    name.className = 'stage-name';
    name.textContent = stage.name;
    card.appendChild(name);

    const desc = document.createElement('div');
    desc.className = 'stage-desc';
    desc.textContent = stage.description;
    card.appendChild(desc);

    const meta = document.createElement('div');
    meta.className = 'stage-meta';
    meta.innerHTML = `
      <span>步数上限: ${stage.maxSteps}</span>
      <span>目标: ${getWinConditionText(stage.winCondition)}</span>
    `;
    card.appendChild(meta);

    if (stage.hasHidden) {
      const badge = document.createElement('div');
      badge.style.marginTop = '12px';
      badge.innerHTML = `<span class="stage-badge">✨ 存在隐藏条件</span>`;
      card.appendChild(badge);
    }

    card.addEventListener('click', () => {
      startGame(stage.id);
    });

    container.appendChild(card);
  });

  return container;
}

function getWinConditionText(condition: { type: string; target: number }): string {
  switch (condition.type) {
    case 'merge-value':
      return `归并值 ${condition.target}`;
    case 'all-lit':
      return `点亮全部 ${condition.target} 槽`;
    case 'patrol-cycle':
      return `巡测 ${condition.target} 圈`;
    default:
      return '达成目标';
  }
}
