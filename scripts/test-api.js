const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.write(JSON.stringify(data));
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3000' + path, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve(JSON.parse(body)));
    });
  });
}

async function test() {
  console.log('=== API 集成测试 ===\n');
  
  console.log('1. 创建丙局会话...');
  const session = await post('/api/sessions', { gameId: 'bing' });
  console.log('   ✓ 会话ID:', session.session.sessionId);
  console.log('   ✓ 初始倒排值:', session.session.currentState.invertedValue);
  console.log('   ✓ 初始配平槽:', session.session.currentState.balanceSlots);
  
  const sessionId = session.session.sessionId;
  
  console.log('\n2. 执行事件: 晨露校准...');
  const result1 = await post('/api/sessions/' + sessionId + '/execute', { eventId: 'e1' });
  console.log('   ✓ 成功:', result1.success);
  console.log('   ✓ 倒排值变化:', result1.delta.invertedValue);
  console.log('   ✓ 配平槽0变化:', result1.delta.balanceSlots[0]);
  console.log('   ✓ 当前倒排值:', result1.session.currentState.invertedValue);
  
  console.log('\n3. 执行事件: 温室调和...');
  const result2 = await post('/api/sessions/' + sessionId + '/execute', { eventId: 'e3' });
  console.log('   ✓ 成功:', result2.success);
  console.log('   ✓ 卯号奖励变化:', result2.delta.rewardM);
  console.log('   ✓ 配平槽2变化:', result2.delta.balanceSlots[2]);
  
  console.log('\n4. 获取回放历史...');
  const replay = await get('/api/sessions/' + sessionId + '/replay');
  console.log('   ✓ 历史步数:', replay.history.length);
  console.log('   ✓ 事件序列:', replay.history.map(h => h.eventName).join(' → '));
  
  console.log('\n5. 执行多步准备结算...');
  await post('/api/sessions/' + sessionId + '/execute', { eventId: 'e1' });
  await post('/api/sessions/' + sessionId + '/execute', { eventId: 'e3' });
  await post('/api/sessions/' + sessionId + '/execute', { eventId: 'e2' });
  
  console.log('\n6. 请求后端结算重算...');
  const settlement = await post('/api/sessions/' + sessionId + '/settle', {});
  console.log('   ✓ 重算状态:', settlement.recalculated);
  console.log('   ✓ 重算步数:', settlement.steps.length);
  console.log('   ✓ 最终得分:', settlement.score.total);
  console.log('   ✓ 最终倒排值:', settlement.finalState.invertedValue);
  console.log('   ✓ 最终配平槽:', settlement.finalState.balanceSlots);
  console.log('   ✓ 胜负验证:', settlement.finalResult.win ? '胜利' : '未胜利');
  
  console.log('\n7. 测试酉局初始状态不直接胜利...');
  const youSession = await post('/api/sessions', { gameId: 'you' });
  const youId = youSession.session.sessionId;
  const youInit = youSession.session.currentState;
  console.log('   ✓ 酉局会话创建');
  console.log('   ✓ 初始倒排值:', youInit.invertedValue, '(应<50)');
  console.log('   ✓ 初始配平槽:', youInit.balanceSlots.slice(0,3), '(应<40)');
  console.log('   ✓ 初始已结束:', youSession.session.isFinished, '(应为false)');
  assert(!youSession.session.isFinished, '酉局初始不应直接结束！');

  console.log('\n8. 酉局步骤1-5: 累积触发值（验证前5步不胜利）...');
  let r;
  r = await post('/api/sessions/' + youId + '/execute', { eventId: 'e2' });
  assert(r.success && !r.result, '步1: e2成功且不胜利');
  r = await post('/api/sessions/' + youId + '/execute', { eventId: 'e1' });
  assert(r.success && !r.result, '步2: e1成功且不胜利');
  r = await post('/api/sessions/' + youId + '/execute', { eventId: 'e3' });
  assert(r.success && !r.result, '步3: e3成功且不胜利');
  r = await post('/api/sessions/' + youId + '/execute', { eventId: 'e3' });
  assert(r.success && !r.result, '步4: e3成功且不胜利');
  r = await post('/api/sessions/' + youId + '/execute', { eventId: 'e4' });
  assert(r.success && !r.result, '步5: e4成功且不胜利');
  r = await post('/api/sessions/' + youId + '/execute', { eventId: 'e2' });
  assert(r.success && !r.result, '步6: e2成功');
  const midState = await get('/api/sessions/' + youId);
  console.log('   ✓ 步6触发值:', midState.session.currentState.hiddenTrigger, '(应≥5)');
  console.log('   ✓ 步6stepCount:', midState.session.currentState.stepCount, '(应为6)');

  console.log('\n9. 酉局解锁隐藏槽...');
  r = await post('/api/sessions/' + youId + '/execute', { eventId: 'e5' });
  assert(r.success, 'e5第四共鸣应成功');
  const unlocked = await get('/api/sessions/' + youId);
  console.log('   ✓ 隐藏解锁:', unlocked.session.currentState.secretUnlocked);
  console.log('   ✓ 第四槽值:', unlocked.session.currentState.balanceSlots[3]);
  assert(unlocked.session.currentState.secretUnlocked, '隐藏槽应已解锁！');

  console.log('\n10. 酉局完美调和+精准校准+净化仪式...');
  r = await post('/api/sessions/' + youId + '/execute', { eventId: 'e7' });
  assert(r.success, 'e7完美调和应成功');
  r = await post('/api/sessions/' + youId + '/execute', { eventId: 'e6' });
  assert(r.success, 'e6精准校准应成功');
  r = await post('/api/sessions/' + youId + '/execute', { eventId: 'e8' });
  assert(r.success, 'e8净化仪式应成功');
  
  const finalState = await get('/api/sessions/' + youId);
  const fs = finalState.session.currentState;
  console.log('   ✓ 最终倒排值:', fs.invertedValue, '(应为88)');
  console.log('   ✓ 最终配平槽:', fs.balanceSlots, '(应全66)');
  console.log('   ✓ 最终酉号:', fs.failureY, '(应为0)');
  console.log('   ✓ 游戏结束:', finalState.session.isFinished);
  console.log('   ✓ 结果类型:', finalState.session.result?.type);
  assert(finalState.session.isFinished && finalState.session.result?.type === 'win', '酉局隐藏胜利应触发！');

  console.log('\n11. 酉局后端结算重算验证...');
  const youSettlement = await post('/api/sessions/' + youId + '/settle', {});
  console.log('   ✓ 重算状态:', youSettlement.recalculated);
  console.log('   ✓ 重算步数:', youSettlement.steps.length);
  console.log('   ✓ 重算胜利:', youSettlement.finalResult.win);
  console.log('   ✓ 最终得分:', youSettlement.score.total);
  console.log('   ✓ 重算倒排值:', youSettlement.finalState.invertedValue);
  console.log('   ✓ 重算配平槽:', youSettlement.finalState.balanceSlots);
  assert(youSettlement.finalResult.win, '后端重算应验证胜利！');
  
  console.log('\n=== 所有 API 测试通过！ ✓');
}

function assert(cond, msg) {
  if (!cond) {
    console.error('   ✗ 断言失败:', msg);
    throw new Error(msg);
  }
  console.log('   ✓', msg);
}

test().catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});
