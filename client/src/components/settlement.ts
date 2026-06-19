import type { GameSettlement, SettlementBreakdownItem } from '../types';
import { startGame, goToStages } from '../state';

export function renderSettlementPanel(settlement: GameSettlement): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'panel settlement-panel';

  const title = document.createElement('div');
  title.className = 'panel-title';
  title.textContent = `结算簿 · ${settlement.stageName}`;
  panel.appendChild(title);

  const content = document.createElement('div');
  content.className = 'settlement-content';

  // 结果标题
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

  // 评级
  const rank = document.createElement('div');
  rank.className = 'settlement-rank';
  if (settlement.hiddenBonus) {
    rank.style.color = 'var(--accent-purple)';
    rank.style.textShadow = 'var(--glow-purple)';
  }
  rank.textContent = `评级：${settlement.rank}`;
  content.appendChild(rank);

  // 核心数据概览
  const stats = document.createElement('div');
  stats.className = 'settlement-stats';
  stats.innerHTML = `
    <div class="settlement-stat">
      <div class="settlement-stat-label">最终归并值</div>
      <div class="settlement-stat-value" style="color:var(--accent-gold)">${settlement.finalMergeValue}</div>
    </div>
    <div class="settlement-stat">
      <div class="settlement-stat-label">使用步数</div>
      <div class="settlement-stat-value">${settlement.stepsUsed}/${settlement.maxSteps}</div>
    </div>
    <div class="settlement-stat">
      <div class="settlement-stat-label">寅号风险</div>
      <div class="settlement-stat-value" style="color:var(--accent-red)">${settlement.thresholds.riskYin.current}/${settlement.thresholds.riskYin.max}</div>
    </div>
    <div class="settlement-stat">
      <div class="settlement-stat-label">丁号奖励</div>
      <div class="settlement-stat-value" style="color:var(--accent-green)">${settlement.thresholds.rewardDing.current}</div>
    </div>
    <div class="settlement-stat">
      <div class="settlement-stat-label">癸号因子</div>
      <div class="settlement-stat-value" style="color:var(--accent-purple)">${settlement.thresholds.failGui.current}/${settlement.thresholds.failGui.max}</div>
    </div>
    <div class="settlement-stat">
      <div class="settlement-stat-label">总分</div>
      <div class="settlement-stat-value" style="color:var(--accent-gold);text-shadow:var(--glow-gold);font-size:24px">${settlement.score}</div>
    </div>
  `;
  content.appendChild(stats);

  // 胜负条件判定
  const winSection = createBreakdownSection(
    '胜负判定',
    settlement.breakdown.filter(b => b.category === '胜负判定'),
    'verdict'
  );
  content.appendChild(winSection);

  // 基础分
  const baseItems = settlement.breakdown.filter(b => b.category === '基础分');
  if (baseItems.length > 0) {
    const baseSection = createBreakdownSection('基础分', baseItems, 'base', settlement.summary.baseScore);
    content.appendChild(baseSection);
  }

  // 加分项
  const bonusItems = settlement.breakdown.filter(b => b.category === '加分项');
  if (bonusItems.length > 0) {
    const bonusSection = createBreakdownSection('加分项', bonusItems, 'bonus', settlement.summary.bonusScore);
    content.appendChild(bonusSection);
  }

  // 扣分项
  const penaltyItems = settlement.breakdown.filter(b => b.category === '扣分项');
  if (penaltyItems.length > 0) {
    const penaltySection = createBreakdownSection('扣分项', penaltyItems, 'penalty', -settlement.summary.penaltyScore);
    content.appendChild(penaltySection);
  }

  // 奖励倍率
  const multiplierItems = settlement.breakdown.filter(b => b.category === '奖励倍率');
  if (multiplierItems.length > 0) {
    const multSection = createBreakdownSection('局特色 · 奖励倍率', multiplierItems, 'multiplier', settlement.summary.finalMultiplier, true);
    content.appendChild(multSection);
  }

  // 总分计算过程
  const calcSection = document.createElement('div');
  calcSection.className = 'settlement-calc-summary';
  calcSection.innerHTML = `
    <div class="calc-line">
      <span>基础分</span>
      <span>+${settlement.summary.baseScore}</span>
    </div>
    <div class="calc-line">
      <span>加分</span>
      <span>+${settlement.summary.bonusScore}</span>
    </div>
    <div class="calc-line">
      <span>扣分</span>
      <span>-${settlement.summary.penaltyScore}</span>
    </div>
    <div class="calc-line subtotal">
      <span>小计</span>
      <span>${settlement.summary.baseScore + settlement.summary.bonusScore - settlement.summary.penaltyScore}</span>
    </div>
    ${settlement.summary.finalMultiplier > 1 ? `
    <div class="calc-line">
      <span>倍率</span>
      <span>×${settlement.summary.finalMultiplier}</span>
    </div>
    ` : ''}
    <div class="calc-line total">
      <span>最终得分</span>
      <span>${settlement.summary.finalScore}</span>
    </div>
  `;
  content.appendChild(calcSection);

  // 操作按钮
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

function createBreakdownSection(
  title: string,
  items: SettlementBreakdownItem[],
  type: 'base' | 'bonus' | 'penalty' | 'multiplier' | 'verdict',
  subtotal?: number,
  isMultiplier?: boolean
): HTMLElement {
  const section = document.createElement('div');
  section.className = `settlement-breakdown ${type}`;

  const header = document.createElement('div');
  header.className = 'breakdown-header';

  const titleEl = document.createElement('span');
  titleEl.className = 'breakdown-title';
  titleEl.textContent = title;
  header.appendChild(titleEl);

  if (subtotal !== undefined) {
    const subEl = document.createElement('span');
    subEl.className = 'breakdown-subtotal';
    if (isMultiplier) {
      subEl.textContent = `×${subtotal}`;
    } else {
      const sign = subtotal >= 0 ? '+' : '';
      subEl.textContent = `${sign}${subtotal}`;
    }
    header.appendChild(subEl);
  }

  section.appendChild(header);

  const list = document.createElement('div');
  list.className = 'breakdown-list';

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'breakdown-row';

    const left = document.createElement('div');
    left.className = 'breakdown-row-left';

    const label = document.createElement('div');
    label.className = 'breakdown-label';
    label.textContent = item.label;
    left.appendChild(label);

    const formula = document.createElement('div');
    formula.className = 'breakdown-formula';
    formula.textContent = item.formula;
    left.appendChild(formula);

    const desc = document.createElement('div');
    desc.className = 'breakdown-desc';
    desc.textContent = item.description;
    left.appendChild(desc);

    row.appendChild(left);

    const right = document.createElement('div');
    right.className = 'breakdown-row-right';

    if (type === 'multiplier') {
      right.textContent = `×${item.value}`;
    } else if (type === 'verdict') {
      right.textContent = item.value > 0 ? '✅' : '❌';
      right.style.fontSize = '18px';
    } else {
      const sign = item.value >= 0 ? '+' : '';
      right.textContent = `${sign}${item.value}`;
      if (item.value >= 0 && type !== 'penalty') {
        right.style.color = 'var(--accent-green)';
      } else {
        right.style.color = 'var(--accent-red)';
      }
    }
    right.className += ' breakdown-value';

    row.appendChild(right);
    list.appendChild(row);
  });

  section.appendChild(list);

  return section;
}
