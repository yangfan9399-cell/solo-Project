const games = {
  chou: {
    id: 'chou',
    name: '夜航纸船资源配给盘·丑局',
    subtitle: '教学局·风险可控',
    description: '丑局为入门教学局，资源充足，风险较低。重点熟悉剥离值调度与排演槽运作。',
    theme: 'teaching',
    initialState: {
      strippingValue: 100,
      maxStrippingValue: 120,
      rehearsalSlots: 3,
      usedSlots: 0,
      calibrationMarks: 0,
      targetCalibration: 5,
      chouRisk: 0.15,
      shenReward: 0,
      jiaFailureFactor: 0,
      turn: 0,
      maxTurns: 10,
      resources: {
        paper: 50,
        ink: 40,
        light: 30
      }
    },
    map: {
      name: '静港夜渡',
      nodes: [
        { id: 'start', name: '起锚港', x: 10, y: 50 },
        { id: 'n1', name: '芦苇荡', x: 30, y: 30 },
        { id: 'n2', name: '石桥下', x: 30, y: 70 },
        { id: 'n3', name: '湖心亭', x: 50, y: 50 },
        { id: 'n4', name: '古渡口', x: 70, y: 30 },
        { id: 'n5', name: '渔火湾', x: 70, y: 70 },
        { id: 'end', name: '彼岸坞', x: 90, y: 50 }
      ],
      routes: [
        ['start', 'n1'], ['start', 'n2'],
        ['n1', 'n3'], ['n2', 'n3'],
        ['n3', 'n4'], ['n3', 'n5'],
        ['n4', 'end'], ['n5', 'end']
      ]
    },
    events: [
      { id: 'e1', name: '晨露浸润', type: 'positive', effect: { paper: 5 }, turn: 1, description: '晨间露水打湿纸料，纸张韧性增加。' },
      { id: 'e2', name: '丑时微风', type: 'risk', effect: { chouRisk: 0.05 }, turn: 2, description: '丑时风起，船身微晃。注意剥离值损耗。' },
      { id: 'e3', name: '萤火引路', type: 'positive', effect: { light: 10 }, turn: 4, description: '一群萤火虫聚来，照亮航路。' },
      { id: 'e4', name: '暗流涌动', type: 'risk', effect: { strippingValue: -8 }, turn: 6, description: '水下暗流突袭，剥离值受损。' },
      { id: 'e5', name: '岸上人烟', type: 'positive', effect: { calibrationMarks: 1 }, turn: 8, description: '望见岸边灯火，定标痕+1。' }
    ],
    winCondition: {
      type: 'calibration',
      target: 5,
      description: '累计获得5个定标痕即可通关'
    },
    loseCondition: {
      type: 'stripping',
      threshold: 0,
      description: '剥离值归零则纸船沉没'
    }
  },

  shen: {
    id: 'shen',
    name: '夜航纸船资源配给盘·申局',
    subtitle: '短缺局·精打细算',
    description: '申局资源短缺，每一步都需精打细算。善用申号奖励方能突围。',
    theme: 'shortage',
    initialState: {
      strippingValue: 80,
      maxStrippingValue: 100,
      rehearsalSlots: 2,
      usedSlots: 0,
      calibrationMarks: 0,
      targetCalibration: 7,
      chouRisk: 0.2,
      shenReward: 0.25,
      jiaFailureFactor: 0,
      turn: 0,
      maxTurns: 12,
      resources: {
        paper: 25,
        ink: 20,
        light: 15
      }
    },
    map: {
      name: '九曲回肠',
      nodes: [
        { id: 'start', name: '窄口滩', x: 10, y: 50 },
        { id: 'n1', name: '盘龙湾', x: 25, y: 25 },
        { id: 'n2', name: '虎跳峡', x: 25, y: 75 },
        { id: 'n3', name: '螺旋道', x: 45, y: 50 },
        { id: 'n4', name: '申字洲', x: 60, y: 25 },
        { id: 'n5', name: '猴形石', x: 60, y: 75 },
        { id: 'n6', name: '一线天', x: 80, y: 50 },
        { id: 'end', name: '豁然台', x: 92, y: 50 }
      ],
      routes: [
        ['start', 'n1'], ['start', 'n2'],
        ['n1', 'n3'], ['n2', 'n3'],
        ['n3', 'n4'], ['n3', 'n5'],
        ['n4', 'n6'], ['n5', 'n6'],
        ['n6', 'end']
      ]
    },
    events: [
      { id: 'e1', name: '补给告罄', type: 'risk', effect: { paper: -5, ink: -5 }, turn: 1, description: '开局即遇补给短缺，资源收紧。' },
      { id: 'e2', name: '申猴献瑞', type: 'reward', effect: { shenReward: 0.1, calibrationMarks: 1 }, turn: 3, description: '途经申字洲，申号奖励激活。' },
      { id: 'e3', name: '粮水不济', type: 'risk', effect: { strippingValue: -12 }, turn: 5, description: '资源短缺加剧，剥离值下降。' },
      { id: 'e4', name: '意外馈赠', type: 'reward', effect: { resources: { paper: 8, ink: 6, light: 4 } }, turn: 7, description: '偶遇商船接济，获得少量补给。' },
      { id: 'e5', name: '猿啼三声', type: 'reward', effect: { calibrationMarks: 2 }, turn: 9, description: '两岸猿声，定标痕+2。' },
      { id: 'e6', name: '最后冲刺', type: 'risk', effect: { chouRisk: 0.1, strippingValue: -5 }, turn: 11, description: '临近终点风险加剧。' }
    ],
    winCondition: {
      type: 'calibration_and_end',
      target: 7,
      endNode: 'end',
      description: '累计7个定标痕且到达终点'
    },
    loseCondition: {
      type: 'resource_or_stripping',
      description: '任一资源归零或剥离值归零则失败'
    }
  },

  jia: {
    id: 'jia',
    name: '夜航纸船资源配给盘·甲局',
    subtitle: '隐藏局·真假难辨',
    description: '甲局暗藏隐藏条件，甲号失败因子随时可能触发。小心每一个选择。',
    theme: 'hidden',
    initialState: {
      strippingValue: 90,
      maxStrippingValue: 110,
      rehearsalSlots: 4,
      usedSlots: 0,
      calibrationMarks: 0,
      targetCalibration: 8,
      chouRisk: 0.25,
      shenReward: 0.1,
      jiaFailureFactor: 0,
      jiaHiddenTriggered: false,
      turn: 0,
      maxTurns: 15,
      resources: {
        paper: 35,
        ink: 30,
        light: 25
      }
    },
    map: {
      name: '幻海迷航',
      nodes: [
        { id: 'start', name: '迷雾港', x: 8, y: 50 },
        { id: 'n1', name: '甲字礁', x: 25, y: 20 },
        { id: 'n2', name: '幻影岛', x: 25, y: 80 },
        { id: 'n3', name: '真假滩', x: 45, y: 35 },
        { id: 'n4', name: '镜像湾', x: 45, y: 65 },
        { id: 'n5', name: '藏龙穴', x: 65, y: 25 },
        { id: 'n6', name: '卧虎渊', x: 65, y: 75 },
        { id: 'n7', name: '一线光', x: 82, y: 50 },
        { id: 'end', name: '逍遥岸', x: 95, y: 50 }
      ],
      routes: [
        ['start', 'n1'], ['start', 'n2'],
        ['n1', 'n3'], ['n2', 'n4'],
        ['n3', 'n4'], ['n3', 'n5'], ['n4', 'n6'],
        ['n5', 'n7'], ['n6', 'n7'],
        ['n7', 'end']
      ]
    },
    events: [
      { id: 'e1', name: '迷雾重重', type: 'risk', effect: { light: -8 }, turn: 1, description: '开局迷雾笼罩，光源消耗加剧。' },
      { id: 'e2', name: '甲影乍现', type: 'hidden', effect: { jiaFailureFactor: 0.15 }, turn: 3, description: '甲号失败因子悄然增长...', hidden: true },
      { id: 'e3', name: '海市蜃楼', type: 'risk', effect: { calibrationMarks: -1 }, turn: 5, description: '幻影迷惑，丢失一个定标痕。' },
      { id: 'e4', name: '破雾之光', type: 'positive', effect: { light: 15, calibrationMarks: 1 }, turn: 7, description: '一束奇光穿透迷雾。' },
      { id: 'e5', name: '甲号觉醒', type: 'hidden', effect: { jiaFailureFactor: 0.25, jiaHiddenTrigger: true }, turn: 9, description: '隐藏条件触发！甲号失败因子大幅增长。', hidden: true },
      { id: 'e6', name: '真假难辨', type: 'choice', effect: { choice: 'jia_twins' }, turn: 11, description: '出现两条航路，一真一假。' },
      { id: 'e7', name: '最后试炼', type: 'risk', effect: { strippingValue: -15, chouRisk: 0.15 }, turn: 13, description: '终点前的终极考验。' }
    ],
    hiddenConditions: [
      {
        id: 'jia_truth',
        name: '真相大白',
        trigger: { calibrationMarks: 6, turn: 10 },
        effect: { jiaFailureFactor: -0.2, calibrationMarks: 2 },
        description: '若第10回合前积累6个定标痕，可识破假象，降低失败因子并获得奖励。'
      }
    ],
    winCondition: {
      type: 'calibration_and_hidden',
      target: 8,
      description: '累计8个定标痕且成功抑制甲号失败因子'
    },
    loseCondition: {
      type: 'jia_failure',
      threshold: 0.6,
      description: '甲号失败因子超过60%则判定失败'
    }
  }
};

module.exports = games;
