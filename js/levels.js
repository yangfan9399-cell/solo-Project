const LEVELS = {
  jia: {
    id: 'jia',
    name: '甲局 · 启蒙教学',
    description: '潮汐钟塔的基础航线推演。规则清晰，资源充裕，用于熟悉操作。',
    initialState: {
      lightValue: 15,
      lightTarget: 70,
      traceSlotMax: 8,
      riskA: 0,
      riskAMax: 10,
      rewardD: 10,
      failB: 0,
      failBMax: 5
    },
    map: {
      cols: 5,
      rows: 3,
      nodes: [
        { id: 'n0', x: 0, y: 1, type: 'start', name: '起锚港', lightOnEnter: 5 },
        { id: 'n1', x: 1, y: 0, type: 'tower', name: '启明塔', lightOnEnter: 10 },
        { id: 'n2', x: 1, y: 1, type: 'event', name: '潮流带', eventId: 'jia_current' },
        { id: 'n3', x: 1, y: 2, type: 'reward', name: '贝币堆', rewardOnEnter: 5 },
        { id: 'n4', x: 2, y: 0, type: 'risk', name: '暗礁区', riskOnEnter: 2, failOnEnter: 1 },
        { id: 'n5', x: 2, y: 1, type: 'tower', name: '指南塔', lightOnEnter: 12 },
        { id: 'n6', x: 2, y: 2, type: 'event', name: '海雾区', eventId: 'jia_fog' },
        { id: 'n7', x: 3, y: 0, type: 'reward', name: '商船遗宝', rewardOnEnter: 8 },
        { id: 'n8', x: 3, y: 1, type: 'tower', name: '测深塔', lightOnEnter: 15 },
        { id: 'n9', x: 3, y: 2, type: 'risk', name: '风暴眼', riskOnEnter: 3, failOnEnter: 1 },
        { id: 'n10', x: 4, y: 1, type: 'end', name: '归航港', lightOnEnter: 20 }
      ],
      connections: [
        ['n0', 'n1'], ['n0', 'n2'], ['n0', 'n3'],
        ['n1', 'n4'], ['n1', 'n5'],
        ['n2', 'n5'], ['n2', 'n6'],
        ['n3', 'n6'],
        ['n4', 'n7'], ['n4', 'n8'],
        ['n5', 'n7'], ['n5', 'n8'], ['n5', 'n9'],
        ['n6', 'n8'], ['n6', 'n9'],
        ['n7', 'n10'],
        ['n8', 'n10'],
        ['n9', 'n10']
      ]
    },
    events: {
      jia_current: {
        id: 'jia_current',
        title: '顺流助力',
        description: '潮流顺着航线方向涌动，船只获得额外动能。',
        type: 'positive',
        effects: { lightValue: 8, rewardD: 2 }
      },
      jia_fog: {
        id: 'jia_fog',
        title: '海雾弥漫',
        description: '浓雾遮蔽视野，需要消耗奖励资源来维持航线。',
        type: 'negative',
        effects: { rewardD: -3, riskA: 1 }
      }
    },
    winCondition: {
      type: 'reach_end_with_light',
      description: '抵达归航港，且潮汐钟塔点亮值 ≥ 目标值'
    },
    loseConditions: [
      { type: 'risk_exceed', description: '甲号风险超过阈值，航线崩溃' },
      { type: 'fail_exceed', description: '乙号失败因子累积过多，推演终止' }
    ],
    settlementFormula: {
      baseScore: '潮汐钟塔点亮值 × 10',
      rewardBonus: '丁号奖励 × 5',
      riskPenalty: '甲号风险 × 8',
      failPenalty: '乙号失败因子 × 15',
      stepBonus: 'MAX(0, (描线槽上限 - 已用步数) × 3)',
      total: '基础分 + 奖励加成 - 风险惩罚 - 失败惩罚 + 步数奖励'
    }
  },

  ding: {
    id: 'ding',
    name: '丁局 · 资源短缺',
    description: '奖励稀少，每一份资源都要斟酌使用。必须找到最优路径才能达标。',
    initialState: {
      lightValue: 8,
      lightTarget: 90,
      traceSlotMax: 10,
      riskA: 0,
      riskAMax: 8,
      rewardD: 2,
      failB: 0,
      failBMax: 4
    },
    map: {
      cols: 6,
      rows: 4,
      nodes: [
        { id: 'n0', x: 0, y: 2, type: 'start', name: '荒港', lightOnEnter: 3 },
        { id: 'n1', x: 1, y: 1, type: 'tower', name: '残塔A', lightOnEnter: 6 },
        { id: 'n2', x: 1, y: 2, type: 'risk', name: '枯潮险滩', riskOnEnter: 2, failOnEnter: 1 },
        { id: 'n3', x: 1, y: 3, type: 'event', name: '断缆区', eventId: 'ding_cable' },
        { id: 'n4', x: 2, y: 0, type: 'risk', name: '涡流群', riskOnEnter: 3, failOnEnter: 1 },
        { id: 'n5', x: 2, y: 1, type: 'event', name: '贸易风', eventId: 'ding_tradewind' },
        { id: 'n6', x: 2, y: 2, type: 'tower', name: '残塔B', lightOnEnter: 8 },
        { id: 'n7', x: 2, y: 3, type: 'risk', name: '暗沙带', riskOnEnter: 2, failOnEnter: 2 },
        { id: 'n8', x: 3, y: 0, type: 'tower', name: '孤塔', lightOnEnter: 14 },
        { id: 'n9', x: 3, y: 1, type: 'reward', name: '漂流箱', rewardOnEnter: 4 },
        { id: 'n10', x: 3, y: 2, type: 'risk', name: '雷雨区', riskOnEnter: 3, failOnEnter: 1 },
        { id: 'n11', x: 3, y: 3, type: 'tower', name: '残塔C', lightOnEnter: 7 },
        { id: 'n12', x: 4, y: 0, type: 'event', name: '星象指引', eventId: 'ding_stars' },
        { id: 'n13', x: 4, y: 1, type: 'tower', name: '导航塔', lightOnEnter: 16 },
        { id: 'n14', x: 4, y: 2, type: 'event', name: '补给船', eventId: 'ding_supply' },
        { id: 'n15', x: 4, y: 3, type: 'risk', name: '海盗旗', riskOnEnter: 4, failOnEnter: 2 },
        { id: 'n16', x: 5, y: 1, type: 'end', name: '灯塔港', lightOnEnter: 25 }
      ],
      connections: [
        ['n0', 'n1'], ['n0', 'n2'], ['n0', 'n3'],
        ['n1', 'n4'], ['n1', 'n5'], ['n1', 'n6'],
        ['n2', 'n5'], ['n2', 'n6'], ['n2', 'n7'],
        ['n3', 'n6'], ['n3', 'n7'],
        ['n4', 'n8'], ['n4', 'n9'],
        ['n5', 'n8'], ['n5', 'n9'], ['n5', 'n10'],
        ['n6', 'n9'], ['n6', 'n10'], ['n6', 'n11'],
        ['n7', 'n10'], ['n7', 'n11'],
        ['n8', 'n12'], ['n8', 'n13'],
        ['n9', 'n12'], ['n9', 'n13'], ['n9', 'n14'],
        ['n10', 'n13'], ['n10', 'n14'], ['n10', 'n15'],
        ['n11', 'n14'], ['n11', 'n15'],
        ['n12', 'n16'],
        ['n13', 'n16'],
        ['n14', 'n16'],
        ['n15', 'n16']
      ]
    },
    events: {
      ding_cable: {
        id: 'ding_cable',
        title: '缆绳崩断',
        description: '老旧缆绳在风浪中断裂，需要额外资源修补。',
        type: 'negative',
        effects: { rewardD: -2, failB: 1 }
      },
      ding_tradewind: {
        id: 'ding_tradewind',
        title: '贸易风起',
        description: '罕见的稳定气流，让航行效率提升。',
        type: 'positive',
        effects: { lightValue: 10, riskA: -1 }
      },
      ding_stars: {
        id: 'ding_stars',
        title: '星象指引',
        description: '夜空星象清晰，为航线指明方向。',
        type: 'positive',
        effects: { lightValue: 12, rewardD: 3 }
      },
      ding_supply: {
        id: 'ding_supply',
        title: '偶遇补给船',
        description: '一艘过路的补给船给予少量支援。',
        type: 'special',
        effects: { rewardD: 5, lightValue: 5 }
      }
    },
    winCondition: {
      type: 'reach_end_with_light_and_reward',
      description: '抵达灯塔港，且潮汐钟塔点亮值 ≥ 目标值，且丁号奖励 ≥ 0'
    },
    loseConditions: [
      { type: 'risk_exceed', description: '甲号风险超过阈值，航线崩溃' },
      { type: 'fail_exceed', description: '乙号失败因子累积过多，推演终止' },
      { type: 'reward_neg', description: '丁号奖励为负，资源枯竭' }
    ],
    settlementFormula: {
      baseScore: '潮汐钟塔点亮值 × 12',
      rewardBonus: '丁号奖励 × 8',
      riskPenalty: '甲号风险 × 10',
      failPenalty: '乙号失败因子 × 20',
      stepBonus: 'MAX(0, (描线槽上限 - 已用步数) × 5)',
      total: '基础分 + 奖励加成 - 风险惩罚 - 失败惩罚 + 步数奖励'
    }
  },

  yi: {
    id: 'yi',
    name: '乙局 · 隐藏条件',
    description: '胜负不仅在于表面数据。找到隐藏节点的特殊触发方式，才能开启真正的胜利之门。',
    initialState: {
      lightValue: 10,
      lightTarget: 80,
      traceSlotMax: 12,
      riskA: 0,
      riskAMax: 12,
      rewardD: 5,
      failB: 0,
      failBMax: 6,
      hiddenFlag: false
    },
    map: {
      cols: 6,
      rows: 4,
      nodes: [
        { id: 'n0', x: 0, y: 2, type: 'start', name: '迷港', lightOnEnter: 4 },
        { id: 'n1', x: 1, y: 0, type: 'event', name: '古碑纹', eventId: 'yi_rune1' },
        { id: 'n2', x: 1, y: 1, type: 'tower', name: '符文塔A', lightOnEnter: 8 },
        { id: 'n3', x: 1, y: 2, type: 'risk', name: '阴影漩涡', riskOnEnter: 2, failOnEnter: 1 },
        { id: 'n4', x: 1, y: 3, type: 'event', name: '古碑纹', eventId: 'yi_rune2' },
        { id: 'n5', x: 2, y: 0, type: 'tower', name: '符文塔B', lightOnEnter: 9 },
        { id: 'n6', x: 2, y: 1, type: 'event', name: '回声窟', eventId: 'yi_echo' },
        { id: 'n7', x: 2, y: 2, type: 'tower', name: '符文塔C', lightOnEnter: 9 },
        { id: 'n8', x: 2, y: 3, type: 'risk', name: '时空裂隙', riskOnEnter: 3, failOnEnter: 1 },
        { id: 'n9', x: 3, y: 0, type: 'reward', name: '古钱币', rewardOnEnter: 6 },
        { id: 'n10', x: 3, y: 1, type: 'hidden', name: '???', hiddenTrigger: ['yi_rune1', 'yi_rune2', 'yi_echo_triggered'], lightOnEnter: 25, rewardOnEnter: 10, hiddenName: '秘境门' },
        { id: 'n11', x: 3, y: 2, type: 'event', name: '旧航海日志', eventId: 'yi_log' },
        { id: 'n12', x: 3, y: 3, type: 'reward', name: '旧钱币', rewardOnEnter: 5 },
        { id: 'n13', x: 4, y: 0, type: 'risk', name: '守护者', riskOnEnter: 4, failOnEnter: 2 },
        { id: 'n14', x: 4, y: 1, type: 'tower', name: '符文塔D', lightOnEnter: 11 },
        { id: 'n15', x: 4, y: 2, type: 'tower', name: '符文塔E', lightOnEnter: 11 },
        { id: 'n16', x: 4, y: 3, type: 'risk', name: '追猎者', riskOnEnter: 4, failOnEnter: 2 },
        { id: 'n17', x: 5, y: 1, type: 'end', name: '真航港', lightOnEnter: 20 },
        { id: 'n18', x: 5, y: 2, type: 'end', name: '秘境港', lightOnEnter: 30, requireHidden: true }
      ],
      connections: [
        ['n0', 'n1'], ['n0', 'n2'], ['n0', 'n3'], ['n0', 'n4'],
        ['n1', 'n5'], ['n1', 'n6'],
        ['n2', 'n5'], ['n2', 'n6'], ['n2', 'n7'],
        ['n3', 'n6'], ['n3', 'n7'], ['n3', 'n8'],
        ['n4', 'n7'], ['n4', 'n8'],
        ['n5', 'n9'], ['n5', 'n10'],
        ['n6', 'n9'], ['n6', 'n10'], ['n6', 'n11'],
        ['n7', 'n10'], ['n7', 'n11'], ['n7', 'n12'],
        ['n8', 'n11'], ['n8', 'n12'],
        ['n9', 'n13'], ['n9', 'n14'],
        ['n10', 'n14'], ['n10', 'n18'],
        ['n11', 'n14'], ['n11', 'n15'],
        ['n12', 'n15'], ['n12', 'n16'],
        ['n13', 'n17'],
        ['n14', 'n17'],
        ['n15', 'n17'], ['n15', 'n18'],
        ['n16', 'n18']
      ]
    },
    events: {
      yi_rune1: {
        id: 'yi_rune1',
        title: '古碑纹·阴',
        description: '碑上刻有古老的阴纹符文。触摸它时感到一阵寒意。似乎与另一块碑文有联系……',
        type: 'special',
        effects: { lightValue: 5 },
        flags: ['yi_rune1']
      },
      yi_rune2: {
        id: 'yi_rune2',
        title: '古碑纹·阳',
        description: '碑上刻有古老的阳纹符文。触摸它时感到一阵暖意。似乎与另一块碑文有联系……',
        type: 'special',
        effects: { lightValue: 5 },
        flags: ['yi_rune2']
      },
      yi_echo: {
        id: 'yi_echo',
        title: '回声窟',
        description: '窟中回荡着古老的声音。你需要丁号奖励作为祭品，才能让回声揭示真相。',
        type: 'conditional',
        condition: { rewardD: 3 },
        triggeredEffects: { lightValue: 8, rewardD: -3 },
        triggeredFlags: ['yi_echo_triggered'],
        untriggeredEffects: { failB: 1 },
        triggeredTitle: '回声窟·真相显现',
        triggeredDescription: '你献出奖励作为祭品，回声汇聚成一句话："门在符文之间。"',
        untriggeredTitle: '回声窟·空荡',
        untriggeredDescription: '奖励不足，回声逐渐消散，只留下一阵空虚感……'
      },
      yi_log: {
        id: 'yi_log',
        title: '旧航海日志',
        description: '日志已经泛黄，依稀可见："……当三纹归一，秘境之门将为航海者开启……"',
        type: 'positive',
        effects: { lightValue: 6, rewardD: 2 }
      }
    },
    winCondition: {
      type: 'reach_end_with_light_hidden',
      description: '抵达任一终点港，且潮汐钟塔点亮值 ≥ 目标值。（抵达秘境港需先开启隐藏条件，可获额外奖励）'
    },
    loseConditions: [
      { type: 'risk_exceed', description: '甲号风险超过阈值，航线崩溃' },
      { type: 'fail_exceed', description: '乙号失败因子累积过多，推演终止' }
    ],
    settlementFormula: {
      baseScore: '潮汐钟塔点亮值 × 10',
      rewardBonus: '丁号奖励 × 6',
      riskPenalty: '甲号风险 × 9',
      failPenalty: '乙号失败因子 × 18',
      stepBonus: 'MAX(0, (描线槽上限 - 已用步数) × 4)',
      hiddenBonus: '隐藏条件达成 × 200',
      total: '基础分 + 奖励加成 - 风险惩罚 - 失败惩罚 + 步数奖励 + 隐藏奖励'
    }
  }
};

if (typeof module !== 'undefined') module.exports = LEVELS;
