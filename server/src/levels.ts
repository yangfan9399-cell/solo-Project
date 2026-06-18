import type { LevelConfig, GameEvent, GameField } from './types';

const wuEvents: GameEvent[] = [
  { id: 'wu-e1', name: '描线校准', description: '使用矿灯描线装置校准矿脉走向，提升描线值', category: 'trace', effect: { traceValue: 15 }, cost: 1 },
  { id: 'wu-e2', name: '深度量测', description: '使用量测槽探测矿层深度，提升量测槽读数', category: 'measure', effect: { measureSlot: 20 }, cost: 1 },
  { id: 'wu-e3', name: '配平操作', description: '调整配平痕使矿灯保持平衡，降低风险', category: 'balance', effect: { balanceMark: 10, wuRisk: -5 }, cost: 2 },
  { id: 'wu-e4', name: '奖励收集', description: '发现额外丁号奖励，增加奖励值', category: 'reward', effect: { dingReward: 25 }, cost: 2 },
  { id: 'wu-e5', name: '风险排查', description: '排查戊号风险点，减少危险等级', category: 'risk', effect: { wuRisk: -15, traceValue: 5 }, cost: 3 },
  { id: 'wu-e6', name: '协作探勘', description: '双人协作探勘，多属性同步提升', category: 'balance', effect: { traceValue: 8, measureSlot: 8, balanceMark: 8 }, cost: 3 },
];

const dingEvents: GameEvent[] = [
  { id: 'ding-e1', name: '紧急描线', description: '资源紧张下快速描线，提升有限', category: 'trace', effect: { traceValue: 10, wuRisk: 3 }, cost: 1 },
  { id: 'ding-e2', name: '估算量测', description: '用估算代替精测，量测槽提升有限', category: 'measure', effect: { measureSlot: 12, weiFailFactor: 2 }, cost: 1 },
  { id: 'ding-e3', name: '应急配平', description: '临时配平，略有损耗', category: 'balance', effect: { balanceMark: 6, dingReward: -5 }, cost: 1 },
  { id: 'ding-e4', name: '奖励兑换', description: '消耗奖励换取配平提升', category: 'reward', effect: { dingReward: -10, balanceMark: 15, traceValue: 5 }, cost: 2 },
  { id: 'ding-e5', name: '深度协作', description: '高投入高回报协作', category: 'balance', effect: { traceValue: 12, measureSlot: 12, balanceMark: 12, wuRisk: -3, dingReward: -8 }, cost: 4 },
  { id: 'ding-e6', name: '风险攻坚', description: '集中力量降风险', category: 'risk', effect: { wuRisk: -20, traceValue: 3, measureSlot: 3 }, cost: 3 },
];

const weiEvents: GameEvent[] = [
  { id: 'wei-e1', name: '精确描线', description: '高精度描线，为隐藏条件做准备', category: 'trace', effect: { traceValue: 18 }, cost: 2 },
  { id: 'wei-e2', name: '极限量测', description: '量测槽读数最大化', category: 'measure', effect: { measureSlot: 25, wuRisk: 5 }, cost: 2 },
  { id: 'wei-e3', name: '精细配平', description: '精调配平痕', category: 'balance', effect: { balanceMark: 18, weiFailFactor: -3 }, cost: 2 },
  { id: 'wei-e4', name: '密令收集', description: '收集丁号奖励密令', category: 'reward', effect: { dingReward: 30 }, cost: 3 },
  { id: 'wei-e5', name: '未号压制', description: '主动压制未号失败因子', category: 'fail', effect: { weiFailFactor: -10, balanceMark: -3 }, cost: 2 },
  { id: 'wei-e6', name: '三相协调', description: '三属性联动触发（关键隐藏操作）', category: 'balance', effect: { traceValue: 10, measureSlot: 10, balanceMark: 10, weiFailFactor: -5 }, cost: 4 },
  { id: 'wei-e7', name: '回溯扫描', description: '扫描矿脉回溯信号', category: 'trace', effect: { traceValue: 8, weiFailFactor: -8, dingReward: 10 }, cost: 3 },
];

