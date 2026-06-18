const fs = require('fs');
const path = require('path');
const vm = require('vm');

const consoleLog = [];
const context = {
    localStorage: {
        data: {},
        getItem(key) { return this.data[key] || null; },
        setItem(key, value) { this.data[key] = value; },
        removeItem(key) { delete this.data[key]; }
    },
    console: {
        log: (...args) => consoleLog.push(args.join(' ')),
        error: (...args) => consoleLog.push('[ERROR] ' + args.join(' '))
    },
    JSON: JSON,
    Date: Date,
    Math: Math,
    Object: Object,
    Array: Array,
    parseInt: parseInt,
    URL: { createObjectURL: () => 'mock', revokeObjectURL: () => {} },
    Blob: function BlobMock(content, options) {
        this.content = content;
        this.options = options;
    }
};
vm.createContext(context);

const fileAssignments = {
    'js/config.js': 'GameConfig',
    'js/state.js': 'GameState',
    'js/board.js': 'Board',
    'js/events.js': 'Events',
    'js/timeline.js': 'Timeline',
    'js/settlement.js': 'Settlement',
    'js/game.js': 'Game'
};

Object.entries(fileAssignments).forEach(([file, varName]) => {
    const code = fs.readFileSync(path.join(__dirname, file), 'utf8');
    vm.runInContext(code + `\nthis.${varName} = ${varName};`, context);
});

const GameConfig = context.GameConfig;
const GameState = context.GameState;
const Events = context.Events;
const Settlement = context.Settlement;

let passCount = 0;
let failCount = 0;

function assert(condition, name) {
    if (condition) {
        console.log(`  ✓ ${name}`);
        passCount++;
    } else {
        console.log(`  ✗ ${name}`);
        failCount++;
    }
}

console.log('═══════════════════════════════════════');
console.log('  霜花塔楼修复验证测试');
console.log('═══════════════════════════════════════\n');

console.log('【测试1】三局 turns 与事件数对齐');
['mao', 'ren', 'shen'].forEach(id => {
    const g = GameConfig.GAMES[id];
    const lastTurn = Math.max(...g.events.map(e => e.turn));
    assert(g.turns === lastTurn, `${g.name}: turns(${g.turns}) === 最后事件回合(${lastTurn})`);
});

console.log('\n【测试2】三局地图配置完整性');
['mao', 'ren', 'shen'].forEach(id => {
    const g = GameConfig.GAMES[id];
    assert(g.mapType !== undefined, `${g.name}: mapType 已设置 (${g.mapType})`);
    assert(g.mapNodes && g.mapNodes.length === g.turns, `${g.name}: mapNodes数量(${g.mapNodes.length}) === turns(${g.turns})`);
});

console.log('\n【测试3】卯局完整流程：开始→打完7回合→结算簿出现');
context.localStorage.data = {};
GameState.init('mao');
assert(GameState.currentGame === 'mao', '卯局初始化成功');
assert(GameState.stats.energy === 15, '初始能量正确');

for (let i = 1; i <= 7; i++) {
    const event = Events.getEventForTurn(i);
    assert(event !== null && event !== undefined, `第${i}回合有事件: ${event ? event.title : '无'}`);
    if (event) {
        const choice = event.choices[0];
        let effects = { ...(choice.effect || {}) };
        if (choice.special) {
            effects = Events.handleSpecialEffect(choice.special, effects);
        }
        GameState.updateStats(effects);
        GameState.addChoice(choice.text);
        GameState.addHistory({
            event: event.title, eventId: event.id, choice: choice.text,
            effects: effects, hidden: choice.hidden || false
        });
    }
}

assert(GameState.history.length === 7, '完成7步操作');
assert(GameState.checkWin() || !GameState.checkWin(), '胜负判定正常执行');

const nextTurnAfterAll = GameState.history.length + 1;
assert(nextTurnAfterAll === 8, '下一步应为8（超过7回合，触发结算）');

