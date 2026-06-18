import { MazeConfig, Cell, CellType } from './types';

function createGrid(width: number, height: number, layout: string[]): Cell[][] {
  const grid: Cell[][] = [];
  for (let y = 0; y < height; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < width; x++) {
      const ch = layout[y]?.[x] || '.';
      let type: CellType = 'empty';
      let groove: string | undefined;
      let reverseMark = false;
      let eventId: string | undefined;

      switch (ch) {
        case '#': type = 'wall'; break;
        case 'S': type = 'start'; break;
        case 'E': type = 'end'; break;
        case 'R': type = 'reward'; eventId = `r_${x}_${y}`; break;
        case 'T': type = 'trap'; eventId = `t_${x}_${y}`; break;
        case '!': type = 'event'; eventId = `e_${x}_${y}`; break;
        case 'H': type = 'hidden'; eventId = `h_${x}_${y}`; break;
        case 'g': type = 'empty'; groove = `grove_${x}_${y}`; break;
        case 'r': type = 'empty'; reverseMark = true; break;
      }

      row.push({
        x,
        y,
        type,
        lit: type === 'start',
        groove,
        reverseMark,
        eventId,
      });
    }
    grid.push(row);
  }
  return grid;
}

const mazeA: MazeConfig = {
  key: 'A',
  name: '蜡封迷宫航线推演局·甲局（教学）',
  description: '入门教学局，点亮蜡封、沿描线槽前行，学会基础操作。奖励充足，风险较低。',
  width: 7,
  height: 5,
  grid: createGrid(7, 5, [
    'S.g..RE',
    '.#.#.#.',
    '.!..T..',
    '.#.g.#.',
    '..R..!.',
  ]),
  startPos: { x: 0, y: 0 },
  endPos: { x: 6, y: 0 },
  events: {
    'r_5_0': {
      id: 'r_5_0',
      name: '蜡封宝珠',
      type: 'reward',
      description: '点亮值 +3，丁号奖励 +1',
      effect: { lightValue: 3, rewardD: 1 },
    },
    'r_2_4': {
      id: 'r_2_4',
      name: '古老封蜡',
      type: 'reward',
      description: '点亮值 +2，描线槽激活一段',
      effect: { lightValue: 2 },
    },
    't_4_2': {
      id: 't_4_2',
      name: '倒排陷阱',
      type: 'risk',
      description: '甲号风险 +2，倒排痕 +1',
      effect: { riskA: 2 },
    },
    'e_1_2': {
      id: 'e_1_2',
      name: '蜡封指引',
      type: 'info',
      description: '教学指引：沿描线槽走可获得额外点亮值。',
      effect: { lightValue: 1 },
    },
    'e_5_4': {
      id: 'e_5_4',
      name: '丁号宝箱',
      type: 'reward',
      description: '丁号奖励 +3',
      effect: { rewardD: 3 },
    },
  },
  initialField: {
    lightValue: 5,
    grooveTracing: [],
    reverseMark: 0,
    riskA: 0,
    rewardD: 0,
    failureB: 0,
  },
  winCondition: '到达终点 E 且 点亮值 ≥ 8',
  loseCondition: '乙号失败因子 ≥ 5 或 点亮值 ≤ 0',
};

const mazeD: MazeConfig = {
  key: 'D',
  name: '蜡封迷宫航线推演局·丁局（资源短缺）',
  description: '资源短缺局，点亮值与奖励都稀缺，需精打细算每一步。失败因子累积更快。',
  width: 8,
  height: 6,
  grid: createGrid(8, 6, [
    'S#.T...E',
    '..#.#.#.',
    '.g#.r#..',
    '.#.T#.#.',
    '.R.#..!.',
    '...##..R',
  ]),
  startPos: { x: 0, y: 0 },
  endPos: { x: 7, y: 0 },
  events: {
    'r_1_4': {
      id: 'r_1_4',
      name: '稀缺封蜡',
      type: 'reward',
      description: '点亮值 +2（仅有的几个奖励之一）',
      effect: { lightValue: 2 },
    },
    'r_7_5': {
      id: 'r_7_5',
      name: '丁号残片',
      type: 'reward',
      description: '丁号奖励 +1，点亮值 +1',
      effect: { lightValue: 1, rewardD: 1 },
    },
    't_3_0': {
      id: 't_3_0',
      name: '枯竭陷阱',
      type: 'risk',
      description: '点亮值 -2，甲号风险 +1',
      effect: { lightValue: -2, riskA: 1 },
    },
    't_3_3': {
      id: 't_3_3',
      name: '乙号侵蚀',
      type: 'failure',
      description: '乙号失败因子 +2，点亮值 -1',
      effect: { failureB: 2, lightValue: -1 },
    },
    'e_6_4': {
      id: 'e_6_4',
      name: '倒排密文',
      type: 'info',
      description: '倒排痕 +1，可能影响结算',
      effect: {},
    },
  },
  initialField: {
    lightValue: 3,
    grooveTracing: [],
    reverseMark: 0,
    riskA: 0,
    rewardD: 0,
    failureB: 0,
  },
  winCondition: '到达终点 E 且 点亮值 ≥ 5 且 乙号失败因子 < 3',
  loseCondition: '乙号失败因子 ≥ 3 或 点亮值 ≤ 0',
};

