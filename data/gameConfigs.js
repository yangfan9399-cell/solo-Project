const GAME_CONFIGS = {
  si: {
    id: 'si',
    name: '巳局 · 初雪之径',
    subtitle: '教学局 · 熟悉航线推演的基本机制',
    description: '巳时之雪，薄而清冽。此局为推演入门之径，旨在让推演者熟悉换轨、转译、复写三大基本操作。',
    initialState: {
      railSwitchValue: 3,
      translationSlots: 2,
      rewriteTraces: 0,
      siRisk: 0,
      shenReward: 0,
      wuFailureFactor: 0,
      currentNode: 'S',
      targetNode: 'T',
      path: ['S'],
      steps: 0,
      maxSteps: 12,
      eventsTriggered: [],
      hiddenUnlocked: false
    },
    map: {
      nodes: [
        { id: 'S', name: '始发屋', x: 60, y: 240, type: 'start' },
        { id: 'A', name: '冰凌驿', x: 180, y: 120, type: 'normal' },
        { id: 'B', name: '霜华栈', x: 180, y: 360, type: 'normal' },
        { id: 'C', name: '雪松坪', x: 340, y: 180, type: 'reward' },
        { id: 'D', name: '冻云渡', x: 340, y: 300, type: 'event' },
        { id: 'E', name: '雪霁峰', x: 500, y: 240, type: 'normal' },
        { id: 'T', name: '终抵屋', x: 620, y: 240, type: 'target' }
      ],
      edges: [
        { from: 'S', to: 'A', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'S', to: 'B', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'A', to: 'C', cost: 2, switchReq: 1, type: 'normal' },
        { from: 'A', to: 'D', cost: 1, switchReq: 0, type: 'shortcut' },
        { from: 'B', to: 'D', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'C', to: 'E', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'D', to: 'E', cost: 2, switchReq: 2, type: 'heavy' },
        { from: 'E', to: 'T', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'C', to: 'T', cost: 3, switchReq: 2, type: 'direct', locked: true, unlockEvent: 'event_clear_sky' }
      ]
    },
    events: {
      event_clear_sky: {
        id: 'event_clear_sky',
        name: '雪霁天开',
        description: '骤雪初停，云开雾散。隐藏的直达航线 C→T 被解锁！',
        node: 'D',
        effects: [
          { type: 'unlock_edge', edge: 'C-T' },
          { type: 'railSwitch', value: 1 }
        ],
        type: 'positive'
      },
      event_frostbite: {
        id: 'event_frostbite',
        name: '霜寒刺骨',
        description: '穿越冰凌驿时受寒，巳号风险上升。',
        node: 'A',
        effects: [
          { type: 'siRisk', value: 1 },
          { type: 'translation', value: -1 }
        ],
        type: 'negative'
      },
      event_crystal_gift: {
        id: 'event_crystal_gift',
        name: '雪松馈赠',
        description: '雪松坪的精灵赠予额外能量！',
        node: 'C',
        effects: [
          { type: 'shenReward', value: 2 },
          { type: 'rewrite', value: 1 }
        ],
        type: 'positive'
      }
    },
    victoryFormula: (state) => {
      const reachedTarget = state.currentNode === state.targetNode;
      const riskOk = state.siRisk <= 3;
      const stepsOk = state.steps <= state.maxSteps;
      return reachedTarget && riskOk && stepsOk;
    },
    defeatFormula: (state) => {
      return state.siRisk > 3 || state.steps > state.maxSteps || state.railSwitchValue < 0;
    },
    scoreFormula: (state) => {
      let base = 100;
      base -= state.steps * 5;
      base -= state.siRisk * 10;
      base += state.shenReward * 15;
      base += state.rewriteTraces * 8;
      if (state.hiddenUnlocked) base += 50;
      return Math.max(0, base);
    }
  },

  shen: {
    id: 'shen',
    name: '申局 · 暴雪之途',
    subtitle: '资源局 · 在资源短缺中寻找最优航线',
    description: '申时暴雪突至，缆线资源告急。推演者必须在换轨值与转译槽不足的情况下抵达终点。',
    initialState: {
      railSwitchValue: 2,
      translationSlots: 1,
      rewriteTraces: 0,
      siRisk: 0,
      shenReward: 0,
      wuFailureFactor: 0,
      currentNode: 'S',
      targetNode: 'T',
      path: ['S'],
      steps: 0,
      maxSteps: 15,
      eventsTriggered: [],
      hiddenUnlocked: false
    },
    map: {
      nodes: [
        { id: 'S', name: '始雪原', x: 50, y: 200, type: 'start' },
        { id: 'A', name: '断缆坡', x: 170, y: 100, type: 'danger' },
        { id: 'B', name: '风啸谷', x: 170, y: 300, type: 'event' },
        { id: 'C', name: '埋雪站', x: 310, y: 60, type: 'normal' },
        { id: 'D', name: '冰隙涧', x: 310, y: 200, type: 'event' },
        { id: 'E', name: '凛冬驿', x: 310, y: 340, type: 'reward' },
        { id: 'F', name: '碎晶岭', x: 460, y: 130, type: 'normal' },
        { id: 'G', name: '白茫渡', x: 460, y: 270, type: 'normal' },
        { id: 'T', name: '终抵塔', x: 600, y: 200, type: 'target' }
      ],
      edges: [
        { from: 'S', to: 'A', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'S', to: 'B', cost: 2, switchReq: 0, type: 'heavy' },
        { from: 'A', to: 'C', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'A', to: 'D', cost: 2, switchReq: 2, type: 'heavy' },
        { from: 'B', to: 'D', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'B', to: 'E', cost: 1, switchReq: 0, type: 'shortcut' },
        { from: 'C', to: 'F', cost: 2, switchReq: 1, type: 'normal' },
        { from: 'D', to: 'F', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'D', to: 'G', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'E', to: 'G', cost: 2, switchReq: 1, type: 'normal' },
        { from: 'F', to: 'T', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'G', to: 'T', cost: 1, switchReq: 2, type: 'heavy' }
      ]
    },
    events: {
      event_wind_tunnel: {
        id: 'event_wind_tunnel',
        name: '风洞效应',
        description: '风啸谷的气流形成天然推力，获得额外转译槽！',
        node: 'B',
        effects: [
          { type: 'translation', value: 2 }
        ],
        type: 'positive'
      },
      event_crevasse_trap: {
        id: 'event_crevasse_trap',
        name: '冰隙陷阱',
        description: '冰隙涧中险些跌落，损失换轨值但获得申号奖励积分。',
        node: 'D',
        effects: [
          { type: 'railSwitch', value: -1 },
          { type: 'shenReward', value: 3 }
        ],
        type: 'mixed'
      },
      event_winter_cache: {
        id: 'event_winter_cache',
        name: '凛冬秘藏',
        description: '凛冬驿发现了前人遗留的补给箱！',
        node: 'E',
        effects: [
          { type: 'railSwitch', value: 2 },
          { type: 'rewrite', value: 2 },
          { type: 'shenReward', value: 1 }
        ],
        type: 'positive'
      },
      event_cable_snap: {
        id: 'event_cable_snap',
        name: '缆线崩断',
        description: '断缆坡的旧缆线突然崩断，巳号风险剧增！',
        node: 'A',
        effects: [
          { type: 'siRisk', value: 2 }
        ],
        type: 'negative'
      }
    },
    victoryFormula: (state) => {
      const reachedTarget = state.currentNode === state.targetNode;
      const switchOk = state.railSwitchValue >= 0;
      const riskOk = state.siRisk <= 4;
      const stepsOk = state.steps <= state.maxSteps;
      return reachedTarget && switchOk && riskOk && stepsOk;
    },
    defeatFormula: (state) => {
      return state.siRisk > 4 || state.steps > state.maxSteps || (state.railSwitchValue < 0 && state.currentNode !== state.targetNode);
    },
    scoreFormula: (state) => {
      let base = 120;
      base -= state.steps * 6;
      base -= state.siRisk * 8;
      base += state.shenReward * 20;
      base += state.rewriteTraces * 10;
      base += state.railSwitchValue * 5;
      return Math.max(0, base);
    }
  },

  wu: {
    id: 'wu',
    name: '午局 · 极夜之航',
    subtitle: '隐藏局 · 触发特殊条件方能全胜',
    description: '午时极夜忽临，天空呈现诡异紫芒。唯有触发隐藏条件「三焰同燃」，方能破除午号失败因子的诅咒。',
    initialState: {
      railSwitchValue: 4,
      translationSlots: 2,
      rewriteTraces: 0,
      siRisk: 0,
      shenReward: 0,
      wuFailureFactor: 0,
      currentNode: 'S',
      targetNode: 'T',
      path: ['S'],
      steps: 0,
      maxSteps: 18,
      eventsTriggered: [],
      hiddenUnlocked: false,
      wuFlames: { a: false, b: false, c: false }
    },
    map: {
      nodes: [
        { id: 'S', name: '子夜门', x: 40, y: 250, type: 'start' },
        { id: 'A', name: '紫焰坛', x: 160, y: 100, type: 'flame', flame: 'a' },
        { id: 'B', name: '绯焰坛', x: 160, y: 400, type: 'flame', flame: 'b' },
        { id: 'C', name: '霜语城', x: 300, y: 180, type: 'event' },
        { id: 'D', name: '碎星桥', x: 300, y: 320, type: 'normal' },
        { id: 'E', name: '金焰坛', x: 440, y: 80, type: 'flame', flame: 'c' },
        { id: 'F', name: '寂灭渊', x: 440, y: 250, type: 'danger' },
        { id: 'G', name: '辉光驿', x: 440, y: 420, type: 'reward' },
        { id: 'H', name: '曙天径', x: 560, y: 170, type: 'normal' },
        { id: 'I', name: '暮光径', x: 560, y: 330, type: 'normal' },
        { id: 'T', name: '黎明星', x: 680, y: 250, type: 'target' }
      ],
      edges: [
        { from: 'S', to: 'A', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'S', to: 'B', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'A', to: 'C', cost: 2, switchReq: 1, type: 'normal' },
        { from: 'A', to: 'E', cost: 3, switchReq: 2, type: 'heavy' },
        { from: 'B', to: 'D', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'B', to: 'G', cost: 2, switchReq: 1, type: 'normal' },
        { from: 'C', to: 'E', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'C', to: 'F', cost: 1, switchReq: 0, type: 'shortcut' },
        { from: 'D', to: 'F', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'D', to: 'G', cost: 2, switchReq: 1, type: 'normal' },
        { from: 'E', to: 'H', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'F', to: 'H', cost: 2, switchReq: 2, type: 'heavy' },
        { from: 'F', to: 'I', cost: 2, switchReq: 2, type: 'heavy' },
        { from: 'G', to: 'I', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'H', to: 'T', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'I', to: 'T', cost: 1, switchReq: 1, type: 'normal' },
        { from: 'H', to: 'I', cost: 1, switchReq: 0, type: 'locked', locked: true, unlockEvent: 'event_three_flames' }
      ]
    },
    events: {
      event_purple_flame: {
        id: 'event_purple_flame',
        name: '紫焰点燃',
        description: '紫焰坛的古老符文被激活，紫焰冉冉升起！',
        node: 'A',
        effects: [
          { type: 'wuFlame', flame: 'a', value: true },
          { type: 'rewrite', value: 1 }
        ],
        type: 'flame'
      },
      event_red_flame: {
        id: 'event_red_flame',
        name: '绯焰点燃',
        description: '绯焰坛的血色符文被激活，绯焰熊熊燃烧！',
        node: 'B',
        effects: [
          { type: 'wuFlame', flame: 'b', value: true },
          { type: 'railSwitch', value: 1 }
        ],
        type: 'flame'
      },
      event_gold_flame: {
        id: 'event_gold_flame',
        name: '金焰点燃',
        description: '金焰坛的神圣符文被激活，金焰辉煌夺目！',
        node: 'E',
        effects: [
          { type: 'wuFlame', flame: 'c', value: true },
          { type: 'shenReward', value: 2 }
        ],
        type: 'flame'
      },
      event_three_flames: {
        id: 'event_three_flames',
        name: '三焰同燃 · 隐藏结局触发',
        description: '三焰齐燃，破界之门开启！午号失败因子被永久封印，隐藏航线 H↔I 解锁！',
        node: null,
        auto: true,
        effects: [
          { type: 'wuFailureFactor', value: -99 },
          { type: 'hiddenUnlocked', value: true },
          { type: 'unlock_edge', edge: 'H-I' }
        ],
        type: 'hidden'
      },
      event_void_whisper: {
        id: 'event_void_whisper',
        name: '寂灭低语',
        description: '寂灭渊中传来低语，午号失败因子增加！请尽快点燃三焰。',
        node: 'F',
        effects: [
          { type: 'wuFailureFactor', value: 3 },
          { type: 'siRisk', value: 1 }
        ],
        type: 'negative'
      },
      event_rune_cache: {
        id: 'event_rune_cache',
        name: '符文窖藏',
        description: '霜语城的符文窖藏开启，获得珍贵资源！',
        node: 'C',
        effects: [
          { type: 'railSwitch', value: 2 },
          { type: 'translation', value: 1 },
          { type: 'rewrite', value: 1 }
        ],
        type: 'positive'
      },
      event_aurora_blessing: {
        id: 'event_aurora_blessing',
        name: '极光祝福',
        description: '辉光驿上空极光降临，带来诸神的祝福！',
        node: 'G',
        effects: [
          { type: 'shenReward', value: 3 },
          { type: 'wuFailureFactor', value: -1 }
        ],
        type: 'positive'
      }
    },
    victoryFormula: (state) => {
      const reachedTarget = state.currentNode === state.targetNode;
      const stepsOk = state.steps <= state.maxSteps;
      if (!reachedTarget || !stepsOk) return false;
      if (state.hiddenUnlocked) {
        return state.wuFailureFactor <= 2;
      }
      return state.wuFailureFactor <= 1 && state.siRisk <= 3;
    },
    defeatFormula: (state) => {
      if (state.steps > state.maxSteps) return true;
      if (state.railSwitchValue < 0 && state.currentNode !== state.targetNode) return true;
      if (!state.hiddenUnlocked && state.wuFailureFactor >= 5) return true;
      return state.wuFailureFactor >= 8;
    },
    scoreFormula: (state) => {
      let base = 150;
      base -= state.steps * 4;
      base -= state.siRisk * 6;
      base -= Math.max(0, state.wuFailureFactor) * 8;
      base += state.shenReward * 18;
      base += state.rewriteTraces * 12;
      if (state.hiddenUnlocked) base += 100;
      const flameCount = Object.values(state.wuFlames || {}).filter(Boolean).length;
      base += flameCount * 25;
      return Math.max(0, base);
    }
  }
};

module.exports = GAME_CONFIGS;