export const LEVELS: Record<string, LevelConfig> = {
  wu: {
    id: 'wu',
    name: '云母矿灯协作闯关游戏·戊局',
    subtitle: '教学示范局',
    description: '本局专为新手设计，资源充足，风险可控。目标是熟悉六大局面字段与协作流程。',
    initialField: {
      traceValue: 30,
      measureSlot: 25,
      balanceMark: 40,
      wuRisk: 20,
      dingReward: 10,
      weiFailFactor: 5,
    },
    targetCondition: (f) => f.traceValue >= 80 && f.measureSlot >= 70 && f.balanceMark >= 70,
    targetText: '描线值≥80、量测槽≥70、配平痕≥70',
    failCondition: (f) => f.wuRisk >= 60 || f.weiFailFactor >= 40,
    failText: '戊号风险≥60 或 未号失败因子≥40',
    availableEvents: wuEvents,
    maxSteps: 8,
    mapNodes: [
      { id: 'n0', x: 10, y: 50, label: '入矿口', type: 'start' },
      { id: 'n1', x: 30, y: 30, label: '甲矿层', type: 'mid' },
      { id: 'n2', x: 50, y: 60, label: '乙矿层', type: 'mid' },
      { id: 'n3', x: 70, y: 35, label: '丙矿层', type: 'mid' },
      { id: 'n4', x: 90, y: 50, label: '出矿口', type: 'end' },
    ],
    mapPaths: [['n0', 'n1'], ['n1', 'n2'], ['n2', 'n3'], ['n3', 'n4']],
  },
  ding: {
    id: 'ding',
    name: '云母矿灯协作闯关游戏·丁局',
    subtitle: '资源短缺局',
    description: '本局故意设置资源短缺：每次操作成本昂贵，丁号奖励稀少。需要精打细算每一步。',
    initialField: {
      traceValue: 20,
      measureSlot: 15,
      balanceMark: 20,
      wuRisk: 35,
      dingReward: 5,
      weiFailFactor: 10,
    },
    targetCondition: (f) => f.traceValue >= 75 && f.measureSlot >= 65 && f.balanceMark >= 65 && f.dingReward >= 20,
    targetText: '描线值≥75、量测槽≥65、配平痕≥65、丁号奖励≥20',
    failCondition: (f) => f.wuRisk >= 70 || f.weiFailFactor >= 50 || f.dingReward <= -20,
    failText: '戊号风险≥70 或 未号失败因子≥50 或 丁号奖励≤-20',
    availableEvents: dingEvents,
    maxSteps: 10,
    mapNodes: [
      { id: 'n0', x: 10, y: 50, label: '入矿口', type: 'start' },
      { id: 'n1', x: 28, y: 20, label: '枯竭层A', type: 'mid' },
      { id: 'n2', x: 45, y: 70, label: '枯竭层B', type: 'mid' },
      { id: 'n3', x: 62, y: 30, label: '补给点', type: 'mid' },
      { id: 'n4', x: 78, y: 65, label: '枯竭层C', type: 'mid' },
      { id: 'n5', x: 90, y: 50, label: '出矿口', type: 'end' },
    ],
    mapPaths: [['n0', 'n1'], ['n1', 'n2'], ['n2', 'n3'], ['n3', 'n4'], ['n4', 'n5']],
  },
  wei: {
    id: 'wei',
    name: '云母矿灯协作闯关游戏·未局',
    subtitle: '隐藏条件局',
    description: '本局存在隐藏胜利条件。除了常规通关外，若描线值、量测槽、配平痕同时达到阈值并触发「三相协调」事件，可解锁隐藏结局。',
    initialField: {
      traceValue: 25,
      measureSlot: 20,
      balanceMark: 25,
      wuRisk: 30,
      dingReward: 15,
      weiFailFactor: 15,
    },
    targetCondition: (f) => f.traceValue >= 85 && f.measureSlot >= 80 && f.balanceMark >= 80,
    targetText: '描线值≥85、量测槽≥80、配平痕≥80',
    failCondition: (f) => f.wuRisk >= 75 || f.weiFailFactor >= 55,
    failText: '戊号风险≥75 或 未号失败因子≥55',
    availableEvents: weiEvents,
    maxSteps: 12,
    hiddenCondition: (f, steps) => {
      const hasThreePhase = steps.some((s) => s.eventId === 'wei-e6');
      const threeAttr = f.traceValue >= 90 && f.measureSlot >= 85 && f.balanceMark >= 85 && f.weiFailFactor <= 0;
      return hasThreePhase && threeAttr;
    },
    hiddenText: '隐藏条件：使用「三相协调」且描线值≥90、量测槽≥85、配平痕≥85、未号失败因子≤0',
    mapNodes: [
      { id: 'n0', x: 10, y: 50, label: '入矿口', type: 'start' },
      { id: 'n1', x: 25, y: 25, label: '信号点α', type: 'mid' },
      { id: 'n2', x: 40, y: 70, label: '信号点β', type: 'mid' },
      { id: 'n3', x: 55, y: 40, label: '三相点', type: 'mid' },
      { id: 'n4', x: 70, y: 70, label: '信号点γ', type: 'mid' },
      { id: 'n5', x: 82, y: 30, label: '回溯点', type: 'hidden' },
      { id: 'n6', x: 90, y: 50, label: '出矿口', type: 'end' },
    ],
    mapPaths: [['n0', 'n1'], ['n1', 'n2'], ['n2', 'n3'], ['n3', 'n4'], ['n4', 'n6'], ['n3', 'n5'], ['n5', 'n6']],
  },
};

export function clampField(f: GameField): GameField {
  return {
    traceValue: Math.max(0, Math.min(120, f.traceValue)),
    measureSlot: Math.max(0, Math.min(120, f.measureSlot)),
    balanceMark: Math.max(0, Math.min(120, f.balanceMark)),
    wuRisk: Math.max(0, Math.min(100, f.wuRisk)),
    dingReward: Math.min(100, f.dingReward),
    weiFailFactor: Math.max(0, Math.min(100, f.weiFailFactor)),
  };
}

export function applyEvent(field: GameField, event: GameEvent): GameField {
  const next: GameField = { ...field };
  for (const key of Object.keys(event.effect) as (keyof GameField)[]) {
    next[key] = (next[key] || 0) + (event.effect[key] || 0);
  }
  return clampField(next);
}
