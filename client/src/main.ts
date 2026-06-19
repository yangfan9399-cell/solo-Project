import { subscribe, getState, loadStages, restoreLastSession, goToStages } from './state';
import { renderBoardPanel } from './components/board';
import { renderEventPanel } from './components/events';
import { renderReplayPanel } from './components/replay';
import { renderSettlementPanel } from './components/settlement';
import { renderStageSelect } from './components/stageSelect';

const app = document.getElementById('app');

function render(): void {
  if (!app) return;

  const state = getState();
  app.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'app-header';

  const titleGroup = document.createElement('div');
  const title = document.createElement('h1');
  title.className = 'app-title';
  title.textContent = '银盐暗房节拍修复场';
  titleGroup.appendChild(title);

  const subtitle = document.createElement('span');
  subtitle.className = 'app-subtitle';
  subtitle.textContent = getViewSubtitle(state.view);
  titleGroup.appendChild(subtitle);

  header.appendChild(titleGroup);

  if (state.view !== 'stages') {
    const backBtn = document.createElement('button');
    backBtn.className = 'replay-btn';
    backBtn.textContent = '← 返回关卡';
    backBtn.style.fontSize = '12px';
    backBtn.style.padding = '6px 12px';
    backBtn.addEventListener('click', () => {
      if (confirm('确定返回关卡选择吗？当前进度将丢失。')) {
        goToStages();
      }
    });
    header.appendChild(backBtn);
  }

  app.appendChild(header);

  const main = document.createElement('main');
  main.className = 'app-main';

  if (state.view === 'stages') {
    main.appendChild(renderStageSelect(state.stages));
  } else if (state.view === 'game' && state.gameState) {
    main.appendChild(renderBoardPanel(state.gameState));
    main.appendChild(renderEventPanel(state.gameState));
    main.appendChild(renderReplayPanel(state.history, state.gameState.stepIndex));
  } else if (state.view === 'settlement' && state.settlement && state.gameState) {
    main.appendChild(renderBoardPanel(state.gameState));
    main.appendChild(renderSettlementPanel(state.settlement));
    main.appendChild(renderReplayPanel(state.history, state.gameState.stepIndex));
  }

  app.appendChild(main);
}

function getViewSubtitle(view: string): string {
  switch (view) {
    case 'stages':
      return '选择关卡开始修复挑战';
    case 'game':
      return '进行中';
    case 'settlement':
      return '结算';
    default:
      return '';
  }
}

async function init(): Promise<void> {
  subscribe(render);

  try {
    await loadStages();
    const restored = await restoreLastSession();
    if (!restored) {
      render();
    }
  } catch (e) {
    console.error('初始化失败:', e);
    render();
  }
}

init();
