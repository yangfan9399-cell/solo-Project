var GameConfig = {
    levels: {
        ren: {
            id: 'ren',
            name: '壬局 · 教学',
            description: '苔藓邮站初开张，一步一步教你经营。资源充足，风险较低，适合新手入门。',
            introText: '欢迎来到苔藓邮站！这是一局教学模式。你将学习如何经营邮站、处理事件、积累解锁值。每一步都很安全，大胆尝试吧！',
            maxTurns: 8,
            initialState: {
                unlockValue: 10,
                unlockSlots: 5,
                traceMarks: 2,
                renRisk: 0,
                dingReward: 1,
                maoFailFactor: 0
            },
            victoryCondition: {
                type: 'unlockValue',
                threshold: 50,
                description: '苔藓邮站解锁值达到 50'
            },
            failCondition: {
                type: 'renRisk',
                threshold: 10,
                description: '壬号风险超过 10'
            },
            eventPool: [
                {
                    id: 'ren_ev_1',
                    title: '晨露包裹',
                    description: '清晨的露水打湿了一批包裹，你需要决定如何处理。',
                    choices: [
                        {
                            text: '仔细烘干每一件包裹',
                            effect: { unlockValue: 3, unlockSlots: -1, renRisk: -1 },
                            effectText: '解锁值+3, 解锁槽-1, 壬号风险-1'
                        },
                        {
                            text: '快速发货，省时省力',
                            effect: { unlockValue: 1, unlockSlots: 0, renRisk: 2 },
                            effectText: '解锁值+1, 壬号风险+2'
                        }
                    ]
                },
                {
                    id: 'ren_ev_2',
                    title: '苔藓蔓延',
                    description: '邮站外墙的苔藓长势喜人，吸引了不少顾客驻足。',
                    choices: [
                        {
                            text: '打理苔藓，打造特色',
                            effect: { unlockValue: 5, traceMarks: 1, unlockSlots: -1 },
                            effectText: '解锁值+5, 溯源痕+1, 解锁槽-1'
                        },
                        {
                            text: '清理苔藓，保持整洁',
                            effect: { unlockValue: 2, unlockSlots: 1 },
                            effectText: '解锁值+2, 解锁槽+1'
                        }
                    ]
                },
                {
                    id: 'ren_ev_3',
                    title: '迷路的邮差',
                    description: '一位新手邮差在森林里迷了路，需要有人接应。',
                    choices: [
                        {
                            text: '亲自前往接应',
                            effect: { unlockValue: 4, traceMarks: 1, renRisk: 1 },
                            effectText: '解锁值+4, 溯源痕+1, 壬号风险+1'
                        },
                        {
                            text: '派老邮差去找',
                            effect: { unlockValue: 2, unlockSlots: -1 },
                            effectText: '解锁值+2, 解锁槽-1'
                        }
                    ]
                },
                {
                    id: 'ren_ev_4',
                    title: '古旧信件',
                    description: '整理仓库时发现了一批年代久远的信件，信封上长满了苔藓。',
                    choices: [
                        {
                            text: '细心修复，寻找收信人',
                            effect: { unlockValue: 6, traceMarks: 2, unlockSlots: -2 },
                            effectText: '解锁值+6, 溯源痕+2, 解锁槽-2'
                        },
                        {
                            text: '收入档案室',
                            effect: { unlockValue: 2, unlockSlots: 0 },
                            effectText: '解锁值+2'
                        }
                    ]
                },
                {
                    id: 'ren_ev_5',
                    title: '森林访客',
                    description: '一位神秘的森林访客来到邮站，似乎有重要的事情。',
                    choices: [
                        {
                            text: '热情招待，聆听故事',
                            effect: { unlockValue: 3, traceMarks: 1, renRisk: 0 },
                            effectText: '解锁值+3, 溯源痕+1'
                        },
                        {
                            text: '保持距离，公事公办',
                            effect: { unlockValue: 1, unlockSlots: 1 },
                            effectText: '解锁值+1, 解锁槽+1'
                        }
                    ]
                },
                {
                    id: 'ren_ev_6',
                    title: '春雨绵绵',
                    description: '连日的春雨让邮路变得泥泞不堪。',
                    choices: [
                        {
                            text: '修缮邮路',
                            effect: { unlockValue: 4, unlockSlots: -2, renRisk: -2 },
                            effectText: '解锁值+4, 解锁槽-2, 壬号风险-2'
                        },
                        {
                            text: '暂停配送',
                            effect: { unlockValue: -1, unlockSlots: 1, renRisk: 1 },
                            effectText: '解锁值-1, 解锁槽+1, 壬号风险+1'
                        }
                    ]
                },
                {
                    id: 'ren_ev_7',
                    title: '苔鲜新品种',
                    description: '邮站周围发现了一种罕见的苔藓品种。',
                    choices: [
                        {
                            text: '研究培育',
                            effect: { unlockValue: 2, traceMarks: 3 },
                            effectText: '解锁值+2, 溯源痕+3'
                        },
                        {
                            text: '保护原址',
                            effect: { unlockValue: 5, unlockSlots: -1, renRisk: -1 },
                            effectText: '解锁值+5, 解锁槽-1, 壬号风险-1'
                        }
                    ]
                },
                {
                    id: 'ren_ev_8',
                    title: '加急信件',
                    description: '一封标有"十万火急"的信件需要立即送出。',
                    choices: [
                        {
                            text: '立刻出发',
                            effect: { unlockValue: 5, renRisk: 2, unlockSlots: -1 },
                            effectText: '解锁值+5, 壬号风险+2, 解锁槽-1'
                        },
                        {
                            text: '按流程排队',
                            effect: { unlockValue: 1, renRisk: 0 },
                            effectText: '解锁值+1'
                        }
                    ]
                }
            ],
            settlementFormula: function(state) {
                var base = state.unlockValue * 10;
                var traceBonus = state.traceMarks * 20;
                var slotBonus = state.unlockSlots * 5;
                var riskPenalty = state.renRisk * 8;
                var total = base + traceBonus + slotBonus - riskPenalty;
                return {
                    base: base,
                    traceBonus: traceBonus,
                    slotBonus: slotBonus,
                    riskPenalty: -riskPenalty,
                    total: Math.max(0, total),
                    isWin: state.unlockValue >= 50 && state.renRisk < 10
                };
            }
        },

        ding: {
            id: 'ding',
            name: '丁局 · 短缺',
            description: '资源紧张的一局！解锁槽紧缺，每一步都要精打细算。丁号奖励倍率让你的决策更加关键。',
            introText: '这是丁局——资源短缺模式。解锁槽非常有限，但丁号奖励倍率会让明智的选择获得更高回报。谨慎使用你的每一个槽位！',
            maxTurns: 10,
            initialState: {
                unlockValue: 5,
                unlockSlots: 2,
                traceMarks: 0,
                renRisk: 0,
                dingReward: 2,
                maoFailFactor: 0
            },
            victoryCondition: {
                type: 'unlockValue',
                threshold: 60,
                description: '苔藓邮站解锁值达到 60'
            },
            failCondition: {
                type: 'unlockSlots',
                threshold: 0,
                description: '解锁槽耗尽且无法恢复'
            },
            eventPool: [
                {
                    id: 'ding_ev_1',
                    title: '稀缺物资',
                    description: '一批重要物资只够支持一个项目。',
                    choices: [
                        {
                            text: '投入基础设施',
                            effect: { unlockValue: 4, unlockSlots: -1, dingReward: 0.5 },
                            effectText: '解锁值+4(×2), 解锁槽-1, 丁号奖励+0.5'
                        },
                        {
                            text: '投入客户服务',
                            effect: { unlockValue: 6, unlockSlots: -1 },
                            effectText: '解锁值+6(×2), 解锁槽-1'
                        }
                    ]
                },
                {
                    id: 'ding_ev_2',
                    title: '节约大赛',
                    description: '总部发起节约竞赛，表现优秀者将获得额外奖励。',
                    choices: [
                        {
                            text: '积极参与',
                            effect: { unlockValue: 2, unlockSlots: 2, dingReward: -0.3 },
                            effectText: '解锁值+2(×2), 解锁槽+2, 丁号奖励-0.3'
                        },
                        {
                            text: '正常运营',
                            effect: { unlockValue: 3, unlockSlots: 0 },
                            effectText: '解锁值+3(×2)'
                        }
                    ]
                },
                {
                    id: 'ding_ev_3',
                    title: '破损包裹',
                    description: '运输途中一批包裹受损，需要决定赔偿方案。',
                    choices: [
                        {
                            text: '全额赔偿',
                            effect: { unlockValue: -3, unlockSlots: -1, dingReward: 0.8 },
                            effectText: '解锁值-3, 解锁槽-1, 丁号奖励+0.8'
                        },
                        {
                            text: '协商处理',
                            effect: { unlockValue: -1, unlockSlots: 0, dingReward: 0 },
                            effectText: '解锁值-1(×2)'
                        }
                    ]
                },
                {
                    id: 'ding_ev_4',
                    title: '高效路线',
                    description: '发现了一条更短的配送路线，但需要前期投入。',
                    choices: [
                        {
                            text: '开辟新路线',
                            effect: { unlockValue: -2, unlockSlots: 3, dingReward: 0.3 },
                            effectText: '解锁值-2, 解锁槽+3, 丁号奖励+0.3'
                        },
                        {
                            text: '保持现状',
                            effect: { unlockValue: 2, unlockSlots: 0 },
                            effectText: '解锁值+2(×2)'
                        }
                    ]
                },
                {
                    id: 'ding_ev_5',
                    title: '老客户回馈',
                    description: '一位老客户想要回馈邮站多年的服务。',
                    choices: [
                        {
                            text: '接受资助',
                            effect: { unlockValue: 8, unlockSlots: -1 },
                            effectText: '解锁值+8(×2), 解锁槽-1'
                        },
                        {
                            text: '婉言谢绝',
                            effect: { unlockValue: 2, unlockSlots: 1, dingReward: 0.5 },
                            effectText: '解锁值+2(×2), 解锁槽+1, 丁号奖励+0.5'
                        }
                    ]
                },
                {
                    id: 'ding_ev_6',
                    title: '临时帮手',
                    description: '有人愿意来邮站帮忙，但需要支付报酬。',
                    choices: [
                        {
                            text: '雇佣帮手',
                            effect: { unlockValue: 5, unlockSlots: -2, dingReward: 0.2 },
                            effectText: '解锁值+5(×2), 解锁槽-2, 丁号奖励+0.2'
                        },
                        {
                            text: '自己扛着',
                            effect: { unlockValue: 1, unlockSlots: 0, dingReward: 0 },
                            effectText: '解锁值+1(×2)'
                        }
                    ]
                },
                {
                    id: 'ding_ev_7',
                    title: '特色服务',
                    description: '可以推出一项苔藓主题的特色服务。',
                    choices: [
                        {
                            text: '大力推广',
                            effect: { unlockValue: 7, unlockSlots: -2, dingReward: 0.4 },
                            effectText: '解锁值+7(×2), 解锁槽-2, 丁号奖励+0.4'
                        },
                        {
                            text: '小范围试点',
                            effect: { unlockValue: 3, unlockSlots: -1 },
                            effectText: '解锁值+3(×2), 解锁槽-1'
                        }
                    ]
                },
                {
                    id: 'ding_ev_8',
                    title: '紧急调货',
                    description: '邻区邮站请求紧急支援一些物资。',
                    choices: [
                        {
                            text: '慷慨支援',
                            effect: { unlockValue: -2, unlockSlots: -1, dingReward: 1.0 },
                            effectText: '解锁值-2, 解锁槽-1, 丁号奖励+1.0'
                        },
                        {
                            text: '婉拒请求',
                            effect: { unlockValue: 1, unlockSlots: 0 },
                            effectText: '解锁值+1(×2)'
                        }
                    ]
                },
                {
                    id: 'ding_ev_9',
                    title: '苔藓工坊',
                    description: '可以在邮站开设一个小型苔藓工坊。',
                    choices: [
                        {
                            text: '开设工坊',
                            effect: { unlockValue: 4, unlockSlots: -2, dingReward: 0.6, traceMarks: 2 },
                            effectText: '解锁值+4(×2), 解锁槽-2, 丁号奖励+0.6, 溯源痕+2'
                        },
                        {
                            text: '暂不开设',
                            effect: { unlockSlots: 1, dingReward: 0 },
                            effectText: '解锁槽+1'
                        }
                    ]
                },
                {
                    id: 'ding_ev_10',
                    title: '年终考核',
                    description: '总部年终考核，丁号奖励将最后结算。',
                    choices: [
                        {
                            text: '冲刺表现',
                            effect: { unlockValue: 6, unlockSlots: -1, dingReward: 0.3 },
                            effectText: '解锁值+6(×2), 解锁槽-1, 丁号奖励+0.3'
                        },
                        {
                            text: '稳扎稳打',
                            effect: { unlockValue: 3, unlockSlots: 1 },
                            effectText: '解锁值+3(×2), 解锁槽+1'
                        }
                    ]
                }
            ],
            settlementFormula: function(state) {
                var base = state.unlockValue * 15;
                var rewardMultiplier = state.dingReward;
                var traceBonus = state.traceMarks * 25;
                var slotBonus = state.unlockSlots * 10;
                var total = Math.floor((base + traceBonus + slotBonus) * rewardMultiplier);
                return {
                    base: base,
                    rewardMultiplier: rewardMultiplier,
                    traceBonus: traceBonus,
                    slotBonus: slotBonus,
                    total: Math.max(0, total),
                    isWin: state.unlockValue >= 60 && state.unlockSlots >= 0
                };
            }
        },

        mao: {
            id: 'mao',
            name: '卯局 · 隐藏',
            description: '神秘的一局！卯号失败因子潜伏在暗处。据说满足隐藏条件可以触发特殊结局...',
            introText: '这是卯局——隐藏条件模式。卯号失败因子会随着某些选择积累。注意观察事件，据说收集足够的溯源痕并做出特定选择，可以触发隐藏的胜利条件...',
            maxTurns: 12,
            initialState: {
                unlockValue: 8,
                unlockSlots: 4,
                traceMarks: 0,
                renRisk: 0,
                dingReward: 1,
                maoFailFactor: 0
            },
            victoryCondition: {
                type: 'hidden',
                description: '达成隐藏条件（或解锁值达到 80）'
            },
            failCondition: {
                type: 'maoFailFactor',
                threshold: 8,
                description: '卯号失败因子达到 8'
            },
            hiddenCondition: {
                traceMarksRequired: 8,
                description: '收集 8 个溯源痕并选择"传承之路"'
            },
            eventPool: [
                {
                    id: 'mao_ev_1',
                    title: '古老地图',
                    description: '在邮站阁楼发现了一张泛黄的古老地图，上面标注着奇怪的符号。',
                    choices: [
                        {
                            text: '仔细研究地图',
                            effect: { unlockValue: 2, traceMarks: 2, maoFailFactor: 0 },
                            effectText: '解锁值+2, 溯源痕+2'
                        },
                        {
                            text: '收起来不管',
                            effect: { unlockValue: 1, traceMarks: 0, maoFailFactor: 1 },
                            effectText: '解锁值+1, 卯号失败因子+1'
                        }
                    ]
                },
                {
                    id: 'mao_ev_2',
                    title: '午夜访客',
                    description: '一位戴着苔藓面具的神秘人在午夜来访。',
                    choices: [
                        {
                            text: '接待访客',
                            effect: { unlockValue: 3, traceMarks: 2, maoFailFactor: 1 },
                            effectText: '解锁值+3, 溯源痕+2, 卯号失败因子+1'
                        },
                        {
                            text: '假装没人',
                            effect: { unlockValue: 0, traceMarks: 0, maoFailFactor: 2 },
                            effectText: '卯号失败因子+2'
                        }
                    ]
                },
                {
                    id: 'mao_ev_3',
                    title: '苔藓祭坛',
                    description: '森林深处似乎有一座古老的苔藓祭坛。',
                    choices: [
                        {
                            text: '前往探索',
                            effect: { unlockValue: 1, traceMarks: 3, unlockSlots: -1, maoFailFactor: 1 },
                            effectText: '解锁值+1, 溯源痕+3, 解锁槽-1, 卯号失败因子+1'
                        },
                        {
                            text: '不去冒险',
                            effect: { unlockValue: 3, traceMarks: 0, maoFailFactor: 0 },
                            effectText: '解锁值+3'
                        }
                    ]
                },
                {
                    id: 'mao_ev_4',
                    title: '遗失的信件',
                    description: '一封地址模糊的信件被退回了多次。',
                    choices: [
                        {
                            text: '追查到底',
                            effect: { unlockValue: 2, traceMarks: 2, unlockSlots: -1, maoFailFactor: 0 },
                            effectText: '解锁值+2, 溯源痕+2, 解锁槽-1'
                        },
                        {
                            text: '销毁处理',
                            effect: { unlockValue: 4, traceMarks: -1, maoFailFactor: 2 },
                            effectText: '解锁值+4, 溯源痕-1, 卯号失败因子+2'
                        }
                    ]
                },
                {
                    id: 'mao_ev_5',
                    title: '守林人传说',
                    description: '当地人说森林里住着一位古老的守林人。',
                    choices: [
                        {
                            text: '寻找守林人',
                            effect: { unlockValue: 0, traceMarks: 2, unlockSlots: -1, maoFailFactor: 1 },
                            effectText: '溯源痕+2, 解锁槽-1, 卯号失败因子+1'
                        },
                        {
                            text: '只是传说而已',
                            effect: { unlockValue: 5, traceMarks: 0, maoFailFactor: 1 },
                            effectText: '解锁值+5, 卯号失败因子+1'
                        }
                    ]
                },
                {
                    id: 'mao_ev_6',
                    title: '苔藓歌谣',
                    description: '风一吹过，邮站的苔藓似乎在发出微弱的歌声。',
                    choices: [
                        {
                            text: '侧耳倾听',
                            effect: { unlockValue: 1, traceMarks: 2, maoFailFactor: 0 },
                            effectText: '解锁值+1, 溯源痕+2'
                        },
                        {
                            text: '清理苔藓',
                            effect: { unlockValue: 4, traceMarks: -2, maoFailFactor: 2 },
                            effectText: '解锁值+4, 溯源痕-2, 卯号失败因子+2'
                        }
                    ]
                },
                {
                    id: 'mao_ev_7',
                    title: '时光邮筒',
                    description: '一个自称来自未来的邮差留下了一个神秘的邮筒。',
                    choices: [
                        {
                            text: '保存邮筒',
                            effect: { unlockValue: 3, traceMarks: 2, unlockSlots: -1, maoFailFactor: 1 },
                            effectText: '解锁值+3, 溯源痕+2, 解锁槽-1, 卯号失败因子+1'
                        },
                        {
                            text: '退回原处',
                            effect: { unlockValue: 2, traceMarks: 0, maoFailFactor: 0 },
                            effectText: '解锁值+2'
                        }
                    ]
                },
                {
                    id: 'mao_ev_8',
                    title: '命运抉择',
                    description: '站在岔路口，一条通向繁荣，一条通向未知。',
                    choices: [
                        {
                            text: '选择繁荣之路',
                            effect: { unlockValue: 10, traceMarks: 0, maoFailFactor: 2, unlockSlots: -1 },
                            effectText: '解锁值+10, 卯号失败因子+2, 解锁槽-1'
                        },
                        {
                            text: '选择未知之路',
                            effect: { unlockValue: 2, traceMarks: 3, maoFailFactor: 0 },
                            effectText: '解锁值+2, 溯源痕+3'
                        }
                    ]
                },
                {
                    id: 'mao_ev_9',
                    title: '苔藓之心',
                    description: '传说森林中心有一颗苔藓之心，能赋予邮站神秘力量。',
                    choices: [
                        {
                            text: '寻找苔藓之心',
                            effect: { unlockValue: 5, traceMarks: 4, unlockSlots: -2, maoFailFactor: 2 },
                            effectText: '解锁值+5, 溯源痕+4, 解锁槽-2, 卯号失败因子+2'
                        },
                        {
                            text: '专注经营',
                            effect: { unlockValue: 8, traceMarks: 0, maoFailFactor: 0 },
                            effectText: '解锁值+8'
                        }
                    ]
                },
                {
                    id: 'mao_ev_10',
                    title: '最后的选择',
                    description: '游戏即将结束，你有机会做出最终的选择。',
                    choices: [
                        {
                            text: '传承之路（需8个溯源痕）',
                            effect: { unlockValue: 20, traceMarks: 0, maoFailFactor: -5, hiddenTrigger: true },
                            effectText: '（隐藏结局）解锁值+20, 卯号失败因子-5',
                            requires: { traceMarks: 8 }
                        },
                        {
                            text: '经营之道',
                            effect: { unlockValue: 8, traceMarks: 1, maoFailFactor: 0 },
                            effectText: '解锁值+8, 溯源痕+1'
                        }
                    ]
                },
                {
                    id: 'mao_ev_11',
                    title: '迷雾森林',
                    description: '森林突然起了大雾，邮路变得危险。',
                    choices: [
                        {
                            text: '摸索前行',
                            effect: { unlockValue: 3, traceMarks: 1, maoFailFactor: 2 },
                            effectText: '解锁值+3, 溯源痕+1, 卯号失败因子+2'
                        },
                        {
                            text: '等待雾散',
                            effect: { unlockValue: -1, traceMarks: 0, maoFailFactor: 0, unlockSlots: 1 },
                            effectText: '解锁值-1, 解锁槽+1'
                        }
                    ]
                },
                {
                    id: 'mao_ev_12',
                    title: '古老契约',
                    description: '一份字迹模糊的契约出现在你的办公桌上。',
                    choices: [
                        {
                            text: '签署契约',
                            effect: { unlockValue: 6, traceMarks: 2, maoFailFactor: 3 },
                            effectText: '解锁值+6, 溯源痕+2, 卯号失败因子+3'
                        },
                        {
                            text: '拒绝签署',
                            effect: { unlockValue: 0, traceMarks: 1, maoFailFactor: 0 },
                            effectText: '溯源痕+1'
                        }
                    ]
                }
            ],
            settlementFormula: function(state, hiddenTriggered) {
                var base = state.unlockValue * 12;
                var traceBonus = state.traceMarks * 30;
                var slotPenalty = (4 - state.unlockSlots) * 5;
                var failPenalty = state.maoFailFactor * 15;
                var hiddenBonus = hiddenTriggered ? 500 : 0;
                var total = base + traceBonus - slotPenalty - failPenalty + hiddenBonus;
                
                var isWin = hiddenTriggered || (state.unlockValue >= 80 && state.maoFailFactor < 8);
                
                return {
                    base: base,
                    traceBonus: traceBonus,
                    slotPenalty: -slotPenalty,
                    failPenalty: -failPenalty,
                    hiddenBonus: hiddenBonus,
                    total: Math.max(0, total),
                    isWin: isWin,
                    isHidden: hiddenTriggered
                };
            }
        }
    },

    statLabels: {
        unlockValue: '苔藓邮站解锁值',
        unlockSlots: '苔藓邮站解锁槽',
        traceMarks: '苔藓邮站溯源痕',
        renRisk: '壬号风险',
        dingReward: '丁号奖励',
        maoFailFactor: '卯号失败因子'
    },

    getStatLabel: function(key) {
        return this.statLabels[key] || key;
    }
};
