import type { GameLevel, PlayerProfile } from './types';

export const INITIAL_LEVELS: GameLevel[] = [
  {
    id: 1,
    name: '初学乍练',
    description: '新手入门，感受水钟校时的基本原理。温和的天气，宽容的客户。',
    days: 5,
    startCopper: 100,
    startReputation: 10,
    temperatureRange: [15, 25],
    dailyTemperatureChange: 1,
    ordersPerDay: 2,
    customerTypes: ['merchant', 'farmer'],
    difficulty: 'easy',
    passCondition: {
      minReputation: 25,
      minCopper: 150,
      minAccuracy: 0.7,
    },
  },
  {
    id: 2,
    name: '市井营生',
    description: '在繁华的市井中经营水钟铺。各色顾客登门，天气变幻不定。',
    days: 7,
    startCopper: 150,
    startReputation: 25,
    temperatureRange: [10, 30],
    dailyTemperatureChange: 2,
    ordersPerDay: 3,
    customerTypes: ['merchant', 'farmer', 'scholar'],
    difficulty: 'medium',
    passCondition: {
      minReputation: 60,
      minCopper: 300,
      minAccuracy: 0.75,
    },
  },
  {
    id: 3,
    name: '官差临门',
    description: '官府开始注意到你的手艺。订单难度大增，稍有差错便会影响声誉。',
    days: 10,
    startCopper: 200,
    startReputation: 60,
    temperatureRange: [5, 35],
    dailyTemperatureChange: 3,
    ordersPerDay: 3,
    customerTypes: ['merchant', 'scholar', 'official', 'noble'],
    difficulty: 'hard',
    passCondition: {
      minReputation: 120,
      minCopper: 600,
      minAccuracy: 0.8,
    },
  },
  {
    id: 4,
    name: '皇家御用',
    description: '最严苛的考验。皇室贵族的订单容不得半点差池，寒暑交替亦需精准计时。',
    days: 14,
    startCopper: 300,
    startReputation: 120,
    temperatureRange: [-5, 40],
    dailyTemperatureChange: 4,
    ordersPerDay: 4,
    customerTypes: ['noble', 'official', 'scholar'],
    difficulty: 'hard',
    passCondition: {
      minReputation: 250,
      minCopper: 1200,
      minAccuracy: 0.85,
    },
  },
];

export const DEFAULT_PLAYER: PlayerProfile = {
  id: 'player-001',
  name: '匿名匠人',
  createdAt: 0,
  copper: 100,
  reputation: 10,
  reputationLevel: 1,
  totalOrdersCompleted: 0,
  totalOrdersFailed: 0,
  bestAccuracy: 0,
  currentLevel: 1,
  completedLevels: [],
};

export const REPUTATION_LEVELS = [
  { level: 1, name: '学徒', minRep: 0 },
  { level: 2, name: '匠人', minRep: 30 },
  { level: 3, name: '师父', minRep: 80 },
  { level: 4, name: '名匠', minRep: 150 },
  { level: 5, name: '国工', minRep: 250 },
  { level: 6, name: '圣手', minRep: 400 },
];

export const CUSTOMER_NAMES = [
  '张老板', '李掌柜', '王员外', '赵公子', '钱大人',
  '孙夫子', '周大爷', '吴郎中', '郑将军', '冯翰林',
  '陈大户', '褚主簿', '卫书生', '蒋乡绅', '沈巡按',
];

export const ORDER_DESCRIPTIONS = [
  '家中祭祀需要准确计时',
  '科举开考需定时提醒',
  '衙门办公需标准时刻',
  '商队远行需校对行程',
  '农家播种需把握节气',
  '婚宴庆典需精准到刻',
  '道观做法需定时焚香',
  '学堂开课需鸣钟通知',
];
