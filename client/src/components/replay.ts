import type { HistoryStep, GameState } from '../types';
import { getState, restoreStep, setSelectedStep } from '../state';

export function renderReplayPanel(history: HistoryStep[], currentStep: number): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'panel replay-panel';

  const title = document.createElement('div');
  title.className = 'panel-title';
  title.textContent = '回放轴';
  panel.appendChild(title);

  const timeline = document.createElement('div');
  timeline.className = 'replay-timeline';

  history.forEach((step) => {
    const stepEl = document.createElement('div');
    const isCurrent = step.stepIndex === currentStep;
    stepEl.className = `replay-step ${isCurrent ? 'current' : ''} ${step.stepIndex === 0 ? 'start' : ''}`;
    stepEl.textContent = step.stepIndex.toString();
    stepEl.title = `第 ${step.stepIndex} 步${step.eventId ? ' - 使用事件' : ' - 起始/跳过'}`;

    if (step.stepIndex > 0) {
      const dot = document.createElement('div');
      dot.className = `step-dot ${step.eventId ? '' : 'skip'}`;
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
    hint.textContent = '点击任意步骤可回退到该状态';
    controls.appendChild(hint);
  }

  panel.appendChild(controls);

  return panel;
}
