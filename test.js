const http = require('http');

function req(method, path, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const r = http.request(
      { hostname: 'localhost', port: 8765, path, method, headers: { 'Content-Type': 'application/json' } },
      res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          try { resolve(JSON.parse(d)); } catch (e) { resolve(d); }
        });
      }
    );
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

(async () => {
  console.log('=== 1. 游戏列表 ===');
  const games = await req('GET', '/api/games');
  games.forEach(g => console.log('  -', g.id, ':', g.name));

  console.log('\n=== 2. 创建酉局会话 ===');
  const start = await req('POST', '/api/sessions', { gameId: 'you' });
  const sid = start.sessionId;
  console.log('Session ID:', sid);

  console.log('\n=== 3. 执行操作循环 ===');
  const actions = ['a1', 'a2', 'a3', 'a4', 'a5'];
  for (let i = 0; i < 6; i++) {
    const r = await req('POST', '/api/sessions/' + sid + '/actions', { actionId: actions[i % 5] });
    if (r.success) {
      console.log('  Turn', i + 1, '| 定标:', r.state.calibration, '风险:', r.state.unitaryRisk, '奖励:', r.state.shenReward);
      if (r.event) console.log('    Event:', r.event.name, '-', r.event.hint.substring(0, 30));
    } else {
      console.log('  Turn', i + 1, '| Error:', r.error);
    }
  }

  console.log('\n=== 4. 回放轴数据 ===');
  const replay = await req('GET', '/api/replays/' + sid);
  console.log('  记录步数:', replay.replay.length);
  replay.replay.forEach((s, idx) => console.log('   ', idx + 1, '. Turn', s.turn, '-', s.actionName));

  console.log('\n=== 5. 结算 ===');
  const result = await req('POST', '/api/sessions/' + sid + '/end', {});
  console.log('  总分:', result.totalScore, '/ 评级:', result.rank);
  console.log('  是否通关:', result.win ? '成功 ✓' : '失败 ✗');
  console.log('  结算明细:');
  result.details.forEach(d => console.log('    -', d.field, ':', d.value, '(目标:' + d.target + ') ', d.pass ? '✓' : '✗'));

  console.log('\n=== 6. 寅局隐藏条件测试 ===');
  const yinStart = await req('POST', '/api/sessions', { gameId: 'yin' });
  const yinSid = yinStart.sessionId;
  console.log('寅局 Session:', yinSid);

  for (let i = 0; i < 7; i++) {
    const actions2 = ['ya3', 'ya4', 'ya2', 'ya5', 'ya1'];
    const r = await req('POST', '/api/sessions/' + yinSid + '/actions', { actionId: actions2[i % 5] });
    if (r.success) {
      console.log('  Turn', i + 1, '| 定标:', r.state.calibration, '换轨:', r.state.shiftMarks, '奖励:', r.state.shenReward);
      if (r.event && r.event.triggered) console.log('    ★ HIDDEN TRIGGERED:', r.event.triggered);
    }
  }

  console.log('\n所有测试完成！');
})().catch(console.error);
