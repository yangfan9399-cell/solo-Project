import type { Level, Player, GameResult } from '../types';
import { isSeedInitialized, markSeedInitialized, saveLevels, savePlayer, saveGameResult, getLevels, getPlayer } from './storage';

export const seedLevels: Level[] = [
  {
    id: 1,
    name: '新手管道',
    description: '学习基础阀门控制，将3个包裹准时送到站。调节阀门压力来控制胶囊速度。',
    difficulty: 'easy',
    timeLimit: 120,
    targetDeliveries: 3,
    minScore: 500,
    valves: [
      { id: 'v1', x: 200, y: 200, pressure: 50, targetPressure: 60, minPressure: 0, maxPressure: 100, isOpen: true },
      { id: 'v2', x: 500, y: 200, pressure: 50, targetPressure: 50, minPressure: 0, maxPressure: 100, isOpen: true }
    ],
    junctions: [
      { id: 'j1', x: 350, y: 200, type: 'turn', direction: 'right', active: true }
    ],
    pipes: [
      { id: 'p1', from: 's1', to: 'v1', capacity: 10, currentFlow: 0, maxPressure: 80 },
      { id: 'p2', from: 'v1', to: 'j1', capacity: 10, currentFlow: 0, maxPressure: 80 },
      { id: 'p3', from: 'j1', to: 'v2', capacity: 10, currentFlow: 0, maxPressure: 80 },
      { id: 'p4', from: 'v2', to: 's2', capacity: 10, currentFlow: 0, maxPressure: 80 }
    ],
    stations: [
      { id: 's1', x: 100, y: 200, name: '城东仓库', type: 'origin', queue: [], delivered: [] },
      { id: 's2', x: 650, y: 200, name: '市中心站', type: 'destination', queue: [], delivered: [] }
    ],
    spawnSchedule: [
      { time: 5, originId: 's1', destinationId: 's2', priority: 'normal', cargo: '食品包裹', maxDeliveryTime: 60 },
      { time: 25, originId: 's1', destinationId: 's2', priority: 'express', cargo: '医疗用品', maxDeliveryTime: 45 },
      { time: 50, originId: 's1', destinationId: 's2', priority: 'normal', cargo: '电商快件', maxDeliveryTime: 60 }
    ],
    anomalies: [
      { id: 'a1', type: 'pressure_surge', triggerTime: 40, targetId: 'p2', duration: 10, severity: 1, description: '管道压力波动' }
    ]
  },
  {
    id: 2,
    name: '双路分流',
    description: '使用分拣节点将包裹送往不同目的地。注意切换分拣方向！',
    difficulty: 'medium',
    timeLimit: 180,
    targetDeliveries: 6,
    minScore: 1200,
    valves: [
      { id: 'v1', x: 200, y: 300, pressure: 55, targetPressure: 55, minPressure: 0, maxPressure: 100, isOpen: true },
      { id: 'v2', x: 450, y: 150, pressure: 50, targetPressure: 50, minPressure: 0, maxPressure: 100, isOpen: true },
      { id: 'v3', x: 450, y: 450, pressure: 50, targetPressure: 50, minPressure: 0, maxPressure: 100, isOpen: true }
    ],
    junctions: [
      { id: 'j1', x: 320, y: 300, type: 'split', direction: 'up', active: true }
    ],
    pipes: [
      { id: 'p1', from: 's1', to: 'v1', capacity: 15, currentFlow: 0, maxPressure: 90 },
      { id: 'p2', from: 'v1', to: 'j1', capacity: 15, currentFlow: 0, maxPressure: 90 },
      { id: 'p3', from: 'j1', to: 'v2', capacity: 10, currentFlow: 0, maxPressure: 80 },
      { id: 'p4', from: 'j1', to: 'v3', capacity: 10, currentFlow: 0, maxPressure: 80 },
      { id: 'p5', from: 'v2', to: 's2', capacity: 10, currentFlow: 0, maxPressure: 80 },
      { id: 'p6', from: 'v3', to: 's3', capacity: 10, currentFlow: 0, maxPressure: 80 }
    ],
    stations: [
      { id: 's1', x: 100, y: 300, name: '中央仓库', type: 'origin', queue: [], delivered: [] },
      { id: 's2', x: 600, y: 150, name: '北区医院', type: 'destination', queue: [], delivered: [] },
      { id: 's3', x: 600, y: 450, name: '南区商场', type: 'destination', queue: [], delivered: [] }
    ],
    spawnSchedule: [
      { time: 5, originId: 's1', destinationId: 's2', priority: 'express', cargo: '急救药品', maxDeliveryTime: 40 },
      { time: 15, originId: 's1', destinationId: 's3', priority: 'normal', cargo: '零售商品', maxDeliveryTime: 70 },
      { time: 30, originId: 's1', destinationId: 's2', priority: 'critical', cargo: '器官移植', maxDeliveryTime: 25 },
      { time: 45, originId: 's1', destinationId: 's3', priority: 'normal', cargo: '生鲜食品', maxDeliveryTime: 60 },
      { time: 60, originId: 's1', destinationId: 's2', priority: 'express', cargo: '医疗设备', maxDeliveryTime: 45 },
      { time: 75, originId: 's1', destinationId: 's3', priority: 'normal', cargo: '服装包裹', maxDeliveryTime: 70 }
    ],
    anomalies: [
      { id: 'a1', type: 'junction_failure', triggerTime: 35, targetId: 'j1', duration: 8, severity: 2, description: '分拣节点故障' },
      { id: 'a2', type: 'pipe_leak', triggerTime: 65, targetId: 'p3', duration: 12, severity: 1, description: '管道轻微泄漏' }
    ]
  },
  {
    id: 3,
    name: '复杂枢纽',
    description: '多节点多目的地，需要精确控制气压和分拣，应对频繁异常。',
    difficulty: 'hard',
    timeLimit: 240,
    targetDeliveries: 10,
    minScore: 2500,
    valves: [
      { id: 'v1', x: 180, y: 200, pressure: 60, targetPressure: 60, minPressure: 0, maxPressure: 100, isOpen: true },
      { id: 'v2', x: 180, y: 400, pressure: 60, targetPressure: 60, minPressure: 0, maxPressure: 100, isOpen: true },
      { id: 'v3', x: 400, y: 300, pressure: 55, targetPressure: 55, minPressure: 0, maxPressure: 100, isOpen: true },
      { id: 'v4', x: 620, y: 150, pressure: 50, targetPressure: 50, minPressure: 0, maxPressure: 100, isOpen: true },
      { id: 'v5', x: 620, y: 300, pressure: 50, targetPressure: 50, minPressure: 0, maxPressure: 100, isOpen: true },
      { id: 'v6', x: 620, y: 450, pressure: 50, targetPressure: 50, minPressure: 0, maxPressure: 100, isOpen: true }
    ],
    junctions: [
      { id: 'j1', x: 290, y: 200, type: 'turn', direction: 'down', active: true },
      { id: 'j2', x: 290, y: 400, type: 'turn', direction: 'up', active: true },
      { id: 'j3', x: 400, y: 200, type: 'merge', direction: 'down', active: true },
      { id: 'j4', x: 400, y: 400, type: 'merge', direction: 'up', active: true },
      { id: 'j5', x: 510, y: 300, type: 'split', direction: 'up', active: true }
    ],
    pipes: [
      { id: 'p1', from: 's1', to: 'v1', capacity: 12, currentFlow: 0, maxPressure: 85 },
      { id: 'p2', from: 's2', to: 'v2', capacity: 12, currentFlow: 0, maxPressure: 85 },
      { id: 'p3', from: 'v1', to: 'j1', capacity: 12, currentFlow: 0, maxPressure: 85 },
      { id: 'p4', from: 'v2', to: 'j2', capacity: 12, currentFlow: 0, maxPressure: 85 },
      { id: 'p5', from: 'j1', to: 'j3', capacity: 10, currentFlow: 0, maxPressure: 80 },
      { id: 'p6', from: 'j2', to: 'j4', capacity: 10, currentFlow: 0, maxPressure: 80 },
      { id: 'p7', from: 'j3', to: 'v3', capacity: 15, currentFlow: 0, maxPressure: 95 },
      { id: 'p8', from: 'j4', to: 'v3', capacity: 15, currentFlow: 0, maxPressure: 95 },
      { id: 'p9', from: 'v3', to: 'j5', capacity: 15, currentFlow: 0, maxPressure: 95 },
      { id: 'p10', from: 'j5', to: 'v4', capacity: 10, currentFlow: 0, maxPressure: 80 },
      { id: 'p11', from: 'j5', to: 'v5', capacity: 10, currentFlow: 0, maxPressure: 80 },
      { id: 'p12', from: 'j5', to: 'v6', capacity: 10, currentFlow: 0, maxPressure: 80 },
      { id: 'p13', from: 'v4', to: 's3', capacity: 10, currentFlow: 0, maxPressure: 80 },
      { id: 'p14', from: 'v5', to: 's4', capacity: 10, currentFlow: 0, maxPressure: 80 },
      { id: 'p15', from: 'v6', to: 's5', capacity: 10, currentFlow: 0, maxPressure: 80 }
    ],
    stations: [
      { id: 's1', x: 80, y: 200, name: '机场物流', type: 'origin', queue: [], delivered: [] },
      { id: 's2', x: 80, y: 400, name: '港口码头', type: 'origin', queue: [], delivered: [] },
      { id: 's3', x: 720, y: 150, name: 'CBD中心', type: 'destination', queue: [], delivered: [] },
      { id: 's4', x: 720, y: 300, name: '科技园', type: 'destination', queue: [], delivered: [] },
      { id: 's5', x: 720, y: 450, name: '大学城', type: 'destination', queue: [], delivered: [] }
    ],
    spawnSchedule: [
      { time: 3, originId: 's1', destinationId: 's3', priority: 'express', cargo: '商务文件', maxDeliveryTime: 35 },
      { time: 8, originId: 's2', destinationId: 's5', priority: 'normal', cargo: '图书教材', maxDeliveryTime: 80 },
      { time: 18, originId: 's1', destinationId: 's4', priority: 'critical', cargo: '芯片组件', maxDeliveryTime: 30 },
      { time: 28, originId: 's2', destinationId: 's3', priority: 'express', cargo: '奢侈品', maxDeliveryTime: 40 },
      { time: 40, originId: 's1', destinationId: 's5', priority: 'normal', cargo: '科研设备', maxDeliveryTime: 70 },
      { time: 52, originId: 's2', destinationId: 's4', priority: 'critical', cargo: '服务器配件', maxDeliveryTime: 25 },
      { time: 65, originId: 's1', destinationId: 's3', priority: 'express', cargo: '法律文书', maxDeliveryTime: 35 },
      { time: 78, originId: 's2', destinationId: 's5', priority: 'normal', cargo: '实验样本', maxDeliveryTime: 60 },
      { time: 92, originId: 's1', destinationId: 's4', priority: 'express', cargo: '医疗试剂', maxDeliveryTime: 40 },
      { time: 105, originId: 's2', destinationId: 's3', priority: 'critical', cargo: '急救物资', maxDeliveryTime: 20 }
    ],
    anomalies: [
      { id: 'a1', type: 'power_outage', triggerTime: 25, targetId: 'v3', duration: 8, severity: 3, description: '主干阀门断电' },
      { id: 'a2', type: 'pressure_surge', triggerTime: 50, targetId: 'p9', duration: 10, severity: 2, description: '主管道压力骤升' },
      { id: 'a3', type: 'junction_failure', triggerTime: 75, targetId: 'j5', duration: 10, severity: 2, description: '主分拣节点故障' },
      { id: 'a4', type: 'pipe_leak', triggerTime: 100, targetId: 'p7', duration: 15, severity: 1, description: '管道泄漏' }
    ]
  }
];

