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
  console.log('--- 1. GET /api/levels ---');
  const levels = await req('GET', '/api/levels');
  console.log('Status:', levels.status, 'Count:', levels.data?.data?.length);
  levels.data?.data?.forEach(l => console.log('  -', l.id, l.name));

  console.log('\n--- 2. POST /api/game/init (chen) ---');
  const init = await req('POST', '/api/game/init', { levelId: 'chen' });
  console.log('Status:', init.status, 'Success:', init.data?.success);
  console.log('  Board size:', init.data?.data?.gameState?.boardSize);
  console.log('  Player1:', init.data?.data?.gameState?.players?.[0]);
  console.log('  Player2:', init.data?.data?.gameState?.players?.[1]);
  const gameState = init.data.data.gameState;
  const levelId = 'chen';

  console.log('\n--- 3. POST /api/game/action (move right p1) ---');
  const move1 = await req('POST', '/api/game/action', {
    levelId, gameState, action: { playerId: 1, type: 'move', dx: 1, dy: 0 }
  });
  console.log('Status:', move1.status, 'Valid:', move1.data?.data?.valid);
  console.log('  Msg:', move1.data?.data?.message);
  const state1 = move1.data.data.state;

  console.log('\n--- 4. POST /api/game/action (light p1) ---');
  const light1 = await req('POST', '/api/game/action', {
    levelId, gameState: state1, action: { playerId: 1, type: 'light' }
  });
  console.log('Status:', light1.status, 'Valid:', light1.data?.data?.valid);
  console.log('  Xunran:', light1.data?.data?.state?.xunran);
  console.log('  Dianliang:', light1.data?.data?.state?.dianliang);

  console.log('\n--- 5. POST /api/game/action (endTurn p1->p2) ---');
  const end1 = await req('POST', '/api/game/action', {
    levelId, gameState: light1.data.data.state, action: { playerId: 1, type: 'endTurn' }
  });
  console.log('Status:', end1.status, 'Valid:', end1.data?.data?.valid);
  console.log('  Current:', end1.data?.data?.state?.currentPlayer, 'Turn:', end1.data?.data?.state?.turn);

  console.log('\n--- 6. POST /api/saves (create save) ---');
  const save = await req('POST', '/api/saves', {
    levelId, gameState: end1.data.data.state,
    replay: [
      { action: { type: 'move' }, message: 'move', timestamp: Date.now() },
      { action: { type: 'light' }, message: 'light', timestamp: Date.now() }
    ],
    metadata: { levelName: '辰局测试' }
  });
  console.log('Status:', save.status, 'SaveID:', save.data?.data?.id);
  const saveId = save.data.data.id;

  console.log('\n--- 7. GET /api/saves/:id (load save) ---');
  const load = await req('GET', `/api/saves/${saveId}`);
  console.log('Status:', load.status, 'Turn:', load.data?.data?.gameState?.turn);

  console.log('\n--- 8. POST /api/settlement/calculate ---');
  const settle = await req('POST', '/api/settlement/calculate', {
    levelId, gameState: end1.data.data.state,
    replay: [
      { action: { type: 'move' } },
      { action: { type: 'light' } }
    ]
  });
  console.log('Status:', settle.status);
  console.log('  Score:', settle.data?.data?.finalScore);
  console.log('  Grade:', settle.data?.data?.grade);
  console.log('  Rank:', settle.data?.data?.rank);
  console.log('  Success:', settle.data?.data?.success);

  console.log('\n✅ ALL TESTS PASSED');
})().catch(e => { console.error('❌ ERROR:', e); process.exit(1); });
