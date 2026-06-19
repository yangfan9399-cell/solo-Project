import type { HistoryStep, StepDelta } from '../types';
import { getState, restoreStep, setSelectedStep } from '../state';

export function renderReplayPanel(history: HistoryStep[], currentStep: number): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'panel replay-panel';

  const title = document.createElement('div');
  title.className = 'panel-title';
  title.textContent = '回放轴 · 时序修复步骤';
  panel.appendChild(title);

  const details = document.createElement('div');
  details.className = 'replay-details';

  history.forEach((step) => {
    const isCurrent = step.stepIndex === currentStep;
    const isSelected = getState().selectedStep === step.stepIndex;

    const row = document.createElement('div');
    row.className = `replay-detail-row ${isCurrent ? 'current' : ''} ${isSelected ? 'selected' : ''} ${step.stepIndex === 0 ? 'start' : ''}`;
    if (step.delta?.isSkip) row.classList.add('skip');

    const leftPart = document.createElement('div');
    leftPart.className = 'replay-detail-left';

    const stepNum = document.createElement('div');
    stepNum.className = 'replay-step-num';
    stepNum.textContent = `#${step.stepIndex}`;
    leftPart.appendChild(stepNum);

    const stepInfo = document.createElement('div');
    stepInfo.className = 'replay-step-info';

    const eventName = document.createElement('div');
    eventName.className = 'replay-event-name';
    eventName.textContent = step.delta?.eventName || (step.stepIndex === 0 ? '暗房初始化' : '未知操作');
    if (step.delta?.isSkip) eventName.classList.add('skip');
    stepInfo.appendChild(eventName);

    const tags = document.createElement('div');
    tags.className = 'replay-delta-tags';
    if (step.delta) {
      tags.innerHTML = renderDeltaTags(step.delta);
    }
    stepInfo.appendChild(tags);

    leftPart.appendChild(stepInfo);
    row.appendChild(leftPart);

    const rightPart = document.createElement('div');
    rightPart.className = 'replay-detail-right';

    if (step.delta) {
      const summary = document.createElement('div');
      summary.className = 'replay-delta-summary';
      summary.innerHTML = renderDeltaSummary(step.delta);
      rightPart.appendChild(summary);
    }

    if (isCurrent) {
      const badge = document.createElement('div');
      badge.className = 'replay-badge current';
      badge.textContent = '当前';
      rightPart.appendChild(badge);
    } else if (isSelected) {
      const badge = document.createElement('div');
      badge.className = 'replay-badge selected';
      badge.textContent = '待回退';
      rightPart.appendChild(badge);
    }

    row.appendChild(rightPart);

    row.addEventListener('click', () => {
      if (!isCurrent) {
        setSelectedStep(step.stepIndex);
      }
    });

    details.appendChild(row);
  });

  panel.appendChild(details);

  const timeline = document.createElement('div');
  timeline.className = 'replay-timeline';
  timeline.style.marginTop = '12px';

  history.forEach((step) => {
    const stepEl = document.createElement('div');
    const isCurrent = step.stepIndex === currentStep;
    const isSelected = getState().selectedStep === step.stepIndex;
    stepEl.className = `replay-step ${isCurrent ? 'current' : ''} ${step.stepIndex === 0 ? 'start' : ''} ${isSelected ? 'selected' : ''}`;
    stepEl.textContent = step.stepIndex.toString();
    stepEl.title = buildTooltip(step);

    if (step.stepIndex > 0) {
      const dot = document.createElement('div');
      dot.className = `step-dot ${step.eventId || step.delta?.eventName && !step.delta?.isSkip ? '' : 'skip'}`;
      stepEl.appendChild(dot);
    }

    stepEl.addEventListener('click', () => {
      if (!isCurrent) {
        setSelectedStep(step.stepIndex);
      }
    });

    timeline.appendChild(stepEl);
  });

  panel.appendChild(timeline);

  const controls = document.createElement('div');
  controls.className = 'replay-controls';

  const selected = getState().selectedStep;
  if (selected !== null && selected !== currentStep) {
    const restoreBtn = document.createElement('button');
    restoreBtn.className = 'replay-btn primary';
    restoreBtn.textContent = `回退到第 ${selected} 步`;
    restoreBtn.addEventListener('click', () => {
      restoreStep(selected);
    });
    controls.appendChild(restoreBtn);

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'replay-btn';
    cancelBtn.textContent = '取消';
    cancelBtn.addEventListener('click', () => {
      setSelectedStep(null);
    });
    controls.appendChild(cancelBtn);
  } else {
    const hint = document.createElement('span');
    hint.style.fontSize = '12px';
    hint.style.color = 'var(--text-muted)';
    hint.textContent = '点击任意步骤可回退到该状态，刷新页面后自动恢复';
    controls.appendChild(hint);
  }

  panel.appendChild(controls);

  return panel;
}

