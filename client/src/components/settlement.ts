import type { GameSettlement } from '../types';
import { goToStages, startGame, getState } from '../state';

export function renderSettlementPanel(settlement: GameSettlement): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'panel settlement-panel';

  const title = document.createElement('div');
  title.className = 'panel-title';
  title.textContent = '结算簿';
  panel.appendChild(title);

  const content = document.createElement('div');
  content.className = 'settlement-content';

  const result = document.createElement('div');
  result.className = `settlement-result ${settlement.isWin ? 'win' : 'lose'}`;
  result.textContent = settlement.isWin ? '修复成功！' : '修复失败';
  content.appendChild(result);

  if (settlement.failReason) {
    const failReason = document.createElement('div');
    failReason.className = 'settlement-fail-reason';
    failReason.textContent = settlement.failReason;
    content.appendChild(failReason);
  }

  const rank = document.createElement('div');
  rank.className = 'settlement-rank';
  rank.textContent = `评级：${settlement.rank}`;
  if (settlement.hiddenBonus) {
    rank.style.color = 'var(--accent-purple)';
    rank.style.textShadow = 'var(--glow-purple)';
  }
  content.appendChild(rank);

  const stats = document.createElement('div');
  stats.className = 'settlement-stats';
  stats.innerHTML = `
    <div class="settlement-stat">
      <div class="settlement-stat-label">最终归并值</div>
      <div class="settlement-stat-value">${settlement.finalMergeValue}</div>
    </div>
    <div class="settlement-stat">
      <div class="settlement-stat-label">使用步数</div>
      <div class="settlement-stat-value">${settlement.stepsUsed}</div>
    </div>
    <div class="settlement-stat">
      <div class="settlement-stat-label">总分</div>
      <div class="settlement-stat-value">${settlement.score}</div>
    </div>
  `;
  content.appendChild(stats);

  if (settlement.hiddenBonus) {
    const hiddenBadge = document.createElement('div');
    hiddenBadge.style.marginTop = '12px';
    hiddenBadge.style.fontSize = '14px';
    hiddenBadge.style.color = 'var(--accent-purple)';
    hiddenBadge.textContent = '✨ 隐藏条件达成：零风险完美修复！';
    content.appendChild(hiddenBadge);
  }

  const details = document.createElement('div');
  details.className = 'settlement-details';
  const detailsTitle = document.createElement('div');
  detailsTitle.className = 'settlement-details-title';
  detailsTitle.textContent = '结算明细';
  details.appendChild(detailsTitle);

  settlement.details.forEach((detail) => {
    const item = document.createElement('div');
    item.className = 'settlement-detail-item';
    item.textContent = detail;
    details.appendChild(item);
  });
  content.appendChild(details);

  const actions = document.createElement('div');
  actions.className = 'settlement-actions';

  const retryBtn = document.createElement('button');
  retryBtn.className = 'replay-btn primary';
  retryBtn.textContent = '再来一局';
  retryBtn.addEventListener('click', () => {
    startGame(settlement.stageId);
  });
  actions.appendChild(retryBtn);

  const backBtn = document.createElement('button');
  backBtn.className = 'replay-btn';
  backBtn.textContent = '返回关卡选择';
  backBtn.addEventListener('click', () => {
    goToStages();
  });
  actions.appendChild(backBtn);

  content.appendChild(actions);
  panel.appendChild(content);

  return panel;
}
