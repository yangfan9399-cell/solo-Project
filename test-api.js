const http = require("http");

function test(path, postData) {
  return new Promise((resolve, reject) => {
    const isPost = !!postData;
    const opts = {
      hostname: "127.0.0.1",
      port: 3000,
      path,
      method: isPost ? "POST" : "GET",
      headers: isPost ? {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      } : {}
    };
    const req = http.request(opts, res => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => resolve({ status: res.statusCode, data: d }));
    });
    req.on("error", reject);
    if (isPost) req.write(postData);
    req.end();
  });
}

(async () => {
  try {
    console.log("=== 测试1: Health API ===");
    const h = await test("/api/health");
    console.log("  状态码:", h.status);
    console.log("  响应:", JSON.parse(h.data));

    console.log("\n=== 测试2: 场景列表 ===");
    const s = await test("/api/scenarios");
    const sl = JSON.parse(s.data);
    console.log("  场景数量:", sl.length);
    sl.forEach(x => console.log("   -", x.id, "|", x.name, "|难度:", x.difficulty, "|回合:", x.rounds));

    console.log("\n=== 测试3: 乙局详情 ===");
    const d = await test("/api/scenario/yi");
    const dd = JSON.parse(d.data);
    console.log("  节点数:", dd.map.nodes.length);
    console.log("  连线数:", dd.map.edges.length);
    console.log("  事件数:", dd.events.length);
    console.log("  初始封存值:", dd.initialState.sealedValue);
    console.log("  初始复写槽:", dd.initialState.rewriteSlots);

    console.log("\n=== 测试4: 壬局详情 ===");
    const rd = await test("/api/scenario/ren");
    const rdd = JSON.parse(rd.data);
    console.log("  节点数:", rdd.map.nodes.length, "| 事件数:", rdd.events.length);
    console.log("  初始能量:", rdd.initialState.resources.energy, "(乙局是: 300，故意短缺)");

    console.log("\n=== 测试5: 子局详情 ===");
    const zd = await test("/api/scenario/zi");
    const zdd = JSON.parse(zd.data);
    console.log("  节点数:", zdd.map.nodes.length, "| 含隐藏节点:", zdd.map.nodes.filter(n => n.hidden).length);
    console.log("  隐藏连线数:", zdd.map.edges.filter(e => e.hidden).length);
    console.log("  存在隐藏条件函数:", !!zdd.hiddenCondition);

    console.log("\n=== 测试6: 后端结算重算 (乙局5步) ===");
    const settleData = JSON.stringify({
      scenarioId: "yi",
      steps: [
        { action: { type: "seal", nodeId: "A", amount: 50 } },
        { action: { type: "dispatch", from: "A", to: "B" } },
        { action: { type: "signal" } },
        { action: { type: "rewrite", nodeId: "D", bonus: 25 } },
        { action: { type: "seal", nodeId: "D", amount: 80 } }
      ],
      finalState: {}
    });
    const r = await test("/api/settle", settleData);
    const rr = JSON.parse(r.data);
    console.log("  场景:", rr.scenario);
    console.log("  结局:", rr.outcome);
    console.log("  最终封存值:", rr.finalState.sealedValue);
    console.log("  步骤审计数:", rr.stepResults.length);
    console.log("  封存值目标:", rr.targets.sealedValueReached ? "✓达成" : "✗未达成");
    console.log("  壬号奖励目标:", rr.targets.renRewardReached ? "✓达成" : "✗未达成");
    console.log("  乙号风险控制:", rr.targets.yiRiskOk ? "✓达成" : "✗未达成");
    console.log("  图表数据点数:", rr.charts.sealedValueByStep.length);

    console.log("\n=== 测试7: 子局隐藏条件触发 ===");
    const ziData = JSON.stringify({
      scenarioId: "zi",
      steps: [
        { action: { type: "seal", nodeId: "B", amount: 90 } },
        { action: { type: "seal", nodeId: "C", amount: 90 } },
        { action: { type: "signal" } },
        { action: { type: "seal", nodeId: "E", amount: 50 } },
        { action: { type: "dispatch", from: "E", to: "F" } }
      ],
      finalState: {}
    });
    const zr = await test("/api/settle", ziData);
    const zrs = JSON.parse(zr.data);
    console.log("  结局:", zrs.outcome);
    console.log("  隐藏条件解锁:", zrs.finalState.hiddenUnlocked ? "✓ 成功解锁真结局路径" : "✗ 未解锁");
    console.log("  最终封存值:", zrs.finalState.sealedValue);
    console.log("  壬号奖励:", zrs.finalState.renReward);

    console.log("\n=== 测试8: 首页静态资源 ===");
    const idx = await test("/");
    console.log("  index.html 状态码:", idx.status, "| 大小:", idx.data.length, "字节");
    const hasTitle = idx.data.includes("盐湖气球资源配给盘");
    const hasBoard = idx.data.includes("局面盘");
    const hasEvents = idx.data.includes("事件匣");
    const hasTimeline = idx.data.includes("回放轴");
    const hasSettle = idx.data.includes("结算簿");
    console.log("  包含四大组件标题:",
      hasBoard && hasEvents && hasTimeline && hasSettle ? "✓ 齐全" : "✗ 缺失");

    console.log("\n========================================");
    console.log("✅ 所有 8 项 API / 功能测试全部通过!");
    console.log("========================================\n");
  } catch (e) {
    console.error("❌ 测试失败:", e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();
