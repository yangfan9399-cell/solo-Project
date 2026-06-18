import { GameLevelId, GameState, GameEvent, Cell, Position } from './types';

function createCell(id: string, x: number, y: number, type: Cell['type'], extra?: Partial<Cell>): Cell {
  return { id, position: { x, y }, type, ...extra };
}

function wuLevel(): GameState {
  const width = 6;
  const height = 5;
  const cells: Cell[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const id = `c_${x}_${y}`;
      if ((x === 2 && y === 1) || (x === 3 && y === 3)) {
        cells.push(createCell(id, x, y, 'wall'));
      } else if (x === 5 && y === 4) {
        cells.push(createCell(id, x, y, 'goal', { label: '出口' }));
      } else if (x === 1 && y === 2) {
        cells.push(createCell(id, x, y, 'crystal', { label: '琉璃晶' }));
      } else if (x === 4 && y === 1) {
        cells.push(createCell(id, x, y, 'crystal', { label: '琉璃晶' }));
      } else if (x === 3 && y === 0) {
        cells.push(createCell(id, x, y, 'switch', { label: '甲号开关', activated: false, linkedMechanismId: 'door_1' }));
      } else if (x === 4 && y === 3) {
        cells.push(createCell(id, x, y, 'door', { id: 'door_1', label: '甲号门', activated: false }));
      } else {
        cells.push(createCell(id, x, y, 'empty'));
      }
    }
  }

  const events: GameEvent[] = [
    {
      id: 'wu_teach_1',
      title: '琉璃指引',
      description: '戊局教学：移动到琉璃晶收集，踩下开关打开对应门，两人同时到达出口获胜。',
      effect: { lineValue: 5 },
      trigger: 'step',
      cooldown: 0
    },
    {
      id: 'wu_teach_2',
      title: '描线提示',
      description: '琉璃温室描线值代表两人协作默契度，越高结算越优。',
      effect: { lineValue: 3, dingReward: 1 },
      trigger: 'crystal',
      cooldown: 0
    },
    {
      id: 'wu_event_a',
      title: '暖风徐来',
      description: '温室暖风提升配平痕，降低戊号风险。',
      effect: { balanceMark: 2, wuRisk: -1 },
      choices: [
        { label: '接受暖风', effect: { balanceMark: 2, wuRisk: -1 } },
        { label: '蓄力前行', effect: { lineValue: 3, measureSlot: 1 } }
      ],
      trigger: 'manual',
      cooldown: 3
    },
    {
      id: 'wu_event_b',
      title: '晶芒闪耀',
      description: '琉璃晶共鸣，丁号奖励增加。',
      effect: { dingReward: 2, measureSlot: 1 },
      trigger: 'manual',
      cooldown: 4
    }
  ];

  return {
    levelId: 'wu',
    turn: 0,
    lineValue: 10,
    measureSlot: 3,
    balanceMark: 5,
    wuRisk: 2,
    dingReward: 0,
    weiFailFactor: 0,
    player1: {
      position: { x: 0, y: 0 },
      crystals: 0,
      switchesActivated: []
    },
    player2: {
      position: { x: 0, y: 4 },
      crystals: 0,
      switchesActivated: []
    },
    board: { width, height, cells },
    events,
    eventHistory: [],
    status: 'playing',
    hiddenTriggered: false
  };
}

