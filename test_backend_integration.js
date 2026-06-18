const http = require('http');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const context = {
    localStorage: { data: {}, getItem(key) { return this.data[key] || null; }, setItem(key, value) { this.data[key] = value; }, removeItem(key) { delete this.data[key]; } },
    console: { log: (...args) => console.log(...args), error: (...args) => console.error(...args), warn: (...args) => console.warn(...args) },
    JSON: JSON, Date: Date, Math: Math, Object: Object, Array: Array,
    parseInt: parseInt, URL: { createObjectURL: () => 'mock', revokeObjectURL: () => {} },
    Blob: function BlobMock(content, options) { this.content = content; this.options = options; },
    fetch: function(url, options) {
        return new Promise((resolve, reject) => {
            const reqBody = options ? JSON.parse(options.body) : {};
            const postData = JSON.stringify(reqBody);
            
            const reqOptions = {
                hostname: 'localhost',
                port: 3001,
                path: url,
                method: options ? options.method : 'GET',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
            };

            const req = http.request(reqOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        ok: res.statusCode === 200,
                        status: res.statusCode,
                        json: () => JSON.parse(data)
                    });
                });
            });
            req.on('error', reject);
            req.write(postData);
            req.end();
        });
    }
};
vm.createContext(context);

const fileAssignments = {
    'js/config.js': 'GameConfig', 'js/state.js': 'GameState', 'js/board.js': 'Board',
    'js/events.js': 'Events', 'js/timeline.js': 'Timeline', 'js/settlement.js': 'Settlement', 'js/game.js': 'Game'
};
Object.entries(fileAssignments).forEach(([file, varName]) => {
    const code = fs.readFileSync(path.join(__dirname, file), 'utf8');
    vm.runInContext(code + `\nthis.${varName} = ${varName};`, context);
});

const { GameConfig, GameState, Events, Settlement, Game } = context;

let passCount = 0; let failCount = 0;
function assert(condition, name) {
    if (condition) { console.log(`  ✓ ${name}`); passCount++; }
    else { console.log(`  ✗ ${name}`); failCount++; }
}

console.log('═══════════════════════════════════════');
console.log('  后端结算集成测试 (API: localhost:3001)');
console.log('═══════════════════════════════════════\n');

async function simulateGame(gameId, choiceStrategy) {
    context.localStorage.data = {};
    GameState.init(gameId);
    const config = GameConfig.GAMES[gameId];

    for (let i = 1; i <= config.turns; i++) {
        const event = Events.getEventForTurn(i);
        const choice = choiceStrategy(event, i);
        let effects = { ...(choice.effect || {}) };
        if (choice.special) effects = Events.handleSpecialEffect(choice.special, effects);
        GameState.updateStats(effects);
        GameState.addChoice(choice.text);
        GameState.addHistory({ event: event.title, eventId: event.id, choice: choice.text, effects: effects, hidden: choice.hidden || false, special: choice.special || undefined });
    }

    GameState.gameOver = true;
    return await Settlement.calculateFromServer();
}

