const http = require('http');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

const context = {
    localStorage: { data: {}, getItem(k){return this.data[k]||null;}, setItem(k,v){this.data[k]=v;}, removeItem(k){delete this.data[k];} },
    console: { log: (...a) => console.log(...a), error: (...a) => console.error(...a), warn: (...a) => console.warn(...a) },
    JSON, Date, Math, Object, Array, parseInt,
    URL: { createObjectURL: () => 'mock', revokeObjectURL: () => {} },
    Blob: function(c,o){this.content=c;this.options=o;},
    fetch: function(url, options) {
        return new Promise((resolve, reject) => {
            const reqBody = options ? JSON.parse(options.body) : {};
            const postData = JSON.stringify(reqBody);
            const req = http.request({
                hostname: 'localhost', port: 3002, path: url,
                method: options ? options.method : 'GET',
                headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve({ ok: res.statusCode === 200, status: res.statusCode, json: () => JSON.parse(data) }));
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

const { GameConfig, GameState, Events, Settlement } = context;

let passCount = 0, failCount = 0;
function assert(cond, name) {
    if (cond) { console.log(`  ✓ ${name}`); passCount++; }
    else { console.log(`  ✗ ${name}`); failCount++; }
}

console.log('═══════════════════════════════════════');
console.log('  special 效果后端回放一致性验证');
console.log('═══════════════════════════════════════\n');

async function simulateAndCompare(gameId, choiceStrategy, label) {
    context.localStorage.data = {};
    GameState.init(gameId);
    const config = GameConfig.GAMES[gameId];

    for (let i = 1; i <= config.turns; i++) {
        const event = Events.getEventForTurn(i);
        const choice = choiceStrategy(event, i);
        let effects = { ...(choice.effect || {}) };
        if (choice.special) {
            effects = Events.handleSpecialEffect(choice.special, effects);
        }
        GameState.updateStats(effects);
        GameState.addChoice(choice.text);
        GameState.addHistory({
            event: event.title, eventId: event.id, choice: choice.text,
            effects: effects,
            baseEffect: { ...(choice.effect || {}) },
            hidden: choice.hidden || false,
            special: choice.special || undefined
        });
    }

    GameState.gameOver = true;

    const frontendStats = { ...GameState.stats };
    const backendResult = await Settlement.calculateFromServer();

    console.log(`\n【${label}】`);
    console.log(`  前端实时状态: 试鸣值=${frontendStats.shimingValue}, 风险=${frontendStats.maoRisk}, 能量=${frontendStats.energy}, 晶核=${frontendStats.crystal}, 零件=${frontendStats.parts}, 试鸣痕=${frontendStats.shimingMark}`);
    console.log(`  后端回放状态: 试鸣值=${backendResult.stats.shimingValue}, 风险=${backendResult.stats.maoRisk}, 能量=${backendResult.stats.energy}, 晶核=${backendResult.stats.crystal}, 零件=${backendResult.stats.parts}, 试鸣痕=${backendResult.stats.shimingMark}`);
    console.log(`  后端得分=${backendResult.score}, 评级=${backendResult.rank}, verified=${backendResult.verified}, serverCalculated=${backendResult.serverCalculated}`);

    const statsMatch = JSON.stringify(frontendStats) === JSON.stringify(backendResult.stats);
    assert(statsMatch, `${label}: 前端状态与后端回放完全一致`);
    assert(backendResult.verified === true, `${label}: 后端 verified=true`);
    assert(backendResult.serverCalculated === true, `${label}: 标识为后端结算`);

    return backendResult;
}

async function runTests() {
    const renResult = await simulateAndCompare('ren', (event, turn) => {
        if (turn === 9) return event.choices.find(c => c.special === 'all_in') || event.choices[0];
        return event.choices[0];
    }, '壬局 all_in（第9回合梭哈）');

    assert(renResult.stats.energy === 0, '壬局 all_in 后能量归零');
    assert(renResult.stats.crystal === 0, '壬局 all_in 后晶核归零');
    assert(renResult.stats.parts === 0, '壬局 all_in 后零件归零');
    const allInShiming = renResult.stats.shimingValue;
    assert(allInShiming > 0, `壬局 all_in 试鸣值正确: ${allInShiming}`);

    const shenResult = await simulateAndCompare('shen', (event, turn) => {
        if (turn === 10) return event.choices.find(c => c.special === 'activate_core') || event.choices[0];
        if (turn === 11) return event.choices.find(c => c.special === 'final_sprint') || event.choices[0];
        return event.choices[0];
    }, '申局 activate_core + final_sprint');

    assert(shenResult.history[9].special === 'activate_core', 'activate_core 已记录');
    assert(shenResult.history[10].special === 'final_sprint', 'final_sprint 已记录');
    assert(shenResult.stats.shimingMark >= 10, `activate_core 后试鸣痕正确: ${shenResult.stats.shimingMark}`);

    const mixedResult = await simulateAndCompare('shen', (event, turn) => {
        if (turn === 10) return event.choices.find(c => c.special === 'activate_core') || event.choices[0];
        if (turn === 11) return event.choices.find(c => c.special === 'final_sprint') || event.choices[0];
        const hiddenChoice = event.choices.find(c => c.hidden);
        return hiddenChoice || event.choices[0];
    }, '申局 隐藏选择+activate_core+final_sprint 混合');

    const normalResult = await simulateAndCompare('mao', (event, turn) => event.choices[0], '卯局 无 special 基准');
    assert(normalResult.serverCalculated === true, '卯局后端结算正常');

    const noSpecialRen = await simulateAndCompare('ren', (event, turn) => event.choices[0], '壬局 不触发 all_in');
    assert(noSpecialRen.serverCalculated === true, '壬局无special后端结算正常');

    console.log('\n【得分公式验证】');
    const maoResult = await simulateAndCompare('mao', (event, turn) => event.choices[0], '卯局公式重算');
    const expectedScore = maoResult.stats.shimingValue * 10 - maoResult.stats.maoRisk * 3 + Math.max(0, (20 - 7) * 5) + maoResult.stats.crystal * 8;
    assert(maoResult.score === expectedScore, `卯局得分公式正确: ${maoResult.score} === ${expectedScore}`);

    console.log('\n【special 重复套用检查】');
    const renAllInAlone = await simulateAndCompare('ren', (event, turn) => {
        if (turn === 9) return event.choices.find(c => c.special === 'all_in') || event.choices[0];
        return event.choices.find(c => !c.special) || event.choices[0];
    }, '壬局 仅最后一回合梭哈');

    const renNoAllIn = await simulateAndCompare('ren', (event, turn) => {
        if (turn === 9) return event.choices.find(c => !c.special) || event.choices[0];
        return event.choices[0];
    }, '壬局 不梭哈');
    assert(renNoAllIn.stats.energy !== 0 || renNoAllIn.stats.crystal !== 0, '不梭哈时资源未归零');
    assert(renAllInAlone.stats.energy === 0 && renAllInAlone.stats.crystal === 0, '梭哈时资源归零');
    assert(renAllInAlone.stats.shimingValue !== renNoAllIn.stats.shimingValue, '梭哈与不梭哈试鸣值不同');

    console.log('\n═══════════════════════════════════════');
    console.log(`  测试结果: ${passCount} 通过, ${failCount} 失败`);
    console.log('═══════════════════════════════════════');
    if (failCount === 0) {
        console.log('\n🎉 special 效果后端回放一致性验证全部通过！');
        console.log('  修复: 后端从 baseEffect(special前) 重算，不再重复套用 special');
    }
}

runTests().catch(e => { console.error('测试失败:', e); process.exit(1); });
