const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const GameConfig = {
    STORAGE_KEY: 'frostflower_tower_save',

    MAX_STATS: {
        shimingValue: 100,
        maoRisk: 100,
        renReward: 100,
        shenFailure: 100
    },

    RANK_THRESHOLDS: {
        S: 800,
        A: 500,
        B: 300,
        C: 100,
        F: 0
    },

    GAMES: {
        mao: {
            id: 'mao',
            name: '卯局 - 教学入门',
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
            winCondition: (stats) => stats.shimingValue >= 60 && stats.maoRisk < 40,
            failCondition: (stats) => stats.maoRisk >= 80 || stats.energy <= 0,
            victoryFormula: (stats, steps) => {
                const baseScore = stats.shimingValue * 10;
                const penalty = stats.maoRisk * 3;
                const stepBonus = Math.max(0, (20 - steps) * 5);
                const crystalBonus = stats.crystal * 8;
                return Math.max(0, baseScore - penalty + stepBonus + crystalBonus);
            },
            hiddenCondition: null
        },
        ren: {
            id: 'ren',
            name: '壬局 - 资源短缺',
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
            winCondition: (stats) => stats.shimingValue >= 50 && stats.energy > 0 && stats.maoRisk < 50,
            failCondition: (stats) => stats.maoRisk >= 70 || stats.energy <= 0 || (stats.crystal <= 0 && stats.parts <= 0 && stats.energy <= 0),
            victoryFormula: (stats, steps) => {
                const baseScore = stats.shimingValue * 12;
                const penalty = stats.maoRisk * 4;
                const resourceBonus = (stats.energy + stats.crystal * 2 + stats.parts * 3) * 10;
                const stepBonus = Math.max(0, (25 - steps) * 4);
                return Math.max(0, baseScore - penalty + resourceBonus + stepBonus);
            },
            hiddenCondition: null
        },
        shen: {
            id: 'shen',
            name: '申局 - 隐藏挑战',
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
            }
        }
    }
};

function handleSpecialEffect(specialType, stats, baseEffects) {
    const effects = { ...baseEffects };

    switch (specialType) {
        case 'all_in':
            const totalResources = stats.energy + stats.crystal + stats.parts;
            effects.energy = -stats.energy;
            effects.crystal = -stats.crystal;
            effects.parts = -stats.parts;
            effects.shimingValue = (effects.shimingValue || 0) + totalResources * 3;
            break;

        case 'activate_core':
            effects.energy = -10;
            effects.crystal = -stats.crystal;
            effects.shimingMark = (effects.shimingMark || 0) + 10;
            effects.shimingValue = (effects.shimingValue || 0) + 50;
            break;

        case 'final_sprint':
            const energyValue = stats.energy;
            effects.energy = -stats.energy;
            effects.shimingValue = (effects.shimingValue || 0) + energyValue * 4;
            break;
    }

    return effects;
}

function recalculateFromHistory(config, history) {
    if (!config) return null;

    const stats = { ...config.startStats };
    const choices = [];

    for (let i = 0; i < history.length; i++) {
        const entry = history[i];
        let effects = { ...(entry.effects || {}) };

        if (entry.special) {
            effects = handleSpecialEffect(entry.special, stats, effects);
        }

        for (const [key, value] of Object.entries(effects)) {
            if (stats.hasOwnProperty(key)) {
                stats[key] += value;
                if (GameConfig.MAX_STATS[key]) {
                    stats[key] = Math.max(0, Math.min(stats[key], GameConfig.MAX_STATS[key]));
                } else {
                    stats[key] = Math.max(0, stats[key]);
                }
            }
        }

        if (entry.choice) {
            choices.push(entry.choice);
        }
    }

    const hiddenTriggered = config.hiddenCondition ? config.hiddenCondition(stats, choices) : false;
    const steps = history.length;

    return { stats, steps, hiddenTriggered, choices };
}

function getRank(score) {
    if (score >= GameConfig.RANK_THRESHOLDS.S) return 'S';
    if (score >= GameConfig.RANK_THRESHOLDS.A) return 'A';
    if (score >= GameConfig.RANK_THRESHOLDS.B) return 'B';
    if (score >= GameConfig.RANK_THRESHOLDS.C) return 'C';
    return 'F';
}

