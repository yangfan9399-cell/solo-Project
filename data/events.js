var MeteorWorkshop = MeteorWorkshop || {};

MeteorWorkshop.Events = {
    ren: [
        {
            id: 'ren_e1',
            name: '采掘陨铁原矿',
            description: '从矿区送入新鲜陨铁矿石，基础产出。',
            cost: { unlockSlot: 0 },
            effect: { unlockValue: 5, renRisk: 1 },
            category: 'produce'
        },
        {
            id: 'ren_e2',
            name: '溯源刻纹',
            description: '在铁坯上刻下溯源标记，用于质量追踪。',
            cost: { unlockSlot: 1 },
            effect: { traceMark: 2, unlockValue: 2 },
            category: 'trace'
        },
        {
            id: 'ren_e3',
            name: '壬号质检',
            description: '对熔炉进行安全检查，降低事故风险。',
            cost: { dingReward: 1 },
            effect: { renRisk: -3 },
            category: 'safety'
        },
        {
            id: 'ren_e4',
            name: '丁号激励',
            description: '发放匠师奖励，提高整体士气。',
            cost: { unlockValue: 3 },
            effect: { dingReward: 2, unlockSlot: 1 },
            category: 'reward'
        },
        {
            id: 'ren_e5',
            name: '卯号压制',
            description: '通过额外工序压制失败因子。',
            cost: { traceMark: 1, unlockSlot: 1 },
            effect: { maoFailure: -2, unlockValue: 1 },
            category: 'suppress'
        },
        {
            id: 'ren_e6',
            name: '熔铸精品',
            description: '消耗溯源痕换取高价值成品。',
            cost: { traceMark: 2, renRisk: 2 },
            effect: { unlockValue: 10, dingReward: 1 },
            category: 'premium'
        }
    ],
    ding: [
        {
            id: 'ding_e1',
            name: '残料回炉',
            description: '将废弃边角料重新入炉，艰难求生。',
            cost: {},
            effect: { unlockValue: 2, maoFailure: 1 },
            category: 'produce'
        },
        {
            id: 'ding_e2',
            name: '匠师手刻',
            description: '珍贵的手工溯源，一次一记。',
            cost: { dingReward: 1, unlockSlot: 1 },
            effect: { traceMark: 2 },
            category: 'trace'
        },
        {
            id: 'ding_e3',
            name: '节流降耗',
            description: '临时关闭部分炉区以节约资源。',
            cost: { unlockValue: 1 },
            effect: { unlockSlot: 1, renRisk: 1 },
            category: 'save'
        },
        {
            id: 'ding_e4',
            name: '丁号补给',
            description: '申请紧急奖励额度。',
            cost: { unlockValue: 5, renRisk: 2 },
            effect: { dingReward: 2 },
            category: 'reward'
        },
        {
            id: 'ding_e5',
            name: '卯号冒险',
            description: '减少质检换取产出，风险自担。',
            cost: { maoFailure: 2 },
            effect: { unlockValue: 6, traceMark: 1 },
            category: 'risk'
        },
        {
            id: 'ding_e6',
            name: '孤注一掷',
            description: '动用全部储备冲击目标。',
            cost: { unlockSlot: 1, dingReward: 1, renRisk: 3 },
            effect: { unlockValue: 8, traceMark: 2 },
            category: 'allin'
        }
    ],
    mao: [
        {
            id: 'mao_e1',
            name: '幽邃采掘',
            description: '从秘境矿脉取材，品质不明。',
            cost: { unlockSlot: 1 },
            effect: { unlockValue: 4, maoFailure: 2 },
            category: 'produce'
        },
        {
            id: 'mao_e2',
            name: '星纹溯源',
            description: '以古老星纹刻印溯源痕，代价高昂。',
            cost: { unlockSlot: 1, maoFailure: 1 },
            effect: { traceMark: 3 },
            category: 'trace'
        },
        {
            id: 'mao_e3',
            name: '壬号献祭',
            description: '主动提升风险以换取秘境之力。',
            cost: { renRisk: 3 },
            effect: { maoFailure: 3, unlockValue: 3 },
            category: 'ritual'
        },
        {
            id: 'mao_e4',
            name: '丁号秘赏',
            description: '秘境深处的珍稀奖励。',
            cost: { traceMark: 2 },
            effect: { dingReward: 3, maoFailure: 1 },
            category: 'reward'
        },
        {
            id: 'mao_e5',
            name: '卯号共鸣',
            description: '主动引导失败因子，寻找其中规律。',
            cost: { unlockValue: 2, renRisk: 1 },
            effect: { maoFailure: 3, traceMark: 2 },
            category: 'resonance'
        },
        {
            id: 'mao_e6',
            name: '陨核萃炼',
            description: '从陨核深处提取终极力量。',
            cost: { traceMark: 3, maoFailure: 2, unlockSlot: 1 },
            effect: { unlockValue: 12, dingReward: 2 },
            category: 'ultimate'
        },
        {
            id: 'mao_e7',
            name: '隐匿之触',
            description: '触发隐藏条件的关键一步。',
            cost: { maoFailure: 1, renRisk: 2, dingReward: 1 },
            effect: { traceMark: 4, unlockValue: 5 },
            category: 'hidden'
        }
    ]
};

MeteorWorkshop.EventCategoryLabels = {
    produce: '生产',
    trace: '溯源',
    safety: '安全',
    reward: '奖励',
    suppress: '压制',
    premium: '精品',
    save: '节流',
    risk: '冒险',
    allin: '孤注',
    ritual: '祭仪',
    resonance: '共鸣',
    ultimate: '萃炼',
    hidden: '隐匿'
};
