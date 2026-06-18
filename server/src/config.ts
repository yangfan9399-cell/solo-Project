import type { GameMap, GamePhase, PhaseConfig, SettleDetailItem, GameState, StepRecord } from './types';

const RESOURCE_LABELS: Record<string, string> = {
  candle: '烛芯',
  oil: '灯油',
  breeze: '风引',
  talisman: '镇符'
};

export const MAPS: Record<GamePhase, GameMap> = {
  wu: {
    phase: 'wu',
    phaseName: '午局 · 潮光教学',
    width: 600,
    height: 420,
    background: 'linear-gradient(180deg, #f5deb3 0%, #deb887 60%, #b8860b 100%)',
    nodes: [
      { id: 'w-n1', x: 120, y: 100, name: '迎潮台', initialMeasurement: 60, type: 'beacon' },
      { id: 'w-n2', x: 300, y: 80, name: '中流塔', initialMeasurement: 55, type: 'tower' },
      { id: 'w-n3', x: 480, y: 120, name: '送舟门', initialMeasurement: 50, type: 'gate' },
      { id: 'w-n4', x: 200, y: 260, name: '浅湾浮', initialMeasurement: 40, type: 'buoy' },
      { id: 'w-n5', x: 400, y: 280, name: '归航标', initialMeasurement: 45, type: 'buoy' }
    ],
    slots: [
      { id: 'w-s1', name: '迎潮槽', capacity: 4, resourceType: 'candle', requiredForId: 'w-n1' },
      { id: 'w-s2', name: '中流槽', capacity: 3, resourceType: 'oil', requiredForId: 'w-n2' },
      { id: 'w-s3', name: '送舟槽', capacity: 3, resourceType: 'candle', requiredForId: 'w-n3' },
      { id: 'w-s4', name: '湾浮槽', capacity: 2, resourceType: 'breeze', requiredForId: 'w-n4' },
      { id: 'w-s5', name: '归航槽', capacity: 2, resourceType: 'breeze', requiredForId: 'w-n5' }
    ]
  },
  ding: {
    phase: 'ding',
    phaseName: '丁局 · 缺灯夜行',
    width: 640,
    height: 440,
    background: 'linear-gradient(180deg, #2c3e50 0%, #1a252f 60%, #0d1418 100%)',
    nodes: [
      { id: 'd-n1', x: 100, y: 90, name: '暗礁灯', initialMeasurement: 70, type: 'beacon' },
      { id: 'd-n2', x: 320, y: 70, name: '十字塔', initialMeasurement: 65, type: 'tower' },
      { id: 'd-n3', x: 540, y: 110, name: '孤门', initialMeasurement: 60, type: 'gate' },
      { id: 'd-n4', x: 180, y: 300, name: '雾中浮', initialMeasurement: 55, type: 'buoy' },
      { id: 'd-n5', x: 360, y: 320, name: '断链标', initialMeasurement: 50, type: 'buoy' },
      { id: 'd-n6', x: 520, y: 280, name: '险流标', initialMeasurement: 58, type: 'buoy' }
    ],
    slots: [
      { id: 'd-s1', name: '暗礁槽', capacity: 5, resourceType: 'oil', requiredForId: 'd-n1' },
      { id: 'd-s2', name: '十字槽', capacity: 4, resourceType: 'oil', requiredForId: 'd-n2' },
      { id: 'd-s3', name: '孤门槽', capacity: 4, resourceType: 'candle', requiredForId: 'd-n3' },
      { id: 'd-s4', name: '雾中槽', capacity: 3, resourceType: 'breeze', requiredForId: 'd-n4' },
      { id: 'd-s5', name: '断链槽', capacity: 3, resourceType: 'talisman', requiredForId: 'd-n5' },
      { id: 'd-s6', name: '险流槽', capacity: 3, resourceType: 'breeze', requiredForId: 'd-n6' }
    ]
  },
  ji: {
    phase: 'ji',
    phaseName: '己局 · 归墟谜光',
    width: 680,
    height: 460,
    background: 'linear-gradient(180deg, #483d8b 0%, #2f1f4a 60%, #1a0f2e 100%)',
    nodes: [
      { id: 'j-n1', x: 120, y: 80, name: '墟门', initialMeasurement: 80, type: 'gate' },
      { id: 'j-n2', x: 340, y: 60, name: '转心塔', initialMeasurement: 75, type: 'tower' },
      { id: 'j-n3', x: 560, y: 100, name: '冥渡台', initialMeasurement: 72, type: 'beacon' },
      { id: 'j-n4', x: 180, y: 260, name: '忘川浮', initialMeasurement: 68, type: 'buoy' },
      { id: 'j-n5', x: 360, y: 280, name: '三生标', initialMeasurement: 65, type: 'buoy' },
      { id: 'j-n6', x: 520, y: 300, name: '彼岸标', initialMeasurement: 70, type: 'buoy' },
      { id: 'j-n7', x: 340, y: 400, name: '归墟眼', initialMeasurement: 90, type: 'beacon' }
    ],
    slots: [
      { id: 'j-s1', name: '墟门槽', capacity: 6, resourceType: 'talisman', requiredForId: 'j-n1' },
      { id: 'j-s2', name: '转心槽', capacity: 5, resourceType: 'oil', requiredForId: 'j-n2' },
      { id: 'j-s3', name: '冥渡槽', capacity: 5, resourceType: 'candle', requiredForId: 'j-n3' },
      { id: 'j-s4', name: '忘川槽', capacity: 4, resourceType: 'breeze', requiredForId: 'j-n4' },
      { id: 'j-s5', name: '三生槽', capacity: 4, resourceType: 'talisman', requiredForId: 'j-n5' },
      { id: 'j-s6', name: '彼岸槽', capacity: 4, resourceType: 'breeze', requiredForId: 'j-n6' },
      { id: 'j-s7', name: '归墟槽', capacity: 8, resourceType: 'oil', requiredForId: 'j-n7' }
    ]
  }
};