function getBreakdown(gameId, stats, steps, hiddenTriggered, finalScore) {
    const breakdown = [];

    if (gameId === 'mao') {
        breakdown.push({ label: '基础分 (霜花塔楼试鸣值 × 10)', value: stats.shimingValue * 10, positive: true });
        breakdown.push({ label: '风险惩罚 (卯号风险 × 3)', value: -stats.maoRisk * 3, positive: false });
        breakdown.push({ label: '竞速步骤奖励 ((20-步数) × 5)', value: Math.max(0, (20 - steps) * 5), positive: true });
        breakdown.push({ label: '晶核奖励 (晶核 × 8)', value: stats.crystal * 8, positive: true });
    } else if (gameId === 'ren') {
        breakdown.push({ label: '基础分 (霜花塔楼试鸣值 × 12)', value: stats.shimingValue * 12, positive: true });
        breakdown.push({ label: '风险惩罚 (卯号风险 × 4)', value: -stats.maoRisk * 4, positive: false });
        breakdown.push({ label: '资源奖励 (能量+晶核×2+零件×3) × 10', value: (stats.energy + stats.crystal * 2 + stats.parts * 3) * 10, positive: true });
        breakdown.push({ label: '竞速步骤奖励 ((25-步数) × 4)', value: Math.max(0, (25 - steps) * 4), positive: true });
    } else if (gameId === 'shen') {
        breakdown.push({ label: '基础分 (霜花塔楼试鸣值 × 15)', value: stats.shimingValue * 15, positive: true });
        breakdown.push({ label: '风险惩罚 (卯号风险 × 3 + 申号失败因子 × 5)', value: -(stats.maoRisk * 3 + stats.shenFailure * 5), positive: false });
        breakdown.push({ label: '试鸣痕奖励 (霜花塔楼试鸣痕 × 25)', value: stats.shimingMark * 25, positive: true });
        breakdown.push({ label: '竞速步骤奖励 ((30-步数) × 6)', value: Math.max(0, (30 - steps) * 6), positive: true });
        if (hiddenTriggered) {
            breakdown.push({ label: '✨ 隐藏条件奖励', value: 500, positive: true });
        }
    }

    breakdown.push({ label: '最终得分', value: finalScore, positive: true, total: true });

    return breakdown;
}

function calculateSettlement(reqData) {
    const { gameId, history, storedStats } = reqData;

    if (!gameId || !GameConfig.GAMES[gameId] || !Array.isArray(history)) {
        return { error: '无效的请求参数' };
    }

    const config = GameConfig.GAMES[gameId];

    const recalc = recalculateFromHistory(config, history);
    if (!recalc) return { error: '重算失败' };

    const recalcStats = recalc.stats;
    const steps = recalc.steps;
    const hiddenTriggered = recalc.hiddenTriggered;

    const score = config.victoryFormula(recalcStats, steps, hiddenTriggered);
    const rank = getRank(score);
    const isWin = config.winCondition(recalcStats);
    const isFail = config.failCondition(recalcStats);

    const verified = storedStats ?
        JSON.stringify(recalcStats) === JSON.stringify(storedStats) : true;

    return {
        score,
        rank,
        isWin,
        isFail,
        hiddenTriggered,
        stats: recalcStats,
        storedStats: storedStats || recalcStats,
        verified,
        steps,
        history,
        serverCalculated: true,
        breakdown: getBreakdown(gameId, recalcStats, steps, hiddenTriggered, score),
        replayLog: [
            { step: '初始状态加载', status: 'ok' },
            { step: `回放 ${steps} 个竞速经营步骤`, status: 'ok' },
            { step: `重算霜花塔楼试鸣值: ${recalcStats.shimingValue}`, status: 'ok' },
            { step: `重算卯号风险: ${recalcStats.maoRisk}`, status: 'ok' },
            { step: '按试鸣值与步骤套用公式', status: 'ok' },
            { step: `数据校验: ${verified ? '回放值与存储值一致' : '存在偏差'}`, status: verified ? 'ok' : 'warning' }
        ]
    };
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function serveStatic(req, res) {
    let urlPath = req.url === '/' ? '/index.html' : req.url;

    if (urlPath.includes('..')) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    const filePath = path.join(__dirname, urlPath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        res.writeHead(200, { 'Content-Type': mimeType });
        res.end(data);
    });
}

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/settlement') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const reqData = JSON.parse(body);
                console.log(`[后端结算] 收到请求: gameId=${reqData.gameId}, steps=${reqData.history ? reqData.history.length : 0}`);
                const result = calculateSettlement(reqData);
                console.log(`[后端结算] 完成: score=${result.score}, rank=${result.rank}, verified=${result.verified}`);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(result, null, 2));
            } catch (e) {
                console.error('[后端结算] 错误:', e);
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: '请求解析失败: ' + e.message }));
            }
        });
        return;
    }

    serveStatic(req, res);
});

server.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  霜花塔楼后端服务已启动`);
    console.log(`  访问地址: http://localhost:${PORT}`);
    console.log(`  后端结算接口: POST http://localhost:${PORT}/api/settlement`);
    console.log(`========================================\n`);
});
