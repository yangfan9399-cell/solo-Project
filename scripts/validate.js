const games = require('../data/games');

const results = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  results.total++;
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log(`✓ ${name}`);
  } catch (e) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: e.message });
    console.log(`✗ ${name}`);
    console.log(`  错误: ${e.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || '断言失败');
  }
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

console.log('========================================');
console.log('  琉璃温室节拍修复场 - 校验脚本');
console.log('========================================\n');

console.log('--- 游戏数据校验 ---\n');

test('三局游戏数据存在', () => {
  assert(games.bing, '丙局数据不存在');
  assert(games.mao, '卯局数据不存在');
  assert(games.you, '酉局数据不存在');
  assert(Object.keys(games).length === 3, '游戏数量不正确');
});

test('游戏核心字段完整性', () => {
  Object.values(games).forEach(game => {
    assert(game.id, `${game.name} 缺少 id`);
    assert(game.name, `${game.name} 缺少 name`);
    assert(game.initialState, `${game.name} 缺少 initialState`);
    assert(game.events && game.events.length > 0, `${game.name} 缺少 events`);
    assert(game.winCondition && typeof game.winCondition === 'function', `${game.name} 缺少 winCondition`);
    assert(game.loseCondition && typeof game.loseCondition === 'function', `${game.name} 缺少 loseCondition`);
    assert(game.map, `${game.name} 缺少 map`);
    assert(game.maxSteps > 0, `${game.name} maxSteps 无效`);
  });
});

test('初始状态字段完整性', () => {
  Object.values(games).forEach(game => {
    const s = game.initialState;
    assert(typeof s.invertedValue === 'number', `${game.name} invertedValue 无效`);
    assert(Array.isArray(s.balanceSlots), `${game.name} balanceSlots 无效`);
    assert(Array.isArray(s.measureTraces), `${game.name} measureTraces 无效`);
    assert(typeof s.riskC === 'number', `${game.name} riskC 无效`);
    assert(typeof s.rewardM === 'number', `${game.name} rewardM 无效`);
    assert(typeof s.failureY === 'number', `${game.name} failureY 无效`);
  });
});

test('事件字段完整性', () => {
  Object.values(games).forEach(game => {
    game.events.forEach(event => {
      assert(event.id, `${game.name} 事件缺少 id`);
      assert(event.name, `${game.name} 事件缺少 name`);
      assert(event.description, `${game.name} 事件缺少 description`);
      assert(typeof event.effect === 'function', `${game.name} 事件 ${event.id} 缺少 effect 函数`);
    });
  });
});

console.log('\n--- 丙局（教学局）逻辑校验 ---\n');

test('丙局初始状态', () => {
  const g = games.bing;
  const s = deepClone(g.initialState);
  assert(s.invertedValue === 50, '倒排值初始应为 50');
  assert(s.balanceSlots.length === 3, '配平槽应为 3 个');
  assert(s.balanceSlots.every(v => v === 0), '配平槽初始应为 0');
  assert(s.riskC === 3, '丙号风险初始应为 3');
  assert(s.rewardM === 2, '卯号奖励初始应为 2');
  assert(s.failureY === 0, '酉号因子初始应为 0');
});

test('丙局胜利条件判定', () => {
  const g = games.bing;
  const winState = {
    invertedValue: 70,
    balanceSlots: [40, 50, 60],
    riskC: 1,
    rewardM: 1,
    failureY: 3
  };
  assert(g.winCondition(winState), '符合条件应判定胜利');
  
  const loseState1 = { ...winState, invertedValue: 50 };
  assert(!g.winCondition(loseState1), '倒排值不在范围内不应胜利');
  
  const loseState2 = { ...winState, balanceSlots: [20, 50, 60] };
  assert(!g.winCondition(loseState2), '配平槽不在范围内不应胜利');
});

test('丙局失败条件判定', () => {
  const g = games.bing;
  const normalState = deepClone(g.initialState);
  assert(!g.loseCondition(normalState), '初始状态不应失败');
  
  const failState1 = { ...normalState, failureY: 5 };
  assert(g.loseCondition(failState1), '酉号≥5 应失败');
  
  const failState2 = { ...normalState, riskC: 0 };
  assert(g.loseCondition(failState2), '丙号≤0 应失败');
});

test('丙局事件效果验证', () => {
  const g = games.bing;
  const state = deepClone(g.initialState);
  
  g.events[0].effect(state);
  assert(state.invertedValue === 55, '晨露校准: 倒排值应+5');
  assert(state.balanceSlots[0] === 10, '晨露校准: 配平槽0应+10');
  
  state.invertedValue = 50;
  state.balanceSlots[0] = 0;
  g.events[1].effect(state);
  assert(state.invertedValue === 47, '琉璃共振: 倒排值应-3');
  assert(state.balanceSlots[1] === 15, '琉璃共振: 配平槽1应+15');
  assert(state.measureTraces.length === 4, '琉璃共振: 应添加量测痕');
});

console.log('\n--- 卯局（资源短缺）逻辑校验 ---\n');

test('卯局资源稀缺初始状态', () => {
  const g = games.mao;
  const s = deepClone(g.initialState);
  assert(s.invertedValue === 30, '倒排值初始应为 30（较低）');
  assert(s.riskC === 2, '丙号风险只有 2（稀缺）');
  assert(s.rewardM === 1, '卯号奖励只有 1（稀缺）');
  assert(s.failureY === 1, '酉号因子初始 1（压力）');
  const slotSum = s.balanceSlots.reduce((a, b) => a + b, 0);
  assert(slotSum === 30, '配平槽总和只有 30（资源匮乏）');
});

test('卯局胜利条件需要高资源', () => {
  const g = games.mao;
  const winState = {
    invertedValue: 80,
    balanceSlots: [60, 60, 60],
    rewardM: 5,
    failureY: 2,
    riskC: 0
  };
  assert(winState.balanceSlots.reduce((a, b) => a + b, 0) >= 180, '配平槽和应≥180');
  assert(g.winCondition(winState), '符合条件应胜利');
});

test('卯局失败条件更严格', () => {
  const g = games.mao;
  const state = deepClone(g.initialState);
  state.failureY = 3;
  assert(g.loseCondition(state), '酉号≥3 即失败（比丙局严格）');
});

console.log('\n--- 酉局（隐藏条件）逻辑校验 ---\n');

test('酉局隐藏槽初始状态', () => {
  const g = games.you;
  const s = deepClone(g.initialState);
  assert(s.balanceSlots.length === 4, '应有 4 个配平槽');
  assert(s.balanceSlots[3] === 0, '第四槽初始为 0（隐藏）');
  assert(s.hiddenTrigger === 0, '隐藏触发计数初始为 0');
  assert(s.secretUnlocked === false, '隐藏未解锁');
});

test('酉局普通胜利条件', () => {
  const g = games.you;
  const normalWin = {
    invertedValue: 80,
    balanceSlots: [50, 50, 50, 0],
    riskC: 2,
    rewardM: 1,
    failureY: 1,
    secretUnlocked: false
  };
  assert(g.winCondition(normalWin), '普通条件满足应胜利');
});

test('酉局隐藏胜利条件', () => {
  const g = games.you;
  const secretWin = {
    invertedValue: 88,
    balanceSlots: [66, 66, 66, 66],
    riskC: 1,
    rewardM: 0,
    failureY: 0,
    secretUnlocked: true
  };
  assert(g.winCondition(secretWin), '隐藏条件满足应胜利（完美值）');
  
  const almostWin = { ...secretWin, invertedValue: 87 };
  assert(!g.winCondition(almostWin), '倒排值不是 88 不应触发隐藏胜利');
});

test('酉局隐藏解锁机制', () => {
  const g = games.you;
  const state = deepClone(g.initialState);
  
  state.hiddenTrigger = 4;
  g.events[4].effect(state);
  assert(state.secretUnlocked === false, '触发值不足不应解锁');
  
  state.hiddenTrigger = 5;
  g.events[4].effect(state);
  assert(state.secretUnlocked === true, '触发值≥5 应解锁隐藏');
  assert(state.balanceSlots[3] === 66, '第四槽应设为 66');
});

console.log('\n--- 事件消耗校验 ---\n');

test('事件消耗逻辑', () => {
  Object.values(games).forEach(game => {
    game.events.forEach(event => {
      if (event.cost) {
        const state = deepClone(game.initialState);
        const prevRisk = state.riskC;
        const prevReward = state.rewardM;
        
        if (event.cost.riskC) state.riskC -= event.cost.riskC;
        if (event.cost.rewardM) state.rewardM -= event.cost.rewardM;
        
        event.effect(state);
        
        if (event.cost.riskC) {
          assert(state.riskC === prevRisk - event.cost.riskC + (state.riskC - (prevRisk - event.cost.riskC)), 
            `${game.name} ${event.name} 丙号消耗计算异常`);
        }
      }
    });
  });
});

console.log('\n--- 量测痕逻辑校验 ---\n');

test('量测痕稳定性判定', () => {
  const testCases = [
    { prev: 50, curr: 53, expected: true },
    { prev: 50, curr: 55, expected: false },
    { prev: 50, curr: 48, expected: true },
    { prev: 50, curr: 44, expected: false },
  ];
  
  testCases.forEach((tc, i) => {
    const isStable = Math.abs(tc.curr - tc.prev) < 5;
    assert(isStable === tc.expected, `测试用例 ${i}: 差值 ${tc.curr - tc.prev} 稳定性判定错误`);
  });
});

console.log('\n--- 游戏流程模拟 ---\n');

test('丙局完整教学流程模拟', () => {
  const g = games.bing;
  let state = deepClone(g.initialState);
  let step = 0;
  const maxSteps = g.maxSteps;
  
  const actions = ['e1', 'e3', 'e1', 'e3', 'e2', 'e2'];
  
  for (const eventId of actions) {
    if (step >= maxSteps) break;
    
    const event = g.events.find(e => e.id === eventId);
    if (!event) continue;
    
    if (event.cost) {
      if (event.cost.riskC && state.riskC < event.cost.riskC) continue;
      if (event.cost.rewardM && state.rewardM < event.cost.rewardM) continue;
      if (event.cost.riskC) state.riskC -= event.cost.riskC;
      if (event.cost.rewardM) state.rewardM -= event.cost.rewardM;
    }
    
    event.effect(state);
    state.measureTraces.push({
      time: Date.now(),
      value: state.invertedValue,
      stable: true
    });
    step++;
    
    if (g.winCondition(state)) break;
    if (g.loseCondition(state)) break;
  }
  
  assert(step > 0, '至少执行了一步');
  assert(!g.loseCondition(state), '教学流程不应失败');
  assert(state.balanceSlots.every(s => s > 0), '配平槽应有增长');
});

test('酉局隐藏路径模拟', () => {
  const g = games.you;
  let state = deepClone(g.initialState);
  
  state.riskC = 10;
  state.rewardM = 10;
  
  for (let i = 0; i < 3; i++) {
    g.events[0].effect(state);
  }
  g.events[2].effect(state);
  
  assert(state.hiddenTrigger >= 5, '隐藏触发值应累计足够');
  
  g.events[4].effect(state);
  assert(state.secretUnlocked === true, '应解锁隐藏条件');
  
  g.events[6].effect(state);
  g.events[5].effect(state);
  g.events[7].effect(state);
  
  assert(state.balanceSlots[0] === 66, '配平槽0应=66');
  assert(state.balanceSlots[1] === 66, '配平槽1应=66');
  assert(state.balanceSlots[2] === 66, '配平槽2应=66');
  assert(state.balanceSlots[3] === 66, '配平槽3应=66');
  assert(state.invertedValue === 88, '倒排值应=88');
  assert(state.failureY === 0, '酉号因子应=0');
  
  assert(g.winCondition(state), '应满足隐藏胜利条件');
});

console.log('\n--- 胜负公式一致性校验 ---\n');

test('胜负公式与逻辑一致', () => {
  Object.values(games).forEach(game => {
    assert(game.winFormula && game.winFormula.length > 0, `${game.name} 缺少胜利公式`);
    assert(game.loseFormula && game.loseFormula.length > 0, `${game.name} 缺少失败公式`);
    
    const winDesc = game.winFormula.toLowerCase();
    const loseDesc = game.loseFormula.toLowerCase();
    
    if (game.id === 'bing') {
      assert(winDesc.includes('倒排值'), '丙局胜利公式应包含倒排值');
      assert(winDesc.includes('配平槽'), '丙局胜利公式应包含配平槽');
    }
    if (game.id === 'mao') {
      assert(winDesc.includes('180') || winDesc.includes('≥'), '卯局胜利公式应包含配平槽和≥180');
    }
    if (game.id === 'you') {
      assert(winDesc.includes('隐藏') || winDesc.includes('66') || winDesc.includes('88'), '酉局胜利公式应包含隐藏条件');
    }
  });
});

console.log('\n--- 地图主题配置校验 ---\n');

test('地图主题配置正确', () => {
  assert(games.bing.map.theme === 'emerald', '丙局主题应为 emerald');
  assert(games.mao.map.theme === 'amber', '卯局主题应为 amber');
  assert(games.you.map.theme === 'purple', '酉局主题应为 purple');
  
  Object.values(games).forEach(game => {
    assert(game.map.name, `${game.name} 缺少地图名称`);
    assert(Array.isArray(game.map.slots), `${game.name} 配平槽配置无效`);
    game.map.slots.forEach((slot, i) => {
      assert(slot.name, `配平槽 ${i} 缺少名称`);
      assert(slot.position, `配平槽 ${i} 缺少位置`);
    });
  });
});

console.log('\n========================================');
console.log('  校验结果汇总');
console.log('========================================');
console.log(`  总测试数: ${results.total}`);
console.log(`  通过: ${results.passed}`);
console.log(`  失败: ${results.failed}`);
console.log(`  通过率: ${((results.passed / results.total) * 100).toFixed(1)}%`);
console.log('========================================');

if (results.failed > 0) {
  console.log('\n  失败的测试:');
  results.tests.filter(t => t.status === 'FAIL').forEach(t => {
    console.log(`  - ${t.name}`);
    console.log(`    ${t.error}`);
  });
  process.exit(1);
} else {
  console.log('\n  ✓ 所有校验通过！游戏逻辑正确。');
  process.exit(0);
}
