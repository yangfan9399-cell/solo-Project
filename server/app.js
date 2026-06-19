#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8888;

const Levels = {
    zi: {
        id: 'zi',
        name: '子局 · 银盐启蒙',
        initialState: { balanceValue: 100, infectionTank: 0, mergeMark: 0, ziRisk: 0, maoReward: 0, chouFailFactor: 0 },
        winCondition: { type: 'reach_end_and_balance', minBalance: 50 },
        loseCondition: { type: 'balance_zero', minBalance: 0 },
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
        ]
    },
    mao: {
        id: 'mao',
        name: '卯局 · 资源匮乏',
        initialState: { balanceValue: 60, infectionTank: 0, mergeMark: 0, ziRisk: 0, maoReward: 0, chouFailFactor: 0 },
        winCondition: { type: 'reach_end_and_balance', minBalance: 20 },
        loseCondition: { type: 'balance_zero', minBalance: 0 },
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
        ]
    },
    chou: {
        id: 'chou',
        name: '丑局 · 隐秘航线',
        initialState: { balanceValue: 80, infectionTank: 0, mergeMark: 0, ziRisk: 0, maoReward: 0, chouFailFactor: 0 },
        winCondition: { type: 'reach_end_and_secret', minBalance: 30, secretCondition: 'mergeMark >= 3' },
        loseCondition: { type: 'balance_or_fail', minBalance: 0, maxFailFactor: 10 },
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
        ]
    },
    getLevel(id) { return this[id] || null; }
};

const GameEvents = {
    develop_1: { title: '显影池', type: 'neutral', effects: { balanceValue: -3, infectionTank: 1 } },
    fix_1: { title: '定影池', type: 'positive', effects: { balanceValue: -2, mergeMark: 1 } },
    wash_1: { title: '水洗槽', type: 'positive', effects: { balanceValue: -1, infectionTank: -1 } },
    dry_1: { title: '干燥架', type: 'neutral', effects: { balanceValue: -2, maoReward: 1 } },
    enlarge_1: { title: '放大机', type: 'neutral', effects: { balanceValue: -4, ziRisk: 1 } },
    paper_1: { title: '相纸盒', type: 'positive', effects: { balanceValue: 5, maoReward: 1 } },
    light_switch: { title: '暗房灯', type: 'special', effects: { balanceValue: -1, mergeMark: 2, infectionTank: 1 } },
    cut_1: { title: '裁片台', type: 'positive', effects: { balanceValue: -2, maoReward: 2 } },
    mao_lowcost_1: { title: '浅盘', type: 'neutral', effects: { balanceValue: -2, ziRisk: 1 } },
    mao_highrisk_1: { title: '深槽', type: 'special', effects: { balanceValue: -5, maoReward: 3, ziRisk: 2 } },
    mao_balance_1: { title: '中转台', type: 'positive', effects: { balanceValue: 3 } },
    mao_reward_1: { title: '旧相纸', type: 'positive', effects: { balanceValue: -1, maoReward: 2 } },
    mao_danger_1: { title: '红灯区', type: 'negative', effects: { balanceValue: -8, ziRisk: 3 } },
    mao_safe_1: { title: '安全灯', type: 'positive', effects: { balanceValue: -2, infectionTank: -1 } },
    mao_cost_1: { title: '废液桶', type: 'negative', effects: { balanceValue: -6, infectionTank: 2 } },
    mao_bonus_1: { title: '补给点', type: 'positive', effects: { balanceValue: 10, maoReward: 2, mergeMark: 1 } },
    mao_normal_1: { title: '显影夹', type: 'neutral', effects: { balanceValue: -3 } },
    mao_final_1: { title: '定影液', type: 'neutral', effects: { balanceValue: -4, mergeMark: 1, maoReward: 1 } },
    chou_broken_1: { title: '破碎镜片', type: 'negative', effects: { balanceValue: -5, chouFailFactor: 1 } },
    chou_album_1: { title: '旧相册', type: 'special', effects: { balanceValue: -2, mergeMark: 2, maoReward: 1 } },
    chou_rust_1: { title: '生锈挂钩', type: 'neutral', effects: { balanceValue: -3, ziRisk: 1 } },
    chou_potion_1: { title: '遗忘药水', type: 'special', effects: { balanceValue: -4, infectionTank: -2, ziRisk: 2 } },
    chou_secret_1: { title: '暗格', type: 'special', effects: { balanceValue: -3, mergeMark: 3, chouFailFactor: 1 } },
    chou_web_1: { title: '蜘蛛网', type: 'negative', effects: { balanceValue: -2, infectionTank: 1 } },
    chou_flash_1: { title: '红光闪烁', type: 'negative', effects: { balanceValue: -6, chouFailFactor: 2, ziRisk: 2 } },
    chou_gate_1: { title: '封印之门', type: 'special', effects: { balanceValue: -5, mergeMark: 2, maoReward: 2 } },
    chou_echo_1: { title: '回声走廊', type: 'neutral', effects: { balanceValue: -3, mergeMark: 1 } },
    chou_abyss_1: { title: '无底暗洞', type: 'negative', effects: { balanceValue: -8, chouFailFactor: 3, infectionTank: 2 } },
    chou_crystal_1: { title: '银盐结晶', type: 'positive', effects: { balanceValue: 5, maoReward: 3, mergeMark: 1 } },
    chou_time_1: { title: '时间裂隙', type: 'special', effects: { balanceValue: -4, mergeMark: 3, chouFailFactor: 1, maoReward: 1 } },
    chou_truth_1: { title: '真相出口', type: 'positive', effects: { balanceValue: -2, mergeMark: 1 } },
    getEvent(id) { return this[id] || null; }
};

