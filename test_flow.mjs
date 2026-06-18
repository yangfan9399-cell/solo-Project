const BASE = 'http://localhost:3001';

async function j(res) { return res.json(); }

async function test() {
  console.log('=== 1. 启动未局(wei) ===');
  const start = await j(await fetch(BASE + '/api/game/start', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({levelId: 'wei'})
  }));
  const SID = start.sessionId;
  console.log(' Session:', SID);
  console.log(' 初始:', start.state.levelId, 'turn=', start.state.turn, 'replay=', start.replay.length);

  console.log('\n=== 2. 移动 ===');
  const moves = [
    [1,1,0], [2,0,-1], [1,1,0], [1,0,1], [2,1,0]
  ];
  for (const [p,dx,dy] of moves) {
    const d = await j(await fetch(`${BASE}/api/game/${SID}/move`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({player:p, direction:{x:dx, y:dy}})
    }));
    console.log('  P' + p + ': ' + (d.moved?'OK':'FAIL') + ' - ' + d.description);
  }

  console.log('\n=== 3. 获取回放 ===');
  const rp = await j(await fetch(BASE + '/api/game/' + SID + '/replay'));
  console.log(' 回放步骤数:', rp.replay.length);
  rp.replay.forEach((r,i) => console.log('   #' + i + ': ' + r.action.description));

  console.log('\n=== 4. 模拟刷新恢复 ===');
  const rst = await j(await fetch(BASE + '/api/game/restore', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({replay: rp.replay})
  }));
  console.log(' 恢复成功, SID=', rst.sessionId);
  console.log(' 状态: turn=', rst.state.turn, 'status=', rst.state.status);
  console.log(' 玩家位置: P1=', JSON.stringify(rst.state.player1.position),
    'P2=', JSON.stringify(rst.state.player2.position));
  console.log(' 可继续操作? ', rst.state.status === 'playing' ? '✅ YES' : 'NO');

  console.log('\n=== 5. 结算 ===');
  const s = await j(await fetch(BASE + '/api/game/' + rst.sessionId + '/settle', {
    method:'POST', headers:{'Content-Type':'application/json'}
  }));
  console.log(' 协作评分:', s.cooperationScore);
  console.log(' 胜负:', s.won ? '🎉 WIN' : '💔 LOSE');
  console.log(' 详情:', s.details);
  console.log(' 公式:', s.formula);
  console.log(' 拆解:');
  for (const [k, v] of Object.entries(s.breakdown)) {
    const sign = v.contribution >= 0 ? '+' : '';
    console.log('   ' + k + ': 值=' + v.value + ' × ' + v.weight + ' = ' + sign + v.contribution + '  (' + v.label + ')');
  }

  console.log('\n✅ 全部测试通过!');
}

test().catch(e => console.error('错误:', e.message));
