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
  const events = ['zi_e6','zi_e2','zi_e2','zi_e1','zi_e1','zi_e1','zi_e1','zi_e1','zi_e1','zi_e1','zi_e1'];
  for (const eid of events) {
    const r = await post('/api/game/zi/apply-event', {eventId: eid});
    const j = JSON.parse(r.body);
    if (!j.success) {
      console.log('  失败:', eid, j.error);
    }
  }
  const st = JSON.parse((await get('/api/game/zi/state')).body);
  console.log('最终 turn:', st.currentState.turn);
  console.log('最终 sealed:', st.currentState.sealedValue);
  console.log('最终 ziFailure:', st.currentState.ziFailure);
  console.log('最终 rewriteSlots:', st.currentState.rewriteSlots);
  console.log('最终 translationTraces:', st.currentState.translationTraces);
  console.log('isEnded:', st.isEnded);
  if (st.result) {
    console.log('\n== 结算信息 ==');
    console.log('win:', st.result.win);
    console.log('lose:', st.result.lose);
    console.log('hiddenTriggered:', st.result.hiddenTriggered);
    console.log('hiddenMessage:', st.result.hiddenMessage);
    console.log('message:', st.result.message);
    console.log('score:', st.result.score);
  }

  console.log('\n=== 检查当前存档 ===');
  const cur = JSON.parse((await get('/api/save/current')).body);
  console.log('当前存档 gameId:', cur.gameId, ' turn:', cur.turn);
})();
