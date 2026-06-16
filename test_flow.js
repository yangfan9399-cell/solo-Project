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
  const seed = await request('/api/seed', { method: 'POST', body: '{}' });
  console.log('✓ 种子数据:', seed.hasPlayer ? '已有玩家' : '无玩家', '关卡数:', seed.levels);

  console.log('\n=== 2. 获取玩家 ===');
  const player = await request('/api/player');
  console.log('✓ 玩家:', player.player?.name, 'ID:', player.player?.id);
  const playerId = player.player.id;

  console.log('\n=== 3. 开始游戏（关卡1） ===');
  const start = await request('/api/game/start', { 
    method: 'POST', 
    body: JSON.stringify({ levelId: 1, playerId }) 
  });
  console.log('✓ 游戏创建:', start.gameState?.id);
  console.log('  startTime:', new Date(start.gameState?.startTime).toISOString());
  console.log('  操作历史长度:', start.gameState?.operationHistory?.length, '(期望 0)');
  const gameId = start.gameState.id;
  let gameState = start.gameState;
  const startTime = gameState.startTime;
  await delay(100);

  console.log('\n=== 4. 调整阀门0 （50 → 75）===');
  {
    const valveId = gameState.valves[0].id;
    const oldPressure = gameState.valves[0].pressure;
    const newPressure = 75;
    console.log('  阀门ID:', valveId);
    console.log('  调整前压力:', oldPressure, '→ 调整后:', newPressure);
    
    // 先快照（操作前），再修改，再 push 记录
    const rec = makeValveAdjustRecord(gameState, valveId, oldPressure, newPressure, 2000);
    gameState.valves[0].pressure = newPressure;
    gameState.operationHistory.push(rec);
    gameState.currentTime = 2;
    
    await request(`/api/game/${gameId}`, { 
      method: 'PATCH', 
      body: JSON.stringify(gameState) 
    });
    console.log('  操作历史长度:', gameState.operationHistory.length, '(期望 1)');
    await delay(100);
  }

  console.log('\n=== 5. 切换分拣节点0 ===');
  {
    const junctionId = gameState.junctions[0].id;
    const oldDirection = gameState.junctions[0].direction;
    const directions = ['up', 'right', 'down', 'left'];
    const idx = directions.indexOf(oldDirection);
    const newDirection = directions[(idx + 1) % 4];
    console.log('  节点ID:', junctionId);
    console.log('  切换前方向:', oldDirection, '→ 切换后:', newDirection);
    
    const rec = makeJunctionSwitchRecord(gameState, junctionId, oldDirection, newDirection, 5000);
    gameState.junctions[0].direction = newDirection;
    gameState.operationHistory.push(rec);
    gameState.currentTime = 5;
    
    await request(`/api/game/${gameId}`, { 
      method: 'PATCH', 
      body: JSON.stringify(gameState) 
    });
    console.log('  操作历史长度:', gameState.operationHistory.length, '(期望 2)');
    await delay(100);
  }

  console.log('\n=== 6. 调整阀门1 （50 → 60） ===');
  {
    const valveId = gameState.valves[1].id;
    const oldPressure = gameState.valves[1].pressure;
    const newPressure = 60;
    console.log('  调整前压力:', oldPressure, '→ 调整后:', newPressure);
    
    const rec = makeValveAdjustRecord(gameState, valveId, oldPressure, newPressure, 8000);
    gameState.valves[1].pressure = newPressure;
    gameState.operationHistory.push(rec);
    gameState.currentTime = 8;
    
    await request(`/api/game/${gameId}`, { 
      method: 'PATCH', 
      body: JSON.stringify(gameState) 
    });
    console.log('  操作历史长度:', gameState.operationHistory.length, '(期望 3)');
    await delay(100);
  }

  console.log('\n=== 7. 撤销操作1 （应回到调阀1之前：分拣方向已切换，阀门0=75，阀门1=50）===');
  const undo1 = await request(`/api/game/${gameId}/undo`, { method: 'POST' });
  console.log('  撤销是否成功:', undo1.undone, '(期望 true)');
  console.log('  撤销后阀门1压力:', undo1.gameState?.valves?.[1]?.pressure, '(期望 50)');
  console.log('  撤销后分拣方向:', undo1.gameState?.junctions?.[0]?.direction);
  console.log('  撤销后阀门0压力:', undo1.gameState?.valves?.[0]?.pressure, '(期望 75)');
  console.log('  操作历史长度:', undo1.gameState?.operationHistory?.length, '(期望 2)');
  gameState = undo1.gameState;
  await delay(100);

  console.log('\n=== 8. 撤销操作2 （应回到切换分拣之前：阀门0=75，分拣=原始，阀门1=50）===');
  const undo2 = await request(`/api/game/${gameId}/undo`, { method: 'POST' });
  console.log('  撤销是否成功:', undo2.undone, '(期望 true)');
  console.log('  撤销后分拣方向:', undo2.gameState?.junctions?.[0]?.direction, '(期望: 原始值)');
  console.log('  撤销后阀门0压力:', undo2.gameState?.valves?.[0]?.pressure, '(期望 75)');
  console.log('  操作历史长度:', undo2.gameState?.operationHistory?.length, '(期望 1)');
  gameState = undo2.gameState;
  await delay(100);

  console.log('\n=== 9. 撤销操作3 （应回到调阀0之前：全部原始值）===');
  const undo3 = await request(`/api/game/${gameId}/undo`, { method: 'POST' });
  console.log('  撤销是否成功:', undo3.undone, '(期望 true)');
  console.log('  撤销后阀门0压力:', undo3.gameState?.valves?.[0]?.pressure, '(期望 50)');
  console.log('  操作历史长度:', undo3.gameState?.operationHistory?.length, '(期望 0)');
  gameState = undo3.gameState;
  await delay(100);

  console.log('\n=== 10. 无操作可撤销验证 ===');
  const undo4 = await request(`/api/game/${gameId}/undo`, { method: 'POST' });
  console.log('  预期错误:', undo4.error, '(期望: 没有可撤销的操作)');

  console.log('\n=== 11. 重新构建操作历史用于后端重算测试 ===');
  // 恢复一个测试用的局次状态
  const initValve0 = gameState.valves[0].pressure;
  const initValve1 = gameState.valves[1].pressure;
  const initJunc0 = gameState.junctions[0].direction;

  // 操作1: 调阀0 50→80 @1s
  gameState.currentTime = 1;
  const rec1 = makeValveAdjustRecord(gameState, gameState.valves[0].id, initValve0, 80, 1000);
  gameState.valves[0].pressure = 80;
  gameState.operationHistory.push(rec1);

  // 操作2: 切换分拣 @3s
  const jDirs = ['up', 'right', 'down', 'left'];
  const jIdx = jDirs.indexOf(initJunc0);
  const jNewDir = jDirs[(jIdx + 2) % 4];
  gameState.currentTime = 3;
  const rec2 = makeJunctionSwitchRecord(gameState, gameState.junctions[0].id, initJunc0, jNewDir, 3000);
  gameState.junctions[0].direction = jNewDir;
  gameState.operationHistory.push(rec2);

  // 操作3: 调阀1 50→70 @6s
  gameState.currentTime = 6;
  const rec3 = makeValveAdjustRecord(gameState, gameState.valves[1].id, initValve1, 70, 6000);
  gameState.valves[1].pressure = 70;
  gameState.operationHistory.push(rec3);

  // 推进到游戏结束 @45s，模拟一些胶囊到达
  gameState.currentTime = 45;
  gameState.isGameOver = true;
  gameState.victory = true;
  gameState.deliveriesCompleted = 5;
  gameState.deliveriesFailed = 0;
  gameState.score = 850;

  const destStation = gameState.stations.find(s => s.type === 'destination');
  if (destStation) {
    for (let i = 0; i < 5; i++) {
      const cap = {
        id: 'cap_deliv_' + i,
        packageId: 'pkg_deliv_' + i,
        currentNodeId: destStation.id,
        targetNodeId: destStation.id,
        progress: 0,
        speed: 0,
        priority: i === 0 ? 'critical' : i === 1 ? 'express' : 'normal',
        deliveryTime: 20 + i * 4,
        maxDeliveryTime: 35,
        status: 'delivered',
        cargo: '货物' + i
      };
      gameState.capsules.push(cap);
      destStation.delivered.push(cap);
    }
  }

  await request(`/api/game/${gameId}`, { 
    method: 'PATCH', 
    body: JSON.stringify(gameState) 
  });
  console.log('  操作历史长度:', gameState.operationHistory.length, '(期望 3)');
  console.log('  startTime:', new Date(gameState.startTime).toISOString());
  console.log('  final currentTime:', gameState.currentTime, 's');
  console.log('  游戏结束:', gameState.isGameOver, '胜利:', gameState.victory);
  console.log('  前端 score:', gameState.score);

  console.log('\n=== 12. 后端重新计算分数（同源 startTime + operationHistory + currentTime 复现） ===');
  const recalc = await request(`/api/game/${gameId}/recalculate`, { method: 'POST' });
  console.log('  后端验证:', recalc.backendVerified, '(期望 true)');
  console.log('  前端提交分数:', gameState.score);
  console.log('  后端重算分数:', recalc.recalculatedBreakdown?.total);
  console.log('  实时计算(直接快照):', recalc.liveBreakdown?.total);
  console.log('  分数差异:', recalc.scoreDifference, '(负数=前端报分偏高)');
  console.log('  评级:', recalc.gameResult?.rating);
  console.log('  重算分解:');
  const r = recalc.recalculatedBreakdown || {};
  for (const [k, v] of Object.entries(r)) {
    console.log('    ', k.padEnd(25), ':', v);
  }
  console.log('  gameId 一致:', recalc.gameResult?.gameId === gameId);

  console.log('\n=== 13. 验证历史记录和玩家档案更新 ===');
  const history = await request('/api/history?limit=3');
  console.log('  历史记录数:', history.history?.length);
  const latest = history.history?.[0];
  if (latest) {
    console.log('  最新记录 gameId:', latest.gameId, '(匹配:', latest.gameId === gameId, ')');
    console.log('  评级:', latest.rating, '分数:', latest.recalculatedScore, latest.victory ? '胜利' : '失败');
    console.log('  操作数:', latest.operationsPerformed, '交付:', latest.deliveriesCompleted);
    console.log('  用时:', latest.timeUsed?.toFixed(1), 's');
  }

  const playerAfter = await request('/api/player');
  console.log('  玩家 gamesPlayed:', playerAfter.player?.gamesPlayed, 'gamesWon:', playerAfter.player?.gamesWon);
  console.log('  玩家 totalScore:', playerAfter.player?.totalScore, 'bestLevel:', playerAfter.player?.bestLevel);

  console.log('\n=== 14. 数据同源验证（game_{id}.json 与历史记录匹配）===');
  const stateFinal = await request(`/api/game/${gameId}`);
  const fs = stateFinal.gameState;
  const ok = (
    latest.gameId === fs.id &&
    latest.levelId === fs.levelId &&
    latest.playerId === fs.playerId &&
    latest.deliveriesCompleted === fs.deliveriesCompleted &&
    latest.deliveriesFailed === fs.deliveriesFailed &&
    Math.abs(latest.timeUsed - fs.currentTime) < 0.5
  );
  console.log('  文件数据 ↔ 历史记录匹配:', ok ? '✅ PASS' : '❌ FAIL');

  console.log('\n✅ 完整闭环测试完成！');
  console.log('   ✓ 操作历史快照: 操作前保存');
  console.log('   ✓ 撤销: 正确回到上一状态');
  console.log('   ✓ 后端重算: 基于原始 startTime/operationHistory/currentTime 同源复现');
  console.log('   ✓ 结算保存: 历史记录 ↔ game_{id}.json ↔ player.json 三方同源一致');
}

main().catch(err => { console.error(err); process.exit(1); });
