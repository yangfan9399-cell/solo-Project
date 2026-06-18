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
  console.log('初始 sealed:', st.currentState.sealedValue, '  ziFailure:', st.currentState.ziFailure, '  rewrite:', st.currentState.rewriteSlots, '  trans:', st.currentState.translationTraces);

  const sequence = [
    'zi_e2',
    'zi_e2',
    'zi_e6',
    'zi_e1',
    'zi_e1',
    'zi_e1',
    'zi_e1',
    'zi_e1',
    'zi_e1'
  ];

  for (let i = 0; i < sequence.length; i++) {
    const eid = sequence[i];
    const r = await post('/api/game/zi/apply-event', {eventId: eid});
    const j = JSON.parse(r.body);
    const st2 = JSON.parse((await get('/api/game/zi/state')).body);
    if (!j.success) {
      console.log(`  Step ${i+1} [${eid}] 失败:`, j.error, '  当前 sealed:', st2.currentState.sealedValue, '  ziFailure:', st2.currentState.ziFailure);
    } else {
      console.log(`  Step ${i+1} [${eid}] OK  sealed:${st2.currentState.sealedValue}  ziFailure:${st2.currentState.ziFailure}  rewrite:${st2.currentState.rewriteSlots}  trans:${st2.currentState.translationTraces}`);
    }
    if (st2.isEnded) { console.log('  游戏已结束'); break; }
  }

  const finalSt = JSON.parse((await get('/api/game/zi/state')).body);
  console.log('\n最终 sealed:', finalSt.currentState.sealedValue, '  ziFailure:', finalSt.currentState.ziFailure);
  console.log('isEnded:', finalSt.isEnded);
  if (finalSt.result) {
    console.log('\n== 结算 ==');
    console.log('hiddenTriggered:', finalSt.result.hiddenTriggered);
    console.log('hiddenMessage:', finalSt.result.hiddenMessage);
    console.log('message:', finalSt.result.message);
    console.log('score:', finalSt.result.score);
  }
})();
