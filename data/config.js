var MeteorWorkshop = MeteorWorkshop || {};

MeteorWorkshop.Fields = {
    UNLOCK_VALUE: 'unlockValue',
    UNLOCK_SLOT: 'unlockSlot',
    TRACE_MARK: 'traceMark',
    REN_RISK: 'renRisk',
    DING_REWARD: 'dingReward',
    MAO_FAILURE: 'maoFailure'
};

MeteorWorkshop.FieldLabels = {
    unlockValue: '陨铁工坊解锁值',
    unlockSlot: '陨铁工坊解锁槽',
    traceMark: '陨铁工坊溯源痕',
    renRisk: '壬号风险',
    dingReward: '丁号奖励',
    maoFailure: '卯号失败因子'
};

MeteorWorkshop.FieldColors = {
    unlockValue: '#c9a84a',
    unlockSlot: '#6fb3d2',
    traceMark: '#a87dc2',
    renRisk: '#e06c6c',
    dingReward: '#7cc57c',
    maoFailure: '#d98c5c'
};

MeteorWorkshop.Sessions = {
    ren: {
        id: 'ren',
        name: '壬局 · 教学演示',
        description: '熟悉陨铁工坊基础操作，资源充足，风险可控。',
        initialState: {
            unlockValue: 10,
            unlockSlot: 3,
            traceMark: 0,
            renRisk: 5,
            dingReward: 3,
            maoFailure: 0
        },
        winCondition: function(state, steps) {
            return state.unlockValue >= 60 && state.maoFailure < 10;
        },
        loseCondition: function(state, steps) {
            return state.renRisk >= 30 || steps > 20;
        },
        winFormula: '解锁值≥60 且 失败因子<10',
        loseFormula: '壬号风险≥30 或 步数>20',
        mapName: '陨铁熔炉·外环',
        mapNodes: [
            { id: 'n1', name: '进料槽', pos: { x: 10, y: 50 } },
            { id: 'n2', name: '预热炉', pos: { x: 30, y: 30 } },
            { id: 'n3', name: '熔铸台', pos: { x: 50, y: 50 } },
            { id: 'n4', name: '淬冷池', pos: { x: 70, y: 30 } },
            { id: 'n5', name: '出件口', pos: { x: 90, y: 50 } }
        ],
        hint: '【教学提示】优先提升解锁值，注意控制壬号风险不要过高。'
    },
    ding: {
        id: 'ding',
        name: '丁局 · 资源短缺',
        description: '解锁槽与溯源痕极度稀缺，需精细分配每一份资源。',
        initialState: {
            unlockValue: 5,
            unlockSlot: 1,
            traceMark: 0,
            renRisk: 8,
            dingReward: 1,
            maoFailure: 2
        },
        winCondition: function(state, steps) {
            return state.unlockValue >= 45 && state.traceMark >= 5;
        },
        loseCondition: function(state, steps) {
            return state.unlockSlot <= 0 || state.dingReward <= 0 || steps > 25;
        },
        winFormula: '解锁值≥45 且 溯源痕≥5',
        loseFormula: '解锁槽≤0 或 丁号奖励≤0 或 步数>25',
        mapName: '陨铁熔炉·核心区',
        mapNodes: [
            { id: 'n1', name: '残料仓', pos: { x: 15, y: 60 } },
            { id: 'n2', name: '节能炉', pos: { x: 40, y: 25 } },
            { id: 'n3', name: '匠师台', pos: { x: 60, y: 60 } },
            { id: 'n4', name: '精炼室', pos: { x: 85, y: 35 } }
        ],
        hint: '【资源警告】每一次消耗都要计算收益，优先触发溯源痕事件。'
    },
    mao: {
        id: 'mao',
        name: '卯局 · 隐匿条件',
        description: '胜负公式含隐藏条件，需在经营中探索触发真正的胜利路径。',
        initialState: {
            unlockValue: 15,
            unlockSlot: 2,
            traceMark: 0,
            renRisk: 10,
            dingReward: 2,
            maoFailure: 5
        },
        winCondition: function(state, steps) {
            return state.unlockValue >= 50 && state.traceMark >= 8 && state.maoFailure >= 15 && state.maoFailure <= 20;
        },
        loseCondition: function(state, steps) {
            return state.maoFailure > 25 || state.renRisk >= 40 || steps > 30;
        },
        winFormula: '（表面）解锁值≥50',
        loseFormula: '（表面）壬号风险≥40',
        hiddenHint: '【隐藏提示】卯号失败因子需落在特定区间内，溯源痕是关键。',
        mapName: '陨铁熔炉·秘境',
        mapNodes: [
            { id: 'n1', name: '幽邃入口', pos: { x: 10, y: 30 } },
            { id: 'n2', name: '迷雾回廊', pos: { x: 30, y: 65 } },
            { id: 'n3', name: '星纹祭坛', pos: { x: 55, y: 25 } },
            { id: 'n4', name: '陨核深处', pos: { x: 75, y: 70 } },
            { id: 'n5', name: '未知出口', pos: { x: 92, y: 40 } }
        ],
        hint: '【局主低语】胜败并非所见，失败之中藏着通路。'
    }
};