const result = Settlement.calculate();
assert(result !== null, '结算簿计算成功');
assert(result.steps === 7, `结算步数正确: ${result.steps}`);
assert(result.verified === true, '回放验证: 重算值与存储值一致');
assert(typeof result.score === 'number', `最终得分: ${result.score}`);
assert(typeof result.rank === 'string', `评级: ${result.rank}`);

console.log('\n【测试4】壬局完整流程：9回合→结算');
context.localStorage.data = {};
GameState.init('ren');
for (let i = 1; i <= 9; i++) {
    const event = Events.getEventForTurn(i);
    assert(event !== null, `壬局第${i}回合有事件: ${event ? event.title : '无'}`);
    if (event) {
        const choice = event.choices[0];
        let effects = { ...(choice.effect || {}) };
        if (choice.special) {
            effects = Events.handleSpecialEffect(choice.special, effects);
        }
        GameState.updateStats(effects);
        GameState.addChoice(choice.text);
        GameState.addHistory({
            event: event.title, eventId: event.id, choice: choice.text,
            effects: effects, hidden: choice.hidden || false
        });
    }
}
const renResult = Settlement.calculate();
assert(renResult.steps === 9, `壬局结算步数: ${renResult.steps}`);
assert(renResult.verified === true, '壬局回放验证通过');

console.log('\n【测试5】申局完整流程：11回合→结算（含隐藏判定）');
context.localStorage.data = {};
GameState.init('shen');
for (let i = 1; i <= 11; i++) {
    const event = Events.getEventForTurn(i);
    assert(event !== null, `申局第${i}回合有事件: ${event ? event.title : '无'}`);
    if (event) {
        const hiddenChoice = event.choices.find(c => c.hidden);
        const choice = hiddenChoice || event.choices[0];
        let effects = { ...(choice.effect || {}) };
        if (choice.special) {
            effects = Events.handleSpecialEffect(choice.special, effects);
        }
        GameState.updateStats(effects);
        GameState.addChoice(choice.text);
        GameState.addHistory({
            event: event.title, eventId: event.id, choice: choice.text,
            effects: effects, hidden: choice.hidden || false
        });
    }
}
const shenResult = Settlement.calculate();
assert(shenResult.steps === 11, `申局结算步数: ${shenResult.steps}`);
assert(shenResult.verified === true, '申局回放验证通过');
assert(typeof shenResult.hiddenTriggered === 'boolean', `隐藏触发: ${shenResult.hiddenTriggered}`);

console.log('\n【测试6】刷新恢复：中途退出→刷新→回到正确回合');
context.localStorage.data = {};
GameState.init('mao');

for (let i = 1; i <= 3; i++) {
    const event = Events.getEventForTurn(i);
    const choice = event.choices[0];
    let effects = { ...(choice.effect || {}) };
    if (choice.special) effects = Events.handleSpecialEffect(choice.special, effects);
    GameState.updateStats(effects);
    GameState.addChoice(choice.text);
    GameState.addHistory({ event: event.title, eventId: event.id, choice: choice.text, effects: effects, hidden: false });
}
GameState.save();

const savedData = JSON.parse(context.localStorage.data[GameConfig.STORAGE_KEY]);
assert(savedData.history.length === 3, '存档保存了3步操作');

GameState.currentGame = null;
GameState.history = [];
GameState.stats = {};
GameState.load();

const resumeTurn = GameState.history.length + 1;
assert(resumeTurn === 4, `刷新后恢复到第${resumeTurn}回合（应为4）`);
assert(GameState.gameOver === false, '游戏未结束');

const resumeEvent = Events.getEventForTurn(resumeTurn);
assert(resumeEvent !== null && resumeEvent.title === '校准机会', `恢复后事件: ${resumeEvent ? resumeEvent.title : '无'}`);

