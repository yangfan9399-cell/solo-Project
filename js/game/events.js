const GameEvents = {
    develop_1: {
        id: 'develop_1',
        title: '显影池',
        description: '将相纸浸入显影液，影像开始浮现。',
        type: 'neutral',
        effects: {
            balanceValue: -3,
            infectionTank: 1
        }
    },
    fix_1: {
        id: 'fix_1',
        title: '定影池',
        description: '定影液固定影像，防止褪色。',
        type: 'positive',
        effects: {
            balanceValue: -2,
            mergeMark: 1
        }
    },
    wash_1: {
        id: 'wash_1',
        title: '水洗槽',
        description: '流动清水洗去化学残留。',
        type: 'positive',
        effects: {
            balanceValue: -1,
            infectionTank: -1
        }
    },
    dry_1: {
        id: 'dry_1',
        title: '干燥架',
        description: '自然风干，静待影像成型。',
        type: 'neutral',
        effects: {
            balanceValue: -2,
            maoReward: 1
        }
    },
    enlarge_1: {
        id: 'enlarge_1',
        title: '放大机',
        description: '调节焦距与曝光时间。',
        type: 'neutral',
        effects: {
            balanceValue: -4,
            ziRisk: 1
        }
    },
    paper_1: {
        id: 'paper_1',
        title: '相纸盒',
        description: '取出一张全新的相纸。',
        type: 'positive',
        effects: {
            balanceValue: 5,
            maoReward: 1
        }
    },
    light_switch: {
        id: 'light_switch',
        title: '暗房灯',
        description: '安全灯亮起，红光弥漫整个房间。',
        type: 'special',
        effects: {
            balanceValue: -1,
            mergeMark: 2,
            infectionTank: 1
        }
    },
    cut_1: {
        id: 'cut_1',
        title: '裁片台',
        description: '精心裁剪，获得完美尺寸。',
        type: 'positive',
        effects: {
            balanceValue: -2,
            maoReward: 2
        }
    },

    mao_lowcost_1: {
        id: 'mao_lowcost_1',
        title: '浅盘',
        description: '浅盘中仅剩少量药液，勉强可用。',
        type: 'neutral',
        effects: {
            balanceValue: -2,
            ziRisk: 1
        }
    },
    mao_highrisk_1: {
        id: 'mao_highrisk_1',
        title: '深槽',
        description: '深槽中蕴含着未知的风险与机遇。',
        type: 'special',
        effects: {
            balanceValue: -5,
            maoReward: 3,
            ziRisk: 2
        }
    },
    mao_balance_1: {
        id: 'mao_balance_1',
        title: '中转台',
        description: '稍作休整，整理思绪。',
        type: 'positive',
        effects: {
            balanceValue: 3
        }
    },
    mao_reward_1: {
        id: 'mao_reward_1',
        title: '旧相纸',
        description: '泛黄的旧相纸，藏着意外的收获。',
        type: 'positive',
        effects: {
            balanceValue: -1,
            maoReward: 2
        }
    },
    mao_danger_1: {
        id: 'mao_danger_1',
        title: '红灯区',
        description: '红光太过强烈，相纸可能受损。',
        type: 'negative',
        effects: {
            balanceValue: -8,
            ziRisk: 3
        }
    },
    mao_safe_1: {
        id: 'mao_safe_1',
        title: '安全灯',
        description: '柔和的安全灯，让人安心。',
        type: 'positive',
        effects: {
            balanceValue: -2,
            infectionTank: -1
        }
    },
    mao_cost_1: {
        id: 'mao_cost_1',
        title: '废液桶',
        description: '处理废液需要消耗额外资源。',
        type: 'negative',
        effects: {
            balanceValue: -6,
            infectionTank: 2
        }
    },
    mao_bonus_1: {
        id: 'mao_bonus_1',
        title: '补给点',
        description: '意外发现的补给点！',
        type: 'positive',
        effects: {
            balanceValue: 10,
            maoReward: 2,
            mergeMark: 1
        }
    },
    mao_normal_1: {
        id: 'mao_normal_1',
        title: '显影夹',
        description: '用夹子夹住相纸，小心操作。',
        type: 'neutral',
        effects: {
            balanceValue: -3
        }
    },
    mao_final_1: {
        id: 'mao_final_1',
        title: '定影液',
        description: '最后的定影步骤，成败在此一举。',
        type: 'neutral',
        effects: {
            balanceValue: -4,
            mergeMark: 1,
            maoReward: 1
        }
    },

    chou_broken_1: {
        id: 'chou_broken_1',
        title: '破碎镜片',
        description: '镜片上映出扭曲的倒影...',
        type: 'negative',
        effects: {
            balanceValue: -5,
            chouFailFactor: 1
        }
    },
    chou_album_1: {
        id: 'chou_album_1',
        title: '旧相册',
        description: '翻开尘封的相册，记忆如潮水涌来。',
        type: 'special',
        effects: {
            balanceValue: -2,
            mergeMark: 2,
            maoReward: 1
        }
    },
    chou_rust_1: {
        id: 'chou_rust_1',
        title: '生锈挂钩',
        description: '生锈的挂钩上挂着一件旧物。',
        type: 'neutral',
        effects: {
            balanceValue: -3,
            ziRisk: 1
        }
    },
    chou_potion_1: {
        id: 'chou_potion_1',
        title: '遗忘药水',
        description: '喝下它，会忘记什么？',
        type: 'special',
        effects: {
            balanceValue: -4,
            infectionTank: -2,
            ziRisk: 2
        }
    },
    chou_secret_1: {
        id: 'chou_secret_1',
        title: '暗格',
        description: '墙壁中的暗格，藏着什么秘密？',
        type: 'special',
        effects: {
            balanceValue: -3,
            mergeMark: 3,
            chouFailFactor: 1
        }
    },
    chou_web_1: {
        id: 'chou_web_1',
        title: '蜘蛛网',
        description: '厚重的蛛网，这里很久没人来了。',
        type: 'negative',
        effects: {
            balanceValue: -2,
            infectionTank: 1
        }
    },
    chou_flash_1: {
        id: 'chou_flash_1',
        title: '红光闪烁',
        description: '红光突然闪烁，有什么要发生了...',
        type: 'negative',
        effects: {
            balanceValue: -6,
            chouFailFactor: 2,
            ziRisk: 2
        }
    },
    chou_gate_1: {
        id: 'chou_gate_1',
        title: '封印之门',
        description: '门上刻满了古老的符文...',
        type: 'special',
        effects: {
            balanceValue: -5,
            mergeMark: 2,
            maoReward: 2
        }
    },
    chou_echo_1: {
        id: 'chou_echo_1',
        title: '回声走廊',
        description: '脚步声在走廊中不断回响。',
        type: 'neutral',
        effects: {
            balanceValue: -3,
            mergeMark: 1
        }
    },
    chou_abyss_1: {
        id: 'chou_abyss_1',
        title: '无底暗洞',
        description: '深不见底的黑洞，凝视它的人...',
        type: 'negative',
        effects: {
            balanceValue: -8,
            chouFailFactor: 3,
            infectionTank: 2
        }
    },
    chou_crystal_1: {
        id: 'chou_crystal_1',
        title: '银盐结晶',
        description: '美丽的银盐结晶，散发着微光。',
        type: 'positive',
        effects: {
            balanceValue: 5,
            maoReward: 3,
            mergeMark: 1
        }
    },
    chou_time_1: {
        id: 'chou_time_1',
        title: '时间裂隙',
        description: '时间在这里变得扭曲...',
        type: 'special',
        effects: {
            balanceValue: -4,
            mergeMark: 3,
            chouFailFactor: 1,
            maoReward: 1
        }
    },
    chou_truth_1: {
        id: 'chou_truth_1',
        title: '真相出口',
        description: '出口就在前方，真相即将揭晓。',
        type: 'positive',
        effects: {
            balanceValue: -2,
            mergeMark: 1
        }
    },

    getEvent(eventId) {
        return this[eventId] || null;
    },

    applyEvent(state, eventId) {
        const event = this.getEvent(eventId);
        if (!event) return state;

        const newState = { ...state };
        const effects = event.effects;

        if (effects.balanceValue !== undefined) {
            newState.balanceValue += effects.balanceValue;
        }
        if (effects.infectionTank !== undefined) {
            newState.infectionTank = Math.max(0, newState.infectionTank + effects.infectionTank);
        }
        if (effects.mergeMark !== undefined) {
            newState.mergeMark += effects.mergeMark;
        }
        if (effects.ziRisk !== undefined) {
            newState.ziRisk += effects.ziRisk;
        }
        if (effects.maoReward !== undefined) {
            newState.maoReward += effects.maoReward;
        }
        if (effects.chouFailFactor !== undefined) {
            newState.chouFailFactor += effects.chouFailFactor;
        }

        return newState;
    }
};
