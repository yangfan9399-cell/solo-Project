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
  console.log('=== 1. 首页 ===');
  const root = await get('/');
  console.log('GET /:', root.status, 'len:', root.body.length);

  console.log('\n=== 2. 乙局 config ===');
  const yiCfg = JSON.parse((await get('/api/game/yi/config')).body);
  console.log('乙局 events数:', yiCfg.events.length, '  mapNodes数:', yiCfg.mapNodes.length);
  console.log('乙局 win:', JSON.stringify(yiCfg.winCondition), '  lose:', JSON.stringify(yiCfg.loseCondition));
  console.log('乙局 hiddenCondition:', yiCfg.hiddenCondition);

  console.log('\n=== 3. 壬局 config ===');
  const renCfg = JSON.parse((await get('/api/game/ren/config')).body);
  console.log('壬局 events数:', renCfg.events.length, '  mapNodes数:', renCfg.mapNodes.length);
  console.log('壬局 win:', JSON.stringify(renCfg.winCondition), '  lose:', JSON.stringify(renCfg.loseCondition));
  console.log('壬局 hiddenCondition:', renCfg.hiddenCondition);

  console.log('\n=== 4. 子局 config ===');
  const ziCfg = JSON.parse((await get('/api/game/zi/config')).body);
  console.log('子局 events数:', ziCfg.events.length, '  mapNodes数:', ziCfg.mapNodes.length);
  console.log('子局 win:', JSON.stringify(ziCfg.winCondition), '  lose:', JSON.stringify(ziCfg.loseCondition));
  console.log('子局 hiddenCondition:', JSON.stringify(ziCfg.hiddenCondition));

  console.log('\n=== 5. 开始乙局并走几步 ===');
  await post('/api/game/yi/start');
  await post('/api/game/yi/apply-event', {eventId:'yi_e2'});
  await post('/api/game/yi/apply-event', {eventId:'yi_e6'});
  const yiState = JSON.parse((await get('/api/game/yi/state')).body);
  console.log('乙局 turn:', yiState.currentState.turn, '  sealed:', yiState.currentState.sealedValue, '  renReward:', yiState.currentState.renReward, '  yiRisk:', yiState.currentState.yiRisk, '  history:', yiState.history.length);

  console.log('\n=== 6. 开始子局触发隐藏结局 ===');
  await post('/api/game/zi/start');
  for (let i = 0; i < 4; i++) await post('/api/game/zi/apply-event', {eventId:'zi_e6'});
  const ziState = JSON.parse((await get('/api/game/zi/state')).body);
  console.log('子局 isEnded:', ziState.isEnded, '  turn:', ziState.currentState.turn, '  sealed:', ziState.currentState.sealedValue, '  ziFailure:', ziState.currentState.ziFailure);
  if (ziState.result) {
    console.log('子局结算 hiddenTriggered:', ziState.result.hiddenTriggered);
    console.log('子局结算 hiddenMessage:', ziState.result.hiddenMessage);
    console.log('子局结算 message:', ziState.result.message);
    console.log('子局结算 score:', ziState.result.score);
  }

  console.log('\n=== 7. 当前存档（应是子局） ===');
  const curSave = JSON.parse((await get('/api/save/current')).body);
  console.log('存档:', JSON.stringify(curSave));

  console.log('\n=== 8. 验证前端资源 ===');
  for (const p of ['/css/style.css', '/js/app.js']) {
    const r = await get(p);
    console.log('GET', p, ':', r.status, 'len:', r.body.length);
  }
  console.log('\n所有测试完成！');
})();
