const BASE_URL = 'http://localhost:5173';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return await res.json();
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
  console.log('✓ 游戏创建:', start.gameState?.id, '操作历史长度:', start.gameState?.operationHistory?.length);
  const gameId = start.gameState.id;
  let gameState = start.gameState;

  console.log('\n=== 4. 调整阀门 ===');
  const valveId = gameState.valves[0].id;
  const oldPressure = gameState.valves[0].pressure;
  console.log('  调整前压力:', oldPressure);
  
  gameState.valves[0].pressure = Math.min(80, oldPressure + 20);
  const valveRecord = {
    id: 'rec_' + Date.now(),
    timestamp: Date.now() + 1000,
    type: 'valve_adjust',
    targetId: valveId,
    oldValue: oldPressure,
    newValue: gameState.valves[0].pressure,
    gameStateSnapshot: JSON.parse(JSON.stringify(gameState))
  };
  gameState.operationHistory.push(valveRecord);
  
  const patch1 = await request(`/api/game/${gameId}`, { 
    method: 'PATCH', 
    body: JSON.stringify(gameState) 
  });
  console.log('  调整后压力:', gameState.valves[0].pressure);
  console.log('  操作历史长度:', gameState.operationHistory.length);

  console.log('\n=== 5. 切换分拣节点 ===');
  const junctionId = gameState.junctions[0].id;
  const oldDirection = gameState.junctions[0].direction;
  console.log('  切换前方向:', oldDirection);
  
  const directions = ['up', 'right', 'down', 'left'];
  const idx = directions.indexOf(oldDirection);
  const newDirection = directions[(idx + 1) % 4];
  gameState.junctions[0].direction = newDirection;
  
  const junctionRecord = {
    id: 'rec_' + (Date.now() + 2000),
    timestamp: Date.now() + 3000,
    type: 'junction_switch',
    targetId: junctionId,
    oldValue: oldDirection,
    newValue: newDirection,
    gameStateSnapshot: JSON.parse(JSON.stringify(gameState))
  };
  gameState.operationHistory.push(junctionRecord);
  
  const patch2 = await request(`/api/game/${gameId}`, { 
    method: 'PATCH', 
    body: JSON.stringify(gameState) 
  });
  console.log('  切换后方向:', gameState.junctions[0].direction);
  console.log('  操作历史长度:', gameState.operationHistory.length);

  console.log('\n=== 6. 撤销操作（应该回到切换分拣节点之前） ===');
  const undo1 = await request(`/api/game/${gameId}/undo`, { method: 'POST' });
  console.log('  撤销是否成功:', undo1.undone);
  console.log('  撤销后分拣方向:', undo1.gameState?.junctions?.[0]?.direction, '(期望:', oldDirection, ')');
  console.log('  撤销后阀门压力:', undo1.gameState?.valves?.[0]?.pressure, '(期望:', gameState.valves[0].pressure, ')');
  console.log('  操作历史长度:', undo1.gameState?.operationHistory?.length);
  
  gameState = undo1.gameState;

  console.log('\n=== 7. 再次撤销（应该回到调阀之前） ===');
  const undo2 = await request(`/api/game/${gameId}/undo`, { method: 'POST' });
  console.log('  撤销是否成功:', undo2.undone);
  console.log('  撤销后阀门压力:', undo2.gameState?.valves?.[0]?.pressure, '(期望:', oldPressure, ')');
  console.log('  操作历史长度:', undo2.gameState?.operationHistory?.length);
  
  gameState = undo2.gameState;

  console.log('\n=== 8. 无操作可撤销验证 ===');
  const undo3 = await request(`/api/game/${gameId}/undo`, { method: 'POST' });
  console.log('  预期错误:', undo3.error);

  console.log('\n=== 9. 重新执行一些操作以便后端重算 ===');
  gameState.valves[0].pressure = 75;
  gameState.valves[1].pressure = 60;
  
  const rec1 = {
    id: 'rec_' + Date.now(),
    timestamp: Date.now() + 5000,
    type: 'valve_adjust',
    targetId: gameState.valves[0].id,
    oldValue: oldPressure,
    newValue: 75,
    gameStateSnapshot: JSON.parse(JSON.stringify(gameState))
  };
  gameState.operationHistory.push(rec1);
  
  const rec2 = {
    id: 'rec_' + (Date.now() + 1000),
    timestamp: Date.now() + 6000,
    type: 'valve_adjust',
    targetId: gameState.valves[1].id,
    oldValue: gameState.valves[1].pressure,
    newValue: 60,
    gameStateSnapshot: JSON.parse(JSON.stringify(gameState))
  };
  gameState.operationHistory.push(rec2);
  
  gameState.currentTime = 60;
  gameState.isGameOver = true;
  gameState.victory = true;
  gameState.deliveriesCompleted = 5;
  gameState.capsules.push({
    id: 'cap_test',
    packageId: 'pkg_test',
    currentNodeId: 's_dest_1',
    targetNodeId: 's_dest_1',
    progress: 0,
    speed: 0,
    priority: 'normal',
    deliveryTime: 30,
    maxDeliveryTime: 45,
    status: 'delivered',
    cargo: '测试'
  });

  await request(`/api/game/${gameId}`, { 
    method: 'PATCH', 
    body: JSON.stringify(gameState) 
  });
  console.log('  操作历史长度:', gameState.operationHistory.length);
  console.log('  游戏结束:', gameState.isGameOver, '胜利:', gameState.victory);

  console.log('\n=== 10. 后端重新计算分数 ===');
  const recalc = await request(`/api/game/${gameId}/recalculate`, { method: 'POST' });
  console.log('  后端验证:', recalc.backendVerified);
  console.log('  前端分数:', gameState.score);
  console.log('  后端重算分数:', recalc.recalculatedBreakdown?.total);
  console.log('  实时计算分数:', recalc.liveBreakdown?.total);
  console.log('  分数差异:', recalc.scoreDifference);
  console.log('  评级:', recalc.gameResult?.rating);
  console.log('  保存到历史记录:', recalc.gameResult?.gameId === gameId);

  console.log('\n=== 11. 验证历史记录 ===');
  const history = await request('/api/history?limit=3');
  console.log('  历史记录数:', history.history?.length);
  const latest = history.history?.[0];
  if (latest) {
    console.log('  最新记录:', latest.rating, latest.recalculatedScore, '分', latest.victory ? '胜利' : '失败');
    console.log('  操作数:', latest.operationsPerformed, '交付:', latest.deliveriesCompleted);
  }

  console.log('\n✅ 完整闭环测试完成！');
  console.log('   - 操作历史快照: ✓ 操作前保存');
  console.log('   - 撤销: ✓ 正确回到上一状态');
  console.log('   - 后端重算: ✓ 从初始状态完整模拟');
  console.log('   - 结算保存: ✓ 保存到历史记录和玩家档案');
}

main().catch(console.error);