const mazeB: MazeConfig = {
  key: 'B',
  name: '蜡封迷宫航线推演局·乙局（隐藏条件）',
  description: '暗藏玄机局，需收集3处倒排痕触发隐藏觉醒。路径与点亮值需精确控制。',
  width: 9,
  height: 7,
  grid: createGrid(9, 7, [
    'S.rg.R.RE',
    '.#.#.#..#',
    '.!.H.r..T',
    '#......#.',
    '.T.r.g.H.',
    '.#..#.#..',
    'R..!..Rg.',
  ]),
  startPos: { x: 0, y: 0 },
  endPos: { x: 8, y: 0 },
  events: {
    'r_5_0': {
      id: 'r_5_0',
      name: '蜡封赠礼',
      type: 'reward',
      description: '点亮值 +3，丁号奖励 +1',
      effect: { lightValue: 3, rewardD: 1 },
    },
    'r_7_0': {
      id: 'r_7_0',
      name: '终点宝珠',
      type: 'reward',
      description: '点亮值 +2',
      effect: { lightValue: 2 },
    },
    'r_6_6': {
      id: 'r_6_6',
      name: '深处馈赠',
      type: 'reward',
      description: '点亮值 +3，丁号奖励 +1',
      effect: { lightValue: 3, rewardD: 1 },
    },
    'r_0_6': {
      id: 'r_0_6',
      name: '封蜡宝藏',
      type: 'reward',
      description: '点亮值 +3，丁号奖励 +2',
      effect: { lightValue: 3, rewardD: 2 },
    },
    't_1_4': {
      id: 't_1_4',
      name: '风险封印',
      type: 'risk',
      description: '甲号风险 +2，点亮值 -1',
      effect: { riskA: 2, lightValue: -1 },
    },
    't_8_2': {
      id: 't_8_2',
      name: '乙号终焉',
      type: 'failure',
      description: '乙号失败因子 +3',
      effect: { failureB: 3 },
    },
    'e_1_2': {
      id: 'e_1_2',
      name: '古老指引',
      type: 'info',
      description: '收集3处倒排痕将触发隐藏觉醒，点亮值+5，丁号奖励+3！',
      effect: { lightValue: 1 },
    },
    'e_3_6': {
      id: 'e_3_6',
      name: '倒排铭文',
      type: 'info',
      description: '倒排痕散布于迷宫深处，循路而行方可觉醒。',
      effect: { lightValue: 1 },
    },
    'h_3_2': {
      id: 'h_3_2',
      name: '隐藏封印·壹',
      type: 'hidden',
      description: '需要触发隐藏条件才能激活。',
      effect: {},
    },
    'h_7_4': {
      id: 'h_7_4',
      name: '隐藏封印·贰',
      type: 'hidden',
      description: '需要触发隐藏条件才能激活。',
      effect: {},
    },
  },
  initialField: {
    lightValue: 10,
    grooveTracing: [],
    reverseMark: 0,
    riskA: 0,
    rewardD: 0,
    failureB: 0,
  },
  winCondition: '到达终点 E 且 点亮值 ≥ 4（触发隐藏觉醒后）/ 点亮值 ≥ 8（未触发）',
  loseCondition: '乙号失败因子 ≥ 5 或 点亮值 ≤ 0',
  hiddenTrigger: {
    type: 'reverse_mark',
    value: 3,
    eventId: 'hidden_awakening',
  },
};

export const MAZES: Record<string, MazeConfig> = {
  A: mazeA,
  D: mazeD,
  B: mazeB,
};
