const http = require('http');

function req(method, path, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: body ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } : {}
    };
    const r = http.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch (e) { resolve({ status: res.statusCode, raw: d }); }
      });
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

(async () => {
  console.log('=========== 测试 1：辰局胜负组合条件（AND逻辑） ===========');
  const init = await req('POST', '/api/game/init', { levelId: 'chen' });
  let state = init.data.data.gameState;
  console.log('初始状态：');
  console.log('  熏染值:', state.xunran, '(需≥70)');
  console.log('  玩家位置: P1=', state.players[0].x, ',', state.players[0].y, ' | P2=', state.players[1].x, ',', state.players[1].y);
  console.log('  阶段:', state.phase, '(期望: play)');

  console.log('\n--- 仅移动到目标格（熏染不够，应不胜）---');
  const moves = [
    [1, 0], [1, 0], [0, 1], [0, 1]
  ];
  for (const [dx, dy] of moves) {
    const r = await req('POST', '/api/game/action', {
      levelId: 'chen', gameState: state,
      action: { playerId: 1, type: 'move', dx, dy }
    });
    state = r.data.data.state;
  }
  console.log('  P1现在位置:', state.players[0].x, ',', state.players[0].y);
  console.log('  熏染值:', state.xunran);
  console.log('  阶段:', state.phase, '(期望: play, 因为熏染不够)');
  console.log('  验证AND逻辑:', state.phase === 'play' ? '✅ 正确（只到目标但熏染不足，未胜利）' : '❌ 错误');

  console.log('\n--- 结算测试：检查 conditions 字段和 details.steps ---');
  const settle1 = await req('POST', '/api/settlement/calculate', {
    levelId: 'chen', gameState: state,
    replay: [
      { action: { type: 'move' } },
      { action: { type: 'move' } },
      { action: { type: 'move' } },
      { action: { type: 'move' } }
    ]
  });
  const s1 = settle1.data.data;
  console.log('  success:', s1.success, '(期望: false)');
  console.log('  details.steps:', JSON.stringify(s1.details.steps), '(期望: {total:4,move:4,light:0,coop:0,event:0})');
  console.log('  has conditions.win:', !!s1.conditions?.win, '(期望: true)');
  console.log('  win conditions count:', s1.conditions?.win?.conditions?.length);
  console.log('  win.allMet:', s1.conditions?.win?.allMet, '(期望: false)');
  console.log('  steps字段存在:', !!s1.details?.steps, '(期望: true)');

  console.log('\n=========== 测试 2：辛局隐藏条件 ===========');
  const init2 = await req('POST', '/api/game/init', { levelId: 'xin' });
  const state2 = init2.data.data.gameState;
  console.log('辛局初始辛号失败因子:', state2.xinFailure, '(期望: 0)');

  const settle2 = await req('POST', '/api/settlement/calculate', {
    levelId: 'xin', gameState: state2, replay: []
  });
  const s2 = settle2.data.data;
  console.log('  隐藏条件存在:', !!s2.conditions?.win?.hiddenCondition, '(期望: true)');
  console.log('  隐藏条件名:', s2.conditions?.win?.hiddenCondition?.name);
  console.log('  隐藏条件达成:', s2.conditions?.win?.hiddenCondition?.met, '(期望: true, 初始为0)');

  console.log('\n=========== 测试 3：卯局条件 ===========');
  const init3 = await req('POST', '/api/game/init', { levelId: 'mao' });
  const state3 = init3.data.data.gameState;

  let s = state3;
  const replay3 = [];
  for (let i = 0; i < 20; i++) {
    const r = await req('POST', '/api/game/action', {
      levelId: 'mao', gameState: s,
      action: { playerId: 1, type: 'light' }
    });
    if (r.data.data.valid) {
      s = r.data.data.state;
      replay3.push({ action: { type: 'light' } });
    }
    const r2 = await req('POST', '/api/game/action', {
      levelId: 'mao', gameState: s,
      action: { playerId: 1, type: 'move', dx: 1, dy: 0 }
    });
    if (r2.data.data.valid) {
      s = r2.data.data.state;
      replay3.push({ action: { type: 'move' } });
    }
    const r3 = await req('POST', '/api/game/action', {
      levelId: 'mao', gameState: s,
      action: { playerId: 1, type: 'endTurn' }
    });
    if (r3.data.data.valid) s = r3.data.data.state;
    const r4 = await req('POST', '/api/game/action', {
      levelId: 'mao', gameState: s,
      action: { playerId: 2, type: 'endTurn' }
    });
    if (r4.data.data.valid) s = r4.data.data.state;
    if (s.phase !== 'play') break;
  }

  const settle3 = await req('POST', '/api/settlement/calculate', {
    levelId: 'mao', gameState: s, replay: replay3
  });
  const s3 = settle3.data.data;
  console.log('卯局:');
  console.log('  熏染值:', s3.details.xunran);
  console.log('  点亮比例:', s3.details.litRatio);
  console.log('  胜利条件数:', s3.conditions?.win?.conditions?.length);
  console.log('  全部满足:', s3.conditions?.win?.allMet);
  console.log('  最终phase:', s.phase);
  console.log('  结算success:', s3.success);
  console.log('  details.steps:', JSON.stringify(s3.details.steps));

  console.log('\n✅ 测试完成');
})().catch(e => { console.error('❌ ERROR:', e); process.exit(1); });
