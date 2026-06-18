const scenarios = {
  chou: {
    name: '丑局 · 教学篇',
    description: '入门教学局，熟悉资源调度基本操作。资源充足，风险较低。',
    maxTurns: 5,
    initialState: {
      stardustStrip: 100,
      rehearsalSlots: 6,
      calibrationMarks: 3,
      chouRisk: 0.1,
      shenReward: 0.5,
      jiaFailureFactor: 0.3,
      resources: {
        energy: 50,
        data: 40,
        time: 30
      }
    },
    map: {
      name: '星尘棋盘·初阶',
      nodes: [
        { id: 'A', name: '起源点', type: 'start', bonus: { energy: 10 } },
        { id: 'B', name: '数据流', type: 'resource', bonus: { data: 15 } },
        { id: 'C', name: '时序站', type: 'resource', bonus: { time: 10 } },
        { id: 'D', name: '校准台', type: 'calibration', bonus: { calibrationMarks: 1 } },
        { id: 'E', name: '星尘井', type: 'stardust', bonus: { stardustStrip: 20 } },
        { id: 'F', name: '终焉门', type: 'end', bonus: { shenReward: 0.2 } }
      ],
      connections: [
        ['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'],
        ['D', 'E'], ['E', 'F']
      ]
    },
    events: [
      {
        turn: 1,
        title: '星尘潮涌',
        description: '一股温和的星尘流涌入棋盘，你有机会获得额外资源。',
        choices: [
          { id: 'accept', text: '接纳星尘 (+15 剥离值, +0.05 丑号风险)', effect: { stardustStrip: 15, chouRisk: 0.05 } },
          { id: 'deflect', text: '偏折星尘 (保持稳定, +1 定标痕)', effect: { calibrationMarks: 1 } }
        ]
      },
      {
        turn: 3,
        title: '排演机会',
        description: '你发现了一个额外的排演槽位，但需要消耗能量来激活。',
        choices: [
          { id: 'activate', text: '激活排演槽 (-10 能量, +2 排演槽)', effect: { resources: { energy: -10 }, rehearsalSlots: 2 } },
          { id: 'skip', text: '跳过 (无变化)', effect: {} }
        ]
      }
    ],
    winCondition: {
      type: 'stardust_target',
      target: 200,
      description: '星尘剥离值达到200即可获胜'
    },
    failCondition: {
      type: 'risk_threshold',
      threshold: 0.5,
      description: '丑号风险超过50%则失败'
    }
  },

  shen: {
    name: '申局 · 资源短缺篇',
    description: '资源极度短缺，每一步都要精打细算。申号奖励丰厚，但风险并存。',
    maxTurns: 7,
    initialState: {
      stardustStrip: 50,
      rehearsalSlots: 3,
      calibrationMarks: 1,
      chouRisk: 0.2,
      shenReward: 1.0,
      jiaFailureFactor: 0.4,
      resources: {
        energy: 20,
        data: 15,
        time: 10
      }
    },
    map: {
      name: '星尘棋盘·困局',
      nodes: [
        { id: 'A', name: '匮乏起点', type: 'start', bonus: { energy: 5 } },
        { id: 'B', name: '枯竭井', type: 'stardust', bonus: { stardustStrip: 10 } },
        { id: 'C', name: '废墟站', type: 'resource', bonus: { data: 5 } },
        { id: 'D', name: '裂隙点', type: 'risk', bonus: { chouRisk: -0.05 } },
        { id: 'E', name: '校准残迹', type: 'calibration', bonus: { calibrationMarks: 1 } },
        { id: 'F', name: '申号宝库', type: 'reward', bonus: { shenReward: 0.3 } },
        { id: 'G', name: '时光回廊', type: 'resource', bonus: { time: 8 } },
        { id: 'H', name: '终局之门', type: 'end', bonus: { stardustStrip: 30 } }
      ],
      connections: [
        ['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'],
        ['D', 'E'], ['D', 'G'], ['E', 'F'], ['G', 'F'],
        ['F', 'H']
      ]
    },
    events: [
      {
        turn: 2,
        title: '资源抉择',
        description: '一位神秘商人提出交易，但代价不菲。',
        choices: [
          { id: 'trade', text: '交易 (-15 剥离值, +10 能量, +8 数据)', effect: { stardustStrip: -15, resources: { energy: 10, data: 8 } } },
          { id: 'decline', text: '拒绝 (+0.1 申号奖励)', effect: { shenReward: 0.1 } }
        ]
      },
      {
        turn: 4,
        title: '能量危机',
        description: '能量系统出现故障，必须做出选择。',
        choices: [
          { id: 'repair', text: '紧急修复 (-5 时间, -5 数据, +15 能量)', effect: { resources: { time: -5, data: -5, energy: 15 } } },
          { id: 'bypass', text: '绕过系统 (+0.1 丑号风险, +2 排演槽)', effect: { chouRisk: 0.1, rehearsalSlots: 2 } }
        ]
      },
      {
        turn: 6,
        title: '最终机遇',
        description: '抵达终点前的最后一个机遇点。',
        choices: [
          { id: 'gamble', text: '孤注一掷 (+40 剥离值, +0.2 丑号风险)', effect: { stardustStrip: 40, chouRisk: 0.2 } },
          { id: 'steady', text: '稳步前进 (+20 剥离值, -0.05 丑号风险)', effect: { stardustStrip: 20, chouRisk: -0.05 } }
        ]
      }
    ],
    winCondition: {
      type: 'multi_condition',
      conditions: {
        stardustStrip: 150,
        minCalibrationMarks: 2
      },
      description: '星尘剥离值≥150 且 定标痕≥2 方可获胜'
    },
    failCondition: {
      type: 'resource_depletion',
      description: '任意资源降至0以下则失败'
    }
  },

  jia: {
    name: '甲局 · 隐藏条件篇',
    description: '存在隐藏胜利条件。甲号失败因子极高，触发隐藏机制方可逆转。',
    maxTurns: 8,
    initialState: {
      stardustStrip: 80,
      rehearsalSlots: 4,
      calibrationMarks: 2,
      chouRisk: 0.15,
      shenReward: 0.8,
      jiaFailureFactor: 0.7,
      resources: {
        energy: 35,
        data: 30,
        time: 25
      },
      hiddenUnlocked: false,
      secretSeals: 0
    },
    map: {
      name: '星尘棋盘·迷局',
      nodes: [
        { id: 'A', name: '迷雾入口', type: 'start', bonus: { data: 10 } },
        { id: 'B', name: '封印塔', type: 'secret', bonus: { secretSeals: 1 } },
        { id: 'C', name: '星尘漩涡', type: 'stardust', bonus: { stardustStrip: 25 } },
        { id: 'D', name: '甲号禁区', type: 'danger', bonus: { jiaFailureFactor: 0.1 } },
        { id: 'E', name: '古校准室', type: 'calibration', bonus: { calibrationMarks: 2 } },
        { id: 'F', name: '暗影回廊', type: 'risk', bonus: { chouRisk: 0.1 } },
        { id: 'G', name: '秘宝窟', type: 'secret', bonus: { secretSeals: 1, shenReward: 0.15 } },
        { id: 'H', name: '时间裂隙', type: 'resource', bonus: { time: 15 } },
        { id: 'I', name: '能量核心', type: 'resource', bonus: { energy: 20 } },
        { id: 'J', name: '终极封印', type: 'secret_end', bonus: {} }
      ],
      connections: [
        ['A', 'B'], ['A', 'C'], ['B', 'D'], ['C', 'D'],
        ['D', 'E'], ['D', 'F'], ['E', 'G'], ['F', 'G'],
        ['G', 'H'], ['G', 'I'], ['H', 'J'], ['I', 'J']
      ]
    },
    events: [
      {
        turn: 1,
        title: '古老铭文',
        description: '你发现了一段模糊的铭文，似乎暗示着某种封印的存在。',
        choices: [
          { id: 'study', text: '深入研究 (-5 能量, -5 数据, +1 秘印)', effect: { resources: { energy: -5, data: -5 }, secretSeals: 1 } },
          { id: 'ignore', text: '忽略继续 (+10 剥离值)', effect: { stardustStrip: 10 } }
        ]
      },
      {
        turn: 3,
        title: '甲号波动',
        description: '甲号失败因子开始不稳定波动，你需要做出应对。',
        choices: [
          { id: 'suppress', text: '压制波动 (-1 排演槽, -0.1 甲号因子)', effect: { rehearsalSlots: -1, jiaFailureFactor: -0.1 } },
          { id: 'channel', text: '引导能量 (+20 剥离值, +0.1 甲号因子)', effect: { stardustStrip: 20, jiaFailureFactor: 0.1 } }
        ]
      },
      {
        turn: 5,
        title: '命运抉择',
        description: '一个关键的分岔路口，你的选择将决定最终结局。',
        choices: [
          { id: 'power', text: '追求力量 (+35 剥离值, +0.15 甲号因子)', effect: { stardustStrip: 35, jiaFailureFactor: 0.15 } },
          { id: 'balance', text: '寻求平衡 (+15 剥离值, +1 秘印, -0.05 甲号因子)', effect: { stardustStrip: 15, secretSeals: 1, jiaFailureFactor: -0.05 } }
        ]
      },
      {
        turn: 7,
        title: '终末回响',
        description: '终点近在眼前，一股神秘力量在召唤你。',
        isHidden: true,
        choices: [
          { id: 'unlock', text: '尝试解开封印 (需要3秘印, 解锁隐藏结局)', effect: { hiddenUnlocked: true }, requires: { secretSeals: 3 } },
          { id: 'normal', text: '正常通关 (+30 剥离值)', effect: { stardustStrip: 30 } }
        ]
      }
    ],
    winCondition: {
      type: 'secret',
      normalTarget: 250,
      secretRequirement: {
        secretSeals: 3,
        hiddenUnlocked: true
      },
      description: '普通胜利: 星尘≥250 | 隐藏胜利: 收集3个秘印并解开封印'
    },
    failCondition: {
      type: 'jia_factor',
      threshold: 1.0,
      description: '甲号失败因子达到100%则立即失败'
    }
  }
};

module.exports = scenarios;