async function runTests() {
    console.log('【测试1】卯局完整流程 → 后端结算');
    const maoResult = await simulateGame('mao', (event, turn) => event.choices[0]);
    assert(maoResult !== null && !maoResult.error, '后端返回有效结果');
    assert(maoResult.serverCalculated === true, '标识为后端结算');
    assert(maoResult.score > 0, `得分有效: ${maoResult.score}`);
    assert(['S','A','B','C','F'].includes(maoResult.rank), `评级有效: ${maoResult.rank}`);
    assert(maoResult.steps === 7, `步骤正确: ${maoResult.steps}`);
    assert(maoResult.verified === true, '数据校验通过');
    assert(Array.isArray(maoResult.breakdown) && maoResult.breakdown.length >= 4, '得分明细完整');
    assert(Array.isArray(maoResult.replayLog) && maoResult.replayLog.length >= 5, '回放日志完整');
    console.log(`      结果: ${maoResult.rank} - ${maoResult.score}分 (后端结算: ${maoResult.serverCalculated})`);

    console.log('\n【测试2】壬局完整流程 → 后端结算');
    const renResult = await simulateGame('ren', (event, turn) => event.choices[0]);
    assert(renResult !== null && !renResult.error, '后端返回有效结果');
    assert(renResult.serverCalculated === true, '标识为后端结算');
    assert(renResult.score > 0, `得分有效: ${renResult.score}`);
    assert(renResult.steps === 9, `步骤正确: ${renResult.steps}`);
    assert(renResult.verified === true, '数据校验通过');
    console.log(`      结果: ${renResult.rank} - ${renResult.score}分 (后端结算: ${renResult.serverCalculated})`);

    console.log('\n【测试3】申局完整流程 → 后端结算（含隐藏判定）');
    const shenResult = await simulateGame('shen', (event, turn) => {
        const hiddenChoice = event.choices.find(c => c.hidden);
        return hiddenChoice || event.choices[0];
    });
    assert(shenResult !== null && !shenResult.error, '后端返回有效结果');
    assert(shenResult.serverCalculated === true, '标识为后端结算');
    assert(shenResult.score > 0, `得分有效: ${shenResult.score}`);
    assert(shenResult.steps === 11, `步骤正确: ${shenResult.steps}`);
    assert(typeof shenResult.hiddenTriggered === 'boolean', `隐藏判定: ${shenResult.hiddenTriggered}`);
    if (shenResult.hiddenTriggered) {
        const hasHiddenBonus = shenResult.breakdown.some(b => b.label.includes('隐藏条件奖励'));
        assert(hasHiddenBonus, '包含隐藏条件奖励明细');
    }
    console.log(`      结果: ${shenResult.rank} - ${shenResult.score}分 (隐藏: ${shenResult.hiddenTriggered}, 后端: ${shenResult.serverCalculated})`);

    console.log('\n【测试4】后端按试鸣值和步骤重算验证');
    const verifyResult = await simulateGame('mao', (event, turn) => event.choices[0]);
    const expectedShiming = 10 + 5 + 5 + 15 + 0 + 0 + 20 + 25;
    assert(verifyResult.stats.shimingValue === expectedShiming, `试鸣值重算正确: ${verifyResult.stats.shimingValue} === ${expectedShiming}`);
    assert(verifyResult.stats.maoRisk === 5 + 0 + 0 + 0 + 0 + 15 + 0 + 10, `风险值重算正确: ${verifyResult.stats.maoRisk}`);
    const expectedScore = verifyResult.stats.shimingValue * 10 - verifyResult.stats.maoRisk * 3 + Math.max(0,(20-verifyResult.steps)*5) + verifyResult.stats.crystal * 8;
    assert(verifyResult.score === expectedScore, `公式重算正确: ${verifyResult.score} === ${expectedScore}`);
    console.log(`      公式验证: 试鸣值×10 - 风险×3 + 步骤奖励 + 晶核奖励 = ${verifyResult.score}`);

    console.log('\n【测试5】三局试鸣值计算公式不同');
    const games = ['mao', 'ren', 'shen'];
    const multipliers = { mao: 10, ren: 12, shen: 15 };
    for (const id of games) {
        const result = await simulateGame(id, (event, turn) => event.choices[0]);
        const expectedBase = result.stats.shimingValue * multipliers[id];
        const actualBase = result.breakdown[0].value;
        assert(actualBase === expectedBase, `${GameConfig.GAMES[id].name} 基础分: ${actualBase} === 试鸣值×${multipliers[id]}`);
    }

    console.log('\n【测试6】special效果后端处理（壬局 all_in）');
    const allInResult = await simulateGame('ren', (event, turn) => {
        if (turn === 9) return event.choices.find(c => c.special === 'all_in') || event.choices[0];
        return event.choices[0];
    });
    assert(allInResult.stats.energy === 0, 'all_in 后能量为0');
    assert(allInResult.stats.crystal === 0, 'all_in 后晶核为0');
    assert(allInResult.stats.parts === 0, 'all_in 后零件为0');
    console.log(`      all_in 效果: 试鸣值 +${allInResult.history[8].effects.shimingValue}, 资源归零 ✓`);

    console.log('\n【测试7】special效果后端处理（申局 activate_core）');
    const coreResult = await simulateGame('shen', (event, turn) => {
        if (turn === 10) return event.choices.find(c => c.special === 'activate_core') || event.choices[0];
        if (turn === 11) return event.choices.find(c => c.special === 'final_sprint') || event.choices[0];
        return event.choices[0];
    });
    assert(coreResult.history[9].special === 'activate_core', 'activate_core 已记录');
    assert(coreResult.history[10].special === 'final_sprint', 'final_sprint 已记录');
    console.log(`      activate_core 和 final_sprint 效果后端处理 ✓`);

    console.log('\n═══════════════════════════════════════');
    console.log(`  测试结果: ${passCount} 通过, ${failCount} 失败`);
    console.log('═══════════════════════════════════════\n');

    if (failCount === 0) {
        console.log('🎉 所有后端结算集成测试通过！');
        console.log('\n集成架构:');
        console.log('  1. 页面调用 POST /api/settlement 接口');
        console.log('  2. 后端 Node.js 按霜花塔楼试鸣值和竞速经营步骤重算');
        console.log('  3. 返回分数、评级、得分明细、回放日志给前端');
        console.log('  4. 结算簿展示后端返回的结果（带"后端结算"标识）');
    }
}

runTests().catch(e => {
    console.error('测试执行失败:', e);
    process.exit(1);
});
