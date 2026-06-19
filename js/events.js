const Events = (function() {
  const state = {
    level: null,
    triggered: []
  };

  function init(levelData) {
    state.level = levelData;
    state.triggered = [];
    render();
  }

  function checkAndTrigger(node, gameState) {
    if (!node.eventId) return null;
    const eventDef = state.level.events[node.eventId];
    if (!eventDef) return null;

    const result = {
      eventId: node.eventId,
      effects: {},
      flags: [],
      displayedTitle: eventDef.title,
      displayedDesc: eventDef.description,
      type: eventDef.type
    };

    if (eventDef.type === 'conditional') {
      let satisfied = true;
      if (eventDef.condition) {
        for (const k in eventDef.condition) {
          if ((gameState[k] || 0) < eventDef.condition[k]) {
            satisfied = false;
            break;
          }
        }
      }
      if (satisfied) {
        result.effects = { ...eventDef.triggeredEffects };
        result.flags = eventDef.triggeredFlags || [];
        result.displayedTitle = eventDef.triggeredTitle || eventDef.title;
        result.displayedDesc = eventDef.triggeredDescription || eventDef.description;
        result.triggered = true;
        result.type = 'positive';
      } else {
        result.effects = { ...eventDef.untriggeredEffects };
        result.displayedTitle = eventDef.untriggeredTitle || eventDef.title;
        result.displayedDesc = eventDef.untriggeredDescription || eventDef.description;
        result.triggered = false;
        result.type = 'negative';
      }
    } else {
      result.effects = { ...eventDef.effects };
      result.flags = eventDef.flags || [];
    }

    state.triggered.push(result);
    render();
    return result;
  }

  function addCustomEvent(evt) {
    state.triggered.push({
      eventId: 'custom_' + Date.now(),
      effects: evt.effects || {},
      flags: evt.flags || [],
      displayedTitle: evt.title || '事件',
      displayedDesc: evt.description || '',
      type: evt.type || 'special'
    });
    render();
  }

  function clear() {
    state.triggered = [];
    render();
  }

  function getTriggered() {
    return [...state.triggered];
  }

  function render() {
    const el = document.getElementById('eventsList');
    if (!el) return;

    if (state.triggered.length === 0) {
      el.innerHTML = '<div class="empty-hint">尚未触发事件……</div>';
      return;
    }

    el.innerHTML = '';
    for (let i = state.triggered.length - 1; i >= 0; i--) {
      const evt = state.triggered[i];
      const card = document.createElement('div');
      card.className = 'event-card ' + (evt.type || '');

      const title = document.createElement('div');
      title.className = 'event-title';
      title.textContent = evt.displayedTitle;
      card.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'event-desc';
      desc.textContent = evt.displayedDesc;
      card.appendChild(desc);

      const eff = document.createElement('div');
      eff.className = 'event-effect';
      const parts = [];
      for (const k in evt.effects) {
        const v = evt.effects[k];
        const label = effectLabel(k);
        if (v > 0) {
          parts.push(`<span class="pos">${label} +${v}</span>`);
        } else if (v < 0) {
          parts.push(`<span class="neg">${label} ${v}</span>`);
        }
      }
      if (parts.length > 0) {
        eff.innerHTML = parts.join('　');
        card.appendChild(eff);
      }

      el.appendChild(card);
    }
  }

  function effectLabel(key) {
    const map = {
      lightValue: '点亮值',
      riskA: '甲号风险',
      rewardD: '丁号奖励',
      failB: '失败因子'
    };
    return map[key] || key;
  }

  return {
    init,
    checkAndTrigger,
    addCustomEvent,
    clear,
    getTriggered,
    render
  };
})();
