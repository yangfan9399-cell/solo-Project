const BASE_URL = "http://localhost:3000";

async function testSessionFlow() {
  console.log("\n=== 测试会话管理 API ===\n");

  // 1. 获取初始游戏状态需要先从首页获取，这里直接模拟创建一个简化的会话
  console.log("1. 创建新会话 (POST /api/session)");
  const mockGameState = {
    levelId: "level-1",
    gridSize: 8,
    maxDives: 5,
    sonarPerDive: 12,
    turbidity: 20,
    relics: [
      { id: "relic-1", name: "青铜鼎", discovered: false }
    ],
    cells: Array(8).fill(null).map(() => 
      Array(8).fill(null).map(() => ({
        sonarScanned: false,
        excavated: false,
        hasRelic: false,
        sonarStrength: 0
      }))
    ),
    currentDive: { diveNumber: 1, sonarUsed: 0 },
    discoveredRelics: [],
    score: 0,
    gameStatus: "playing",
    startTime: Date.now()
  };

  const createResp = await fetch(`${BASE_URL}/api/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      levelId: "level-1",
      gameState: mockGameState
    })
  });
  const session = await createResp.json();
  console.log("   创建成功，会话ID:", session.id);
  const sessionId = session.id;

  // 2. 模拟进行几次操作，更新会话
  console.log("\n2. 更新会话 - 添加操作历史 (PUT /api/session/:id)");
  
  const mockHistory = [
    {
      type: "sonar",
      position: { row: 0, col: 0 },
      previousState: { ...mockGameState, score: 0 },
      timestamp: Date.now() - 5000
    },
    {
      type: "sonar",
      position: { row: 0, col: 1 },
      previousState: { ...mockGameState, score: 10 },
      timestamp: Date.now() - 3000
    },
    {
      type: "excavate",
      position: { row: 1, col: 1 },
      previousState: { ...mockGameState, score: 30 },
      timestamp: Date.now() - 1000
    }
  ];

  const updatedState = {
    ...mockGameState,
    score: 50,
    discoveredRelics: ["relic-1"],
    cells: mockGameState.cells.map((row, ri) => 
      row.map((cell, ci) => ({
        ...cell,
        sonarScanned: (ri === 0 && ci <= 1) || (ri === 1 && ci === 1),
        excavated: ri === 1 && ci === 1,
        sonarStrength: (ri === 0 && ci === 1) ? 35 : cell.sonarStrength
      }))
    )
  };

  const updateResp = await fetch(`${BASE_URL}/api/session/${sessionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gameState: updatedState,
      history: mockHistory
    })
  });
  const updatedSession = await updateResp.json();
  console.log("   更新成功，历史记录数:", updatedSession.history.length);
  console.log("   当前分数:", updatedSession.gameState.score);

  // 3. 再次获取活动会话，验证数据持久化
  console.log("\n3. 重新获取活动会话 (GET /api/session?levelId=level-1)");
  const getResp = await fetch(`${BASE_URL}/api/session?levelId=level-1`);
  const { session: restoredSession } = await getResp.json();
  
  if (restoredSession && restoredSession.id === sessionId) {
    console.log("   ✅ 会话恢复成功!");
    console.log("   会话ID:", restoredSession.id);
    console.log("   历史记录数:", restoredSession.history.length);
    console.log("   游戏分数:", restoredSession.gameState.score);
    console.log("   发现遗物:", restoredSession.gameState.discoveredRelics);
    console.log("   可撤销步数:", restoredSession.history.length);
  } else {
    console.log("   ❌ 会话恢复失败");
  }

  // 4. 测试撤销操作（从历史中恢复状态）
  console.log("\n4. 测试撤销 - 从历史记录恢复状态");
  const lastAction = restoredSession.history[restoredSession.history.length - 1];
  const undoneState = {
    ...restoredSession.gameState,
    cells: lastAction.previousState.cells,
    discoveredRelics: lastAction.previousState.discoveredRelics,
    score: lastAction.previousState.score,
    gameStatus: "playing"
  };
  const undoneHistory = restoredSession.history.slice(0, -1);

  const undoResp = await fetch(`${BASE_URL}/api/session/${sessionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      gameState: undoneState,
      history: undoneHistory
    })
  });
  const afterUndo = await undoResp.json();
  console.log("   ✅ 撤销成功!");
  console.log("   撤销后分数:", afterUndo.gameState.score);
  console.log("   剩余历史记录:", afterUndo.history.length);

  // 5. 完成会话
  console.log("\n5. 完成会话 (DELETE /api/session/:id?complete=true)");
  const completeResp = await fetch(`${BASE_URL}/api/session/${sessionId}?complete=true`, {
    method: "DELETE"
  });
  const completed = await completeResp.json();
  console.log("   会话状态:", completed.status);

  // 6. 验证会话不再是活动状态
  console.log("\n6. 验证完成后会话不再活动");
  const finalGetResp = await fetch(`${BASE_URL}/api/session?levelId=level-1`);
  const { session: finalSession } = await finalGetResp.json();
  console.log("   活动会话:", finalSession === null ? "✅ 无 (已完成)" : "❌ 仍存在");

  console.log("\n=== 测试完成 ===");
}

testSessionFlow().catch(console.error);