function applyEventEffects(state, effects) {
    const newState = { ...state };
    if (effects.balanceValue !== undefined) newState.balanceValue += effects.balanceValue;
    if (effects.infectionTank !== undefined) newState.infectionTank = Math.max(0, newState.infectionTank + effects.infectionTank);
    if (effects.mergeMark !== undefined) newState.mergeMark += effects.mergeMark;
    if (effects.ziRisk !== undefined) newState.ziRisk += effects.ziRisk;
    if (effects.maoReward !== undefined) newState.maoReward += effects.maoReward;
    if (effects.chouFailFactor !== undefined) newState.chouFailFactor += effects.chouFailFactor;
    return newState;
}

function findEdge(level, from, to) {
    return level.edges.find(e =>
        (e.from === from && e.to === to) ||
        (e.from === to && e.to === from)
    );
}

function checkGameEnd(level, state, currentNode) {
    const winCondition = level.winCondition;
    const loseCondition = level.loseCondition;
    let gameOver = false;
    let gameWon = false;

    if (loseCondition) {
        if (loseCondition.type === 'balance_zero') {
            if (state.balanceValue <= loseCondition.minBalance) {
                gameOver = true;
                gameWon = false;
            }
        } else if (loseCondition.type === 'balance_or_fail') {
            if (state.balanceValue <= loseCondition.minBalance ||
                state.chouFailFactor >= loseCondition.maxFailFactor) {
                gameOver = true;
                gameWon = false;
            }
        }
    }

    if (!gameOver) {
        const isAtEnd = currentNode === 'end';
        if (winCondition && isAtEnd) {
            if (winCondition.type === 'reach_end_and_balance') {
                if (state.balanceValue >= winCondition.minBalance) {
                    gameOver = true;
                    gameWon = true;
                } else {
                    gameOver = true;
                    gameWon = false;
                }
            } else if (winCondition.type === 'reach_end_and_secret') {
                const meetsBalance = state.balanceValue >= winCondition.minBalance;
                let meetsSecret = false;
                if (winCondition.secretCondition && winCondition.secretCondition.includes('mergeMark')) {
                    const value = parseInt(winCondition.secretCondition.split('>=')[1].trim());
                    meetsSecret = state.mergeMark >= value;
                }
                if (meetsBalance && meetsSecret) {
                    gameOver = true;
                    gameWon = true;
                } else if (meetsBalance && !meetsSecret) {
                    gameOver = true;
                    gameWon = 'partial';
                } else {
                    gameOver = true;
                    gameWon = false;
                }
            }
        }
    }

    return { gameOver, gameWon };
}