function measurementScore(s: GameState, nodes: { id: string }[]): number {
  return nodes.reduce((sum, n) => sum + (s.measurements[n.id] || 0), 0);
}

export const PHASE_CONFIGS: Record<GamePhase, PhaseConfig> = {
  wu: {
    phase: 'wu',
    phaseName: '午局 · 潮光教学',
    description: '教学关：学习资源归并、量测与事件应对。资源充足，风险可控。',
    teaching: true,
    maxRounds: 5,
    initialResources: { candle: 12, oil: 8, breeze: 6, talisman: 3 },
    victoryThreshold: 300,
    eventPool: ['wu-1', 'wu-2', 'wu-3', 'wu-4', 'wu-5'],
    winFormula: (s: GameState, steps: StepRecord[]) => {
      const map = MAPS.wu;
      const measScore = measurementScore(s, map.nodes);
      const wuPenalty = Math.max(0, s.wuRisk - 60) * 2;
      const dingBonus = s.dingReward * 3;
      const jiPenalty = s.jiFailure * 5;
      const stainPenalty = s.stains.reduce((sum, st) => sum + st.intensity, 0) * 2;
      const effSteps = steps.length;
      const effBonus = Math.max(0, 80 - effSteps * 3);

      const details: SettleDetailItem[] = [
        { label: '灯阵量测总分', value: measScore, weight: 1 },
        { label: '午号风险罚金', value: -wuPenalty, weight: 1 },
        { label: '丁号奖励加成', value: dingBonus, weight: 1 },
        { label: '己号失败因子', value: -jiPenalty, weight: 1 },
        { label: '熏染痕罚分', value: -stainPenalty, weight: 1 },
        { label: '步数效率奖励', value: effBonus, weight: 1 }
      ];

      const score = measScore - wuPenalty + dingBonus - jiPenalty - stainPenalty + effBonus;
      return { score, victory: score >= 300, details, hiddenTriggered: false };
    }
  },
  ding: {
    phase: 'ding',
    phaseName: '丁局 · 缺灯夜行',
    description: '资源短缺关：必须精确分配资源，触发丁号奖励弥补缺口。',
    teaching: false,
    maxRounds: 6,
    initialResources: { candle: 6, oil: 7, breeze: 5, talisman: 2 },
    victoryThreshold: 320,
    eventPool: ['ding-1', 'ding-2', 'ding-3', 'ding-4', 'ding-5', 'ding-6'],
    winFormula: (s: GameState, steps: StepRecord[]) => {
      const map = MAPS.ding;
      const measScore = measurementScore(s, map.nodes) * 0.9;
      const wuPenalty = Math.max(0, s.wuRisk - 50) * 3;
      const dingBonus = s.dingReward * 5;
      const jiPenalty = s.jiFailure * 4;
      const stainPenalty = s.stains.reduce((sum, st) => sum + st.intensity, 0) * 3;
      const effSteps = steps.length;
      const effBonus = Math.max(0, 60 - effSteps * 2);

      const details: SettleDetailItem[] = [
        { label: '灯阵量测总分(衰减)', value: Math.round(measScore), weight: 1 },
        { label: '午号风险罚金(严)', value: -wuPenalty, weight: 1 },
        { label: '丁号奖励加成(厚)', value: dingBonus, weight: 1 },
        { label: '己号失败因子', value: -jiPenalty, weight: 1 },
        { label: '熏染痕罚分(重)', value: -stainPenalty, weight: 1 },
        { label: '步数效率奖励', value: effBonus, weight: 1 }
      ];

      const score = Math.round(measScore) - wuPenalty + dingBonus - jiPenalty - stainPenalty + effBonus;
      return { score, victory: score >= 320, details, hiddenTriggered: false };
    }
  },
  ji: {
    phase: 'ji',
    phaseName: '己局 · 归墟谜光',
    description: '隐藏条件关：触发"七灯归元"可获巨量加成分。满足所有节点量测≥85 同时归墟槽填满。',
    teaching: false,
    maxRounds: 7,
    initialResources: { candle: 10, oil: 14, breeze: 8, talisman: 8 },
    victoryThreshold: 450,
    hiddenCondition: {
      name: '七灯归元',
      description: '所有灯阵节点量测≥85，且归墟槽完全填满',
      check: (s: GameState) => {
        const map = MAPS.ji;
        const allHigh = map.nodes.every(n => (s.measurements[n.id] || 0) >= 85);
        const guixuSlot = map.slots.find(sl => sl.id === 'j-s7');
        const guixuFull = guixuSlot ? (s.slotFill['j-s7'] || 0) >= guixuSlot.capacity : false;
        return allHigh && guixuFull;
      },
      bonus: 150
    },
    eventPool: ['ji-1', 'ji-2', 'ji-3', 'ji-4', 'ji-5', 'ji-6', 'ji-7'],
    winFormula: (s: GameState, steps: StepRecord[]) => {
      const map = MAPS.ji;
      const measScore = measurementScore(s, map.nodes);
      const wuPenalty = Math.max(0, s.wuRisk - 70) * 2;
      const dingBonus = s.dingReward * 4;
      const jiPenalty = s.jiFailure * 6;
      const stainPenalty = s.stains.reduce((sum, st) => sum + st.intensity, 0) * 2;
      const effSteps = steps.length;
      const effBonus = Math.max(0, 70 - effSteps * 2);

      const hidden = PHASE_CONFIGS.ji.hiddenCondition!;
      const hiddenTriggered = hidden.check(s, steps);
      const hiddenBonus = hiddenTriggered ? hidden.bonus : 0;

      const details: SettleDetailItem[] = [
        { label: '灯阵量测总分', value: measScore, weight: 1 },
        { label: '午号风险罚金', value: -wuPenalty, weight: 1 },
        { label: '丁号奖励加成', value: dingBonus, weight: 1 },
        { label: '己号失败因子', value: -jiPenalty, weight: 1 },
        { label: '熏染痕罚分', value: -stainPenalty, weight: 1 },
        { label: '步数效率奖励', value: effBonus, weight: 1 },
        ...(hiddenTriggered ? [{ label: `隐藏条件「${hidden.name}」`, value: hiddenBonus, weight: 1 }] : [])
      ];

      const score = measScore - wuPenalty + dingBonus - jiPenalty - stainPenalty + effBonus + hiddenBonus;
      return {
        score,
        victory: score >= 450,
        details,
        hiddenTriggered,
        hiddenName: hiddenTriggered ? hidden.name : undefined
      };
    }
  }
};

