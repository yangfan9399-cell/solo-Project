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
  let passed = 0, failed = 0;
  function assert(name, cond, detail) {
    if (cond) {
      console.log("  ✓", name);
      passed++;
    } else {
      console.log("  ✗", name, detail || "");
      failed++;
    }
  }

  console.log("\n=== 测试A: 子局隐藏条件阈值 (各节点封存1 不应解锁) ===");
  {
    const steps = [
      { action: { type: "seal", nodeId: "B", amount: 1 } },
      { action: { type: "seal", nodeId: "C", amount: 1 } }
    ];
    const r = await test("/api/settle", JSON.stringify({ scenarioId: "zi", steps, finalState: {} }));
    const data = JSON.parse(r.data);
    assert("B封存1 + C封存1 = hiddenUnlocked=false", data.finalState.hiddenUnlocked === false,
      `实际: hiddenUnlocked=${data.finalState.hiddenUnlocked}, B封存=${data.stepResults[0]?.sealAmount}, C封存=${data.stepResults[1]?.sealAmount}`);
    assert("结局=进行中/普通(非真结局)", !data.isHiddenEnding, "实际结局: " + data.outcome);
  }

  console.log("\n=== 测试B: 子局B封存80+C封存79 不应解锁 ===");
  {
    const steps = [
      { action: { type: "seal", nodeId: "B", amount: 80 } },
      { action: { type: "seal", nodeId: "C", amount: 79 } }
    ];
    const r = await test("/api/settle", JSON.stringify({ scenarioId: "zi", steps, finalState: {} }));
    const data = JSON.parse(r.data);
    assert("B=80,C=79 = hiddenUnlocked=false", data.finalState.hiddenUnlocked === false,
      "实际: hiddenUnlocked=" + data.finalState.hiddenUnlocked);
    assert("非真结局", !data.isHiddenEnding, "结局: " + data.outcome);
  }

  console.log("\n=== 测试C: 子局B封存80+C封存80 才解锁 ===");
  {
    const steps = [
      { action: { type: "seal", nodeId: "B", amount: 80 } },
      { action: { type: "seal", nodeId: "C", amount: 80 } }
    ];
    const r = await test("/api/settle", JSON.stringify({ scenarioId: "zi", steps, finalState: {} }));
    const data = JSON.parse(r.data);
    assert("B=80,C=80 = hiddenUnlocked=true", data.finalState.hiddenUnlocked === true,
      "实际: hiddenUnlocked=" + data.finalState.hiddenUnlocked);
    assert("某一步触发了 hiddenUnlocked 标记",
      data.stepResults.some(sr => sr.hiddenUnlocked === true),
      "stepResults 无 hiddenUnlocked=true 标记");
    console.log("  → stepResult 中 B封存:", data.stepResults[0]?.sealAmount,
      " C封存:", data.stepResults[1]?.sealAmount);
  }

  console.log("\n=== 测试D: finalState.hiddenUnlocked 无法覆盖步骤结果 ===");
  {
    // 步骤只各封存1 → 实际没解锁，但传入 finalState.hiddenUnlocked=true 试图伪造
    const steps = [
      { action: { type: "seal", nodeId: "B", amount: 1 } },
      { action: { type: "seal", nodeId: "C", amount: 1 } }
    ];
    const r = await test("/api/settle", JSON.stringify({
      scenarioId: "zi", steps,
      finalState: { hiddenUnlocked: true }
    }));
    const data = JSON.parse(r.data);
    assert("传入 finalState.hiddenUnlocked=true 但步骤不满足时仍为 false",
      data.finalState.hiddenUnlocked === false,
      "实际: hiddenUnlocked=" + data.finalState.hiddenUnlocked + " (被覆盖为true说明有bug)");
    assert("非真结局", !data.isHiddenEnding, "结局: " + data.outcome);
  }

  console.log("\n=== 测试E: 乙局事件推进 (8步 触发所有事件) ===");
  {
    // 构造8步，覆盖 8 个回合，看所有事件是否被按顺序触发
    const steps = Array(8).fill(0).map(() => ({ action: { type: "seal", nodeId: "A", amount: 10 } }));
    const r = await test("/api/settle", JSON.stringify({ scenarioId: "yi", steps, finalState: {} }));
    const data = JSON.parse(r.data);
    const eventCount = data.stepResults.filter(sr => sr.eventApplied).length;
    console.log("  → 已触发事件数:", eventCount);
    console.log("  → 触发的事件ID:", data.stepResults.map(sr => sr.eventApplied || null).filter(x => x));
    assert("乙局 8步 至少触发 4 个带effect的事件(yi_e2/e4/e5/e6)", eventCount >= 4, "实际触发: " + eventCount);
    // 乙号事件 e2 是第2回合，奖励+20封存值
    const e2Applied = data.stepResults.find(sr => sr.eventApplied === "yi_e2");
    assert("第2步触发 yi_e2(初始奖励)", !!e2Applied, "未找到 yi_e2");
    if (e2Applied) {
      const delta = (e2Applied.after?.sealedValue || 0) - (e2Applied.before?.sealedValue || 0);
      console.log("  → yi_e2 作用后封存值增量:", delta, " (动作+事件总和)");
      assert("yi_e2 使封存值上升(包含动作10+奖励15=增量≈25)", delta > 15, "实际增量: " + delta);
    }
  }

  console.log("\n=== 测试F: 壬局事件推进 (故意短缺) ===");
  {
    const steps = Array(7).fill(0).map((_, i) => {
      if (i % 2 === 0) return { action: { type: "seal", nodeId: "A", amount: 5 } };
      return { action: { type: "signal" } };
    });
    const r = await test("/api/settle", JSON.stringify({ scenarioId: "ren", steps, finalState: {} }));
    const data = JSON.parse(r.data);
    const eventApplied = data.stepResults.filter(sr => sr.eventApplied).map(sr => sr.eventApplied);
    console.log("  → 触发的事件:", eventApplied);
    assert("壬局 7步 触发了事件", eventApplied.length > 0, "没有任何事件触发");
    // ren_e1 第1回合无effect, ren_e2 第2回合有effect(乙号风险+20)
    if (data.stepResults[1]) {
      const yiRiskDelta = (data.stepResults[1].after?.yiRisk || 0) - (data.stepResults[1].before?.yiRisk || 0);
      // 第2回合 ren_e2: 乙号风险+20
      console.log("  → 第2步前后乙号风险变化:", yiRiskDelta, " (预计≈+20)");
      assert("第2步包含 ren_e2 风险上升(动作signal-5 + 事件+20 = 净+15)", yiRiskDelta >= 10 && yiRiskDelta <= 25, "实际变化: " + yiRiskDelta);
    }
  }

  console.log("\n========================================");
  console.log(`测试结果: ${passed} 通过, ${failed} 失败`);
  if (failed === 0) {
    console.log("✅ 全部通过! 隐藏条件 & finalState 覆盖 & 事件推进 修复有效");
  } else {
    console.log("❌ 有失败用例");
    process.exit(1);
  }
  console.log("========================================\n");
})().catch(e => {
  console.error("错误:", e.message);
  console.error(e.stack);
  process.exit(1);
});