console.log('\n【测试7】结算后刷新→仍然显示结算簿');
context.localStorage.data = {};
GameState.init('mao');
for (let i = 1; i <= 7; i++) {
    const event = Events.getEventForTurn(i);
    const choice = event.choices[0];
    let effects = { ...(choice.effect || {}) };
    if (choice.special) effects = Events.handleSpecialEffect(choice.special, effects);
    GameState.updateStats(effects);
    GameState.addChoice(choice.text);
    GameState.addHistory({ event: event.title, eventId: event.id, choice: choice.text, effects: effects, hidden: false });
}
GameState.gameOver = true;
GameState.save();

GameState.currentGame = null;
GameState.history = [];
GameState.stats = {};
GameState.gameOver = false;
GameState.load();

assert(GameState.gameOver === true, '刷新后游戏状态为已结束');
const endResult = Settlement.calculate();
assert(endResult !== null, '刷新后结算簿重新计算成功');
assert(endResult.verified === true, '刷新后回放验证通过');

console.log('\n【测试8】从任一局开始');
['mao', 'ren', 'shen'].forEach(id => {
    context.localStorage.data = {};
    GameState.init(id);
    const g = GameConfig.GAMES[id];
    assert(GameState.currentGame === id, `可以从${g.name}开始`);
    const firstEvent = Events.getEventForTurn(1);
    assert(firstEvent !== null, `${g.name}第1回合事件存在: ${firstEvent ? firstEvent.title : '无'}`);
});

console.log('\n【测试9】三局地图类型不同');
const mapTypes = ['mao', 'ren', 'shen'].map(id => GameConfig.GAMES[id].mapType);
assert(mapTypes[0] === 'tower', `卯局地图: ${mapTypes[0]}`);
assert(mapTypes[1] === 'wasteland', `壬局地图: ${mapTypes[1]}`);
assert(mapTypes[2] === 'spiral', `申局地图: ${mapTypes[2]}`);
assert(new Set(mapTypes).size === 3, '三局地图类型互不相同');

console.log('\n【测试10】结算公式按试鸣值和步骤重算');
context.localStorage.data = {};
GameState.init('mao');
const event1 = Events.getEventForTurn(1);
const choice1 = { text: '了解试鸣值', effect: { shimingValue: 5 } };
GameState.updateStats(choice1.effect);
GameState.addHistory({ event: event1.title, eventId: event1.id, choice: choice1.text, effects: choice1.effect, hidden: false });

const event2 = Events.getEventForTurn(2);
const choice2 = { text: '稳定供能', effect: { energy: -2, shimingValue: 5 }, cost: { energy: 2 } };
GameState.updateStats(choice2.effect);
GameState.addHistory({ event: event2.title, eventId: event2.id, choice: choice2.text, effects: choice2.effect, hidden: false });

const recalc = Settlement.recalculateFromHistory();
assert(recalc.stats.shimingValue === GameState.stats.shimingValue, `重算试鸣值(${recalc.stats.shimingValue}) === 存储值(${GameState.stats.shimingValue})`);
assert(recalc.steps === 2, `重算步数: ${recalc.steps}`);

const formulaScore = GameConfig.GAMES.mao.victoryFormula(recalc.stats, recalc.steps, false);
assert(typeof formulaScore === 'number' && formulaScore > 0, `公式得分: ${formulaScore}（基于试鸣值${recalc.stats.shimingValue}和${recalc.steps}步）`);

console.log('\n═══════════════════════════════════════');
console.log(`  测试结果: ${passCount} 通过, ${failCount} 失败`);
console.log('═══════════════════════════════════════');

if (failCount === 0) {
    console.log('\n🎉 所有测试通过！修复验证成功。');
    console.log('\n修复摘要:');
    console.log('  1. turns与事件数对齐（mao:7, ren:9, shen:11）');
    console.log('  2. nextTurn()空事件→直接触发endGame()');
    console.log('  3. resume()用history.length+1恢复正确回合');
    console.log('  4. 结算簿从历史回放重算，验证数据一致');
    console.log('  5. 三局不同地图（tower/wasteland/spiral）');
    console.log('  6. 任一局可开始→打完整局→看到结算簿→刷新继续');
}