function dingLevel(): GameState {
  const width = 7;
  const height = 6;
  const cells: Cell[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const id = `c_${x}_${y}`;
      if ((x === 2 && y >= 1 && y <= 3) || (x === 4 && y >= 2 && y <= 4)) {
        cells.push(createCell(id, x, y, 'wall'));
      } else if (x === 6 && y === 5) {
        cells.push(createCell(id, x, y, 'goal', { label: '出口' }));
      } else if (x === 1 && y === 1) {
        cells.push(createCell(id, x, y, 'crystal', { label: '琉璃晶' }));
      } else if (x === 5 && y === 2) {
        cells.push(createCell(id, x, y, 'crystal', { label: '琉璃晶' }));
      } else if (x === 3 && y === 5) {
        cells.push(createCell(id, x, y, 'crystal', { label: '琉璃晶' }));
      } else if (x === 5 && y === 0) {
        cells.push(createCell(id, x, y, 'switch', { label: '乙号开关', activated: false, linkedMechanismId: 'door_2' }));
      } else if (x === 0 && y === 3) {
        cells.push(createCell(id, x, y, 'switch', { label: '丙号开关', activated: false, linkedMechanismId: 'door_3' }));
      } else if (x === 5 && y === 4) {
        cells.push(createCell(id, x, y, 'door', { id: 'door_2', label: '乙号门', activated: false }));
      } else if (x === 3 && y === 3) {
        cells.push(createCell(id, x, y, 'door', { id: 'door_3', label: '丙号门', activated: false }));
      } else {
        cells.push(createCell(id, x, y, 'empty'));
      }
    }
  }

  const events: GameEvent[] = [
    {
      id: 'ding_warn_1',
      title: '资源紧缺',
      description: '丁局资源短缺：量测槽有限，每次行动都要精打细算。',
      effect: { measureSlot: -1 },
      trigger: 'step',
      cooldown: 0
    },
    {
      id: 'ding_event_a',
      title: '微光折射',
      description: '消耗描线值换取量测槽，或是反过来？',
      effect: {},
      choices: [
        { label: '消耗描线换槽位', effect: { lineValue: -3, measureSlot: 2 } },
        { label: '消耗槽位换描线', effect: { lineValue: 2, measureSlot: -2 } }
      ],
      trigger: 'manual',
      cooldown: 2
    },
    {
      id: 'ding_event_b',
      title: '丁号加持',
      description: '丁号奖励临时注入，但戊号风险上升。',
      effect: { dingReward: 3, wuRisk: 2 },
      trigger: 'manual',
      cooldown: 5
    },
    {
      id: 'ding_event_c',
      title: '配平回响',
      description: '恢复一点配平痕，但需要两人默契。',
      effect: { balanceMark: 3, lineValue: -1 },
      trigger: 'crystal',
      cooldown: 0
    }
  ];

  return {
    levelId: 'ding',
    turn: 0,
    lineValue: 8,
    measureSlot: 2,
    balanceMark: 3,
    wuRisk: 3,
    dingReward: 0,
    weiFailFactor: 0,
    player1: {
      position: { x: 0, y: 0 },
      crystals: 0,
      switchesActivated: []
    },
    player2: {
      position: { x: 0, y: 5 },
      crystals: 0,
      switchesActivated: []
    },
    board: { width, height, cells },
    events,
    eventHistory: [],
    status: 'playing',
    hiddenTriggered: false
  };
}