function calculateScore(state, stepCount, gameWon) {
    const baseScore = state.balanceValue * 10;
    const maoBonus = state.maoReward * 25;
    const mergeBonus = state.mergeMark * 15;
    const riskPenalty = state.ziRisk * 10;
    const failPenalty = state.chouFailFactor * 20;
    const stepPenalty = stepCount * 2;

    let score = baseScore + maoBonus + mergeBonus - riskPenalty - failPenalty - stepPenalty;

    if (gameWon === true) score *= 1.5;
    else if (gameWon === 'partial') score *= 1.0;
    else score *= 0.3;

    return Math.max(0, Math.round(score));
}

function validateReplay(levelId, steps) {
    const level = Levels.getLevel(levelId);
    if (!level) return { valid: false, error: 'Invalid level ID' };

    let state = { ...level.initialState };
    let currentNode = 'start';
    let visitedNodes = ['start'];
    let eventLog = [];

    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const edge = findEdge(level, currentNode, step.toNode);

        if (!edge) {
            return { valid: false, error: `Step ${i + 1}: Invalid move from ${currentNode} to ${step.toNode}`, step: i };
        }

        if (state.balanceValue < edge.cost) {
            return { valid: false, error: `Step ${i + 1}: Insufficient balance (${state.balanceValue} < ${edge.cost})`, step: i };
        }

        state.balanceValue -= edge.cost;

        const node = level.nodes.find(n => n.id === step.toNode);
        if (node && node.event && !visitedNodes.includes(step.toNode)) {
            const event = GameEvents.getEvent(node.event);
            if (event) {
                state = applyEventEffects(state, event.effects);
                eventLog.push({ ...event, nodeId: node.id, nodeName: node.name });
            }
        }

        if (!visitedNodes.includes(step.toNode)) {
            visitedNodes.push(step.toNode);
        }

        currentNode = step.toNode;

        const gameOverResult = checkGameEnd(level, state, currentNode);
        if (gameOverResult.gameOver && i < steps.length - 1) {
            return { valid: false, error: `Step ${i + 1}: Game ended prematurely`, step: i, state: { ...state } };
        }
    }

    const finalResult = checkGameEnd(level, state, currentNode);
    const score = calculateScore(state, steps.length, finalResult.gameWon);

    return {
        valid: true,
        finalState: state,
        currentNode: currentNode,
        visitedNodes: visitedNodes,
        eventLog: eventLog,
        gameOver: finalResult.gameOver,
        gameWon: finalResult.gameWon,
        score: score,
        details: {
            baseScore: state.balanceValue * 10,
            maoBonus: state.maoReward * 25,
            mergeBonus: state.mergeMark * 15,
            riskPenalty: -state.ziRisk * 10,
            failPenalty: -state.chouFailFactor * 20,
            stepPenalty: -steps.length * 2
        }
    };
}

const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/api/settle') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const result = validateReplay(data.levelId, data.steps);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    let urlPath = req.url.split('?')[0];
    let filePath = '.' + urlPath;
    if (filePath === './') filePath = './index.html';
    filePath = path.join(__dirname, '..', filePath);

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1>', 'utf-8');
            } else {
                res.writeHead(500);
                res.end('Server Error: ' + error.code, 'utf-8');
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`\n  银盐暗房航线推演局 - 本地服务器启动`);
    console.log(`  ======================================`);
    console.log(`  地址: http://localhost:${PORT}`);
    console.log(`  结算API: POST http://localhost:${PORT}/api/settle`);
    console.log(`  ======================================\n`);
});
