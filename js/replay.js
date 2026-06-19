const Replay = (function() {
  const STORAGE_KEY = 'tidal_tower_replay_v1';

  const state = {
    steps: [],
    pointer: 0,
    levelId: null,
    autoPlayTimer: null
  };

  function record(step) {
    state.steps.push({
      index: state.steps.length,
      timestamp: Date.now(),
      ...step
    });
    state.pointer = state.steps.length;
    persist();
    render();
  }

  function undoLast() {
    if (state.steps.length === 0) return null;
    const last = state.steps.pop();
    state.pointer = state.steps.length;
    persist();
    render();
    return last;
  }

  function init(levelId) {
    state.levelId = levelId;
    state.pointer = state.steps.length;
    stopAutoPlay();
    render();
  }

  function reset() {
    stopAutoPlay();
    state.steps = [];
    state.pointer = 0;
    persist();
    render();
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.levelId !== state.levelId) return null;
      state.steps = data.steps || [];
      state.pointer = state.steps.length;
      return { replay: data };
    } catch (e) {
      console.warn('Replay load failed:', e);
      return null;
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        levelId: state.levelId,
        steps: state.steps
      }));
    } catch (e) {
      console.warn('Replay persist failed:', e);
    }
  }

  function getSteps() { return [...state.steps]; }
  function getPointer() { return state.pointer; }

  function setPointer(p) {
    state.pointer = Math.max(0, Math.min(state.steps.length, p));
    render();
  }

  function startAutoPlay(callback, intervalMs = 800) {
    stopAutoPlay();
    if (state.pointer >= state.steps.length) state.pointer = 0;
    state.autoPlayTimer = setInterval(() => {
      if (state.pointer < state.steps.length) {
        const step = state.steps[state.pointer];
        state.pointer++;
        render();
        if (callback) callback(step, state.pointer - 1);
      } else {
        stopAutoPlay();
      }
    }, intervalMs);
  }

  function stopAutoPlay() {
    if (state.autoPlayTimer) {
      clearInterval(state.autoPlayTimer);
      state.autoPlayTimer = null;
    }
  }

  function stepForward(callback) {
    if (state.pointer < state.steps.length) {
      const step = state.steps[state.pointer];
      state.pointer++;
      render();
      if (callback) callback(step, state.pointer - 1);
    }
  }

  function resetPointer(callback) {
    stopAutoPlay();
    state.pointer = 0;
    render();
    if (callback) callback();
  }

  function render() {
    const el = document.getElementById('replayTimeline');
    const statusEl = document.getElementById('replayStatus');
    const pointerEl = document.getElementById('replayPointer');
    if (!el) return;

    if (statusEl) statusEl.textContent = `已记录 ${state.steps.length} 步`;
    if (pointerEl) pointerEl.textContent = `当前指针：${state.pointer}`;

    if (state.steps.length === 0) {
      el.innerHTML = '<div class="empty-hint" style="flex:1;">尚未记录步骤，推进航线以产生回放轴…</div>';
      return;
    }

    el.innerHTML = '';
    state.steps.forEach((step, idx) => {
      if (idx > 0) {
        const conn = document.createElement('div');
        conn.className = 'timeline-connector';
        el.appendChild(conn);
      }

      const item = document.createElement('div');
      item.className = 'timeline-step';
      if (idx < state.pointer) item.classList.add('active');
      else item.classList.add('future');

      const num = document.createElement('div');
      num.className = 'timeline-step-num';
      num.textContent = idx + 1;
      item.appendChild(num);

      const icon = document.createElement('div');
      icon.className = 'timeline-step-icon';
      icon.textContent = step.icon || stepTypeIcon(step);
      item.appendChild(icon);

      const label = document.createElement('div');
      label.className = 'timeline-step-label';
      label.textContent = step.label || step.nodeName || '';
      item.appendChild(label);

      item.title = `${idx + 1}. ${step.label || step.nodeName || '步骤'}` +
        (step.deltaLight != null ? `　点亮${step.deltaLight > 0 ? '+' : ''}${step.deltaLight}` : '') +
        (step.deltaRisk != null ? `　风险${step.deltaRisk > 0 ? '+' : ''}${step.deltaRisk}` : '') +
        (step.deltaReward != null ? `　奖励${step.deltaReward > 0 ? '+' : ''}${step.deltaReward}` : '');

      item.addEventListener('click', () => {
        if (typeof window.onTimelineStepClick === 'function') {
          window.onTimelineStepClick(idx, step);
        }
      });

      el.appendChild(item);
    });

    setTimeout(() => {
      if (el.lastChild) {
        el.lastChild.scrollIntoView({ behavior: 'smooth', inline: 'end', block: 'nearest' });
      }
    }, 50);
  }

  function stepTypeIcon(step) {
    if (step.nodeType === 'start') return '⚓';
    if (step.nodeType === 'end') return '🏁';
    if (step.nodeType === 'tower') return '🗼';
    if (step.nodeType === 'reward') return '💰';
    if (step.nodeType === 'risk') return '⚠';
    if (step.nodeType === 'event') return '✦';
    if (step.nodeType === 'hidden') return '▣';
    return '→';
  }

  return {
    init,
    record,
    undoLast,
    reset,
    loadFromStorage,
    getSteps,
    getPointer,
    setPointer,
    startAutoPlay,
    stopAutoPlay,
    stepForward,
    resetPointer,
    render
  };
})();
