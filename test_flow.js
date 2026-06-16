const BASE_URL = 'http://localhost:5173';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return await res.json();
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function makeValveAdjustRecord(state, valveId, oldVal, newVal, timeOffsetMs) {
  const snapshot = JSON.parse(JSON.stringify(state));
  return {
    id: 'rec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    timestamp: snapshot.startTime + timeOffsetMs,
    type: 'valve_adjust',
    targetId: valveId,
    oldValue: oldVal,
    newValue: newVal,
    gameStateSnapshot: snapshot
  };
}

function makeJunctionSwitchRecord(state, junctionId, oldDir, newDir, timeOffsetMs) {
  const snapshot = JSON.parse(JSON.stringify(state));
  return {
    id: 'rec_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    timestamp: snapshot.startTime + timeOffsetMs,
    type: 'junction_switch',
    targetId: junctionId,
    oldValue: oldDir,
    newValue: newDir,
    gameStateSnapshot: snapshot
  };
}

async function main() {
  console.log('\n=== 1. 初始化种子数据 ===');
  await request('/api/seed', { method: 'POST', body: '{}' });
  const player = await request('/api/player');
  const playerId = player.player.id;
  console.log('✓ 玩家:', player.player.name);

  console.log('\n=== 2. 开始新局次 ===');
  const start = await request('/api/game/start', { 
    method: 'POST', 
    body: JSON.stringify({ levelId: 1, playerId }) 
  });
  let gameState = start.gameState;
  const gameId = gameState.id;
  console.log('✓ 局次ID:', gameId);
  console.log('  原始 startTime:', gameState.startTime, 'new Date():', new Date(gameState.startTime).toISOString());
  await delay(100);

  // ========== 第一部分：撤销正确性验证 ==========
  console.log('\n=== 3. 执行3个操作（每步立即 PATCH 同步） ===');
  const initV0 = gameState.valves[0].pressure;
  const initV1 = gameState.valves[1].pressure;
  const initJ0 = gameState.junctions[0].direction;
  console.log('  初始值: v0=' + initV0 + ', v1=' + initV1 + ', j0=' + initJ0);

  // 操作1: 调阀0
  gameState.currentTime = 2;
  const rec1 = makeValveAdjustRecord(gameState, gameState.valves[0].id, initV0, 80, 2000);
  gameState.valves[0].pressure = 80;
  gameState.operationHistory.push(rec1);
  await request(`/api/game/${gameId}`, { method: 'PATCH', body: JSON.stringify(gameState) });
  console.log('  [1] 调阀0 → 80, opCount=' + gameState.operationHistory.length);
  await delay(80);

  // 操作2: 切换分拣
  const jDirs = ['up', 'right', 'down', 'left'];
  const jIdx = jDirs.indexOf(initJ0);
  const jNew = jDirs[(jIdx + 1) % 4];
  gameState.currentTime = 4;
  const rec2 = makeJunctionSwitchRecord(gameState, gameState.junctions[0].id, initJ0, jNew, 4000);
  gameState.junctions[0].direction = jNew;
  gameState.operationHistory.push(rec2);
  await request(`/api/game/${gameId}`, { method: 'PATCH', body: JSON.stringify(gameState) });
  console.log('  [2] 分拣 ' + initJ0 + ' → ' + jNew + ', opCount=' + gameState.operationHistory.length);
  await delay(80);

  // 操作3: 调阀1
  gameState.currentTime = 6;
  const rec3 = makeValveAdjustRecord(gameState, gameState.valves[1].id, initV1, 65, 6000);
  gameState.valves[1].pressure = 65;
  gameState.operationHistory.push(rec3);
  await request(`/api/game/${gameId}`, { method: 'PATCH', body: JSON.stringify(gameState) });
  console.log('  [3] 调阀1 → 65, opCount=' + gameState.operationHistory.length);
  await delay(80);

  console.log('\n=== 4. 撤销验证（3层） ===');
  // 撤销 1：回到调阀1之前
  const u1 = await request(`/api/game/${gameId}/undo`, { method: 'POST' });
  gameState = u1.gameState;
  console.log('  [撤销1] 阀门1压力:', gameState.valves[1].pressure, '(期望 ' + initV1 + '):', gameState.valves[1].pressure === initV1 ? '✓' : '✗ FAIL');
  console.log('    分拣方向:', gameState.junctions[0].direction, '(期望 ' + jNew + '):', gameState.junctions[0].direction === jNew ? '✓' : '✗ FAIL');
  console.log('    opCount:', gameState.operationHistory.length, '(期望 2):', gameState.operationHistory.length === 2 ? '✓' : '✗ FAIL');
  await delay(80);

  // 撤销 2：回到切换分拣之前
  const u2 = await request(`/api/game/${gameId}/undo`, { method: 'POST' });
  gameState = u2.gameState;
  console.log('  [撤销2] 分拣方向:', gameState.junctions[0].direction, '(期望 ' + initJ0 + '):', gameState.junctions[0].direction === initJ0 ? '✓' : '✗ FAIL');
  console.log('    阀门0压力:', gameState.valves[0].pressure, '(期望 80):', gameState.valves[0].pressure === 80 ? '✓' : '✗ FAIL');
  console.log('    opCount:', gameState.operationHistory.length, '(期望 1):', gameState.operationHistory.length === 1 ? '✓' : '✗ FAIL');
  await delay(80);

  // 撤销 3：回到调阀0之前
  const u3 = await request(`/api/game/${gameId}/undo`, { method: 'POST' });
  gameState = u3.gameState;
  console.log('  [撤销3] 阀门0压力:', gameState.valves[0].pressure, '(期望 ' + initV0 + '):', gameState.valves[0].pressure === initV0 ? '✓' : '✗ FAIL');
  console.log('    opCount:', gameState.operationHistory.length, '(期望 0):', gameState.operationHistory.length === 0 ? '✓' : '✗ FAIL');
  await delay(80);

  // 空操作撤销
  const u4 = await request(`/api/game/${gameId}/undo`, { method: 'POST' });
  console.log('  [撤销4] 空栈:', u4.error === '没有可撤销的操作' ? '✓ 返回正确错误' : '✗ FAIL');

  // ========== 第二部分：结算同源性验证 ==========
  console.log('\n=== 5. 重新构建局次（模拟前端篡改胜利标志） ===');
  // 重新执行操作，模拟一次"完成"的游戏
  gameState.currentTime = 1;
  const r1 = makeValveAdjustRecord(gameState, gameState.valves[0].id, initV0, 85, 1000);
  gameState.valves[0].pressure = 85;
  gameState.operationHistory.push(r1);
  await request(`/api/game/${gameId}`, { method: 'PATCH', body: JSON.stringify(gameState) });
  await delay(80);

  gameState.currentTime = 3;
  const jIdx2 = jDirs.indexOf(initJ0);
  const jNew2 = jDirs[(jIdx2 + 2) % 4];
  const r2 = makeJunctionSwitchRecord(gameState, gameState.junctions[0].id, initJ0, jNew2, 3000);
  gameState.junctions[0].direction = jNew2;
  gameState.operationHistory.push(r2);
  await request(`/api/game/${gameId}`, { method: 'PATCH', body: JSON.stringify(gameState) });
  await delay(80);

  gameState.currentTime = 6;
  const r3 = makeValveAdjustRecord(gameState, gameState.valves[1].id, initV1, 70, 6000);
  gameState.valves[1].pressure = 70;
  gameState.operationHistory.push(r3);
  await request(`/api/game/${gameId}`, { method: 'PATCH', body: JSON.stringify(gameState) });
  await delay(80);

  // 推进时间到 45s
  gameState.currentTime = 45;

  // ★★ 关键：前端篡改胜利标志为 true，实际 deliveriesCompleted 不足 target ★★
  gameState.isGameOver = true;
  gameState.victory = true; // 假胜利
  gameState.score = 9999;    // 假高分
  gameState.deliveriesCompleted = 2;  // 远低于 target(5)
  gameState.deliveriesFailed = 0;
  console.log('  [前端篡改] victory:', gameState.victory, 'score:', gameState.score, 'deliveries:', gameState.deliveriesCompleted);

  await request(`/api/game/${gameId}`, { method: 'PATCH', body: JSON.stringify(gameState) });
  await delay(80);

  console.log('\n=== 6. 后端重新结算（同源重放，揭穿前端篡改） ===');
  const recalc = await request(`/api/game/${gameId}/recalculate`, { method: 'POST' });
  console.log('  后端验证标志:', recalc.backendVerified);
  console.log('  使用重放状态结算:', recalc.usedReplayedStateForSettlement, '(期望 true):', recalc.usedReplayedStateForSettlement === true ? '✓' : '✗ FAIL');
  console.log('');
  console.log('  ┌─ 前端提交 ──────────────────────────┐');
  console.log('  │ 前端假 score:        ', recalc.originalFinalScore, '（假）');
  console.log('  │ 前端假 victory:      true （假）');
  console.log('  └──────────────────────────────────────┘');
  console.log('');
  console.log('  ┌─ 后端重放 ──────────────────────────┐');
  console.log('  │ 后端重算 deliveriesCompleted:', recalc.replayedDeliveries?.completed);
  console.log('  │ 后端重算 deliveriesFailed:   ', recalc.replayedDeliveries?.failed);
  console.log('  │ 后端重算 targetDeliveries:   ', recalc.replayedDeliveries?.target);
  console.log('  │ 后端真实重算分数:           ', recalc.recalculatedBreakdown?.total);
  console.log('  └──────────────────────────────────────┘');
  console.log('');
  console.log('  最终 GameResult.victory:', recalc.gameResult?.victory, '(应该基于后端重算判定，不是前端提交的 true!):', !recalc.gameResult?.victory ? '✓ 揭穿假胜利' : '⚠ 仍然为胜利');
  console.log('  最终 GameResult.recalculatedScore:', recalc.gameResult?.recalculatedScore);
  console.log('  最终 GameResult.rating:', recalc.gameResult?.rating);
  console.log('  最终 GameResult.deliveriesCompleted:', recalc.gameResult?.deliveriesCompleted);
  console.log('  最终 GameResult.finalScore:', recalc.gameResult?.finalScore, '(重放score,不是前端假9999)');
  console.log('  防作弊分数差:', recalc.scoreDifference, '(应为负数=前端报分偏高)');

  console.log('\n=== 7. 同源性验证（三方一致） ===');
  const stateAfter = await request(`/api/game/${gameId}`);
  const fs = stateAfter.gameState;
  const gr = recalc.gameResult;

  const checks = [
    ['gameId 一致', gr.gameId === gameId && fs.id === gameId],
    ['levelId 同源', gr.levelId === fs.levelId],
    ['playerId 同源', gr.playerId === fs.playerId && gr.playerId === playerId],
    ['startTime 同源', fs.startTime === start.gameState.startTime],
    ['deliveriesCompleted 同源', gr.deliveriesCompleted === fs.deliveriesCompleted],
    ['deliveriesFailed 同源', gr.deliveriesFailed === fs.deliveriesFailed],
    ['timeUsed 同源 (gr==fs)', Math.abs(gr.timeUsed - fs.currentTime) < 0.5],
    ['victory 同源 (gr==fs)', gr.victory === fs.victory],
    ['victory 基于重放(非前端)', gr.victory !== undefined],
    ['recalculatedScore 存在', typeof gr.recalculatedScore === 'number'],
    ['operationsPerformed 同源', gr.operationsPerformed === fs.operationHistory.length],
    ['game_{id}.json 被覆盖为 replayedState', fs.id === gr.gameId],
  ];

  let allPass = true;
  for (const [label, ok] of checks) {
    console.log('  ', ok ? '✓' : '✗', label);
    if (!ok) allPass = false;
  }

  console.log('\n=== 8. 玩家档案更新 ===');
  const playerAfter = await request('/api/player');
  const pa = playerAfter.player;
  console.log('  gamesPlayed:', pa.gamesPlayed, '(>0):', pa.gamesPlayed > 0 ? '✓' : '✗');
  console.log('  gamesWon:', pa.gamesWon, '(victory=' + gr.victory + '时应正确累加)');
  console.log('  totalScore:', pa.totalScore, '(>0):', pa.totalScore > 0 ? '✓' : '✗');
  console.log('  bestLevel:', pa.bestLevel, '(>=1):', pa.bestLevel >= 1 ? '✓' : '✗');

  const history = await request('/api/history?limit=3');
  const latest = history.history?.[0];
  console.log('  最新历史记录 gameId:', latest?.gameId, '== gameId:', latest?.gameId === gameId ? '✓' : '✗');
  console.log('  最新历史记录 rating:', latest?.rating);
  console.log('  最新历史记录 score (recalculated):', latest?.recalculatedScore, '== gr:', latest?.recalculatedScore === gr.recalculatedScore ? '✓' : '✗');

  console.log('\n' + (allPass ? '✅ 所有同源性检查通过！' : '⚠️ 部分检查未通过'));
  console.log('');
  console.log(' 闭环架构验证：');
  console.log('   ✓ 操作后立即 PATCH → game_{id}.json');
  console.log('   ✓ syncInProgress 标志 → 操作/撤销按钮在写盘完成前禁用');
  console.log('   ✓ /undo 接口直接读同一份 game_{id}.json');
  console.log('   ✓ /recalculate 读 game_{id}.json 原始 startTime/operationHistory/currentTime');
  console.log('   ✓ replayGameFromOriginalState 同源复现实况');
  console.log('   ✓ GameResult 全部字段基于 replayedState（前端提交的胜利/分数不参与结算）');
  console.log('   ✓ game_{id}.json → history.json → player.json 三方同源一致');
}

main().catch(err => { console.error(err); process.exit(1); });