export const seedPlayer: Player = {
  id: 'player_001',
  name: '新手调度员',
  createdAt: Date.now(),
  totalScore: 0,
  gamesPlayed: 0,
  gamesWon: 0,
  bestLevel: 0
};

export const seedHistory: GameResult[] = [
  {
    gameId: 'game_demo_1',
    playerId: 'player_001',
    levelId: 1,
    completedAt: Date.now() - 86400000,
    victory: true,
    finalScore: 1250,
    recalculatedScore: 1250,
    deliveriesCompleted: 3,
    deliveriesFailed: 0,
    timeUsed: 85,
    anomaliesResolved: 1,
    operationsPerformed: 12,
    rating: 'A'
  },
  {
    gameId: 'game_demo_2',
    playerId: 'player_001',
    levelId: 2,
    completedAt: Date.now() - 43200000,
    victory: false,
    finalScore: 890,
    recalculatedScore: 890,
    deliveriesCompleted: 4,
    deliveriesFailed: 2,
    timeUsed: 180,
    anomaliesResolved: 1,
    operationsPerformed: 18,
    rating: 'D'
  }
];

export function initializeSeedData(): void {
  if (isSeedInitialized()) {
    return;
  }

  const existingLevels = getLevels();
  if (existingLevels.length === 0) {
    saveLevels(seedLevels);
  }

  const existingPlayer = getPlayer();
  if (!existingPlayer) {
    savePlayer(seedPlayer);
  }

  seedHistory.forEach(result => {
    saveGameResult(result);
  });

  markSeedInitialized();
}
