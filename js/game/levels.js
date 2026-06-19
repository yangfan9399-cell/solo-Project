const Levels = {
    zi: {
        id: 'zi',
        name: '子局 · 银盐启蒙',
        description: '初学者之局，熟悉银盐暗房的基本操作',
        difficulty: '简单',
        initialState: {
            balanceValue: 100,
            infectionTank: 0,
            mergeMark: 0,
            ziRisk: 0,
            maoReward: 0,
            chouFailFactor: 0
        },
        winCondition: {
            type: 'reach_end_and_balance',
            minBalance: 50
        },
        loseCondition: {
            type: 'balance_zero',
            minBalance: 0
        },
        nodes: [
            { id: 'start', x: 80, y: 250, type: 'start', name: '起点', event: null },
            { id: 'n1', x: 200, y: 150, type: 'normal', name: '显影池', event: 'develop_1' },
            { id: 'n2', x: 200, y: 350, type: 'normal', name: '定影池', event: 'fix_1' },
            { id: 'n3', x: 350, y: 100, type: 'normal', name: '水洗槽', event: 'wash_1' },
            { id: 'n4', x: 350, y: 250, type: 'normal', name: '干燥架', event: 'dry_1' },
            { id: 'n5', x: 350, y: 400, type: 'normal', name: '放大机', event: 'enlarge_1' },
            { id: 'n6', x: 500, y: 150, type: 'normal', name: '相纸盒', event: 'paper_1' },
            { id: 'n7', x: 500, y: 350, type: 'event', name: '暗房灯', event: 'light_switch' },
            { id: 'n8', x: 620, y: 250, type: 'normal', name: '裁片台', event: 'cut_1' },
            { id: 'end', x: 720, y: 250, type: 'end', name: '终点', event: null }
        ],
        edges: [
            { from: 'start', to: 'n1', cost: 5 },
            { from: 'start', to: 'n2', cost: 5 },
            { from: 'n1', to: 'n3', cost: 3 },
            { from: 'n1', to: 'n4', cost: 4 },
            { from: 'n2', to: 'n4', cost: 3 },
            { from: 'n2', to: 'n5', cost: 4 },
            { from: 'n3', to: 'n6', cost: 5 },
            { from: 'n4', to: 'n6', cost: 3 },
            { from: 'n4', to: 'n7', cost: 3 },
            { from: 'n5', to: 'n7', cost: 4 },
            { from: 'n6', to: 'n8', cost: 4 },
            { from: 'n7', to: 'n8', cost: 3 },
            { from: 'n8', to: 'end', cost: 2 }
        ],
        hints: [
            '试着从起点出发，选择不同的路径探索',
            '注意收集卯号奖励，它会提高最终评分',
            '避开高风险的节点，保持配平值健康'
        ]
    },

    mao: {
        id: 'mao',
        name: '卯局 · 资源匮乏',
        description: '配平值稀缺，每一步都需精打细算',
        difficulty: '中等',
        initialState: {
            balanceValue: 60,
            infectionTank: 0,
            mergeMark: 0,
            ziRisk: 0,
            maoReward: 0,
            chouFailFactor: 0
        },
        winCondition: {
            type: 'reach_end_and_balance',
            minBalance: 20
        },
        loseCondition: {
            type: 'balance_zero',
            minBalance: 0
        },
        nodes: [
            { id: 'start', x: 80, y: 250, type: 'start', name: '起点', event: null },
            { id: 'n1', x: 180, y: 120, type: 'normal', name: '浅盘', event: 'mao_lowcost_1' },
            { id: 'n2', x: 180, y: 380, type: 'event', name: '深槽', event: 'mao_highrisk_1' },
            { id: 'n3', x: 300, y: 200, type: 'normal', name: '中转台', event: 'mao_balance_1' },
            { id: 'n4', x: 300, y: 320, type: 'normal', name: '旧相纸', event: 'mao_reward_1' },
            { id: 'n5', x: 420, y: 100, type: 'event', name: '红灯区', event: 'mao_danger_1' },
            { id: 'n6', x: 420, y: 250, type: 'normal', name: '安全灯', event: 'mao_safe_1' },
            { id: 'n7', x: 420, y: 400, type: 'normal', name: '废液桶', event: 'mao_cost_1' },
            { id: 'n8', x: 540, y: 180, type: 'event', name: '补给点', event: 'mao_bonus_1' },
            { id: 'n9', x: 540, y: 320, type: 'normal', name: '显影夹', event: 'mao_normal_1' },
            { id: 'n10', x: 640, y: 250, type: 'normal', name: '定影液', event: 'mao_final_1' },
            { id: 'end', x: 720, y: 250, type: 'end', name: '终点', event: null }
        ],
        edges: [
            { from: 'start', to: 'n1', cost: 8 },
            { from: 'start', to: 'n2', cost: 4 },
            { from: 'n1', to: 'n3', cost: 6 },
            { from: 'n1', to: 'n5', cost: 5 },
            { from: 'n2', to: 'n4', cost: 3 },
            { from: 'n2', to: 'n7', cost: 5 },
            { from: 'n3', to: 'n5', cost: 7 },
            { from: 'n3', to: 'n6', cost: 4 },
            { from: 'n4', to: 'n6', cost: 3 },
            { from: 'n4', to: 'n7', cost: 6 },
            { from: 'n5', to: 'n8', cost: 4 },
            { from: 'n6', to: 'n8', cost: 5 },
            { from: 'n6', to: 'n9', cost: 3 },
            { from: 'n7', to: 'n9', cost: 4 },
            { from: 'n8', to: 'n10', cost: 6 },
            { from: 'n9', to: 'n10', cost: 4 },
            { from: 'n10', to: 'end', cost: 3 }
        ],
        hints: [
            '资源紧张，选择低成本路径',
            '有些事件虽然有风险，但收益很高',
            '合理利用卯号奖励可以渡过难关'
        ]
    },

    chou: {
        id: 'chou',
        name: '丑局 · 隐秘航线',
        description: '隐藏条件等待发现，真相藏在暗影之中',
        difficulty: '困难',
        initialState: {
            balanceValue: 80,
            infectionTank: 0,
            mergeMark: 0,
            ziRisk: 0,
            maoReward: 0,
            chouFailFactor: 0
        },
        winCondition: {
            type: 'reach_end_and_secret',
            minBalance: 30,
            secretCondition: 'mergeMark >= 3'
        },
        loseCondition: {
            type: 'balance_or_fail',
            minBalance: 0,
            maxFailFactor: 10
        },
        hidden: {
            secretPath: ['n2', 'n5', 'n8'],
            secretReward: '古老配方'
        },
        nodes: [
            { id: 'start', x: 80, y: 250, type: 'start', name: '迷雾入口', event: null },
            { id: 'n1', x: 180, y: 100, type: 'normal', name: '破碎镜片', event: 'chou_broken_1' },
            { id: 'n2', x: 180, y: 250, type: 'event', name: '旧相册', event: 'chou_album_1' },
            { id: 'n3', x: 180, y: 400, type: 'normal', name: '生锈挂钩', event: 'chou_rust_1' },
            { id: 'n4', x: 300, y: 150, type: 'normal', name: '遗忘药水', event: 'chou_potion_1' },
            { id: 'n5', x: 300, y: 300, type: 'event', name: '暗格', event: 'chou_secret_1' },
            { id: 'n6', x: 300, y: 420, type: 'normal', name: '蜘蛛网', event: 'chou_web_1' },
            { id: 'n7', x: 440, y: 80, type: 'event', name: '红光闪烁', event: 'chou_flash_1' },
            { id: 'n8', x: 440, y: 220, type: 'normal', name: '封印之门', event: 'chou_gate_1' },
            { id: 'n9', x: 440, y: 360, type: 'normal', name: '回声走廊', event: 'chou_echo_1' },
            { id: 'n10', x: 440, y: 450, type: 'event', name: '无底暗洞', event: 'chou_abyss_1' },
            { id: 'n11', x: 580, y: 150, type: 'normal', name: '银盐结晶', event: 'chou_crystal_1' },
            { id: 'n12', x: 580, y: 320, type: 'event', name: '时间裂隙', event: 'chou_time_1' },
            { id: 'n13', x: 680, y: 250, type: 'normal', name: '真相出口', event: 'chou_truth_1' },
            { id: 'end', x: 740, y: 250, type: 'end', name: '终点', event: null }
        ],
        edges: [
            { from: 'start', to: 'n1', cost: 5 },
            { from: 'start', to: 'n2', cost: 4 },
            { from: 'start', to: 'n3', cost: 5 },
            { from: 'n1', to: 'n4', cost: 4 },
            { from: 'n2', to: 'n4', cost: 3 },
            { from: 'n2', to: 'n5', cost: 3 },
            { from: 'n3', to: 'n5', cost: 4 },
            { from: 'n3', to: 'n6', cost: 3 },
            { from: 'n4', to: 'n7', cost: 5 },
            { from: 'n4', to: 'n8', cost: 6 },
            { from: 'n5', to: 'n8', cost: 4 },
            { from: 'n5', to: 'n9', cost: 5 },
            { from: 'n6', to: 'n9', cost: 4 },
            { from: 'n6', to: 'n10', cost: 6 },
            { from: 'n7', to: 'n11', cost: 6 },
            { from: 'n8', to: 'n11', cost: 5 },
            { from: 'n8', to: 'n12', cost: 4 },
            { from: 'n9', to: 'n12', cost: 5 },
            { from: 'n10', to: 'n12', cost: 7 },
            { from: 'n11', to: 'n13', cost: 4 },
            { from: 'n12', to: 'n13', cost: 5 },
            { from: 'n13', to: 'end', cost: 3 }
        ],
        hints: [
            '注意那些看起来普通的节点，也许藏着秘密',
            '收集足够的归并痕会触发隐藏条件',
            '丑号失败因子过高会导致直接失败'
        ]
    },

    getLevel(id) {
        return this[id] || null;
    },

    getAllLevels() {
        return ['zi', 'mao', 'chou'].map(id => this[id]);
    }
};