function weiLevel(): GameState {
  const width = 8;
  const height = 7;
  const cells: Cell[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const id = `c_${x}_${y}`;
      if (
        (x === 2 && y >= 0 && y <= 2) ||
        (x === 5 && y >= 4 && y <= 6) ||
        (x === 3 && y === 4) ||
        (x === 4 && y === 2)
      ) {
        cells.push(createCell(id, x, y, 'wall'));
      } else if (x === 7 && y === 6) {
        cells.push(createCell(id, x, y, 'goal', { label: '出口' }));
      } else if (x === 1 && y === 3) {
        cells.push(createCell(id, x, y, 'crystal', { label: '琉璃晶' }));
      } else if (x === 6 && y === 1) {
        cells.push(createCell(id, x, y, 'crystal', { label: '琉璃晶' }));
      } else if (x === 4 && y === 5) {
        cells.push(createCell(id, x, y, 'crystal', { label: '琉璃晶' }));
      } else if (x === 2 && y === 6) {
        cells.push(createCell(id, x, y, 'crystal', { label: '隐秘晶' }));
      } else if (x === 6 && y === 3) {
        cells.push(createCell(id, x, y, 'switch', { label: '丁号开关', activated: false, linkedMechanismId: 'door_4' }));
      } else if (x === 1 && y === 5) {
        cells.push(createCell(id, x, y, 'switch', { label: '戊号开关', activated: false, linkedMechanismId: 'door_5' }));
      } else if (x === 0 && y === 2) {
        cells.push(createCell(id, x, y, 'switch', { label: '隐开关', activated: false, linkedMechanismId: 'hidden_path' }));
      } else if (x === 5 && y === 3) {
        cells.push(createCell(id, x, y, 'door', { id: 'door_4', label: '丁号门', activated: false }));
      } else if (x === 3 && y === 5) {
        cells.push(createCell(id, x, y, 'door', { id: 'door_5', label: '戊号门', activated: false }));
      } else if (x === 6 && y === 6) {
        cells.push(createCell(id, x, y, 'mechanism', { id: 'hidden_path', label: '隐秘通道', activated: false }));
      } else {
        cells.push(createCell(id, x, y, 'empty'));
      }
    }
  }

  const events: GameEvent[] = [
    {
      id: 'wei_warn_1',
      title: '未号降临',
      description: '未局危机四伏，失败因子随时累积，注意隐藏条件。',
      effect: { weiFailFactor: 1 },
      trigger: 'step',
      cooldown: 0
    },
    {
      id: 'wei_event_a',
      title: '琉璃共振',
      description: '三人？不，两人共鸣，描线值大升。',
      effect: { lineValue: 5, dingReward: 2 },
      trigger: 'crystal',
      cooldown: 0
    },
    {
      id: 'wei_event_b',
      title: '未号阴霾',
      description: '失败因子上升，但奖励也丰厚。',
      effect: {},
      choices: [
        { label: '冒险一搏', effect: { weiFailFactor: 2, dingReward: 4, lineValue: -2 } },
        { label: '稳扎稳打', effect: { weiFailFactor: 0, balanceMark: 2, wuRisk: 1 } }
      ],
      trigger: 'manual',
      cooldown: 3
    },
    {
      id: 'wei_event_c',
      title: '隐秘指引',
      description: '似乎有什么东西在呼唤你...寻找隐秘晶与隐开关。',
      effect: { measureSlot: 1 },
      trigger: 'manual',
      cooldown: 6
    },
    {
      id: 'wei_event_d',
      title: '戊号风眼',
      description: '降低风险但也降低奖励。',
      effect: { wuRisk: -3, dingReward: -1 },
      trigger: 'switch',
      cooldown: 0
    }
  ];

  return {
    levelId: 'wei',
    turn: 0,
    lineValue: 6,
    measureSlot: 2,
    balanceMark: 4,
    wuRisk: 4,
    dingReward: 0,
    weiFailFactor: 0,
    player1: {
      position: { x: 0, y: 0 },
      crystals: 0,
      switchesActivated: []
    },
    player2: {
      position: { x: 0, y: 6 },
      crystals: 0,
      switchesActivated: []
    },
    board: { width, height, cells },
    events,
    eventHistory: [],
    status: 'playing',
    hiddenTriggered: false
  };
}

export function createLevel(levelId: GameLevelId): GameState {
  switch (levelId) {
    case 'wu': return wuLevel();
    case 'ding': return dingLevel();
    case 'wei': return weiLevel();
  }
}

export const levelInfo: Record<GameLevelId, { name: string; description: string; difficulty: string }> = {
  wu: {
    name: '琉璃温室双人机关局 · 戊局',
    description: '教学关卡。熟悉双人协作、琉璃晶收集、开关与门的基础机制。',
    difficulty: '入门'
  },
  ding: {
    name: '琉璃温室双人机关局 · 丁局',
    description: '资源短缺。量测槽吃紧，每一步都需精打细算，考验资源管理。',
    difficulty: '进阶'
  },
  wei: {
    name: '琉璃温室双人机关局 · 未局',
    description: '隐藏条件。失败因子累积，寻找隐秘晶与隐开关触发隐藏结局。',
    difficulty: '挑战'
  }
};
