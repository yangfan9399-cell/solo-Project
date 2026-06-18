const GameConfig = {
    STORAGE_KEY: 'frostflower_tower_save',
    
    BASE_STATS: {
        shimingValue: 0,
        calibrationSlots: 5,
        shimingMark: 0,
        maoRisk: 0,
        renReward: 0,
        shenFailure: 0,
        energy: 10,
        crystal: 5,
        parts: 3
    },
    
    MAX_STATS: {
        shimingValue: 100,
        maoRisk: 100,
        renReward: 100,
        shenFailure: 100
    },

    GAMES: {
        mao: {
            id: 'mao',
            name: '卯局 - 教学入门',
            description: '适合新手的教学局，资源充足，引导清晰',
            turns: 7,
            startStats: {
                shimingValue: 10,
                calibrationSlots: 6,
                shimingMark: 0,
                maoRisk: 5,
                renReward: 0,
                shenFailure: 0,
                energy: 15,
                crystal: 8,
                parts: 5
            },
            mapType: 'tower',
            mapNodes: [
                { turn: 1, label: '初绽层', icon: '🌸' },
                { turn: 2, label: '能源层', icon: '⚡' },
                { turn: 3, label: '晶核层', icon: '💎' },
                { turn: 4, label: '校准层', icon: '🎯' },
                { turn: 5, label: '霜风层', icon: '🌬️' },
                { turn: 6, label: '嘉奖层', icon: '🏆' },
                { turn: 7, label: '冲刺层', icon: '🚀' }
            ],
            winCondition: (stats) => stats.shimingValue >= 60 && stats.maoRisk < 40,
            failCondition: (stats) => stats.maoRisk >= 80 || stats.energy <= 0,
            victoryFormula: (stats, steps) => {
                const baseScore = stats.shimingValue * 10;
                const penalty = stats.maoRisk * 3;
                const stepBonus = Math.max(0, (20 - steps) * 5);
                const crystalBonus = stats.crystal * 8;
                return Math.max(0, baseScore - penalty + stepBonus + crystalBonus);
            },
            hiddenCondition: null,
            events: [
                {
                    id: 'mao_intro',
                    turn: 1,
                    title: '霜花初绽',
                    description: '欢迎来到霜花塔楼！作为新任经营官，你的任务是提升试鸣值，同时控制风险。点击选项继续。',
                    type: 'info',
                    choices: [
                        { text: '了解试鸣值', effect: { shimingValue: 5 }, teaching: '试鸣值是塔楼的核心指标，越高越好' },
                        { text: '了解风险', effect: { maoRisk: -3 }, teaching: '卯号风险越低越安全，超过80会失败' }
                    ]
                },
                {
                    id: 'mao_choice1',
                    turn: 2,
                    title: '能源抉择',
                    description: '塔楼需要能量维持运转。你可以选择稳定供能或者冒险超频。',
                    type: 'normal',
                    choices: [
                        { text: '稳定供能 (-2能量, +5试鸣值)', effect: { energy: -2, shimingValue: 5 }, cost: { energy: 2 } },
                        { text: '冒险超频 (-1能量, +10试鸣值, +8风险)', effect: { energy: -1, shimingValue: 10, maoRisk: 8 }, cost: { energy: 1 } },
                        { text: '节能模式 (+3能量, -3试鸣值)', effect: { energy: 3, shimingValue: -3 } }
                    ]
                },
                {
                    id: 'mao_choice2',
                    turn: 3,
                    title: '晶核投入',
                    description: '使用晶核可以大幅提升试鸣值，但会消耗宝贵资源。',
                    type: 'normal',
                    choices: [
                        { text: '投入晶核 (-3晶核, +15试鸣值)', effect: { crystal: -3, shimingValue: 15 }, cost: { crystal: 3 } },
                        { text: '谨慎使用 (-1晶核, +5试鸣值, +1校准槽)', effect: { crystal: -1, shimingValue: 5, calibrationSlots: 1 }, cost: { crystal: 1 } },
                        { text: '保存晶核', effect: {} }
                    ]
                },
                {
                    id: 'mao_calibrate',
                    turn: 4,
                    title: '校准机会',
                    description: '发现一个校准点！使用校准槽可以降低风险并获得试鸣痕。',
                    type: 'success',
                    choices: [
                        { text: '进行校准 (-1校准槽, -10风险, +1试鸣痕)', effect: { calibrationSlots: -1, maoRisk: -10, shimingMark: 1 }, cost: { calibrationSlots: 1 } },
                        { text: '深度校准 (-2校准槽, -20风险, +3试鸣痕, +5试鸣值)', effect: { calibrationSlots: -2, maoRisk: -20, shimingMark: 3, shimingValue: 5 }, cost: { calibrationSlots: 2 } },
                        { text: '跳过', effect: {} }
                    ]
                },
                {
                    id: 'mao_risk_event',
                    turn: 5,
                    title: '霜风预警',
                    description: '外部霜风增强，风险正在累积！你需要采取措施。',
                    type: 'warning',
                    choices: [
                        { text: '加固防护 (-2零件, -15风险)', effect: { parts: -2, maoRisk: -15 }, cost: { parts: 2 } },
                        { text: '能量护盾 (-4能量, -20风险, +5奖励)', effect: { energy: -4, maoRisk: -20, renReward: 5 }, cost: { energy: 4 } },
                        { text: '硬抗 (+15风险, +3能量)', effect: { maoRisk: 15, energy: 3 } }
                    ]
                },
                {
                    id: 'mao_reward',
                    turn: 6,
                    title: '壬号嘉奖',
                    description: '塔楼运营良好，获得壬号奖励机会！',
                    type: 'success',
                    choices: [
                        { text: '领取资源 (+5能量, +3晶核, +2零件)', effect: { energy: 5, crystal: 3, parts: 2, renReward: 10 } },
                        { text: '提升试鸣 (+20试鸣值, +10奖励)', effect: { shimingValue: 20, renReward: 10 } },
                        { text: '增加校准 (+2校准槽, +10奖励)', effect: { calibrationSlots: 2, renReward: 10 } }
                    ]
                },
                {
                    id: 'mao_final_choice',
                    turn: 7,
                    title: '最终冲刺',
                    description: '最后的机会！做出你的最终选择。',
                    type: 'normal',
                    choices: [
                        { text: '全力冲刺 (-5能量, -2晶核, +25试鸣值, +10风险)', effect: { energy: -5, crystal: -2, shimingValue: 25, maoRisk: 10 }, cost: { energy: 5, crystal: 2 } },
                        { text: '稳健经营 (-10风险, +10试鸣值)', effect: { maoRisk: -10, shimingValue: 10 } },
                        { text: '收集奖励 (+15壬号奖励)', effect: { renReward: 15 } }
                    ]
                }
            ]
        },
        
        ren: {
            id: 'ren',
            name: '壬局 - 资源短缺',
            description: '资源极度匮乏，每一个选择都关乎生死',
            turns: 9,
            startStats: {
                shimingValue: 5,
                calibrationSlots: 3,
                shimingMark: 0,
                maoRisk: 15,
                renReward: 0,
                shenFailure: 0,
                energy: 5,
                crystal: 2,
                parts: 1
            },
            mapType: 'wasteland',
            mapNodes: [
                { turn: 1, label: '枯竭站', icon: '🏜️' },
                { turn: 2, label: '物资点', icon: '📦' },
                { turn: 3, label: '黑市', icon: '🤝' },
                { turn: 4, label: '维护站', icon: '⚙️' },
                { turn: 5, label: '险地', icon: '⚠️' },
                { turn: 6, label: '校准台', icon: '🔧' },
                { turn: 7, label: '补给舰', icon: '🚢' },
                { turn: 8, label: '断粮点', icon: '🪫' },
                { turn: 9, label: '终末站', icon: '🏁' }
            ],
            winCondition: (stats) => stats.shimingValue >= 50 && stats.energy > 0 && stats.maoRisk < 50,
            failCondition: (stats) => stats.maoRisk >= 70 || stats.energy <= 0 || (stats.crystal <= 0 && stats.parts <= 0 && stats.energy <= 0),
            victoryFormula: (stats, steps) => {
                const baseScore = stats.shimingValue * 12;
                const penalty = stats.maoRisk * 4;
                const resourceBonus = (stats.energy + stats.crystal * 2 + stats.parts * 3) * 10;
                const stepBonus = Math.max(0, (25 - steps) * 4);
                return Math.max(0, baseScore - penalty + resourceBonus + stepBonus);
            },
            hiddenCondition: null,
            events: [
                {
                    id: 'ren_intro',
                    turn: 1,
                    title: '资源枯竭',
                    description: '塔楼储备告急！能量、晶核、零件都所剩无几。你必须在资源耗尽前达成目标。',
                    type: 'danger',
                    choices: [
                        { text: '优先保障能量 (+2能量, -3试鸣值)', effect: { energy: 2, shimingValue: -3 } },
                        { text: '冒险提升试鸣 (+8试鸣值, +5风险)', effect: { shimingValue: 8, maoRisk: 5 } }
                    ]
                },
                {
                    id: 'ren_scarcity1',
                    turn: 2,
                    title: '两难抉择',
                    description: '一份紧急物资到货，但只能选择一种。',
                    type: 'warning',
                    choices: [
                        { text: '获取能量 (+3能量)', effect: { energy: 3 } },
                        { text: '获取晶核 (+1晶核)', effect: { crystal: 1 } },
                        { text: '获取零件 (+1零件)', effect: { parts: 1 } }
                    ]
                },
                {
                    id: 'ren_trade',
                    turn: 3,
                    title: '黑市交易',
                    description: '神秘商人出现，愿意用风险换取资源。',
                    type: 'warning',
                    choices: [
                        { text: '用风险换能量 (+10风险, +4能量)', effect: { maoRisk: 10, energy: 4 } },
                        { text: '用风险换晶核 (+8风险, +2晶核)', effect: { maoRisk: 8, crystal: 2 } },
                        { text: '拒绝交易', effect: {} }
                    ]
                },
                {
                    id: 'ren_choice1',
                    turn: 4,
                    title: '强制消耗',
                    description: '塔楼基础运转需要消耗能量，否则风险剧增。',
                    type: 'danger',
                    choices: [
                        { text: '支付维护费 (-2能量)', effect: { energy: -2 }, cost: { energy: 2 } },
                        { text: '跳过维护 (+15风险)', effect: { maoRisk: 15 } }
                    ]
                },
                {
                    id: 'ren_opportunity',
                    turn: 5,
                    title: '冒险机遇',
                    description: '发现一个高风险高回报的机会。',
                    type: 'warning',
                    choices: [
                        { text: '全力一搏 (-2能量, -1零件, +20试鸣值, +12风险)', effect: { energy: -2, parts: -1, shimingValue: 20, maoRisk: 12 }, cost: { energy: 2, parts: 1 } },
                        { text: '谨慎尝试 (-1能量, +8试鸣值, +5风险)', effect: { energy: -1, shimingValue: 8, maoRisk: 5 }, cost: { energy: 1 } },
                        { text: '放弃机会', effect: {} }
                    ]
                },
                {
                    id: 'ren_calibrate',
                    turn: 6,
                    title: '紧急校准',
                    description: '风险过高！必须立即处理。',
                    type: 'danger',
                    choices: [
                        { text: '消耗晶核校准 (-1晶核, -12风险)', effect: { crystal: -1, maoRisk: -12 }, cost: { crystal: 1 } },
                        { text: '消耗零件校准 (-1零件, -10风险, +1试鸣痕)', effect: { parts: -1, maoRisk: -10, shimingMark: 1 }, cost: { parts: 1 } },
                        { text: '消耗能量校准 (-3能量, -8风险)', effect: { energy: -3, maoRisk: -8 }, cost: { energy: 3 } }
                    ]
                },
                {
                    id: 'ren_reward',
                    turn: 7,
                    title: '壬号补给',
                    description: '壬号补给舰抵达，带来了珍贵的物资。',
                    type: 'success',
                    choices: [
                        { text: '领取基础补给 (+2能量, +1晶核, +1零件)', effect: { energy: 2, crystal: 1, parts: 1, renReward: 10 } },
                        { text: '换取试鸣提升 (-1晶核, +15试鸣值, +15奖励)', effect: { crystal: -1, shimingValue: 15, renReward: 15 }, cost: { crystal: 1 } }
                    ]
                },
                {
                    id: 'ren_scarcity2',
                    turn: 8,
                    title: '资源见底',
                    description: '资源即将耗尽，必须做出艰难选择。',
                    type: 'danger',
                    choices: [
                        { text: '拆解零件获取能量 (-1零件, +3能量)', effect: { parts: -1, energy: 3 }, cost: { parts: 1 } },
                        { text: '消耗晶核维持运转 (-1晶核, +2能量, +5试鸣值)', effect: { crystal: -1, energy: 2, shimingValue: 5 }, cost: { crystal: 1 } },
                        { text: '什么都不做 (+8风险)', effect: { maoRisk: 8 } }
                    ]
                },
                {
                    id: 'ren_final',
                    turn: 9,
                    title: '最后一搏',
                    description: '这是最后的机会，成败在此一举！',
                    type: 'warning',
                    choices: [
                        { text: '全资源投入 (-所有能量, -所有晶核, -所有零件, +试鸣值=资源总和×3)', special: 'all_in' },
                        { text: '保守策略 (+5试鸣值, -5风险)', effect: { shimingValue: 5, maoRisk: -5 } },
                        { text: '积累奖励 (+20壬号奖励)', effect: { renReward: 20 } }
                    ]
                }
            ]
        },
        
        shen: {
            id: 'shen',
            name: '申局 - 隐藏挑战',
            description: '传说中的隐藏关卡，触发特定条件可解锁特殊结局',
            turns: 11,
            startStats: {
                shimingValue: 0,
                calibrationSlots: 4,
                shimingMark: 0,
                maoRisk: 10,
                renReward: 0,
                shenFailure: 0,
                energy: 12,
                crystal: 6,
                parts: 4
            },
            mapType: 'spiral',
            mapNodes: [
                { turn: 1, label: '入口', icon: '🌀' },
                { turn: 2, label: '符文', icon: '🔮' },
                { turn: 3, label: '共鸣', icon: '🎵' },
                { turn: 4, label: '矩阵', icon: '🔷' },
                { turn: 5, label: '因子', icon: '⚠️' },
                { turn: 6, label: '商客', icon: '👤' },
                { turn: 7, label: '深处', icon: '🕳️' },
                { turn: 8, label: '终极', icon: '✨' },
                { turn: 9, label: '赏赐', icon: '👑' },
                { turn: 10, label: '命运', icon: '🎲' },
                { turn: 11, label: '终局', icon: '🌟' }
            ],
            winCondition: (stats) => stats.shimingValue >= 70 && stats.shenFailure < 50 && stats.maoRisk < 60,
            failCondition: (stats) => stats.maoRisk >= 75 || stats.shenFailure >= 80 || stats.energy <= 0,
            victoryFormula: (stats, steps, hiddenTriggered) => {
                const baseScore = stats.shimingValue * 15;
                const penalty = stats.maoRisk * 3 + stats.shenFailure * 5;
                const markBonus = stats.shimingMark * 25;
                const stepBonus = Math.max(0, (30 - steps) * 6);
                const hiddenBonus = hiddenTriggered ? 500 : 0;
                return Math.max(0, baseScore - penalty + markBonus + stepBonus + hiddenBonus);
            },
            hiddenCondition: (stats, choices) => {
                return stats.shimingMark >= 5 && stats.calibrationSlots >= 2 && 
                       choices.filter(c => c.includes('隐藏') || c.includes('神秘')).length >= 2;
            },
            events: [
                {
                    id: 'shen_intro',
                    turn: 1,
                    title: '神秘塔楼',
                    description: '这座古老的霜花塔楼隐藏着不为人知的秘密。传说收集足够的试鸣痕可以解锁隐藏力量...',
                    type: 'info',
                    choices: [
                        { text: '探索塔楼 (+2试鸣值, +1试鸣痕)', effect: { shimingValue: 2, shimingMark: 1 } },
                        { text: '感知隐藏 (+1试鸣痕, +5申号失败因子)', effect: { shimingMark: 1, shenFailure: 5 } }
                    ]
                },
                {
                    id: 'shen_mystery1',
                    turn: 2,
                    title: '神秘符文',
                    description: '发现墙上刻着奇怪的符文，似乎是某种校准指南。',
                    type: 'normal',
                    choices: [
                        { text: '研究符文 (-2能量, +2试鸣痕, +1校准槽)', effect: { energy: -2, shimingMark: 2, calibrationSlots: 1 }, cost: { energy: 2 } },
                        { text: '跳过符文 (+8试鸣值)', effect: { shimingValue: 8 } },
                        { text: '隐藏选择：触摸符文 (+3试鸣痕, +10失败因子)', effect: { shimingMark: 3, shenFailure: 10 }, hidden: true }
                    ]
                },
                {
                    id: 'shen_choice1',
                    turn: 3,
                    title: '霜花共鸣',
                    description: '霜花开始产生奇异的共鸣。',
                    type: 'normal',
                    choices: [
                        { text: '引导共鸣 (+10试鸣值, +5风险)', effect: { shimingValue: 10, maoRisk: 5 } },
                        { text: '记录共鸣 (-1能量, +2试鸣痕)', effect: { energy: -1, shimingMark: 2 }, cost: { energy: 1 } },
                        { text: '吸收共鸣 (+15试鸣值, +10失败因子)', effect: { shimingValue: 15, shenFailure: 10 } }
                    ]
                },
                {
                    id: 'shen_calibrate1',
                    turn: 4,
                    title: '校准矩阵',
                    description: '一个复杂的校准矩阵出现在眼前。',
                    type: 'success',
                    choices: [
                        { text: '常规校准 (-1校准槽, -8风险)', effect: { calibrationSlots: -1, maoRisk: -8 }, cost: { calibrationSlots: 1 } },
                        { text: '深度校准 (-2校准槽, -15风险, +2试鸣痕)', effect: { calibrationSlots: -2, maoRisk: -15, shimingMark: 2 }, cost: { calibrationSlots: 2 } },
                        { text: '隐藏校准 (-3校准槽, +5试鸣痕, -20失败因子)', effect: { calibrationSlots: -3, shimingMark: 5, shenFailure: -20 }, cost: { calibrationSlots: 3 }, hidden: true }
                    ]
                },
                {
                    id: 'shen_failure_risk',
                    turn: 5,
                    title: '失败因子累积',
                    description: '申号失败因子正在累积，需要处理！',
                    type: 'warning',
                    choices: [
                        { text: '清除因子 (-3能量, -15失败因子)', effect: { energy: -3, shenFailure: -15 }, cost: { energy: 3 } },
                        { text: '隔离因子 (-1晶核, -10失败因子, +1试鸣痕)', effect: { crystal: -1, shenFailure: -10, shimingMark: 1 }, cost: { crystal: 1 } },
                        { text: '转化因子 (+10试鸣值, +5失败因子, +3风险)', effect: { shimingValue: 10, shenFailure: 5, maoRisk: 3 } }
                    ]
                },
                {
                    id: 'shen_mystery2',
                    turn: 6,
                    title: '神秘商人',
                    description: '一位神秘商人出现在塔楼中，兜售奇怪的物品。',
                    type: 'warning',
                    choices: [
                        { text: '购买能量包 (-2晶核, +5能量)', effect: { crystal: -2, energy: 5 }, cost: { crystal: 2 } },
                        { text: '购买校准槽 (-3晶核, +2校准槽)', effect: { crystal: -3, calibrationSlots: 2 }, cost: { crystal: 3 } },
                        { text: '隐藏交易：购买神秘卷轴 (-4晶核, +4试鸣痕)', effect: { crystal: -4, shimingMark: 4 }, cost: { crystal: 4 }, hidden: true }
                    ]
                },
                {
                    id: 'shen_choice2',
                    turn: 7,
                    title: '塔楼深处',
                    description: '通往塔楼深处的大门打开了。',
                    type: 'normal',
                    choices: [
                        { text: '深入探索 (-3能量, -2零件, +20试鸣值, +15风险)', effect: { energy: -3, parts: -2, shimingValue: 20, maoRisk: 15 }, cost: { energy: 3, parts: 2 } },
                        { text: '留守外围 (+8试鸣值, +2试鸣痕)', effect: { shimingValue: 8, shimingMark: 2 } },
                        { text: '隐藏路径 (-5能量, +6试鸣痕, +20壬号奖励)', effect: { energy: -5, shimingMark: 6, renReward: 20 }, cost: { energy: 5 }, hidden: true }
                    ]
                },
                {
                    id: 'shen_calibrate2',
                    turn: 8,
                    title: '终极校准',
                    description: '这是一个关键的校准点，决定着最终结局。',
                    type: 'success',
                    choices: [
                        { text: '稳定校准 (-1校准槽, -10风险, -10失败因子)', effect: { calibrationSlots: -1, maoRisk: -10, shenFailure: -10 }, cost: { calibrationSlots: 1 } },
                        { text: '增强校准 (-2校准槽, -18风险, -15失败因子, +3试鸣值)', effect: { calibrationSlots: -2, maoRisk: -18, shenFailure: -15, shimingValue: 3 }, cost: { calibrationSlots: 2 } },
                        { text: '隐藏终极校准 (-4校准槽, +8试鸣痕, -30失败因子, -25风险)', effect: { calibrationSlots: -4, shimingMark: 8, shenFailure: -30, maoRisk: -25 }, cost: { calibrationSlots: 4 }, hidden: true }
                    ]
                },
                {
                    id: 'shen_reward',
                    turn: 9,
                    title: '壬号赏赐',
                    description: '壬号使者带来了丰厚的赏赐。',
                    type: 'success',
                    choices: [
                        { text: '资源赏赐 (+5能量, +3晶核, +2零件)', effect: { energy: 5, crystal: 3, parts: 2, renReward: 15 } },
                        { text: '试鸣赏赐 (+25试鸣值, +20奖励)', effect: { shimingValue: 25, renReward: 20 } },
                        { text: '校准赏赐 (+3校准槽, +15奖励)', effect: { calibrationSlots: 3, renReward: 15 } }
                    ]
                },
                {
                    id: 'shen_final_choice',
                    turn: 10,
                    title: '命运抉择',
                    description: '最终的时刻即将到来，做出你的选择！',
                    type: 'warning',
                    choices: [
                        { text: '全力提升试鸣 (-5能量, -3晶核, +30试鸣值, +15风险)', effect: { energy: -5, crystal: -3, shimingValue: 30, maoRisk: 15 }, cost: { energy: 5, crystal: 3 } },
                        { text: '全面控制风险 (-15风险, -15失败因子, +10试鸣值)', effect: { maoRisk: -15, shenFailure: -15, shimingValue: 10 } },
                        { text: '隐藏选择：激活霜花核心 (-10能量, -所有晶核, +10试鸣痕, +50试鸣值)', special: 'activate_core', hidden: true }
                    ]
                },
                {
                    id: 'shen_ultimate',
                    turn: 11,
                    title: '终局之战',
                    description: '一切都将在此刻揭晓！',
                    type: 'danger',
                    choices: [
                        { text: '最终冲刺 (-所有能量, +试鸣值=能量×4)', special: 'final_sprint' },
                        { text: '稳扎稳打 (+10试鸣值, -10风险, -10失败因子)', effect: { shimingValue: 10, maoRisk: -10, shenFailure: -10 } },
                        { text: '收集试鸣痕 (+3试鸣痕)', effect: { shimingMark: 3 } }
                    ]
                }
            ]
        }
    },

    RANK_THRESHOLDS: {
        S: 800,
        A: 500,
        B: 300,
        C: 100,
        F: 0
    }
};