export const EVENTS: Record<string, {
  id: string;
  phase: GamePhase;
  roundRange: [number, number];
  type: 'blessing' | 'hazard' | 'mystery' | 'choice';
  title: string;
  description: string;
  effects?: { target: any; targetId?: string; delta: number }[];
  choices?: { label: string; description: string; effects: any[] }[];
}> = {
  'wu-1': {
    id: 'wu-1', phase: 'wu', roundRange: [1, 2], type: 'blessing',
    title: '午后晴光',
    description: '暖阳驱散薄雾，所有灯阵量测 +8。',
    effects: [{ target: 'measurement', delta: 8 }]
  },
  'wu-2': {
    id: 'wu-2', phase: 'wu', roundRange: [2, 3], type: 'choice',
    title: '渔舟借灯',
    description: '一队渔船希望借一盏灯笼照明，选择是否应允。',
    choices: [
      { label: '借予渔舟', description: '失去 2 烛芯，丁号奖励 +10', effects: [{ target: 'resource', targetId: 'candle', delta: -2 }, { target: 'dingReward', delta: 10 }] },
      { label: '谨慎拒绝', description: '资源保持不变，午号风险 +5', effects: [{ target: 'wuRisk', delta: 5 }] }
    ]
  },
  'wu-3': {
    id: 'wu-3', phase: 'wu', roundRange: [3, 4], type: 'hazard',
    title: '轻雾回潮',
    description: '雾气短暂回涌，中流塔量测 -6，出现轻微熏染痕。',
    effects: [{ target: 'measurement', targetId: 'w-n2', delta: -6 }, { target: 'stain', targetId: 'w-n2', delta: 2 }]
  },
  'wu-4': {
    id: 'wu-4', phase: 'wu', roundRange: [4, 5], type: 'mystery',
    title: '远岸鼓声',
    description: '神秘鼓声自远岸传来，所有归并槽额外 +1 容纳（一次性补给）。',
    effects: [{ target: 'resource', targetId: 'candle', delta: 1 }, { target: 'resource', targetId: 'oil', delta: 1 }, { target: 'resource', targetId: 'breeze', delta: 1 }]
  },
  'wu-5': {
    id: 'wu-5', phase: 'wu', roundRange: [5, 5], type: 'blessing',
    title: '潮满船归',
    description: '满载船只安全归港，丁号奖励 +15，午号风险 -8。',
    effects: [{ target: 'dingReward', delta: 15 }, { target: 'wuRisk', delta: -8 }]
  },
  'ding-1': {
    id: 'ding-1', phase: 'ding', roundRange: [1, 2], type: 'hazard',
    title: '油坊告急',
    description: '补给船延迟，灯油 -3，十字塔量测 -5。',
    effects: [{ target: 'resource', targetId: 'oil', delta: -3 }, { target: 'measurement', targetId: 'd-n2', delta: -5 }]
  },
  'ding-2': {
    id: 'ding-2', phase: 'ding', roundRange: [2, 3], type: 'choice',
    title: '险路求救',
    description: '一艘货轮在险流区偏航，需冒险增亮。',
    choices: [
      { label: '全力驰援', description: '险流标量测 +15，午号风险 +12，丁号奖励 +20', effects: [{ target: 'measurement', targetId: 'd-n6', delta: 15 }, { target: 'wuRisk', delta: 12 }, { target: 'dingReward', delta: 20 }] },
      { label: '维持常规', description: '险流区量测 -10，己号失败因子 +3', effects: [{ target: 'measurement', targetId: 'd-n6', delta: -10 }, { target: 'jiFailure', delta: 3 }] }
    ]
  },
  'ding-3': {
    id: 'ding-3', phase: 'ding', roundRange: [3, 4], type: 'hazard',
    title: '夜鸮惊魂',
    description: '大鸟撞击灯阵，断链标与雾中浮出现熏染痕(各+3)。',
    effects: [{ target: 'stain', targetId: 'd-n4', delta: 3 }, { target: 'stain', targetId: 'd-n5', delta: 3 }, { target: 'measurement', targetId: 'd-n5', delta: -4 }]
  },
  'ding-4': {
    id: 'ding-4', phase: 'ding', roundRange: [4, 5], type: 'mystery',
    title: '潮商密约',
    description: '神秘商人出售紧俏物资。',
    choices: [
      { label: '购置灯油', description: '花费 1 镇符换取 5 灯油', effects: [{ target: 'resource', targetId: 'talisman', delta: -1 }, { target: 'resource', targetId: 'oil', delta: 5 }] },
      { label: '购置镇符', description: '花费 4 灯油换取 2 镇符', effects: [{ target: 'resource', targetId: 'oil', delta: -4 }, { target: 'resource', targetId: 'talisman', delta: 2 }] },
      { label: '不做交易', description: '无事发生', effects: [] }
    ]
  },
  'ding-5': {
    id: 'ding-5', phase: 'ding', roundRange: [5, 6], type: 'hazard',
    title: '浓雾压境',
    description: '浓雾全面压境，除孤门外所有灯阵量测 -8。',
    effects: [{ target: 'measurement', targetId: 'd-n1', delta: -8 }, { target: 'measurement', targetId: 'd-n2', delta: -8 }, { target: 'measurement', targetId: 'd-n4', delta: -8 }, { target: 'measurement', targetId: 'd-n5', delta: -8 }, { target: 'measurement', targetId: 'd-n6', delta: -8 }]
  },
  'ding-6': {
    id: 'ding-6', phase: 'ding', roundRange: [6, 6], type: 'blessing',
    title: '晨星启明',
    description: '晨星照亮航道，所有灯阵量测 +6，己号失败因子 -2。',
    effects: [{ target: 'measurement', delta: 6 }, { target: 'jiFailure', delta: -2 }]
  },
  'ji-1': {
    id: 'ji-1', phase: 'ji', roundRange: [1, 2], type: 'mystery',
    title: '墟门幻影',
    description: '墟门开启时显现异光，镇符 +3，归墟眼量测 +5。',
    effects: [{ target: 'resource', targetId: 'talisman', delta: 3 }, { target: 'measurement', targetId: 'j-n7', delta: 5 }]
  },
  'ji-2': {
    id: 'ji-2', phase: 'ji', roundRange: [2, 3], type: 'hazard',
    title: '忘川波澜',
    description: '忘川波起，忘川浮与三生标量测 -7，熏染痕各 +2。',
    effects: [{ target: 'measurement', targetId: 'j-n4', delta: -7 }, { target: 'measurement', targetId: 'j-n5', delta: -7 }, { target: 'stain', targetId: 'j-n4', delta: 2 }, { target: 'stain', targetId: 'j-n5', delta: 2 }]
  },
  'ji-3': {
    id: 'ji-3', phase: 'ji', roundRange: [3, 4], type: 'choice',
    title: '三生抉择',
    description: '三生标显现三道幻影，需做出抉择。',
    choices: [
      { label: '前生之忆', description: '所有节点量测 +5，午号风险 +10', effects: [{ target: 'measurement', delta: 5 }, { target: 'wuRisk', delta: 10 }] },
      { label: '今生之誓', description: '丁号奖励 +25，熏染痕清除(所有 -10 但不低于 0)', effects: [{ target: 'dingReward', delta: 25 }, { target: 'stain', delta: -10 }] },
      { label: '来生之愿', description: '灯油 +6，风引 +4，己号失败因子 +4', effects: [{ target: 'resource', targetId: 'oil', delta: 6 }, { target: 'resource', targetId: 'breeze', delta: 4 }, { target: 'jiFailure', delta: 4 }] }
    ]
  },
  'ji-4': {
    id: 'ji-4', phase: 'ji', roundRange: [4, 5], type: 'blessing',
    title: '彼岸风来',
    description: '彼岸之风自深处来，彼岸标量测 +12，风引 +3。',
    effects: [{ target: 'measurement', targetId: 'j-n6', delta: 12 }, { target: 'resource', targetId: 'breeze', delta: 3 }]
  },
  'ji-5': {
    id: 'ji-5', phase: 'ji', roundRange: [5, 6], type: 'choice',
    title: '转心塔动',
    description: '转心塔核心颤动，决定是否投入大量资源稳定。',
    choices: [
      { label: '倾尽油符', description: '灯油 -5，镇符 -3，转心塔量测 +25，归墟眼 +15', effects: [{ target: 'resource', targetId: 'oil', delta: -5 }, { target: 'resource', targetId: 'talisman', delta: -3 }, { target: 'measurement', targetId: 'j-n2', delta: 25 }, { target: 'measurement', targetId: 'j-n7', delta: 15 }] },
      { label: '静观其变', description: '转心塔量测 -10，己号失败因子 +6，冥渡台 +8', effects: [{ target: 'measurement', targetId: 'j-n2', delta: -10 }, { target: 'jiFailure', delta: 6 }, { target: 'measurement', targetId: 'j-n3', delta: 8 }] }
    ]
  },
  'ji-6': {
    id: 'ji-6', phase: 'ji', roundRange: [6, 7], type: 'hazard',
    title: '归墟吞噬',
    description: '归墟眼异动，所有节点量测 -5，熏染痕 +1。',
    effects: [{ target: 'measurement', delta: -5 }, { target: 'stain', delta: 1 }]
  },
  'ji-7': {
    id: 'ji-7', phase: 'ji', roundRange: [7, 7], type: 'mystery',
    title: '七灯归元兆',
    description: '若七灯皆明，则归墟开眼。灯油 +4，镇符 +2。',
    effects: [{ target: 'resource', targetId: 'oil', delta: 4 }, { target: 'resource', targetId: 'talisman', delta: 2 }]
  }
};

export { RESOURCE_LABELS };
