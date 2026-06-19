const http = require('http');

function post(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 3777,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function test() {
  console.log('=== 辰局：连续操作胜利 ===');
  const chen = await post('/api/settle', {
    levelId: 'chen',
    replay: { actions: [
      { cellId: 'A1', players: 2 }, { cellId: 'C1', players: 2 },
      { cellId: 'A1', players: 2 }, { cellId: 'C1', players: 2 },
      { cellId: 'A1', players: 2 }
    ]}
  });
  console.log('  won:', chen.won, '  fumigation:', chen.finalState.fumigation, 'lightMarks:', chen.finalState.lightMarks, 'score:', chen.score);

  console.log();
  console.log('=== 卯局：资源短缺胜利（先C2撑过挥发事件） ===');
  const mao = await post('/api/settle', {
    levelId: 'mao',
    replay: { actions: [
      { cellId: 'B1', players: 2 },
      { cellId: 'B1', players: 2 },
      { cellId: 'C2', players: 1 },
      { cellId: 'B1', players: 2 },
      { cellId: 'B1', players: 2 },
      { cellId: 'B1', players: 2 },
      { cellId: 'B1', players: 2 },
      { cellId: 'B1', players: 2 },
      { cellId: 'C2', players: 1 },
      { cellId: 'B1', players: 2 },
      { cellId: 'A2', players: 1 },
      { cellId: 'A2', players: 1 },
      { cellId: 'A2', players: 1 },
      { cellId: 'A2', players: 1 },
      { cellId: 'A2', players: 1 },
      { cellId: 'A2', players: 1 },
      { cellId: 'A1', players: 1 },
      { cellId: 'B1', players: 2 },
      { cellId: 'A1', players: 1 }
    ]}
  });
  console.log('  won:', mao.won);
  console.log('  fumigation:', mao.finalState.fumigation, 'lightMarks:', mao.finalState.lightMarks, 'maoReward:', mao.finalState.maoReward);
  console.log('  turns:', mao.totalTurns, '(lose if >20):', mao.totalTurns > 20);
  console.log('  events:', mao.steps.filter(s => s.event).map(s => 'T' + s.turn + ':' + s.event).join(' | '));

  console.log();
  console.log('=== 辛局：隐藏条件胜利 ===');
  const xin = await post('/api/settle', {
    levelId: 'xin',
    replay: { actions: [
      { cellId: 'A2', players: 1 }, { cellId: 'B1', players: 1 },
      { cellId: 'C2', players: 1 }, { cellId: 'A1', players: 2 },
      { cellId: 'A1', players: 2 }, { cellId: 'C1', players: 2 },
      { cellId: 'B2', players: 1 }, { cellId: 'A2', players: 1 },
      { cellId: 'C1', players: 2 }
    ]}
  });
  console.log('  won:', xin.won, '  fumigation:', xin.finalState.fumigation, 'lightMarks:', xin.finalState.lightMarks);
  console.log('  hiddenTriggered:', xin.finalState.hiddenTriggered, 'score:', xin.score);

  console.log();
  console.log('=== 验证：不传 _firedEvents 也能正确触发事件 ===');
  const noFired = await post('/api/settle', {
    levelId: 'chen',
    replay: { actions: [
      { cellId: 'C1', players: 2 }, { cellId: 'C1', players: 2 }, { cellId: 'A1', players: 2 }
    ]}
  });
  console.log('  events triggered:', noFired.steps.filter(s => s.event).length);
  console.log('  list:', noFired.steps.filter(s => s.event).map(s => 'T' + s.turn + ':' + s.event).join(' | '));
}

test().catch(e => console.error(e));
