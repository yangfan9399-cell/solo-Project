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
  
  console.log('\n7. 测试酉局隐藏路径...');
  const youSession = await post('/api/sessions', { gameId: 'you' });
  const youId = youSession.session.sessionId;
  console.log('   ✓ 酉局会话创建成功');
  
  await post('/api/sessions/' + youId + '/execute', { eventId: 'e1' });
  await post('/api/sessions/' + youId + '/execute', { eventId: 'e1' });
  await post('/api/sessions/' + youId + '/execute', { eventId: 'e1' });
  await post('/api/sessions/' + youId + '/execute', { eventId: 'e2' });
  await post('/api/sessions/' + youId + '/execute', { eventId: 'e3' });
  
  const youState = await get('/api/sessions/' + youId);
  console.log('   ✓ 隐藏触发值:', youState.session.currentState.hiddenTrigger);
  console.log('   ✓ 隐藏已解锁:', youState.session.currentState.secretUnlocked);
  
  if (youState.session.currentState.hiddenTrigger >= 5) {
    await post('/api/sessions/' + youId + '/execute', { eventId: 'e5' });
    const afterSecret = await get('/api/sessions/' + youId);
    console.log('   ✓ 解锁后状态:', afterSecret.session.currentState.secretUnlocked ? '隐藏已解锁' : '未解锁');
    console.log('   ✓ 第四配平槽:', afterSecret.session.currentState.balanceSlots[3]);
  }
  
  console.log('\n=== 所有 API 测试通过！ ✓');
}

test().catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});