function renderDeltaTags(delta: StepDelta): string {
  const tags: string[] = [];

  if (delta.mergeValue !== 0) {
    const cls = delta.mergeValue > 0 ? 'pos' : 'neg';
    const color = delta.mergeValue > 0 ? '#d4a853' : '#e05555';
    tags.push(`<span class="delta-tag ${cls}" style="border-color:${color};color:${color}">归并 ${delta.mergeValue > 0 ? '+' : ''}${delta.mergeValue}</span>`);
  }

  if (delta.riskYin !== 0) {
    const cls = delta.riskYin > 0 ? 'neg' : 'pos';
    tags.push(`<span class="delta-tag ${cls}">寅 ${delta.riskYin > 0 ? '+' : ''}${delta.riskYin}</span>`);
  }

  if (delta.rewardDing !== 0) {
    const cls = delta.rewardDing > 0 ? 'pos' : 'neg';
    tags.push(`<span class="delta-tag ${cls}">丁 ${delta.rewardDing > 0 ? '+' : ''}${delta.rewardDing}</span>`);
  }

  if (delta.failGui !== 0) {
    const cls = delta.failGui > 0 ? 'neg' : 'pos';
    tags.push(`<span class="delta-tag ${cls}">癸 ${delta.failGui > 0 ? '+' : ''}${delta.failGui}</span>`);
  }

  if (delta.slotsLit > 0) {
    tags.push(`<span class="delta-tag pos">槽 +${delta.slotsLit}</span>`);
  }

  if (delta.patrolMove > 0) {
    tags.push(`<span class="delta-tag patrol">巡 ${delta.patrolMove}</span>`);
  }

  return tags.join('');
}

function renderDeltaSummary(delta: StepDelta): string {
  const parts: string[] = [];
  if (delta.mergeValue !== 0) {
    const color = delta.mergeValue > 0 ? '#d4a853' : '#e05555';
    parts.push(`<span style="color:${color}">归并${delta.mergeValue > 0 ? '+' : ''}${delta.mergeValue}</span>`);
  }
  if (delta.riskYin !== 0) {
    const color = delta.riskYin > 0 ? '#e05555' : '#55c07a';
    parts.push(`<span style="color:${color}">寅${delta.riskYin > 0 ? '+' : ''}${delta.riskYin}</span>`);
  }
  if (delta.rewardDing !== 0) {
    const color = delta.rewardDing > 0 ? '#55c07a' : '#e05555';
    parts.push(`<span style="color:${color}">丁${delta.rewardDing > 0 ? '+' : ''}${delta.rewardDing}</span>`);
  }
  if (delta.failGui !== 0) {
    const color = delta.failGui > 0 ? '#aa66cc' : '#55c07a';
    parts.push(`<span style="color:${color}">癸${delta.failGui > 0 ? '+' : ''}${delta.failGui}</span>`);
  }
  return parts.length > 0 ? parts.join(' · ') : '<span style="color:var(--text-muted)">无变化</span>';
}

function buildTooltip(step: HistoryStep): string {
  const delta = step.delta;
  if (!delta) return `第 ${step.stepIndex} 步`;
  const lines = [`第 ${step.stepIndex} 步：${delta.eventName || '初始化'}`];
  if (delta.mergeValue !== 0) lines.push(`银盐归并值: ${delta.mergeValue > 0 ? '+' : ''}${delta.mergeValue}`);
  if (delta.riskYin !== 0) lines.push(`寅号风险: ${delta.riskYin > 0 ? '+' : ''}${delta.riskYin}`);
  if (delta.rewardDing !== 0) lines.push(`丁号奖励: ${delta.rewardDing > 0 ? '+' : ''}${delta.rewardDing}`);
  if (delta.failGui !== 0) lines.push(`癸号失败因子: ${delta.failGui > 0 ? '+' : ''}${delta.failGui}`);
  if (delta.slotsLit !== 0) lines.push(`点亮槽: ${delta.slotsLit > 0 ? '+' : ''}${delta.slotsLit}`);
  if (delta.patrolMove !== 0) lines.push(`巡测移动: ${delta.patrolMove} 格`);
  return lines.join('\n');
}
