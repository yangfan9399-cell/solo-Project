const http = require('http');
function get(path) {
  return new Promise(res => {
    http.get('http://localhost:3000' + path, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res({status: r.statusCode, body: d}));
    });
  });
}
function post(path, body) {
  return new Promise(res => {
    const data = JSON.stringify(body || {});
    const req = http.request({hostname:'localhost',port:3000,path,method:'POST',headers:{'Content-Type':'application/json','Content-Length':data.length}}, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res({status: r.statusCode, body: d}));
    });
    req.write(data); req.end();
  });
}
(async () => {
  console.log('=== 测试子局隐藏结局触发 ===');
  await post('/api/game/zi/reset');
  let st = JSON.parse((await get('/api/game/zi/state')).body);

  const sequence = ['zi_e2','zi_e2','zi_e6','zi_e1','zi_e1','zi_e1'];
  for (let i = 0; i < sequence.length; i++) {
    const eid = sequence[i];
    const r = await post('/api/game/zi/apply-event', {eventId: eid});
    const j = JSON.parse(r.body);
    const st2 = JSON.parse((await get('/api/game/zi/state')).body);
    if (!j.success) {
      console.log(`  Step ${i+1} [${eid}] 失败:`, j.error);
    } else {
      console.log(`  Step ${i+1} [${eid}]  sealed:${st2.currentState.sealedValue}  ziFailure:${st2.currentState.ziFailure}  trans:${st2.currentState.translationTraces}`);
    }
    if (st2.isEnded) { console.log('  -> 游戏结束'); break; }
  }

  const finalSt = JSON.parse((await get('/api/game/zi/state')).body);
  console.log('\n最终 sealed:', finalSt.currentState.sealedValue, '  ziFailure:', finalSt.currentState.ziFailure);
  if (finalSt.result) {
    console.log('\n== 结算信息 ==');
    console.log('hiddenTriggered:', finalSt.result.hiddenTriggered);
    console.log('hiddenMessage:', finalSt.result.hiddenMessage);
    console.log('message:', finalSt.result.message);
    console.log('score:', finalSt.result.score);
  }

  console.log('\n=== 当前存档 ===');
  const cur = JSON.parse((await get('/api/save/current')).body);
  console.log('gameId:', cur.gameId, '  turn:', cur.turn);
})();
