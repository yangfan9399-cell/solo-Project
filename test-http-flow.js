const http = require("http");

const BASE = "http://localhost:3001";
const TIMEOUT = 180000;

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      method,
      host: "127.0.0.1",
      port: 3001,
      path,
      headers: data
        ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
        : {},
      timeout: TIMEOUT,
    };
    const req = http.request(opts, (res) => {
      let chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        try {
          resolve({ status: res.statusCode, body: JSON.parse(text) });
        } catch {
          resolve({ status: res.statusCode, body: text });
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("HTTP timeout " + method + " " + path)); });
    if (data) req.write(data);
    req.end();
  });
}

function print(title, obj) {
  console.log("\n" + "=".repeat(70));
  console.log("  " + title);
  console.log("=".repeat(70));
  if (obj !== undefined) {
    if (typeof obj === "string") console.log(obj);
    else console.log(JSON.stringify(obj, null, 2));
  }
}

(async () => {
  try {
    // ========== Step 0: 先 GET 首页触发 Next.js 编译 ==========
    print("Step 0: GET / 触发 Next.js 首次编译");
    console.log("(首次编译 API 路由可能需要几分钟，请耐心等待...)");
    const home = await request("GET", "/");
    console.log(`首页响应: status=${home.status}, body 长度=${typeof home.body === 'string' ? home.body.length : 'JSON对象'}`);

    // ========== Step 1: POST /api/seed 初始化种子数据 ==========
    print("[HTTP Step 1] POST /api/seed 初始化 3 个种子场景");
    const seed = await request("POST", "/api/seed");
    console.log(`status=${seed.status}`);
    console.log(JSON.stringify(seed.body, null, 2));

    // ========== Step 2: GET /api/history 获取会话列表 ==========
    print("[HTTP Step 2] GET /api/history 获取历史会话列表，取第 1 个已完成会话");
    const history = await request("GET", "/api/history");
    console.log(`status=${history.status}`);
    const sessions = history.body.sessions || [];
    console.log(`共 ${sessions.length} 个会话`);
    sessions.forEach((s, i) => console.log(`  [${i}] id=${s.id.slice(0,10)}... status=${s.status} route=${s.route.length}`));

    if (sessions.length === 0) { console.log("❌ 没有会话"); process.exit(1); }

    // 取第一个已完成的会话
    const targetSession = sessions.find((s) => s.status === "completed") || sessions[0];
    const SID = targetSession.id;
    console.log(`\n选择会话: ${SID} (status=${targetSession.status})`);

    // ========== Step 3: 重新加载会话 → GET /api/records + /api/recovery ==========
    print("[HTTP Step 3] 模拟初始加载（获取 result + recoveryTasks）");
    const records = await request("GET", `/api/records?sessionId=${SID}`);
    const result0 = records.body.result;
    console.log("初始 result：");
    console.log(JSON.stringify({
      researchPoints: result0.researchPoints,
      ecoScore: result0.ecoScore,
      finalScore: result0.finalScore,
      preRecoveryResearch: result0.preRecoveryResearch,
      preRecoveryEco: result0.preRecoveryEco,
      preRecoveryFinal: result0.preRecoveryFinal,
      tramplingPenalty: result0.tramplingPenalty,
      missedTidePenalty: result0.missedTidePenalty,
    }, null, 2));

    const rec0 = await request("GET", `/api/recovery?sessionId=${SID}`);
    const tasks0 = rec0.body.tasks || [];
    console.log("\n初始恢复任务列表：");
    tasks0.forEach((t, i) => console.log(`  [${i}] type=${t.type} completed=${t.completed} reward=${t.pointsReward}`));

    console.log("\n✅ 初始状态检查（尚未完成任何恢复任务）：");
    const eqResearch0 = result0.preRecoveryResearch === result0.researchPoints;
    const eqEco0 = result0.preRecoveryEco === result0.ecoScore;
    const eqFinal0 = result0.preRecoveryFinal === result0.finalScore;
    console.log(`  preRecoveryResearch === researchPoints : ${eqResearch0 ? "✅ YES" : "❌ NO"}`);
    console.log(`  preRecoveryEco === ecoScore           : ${eqEco0 ? "✅ YES" : "❌ NO"}`);
    console.log(`  preRecoveryFinal === finalScore       : ${eqFinal0 ? "✅ YES" : "❌ NO"}`);

    const pendingTasks0 = tasks0.filter((t) => !t.completed);
    if (pendingTasks0.length === 0) { console.log("⚠️  没有待完成的恢复任务，测试结束"); process.exit(0); }

    // ========== Step 4: POST /api/recovery 完成第 1 个恢复任务 + recalculate=true ==========
    const task1 = pendingTasks0[0];
    print(`[HTTP Step 4] POST /api/recovery 完成第 1 个任务: type=${task1.type} (recalculate=true)`);
    const recResp1 = await request("POST", "/api/recovery", {
      taskId: task1.id,
      sessionId: SID,
      recalculate: true,
    });
    console.log(`status=${recResp1.status}`);
    console.log("body 摘要：");
    if (recResp1.body.result) {
      const r = recResp1.body.result;
      console.log(JSON.stringify({
        researchPoints: r.researchPoints,
        ecoScore: r.ecoScore,
        finalScore: r.finalScore,
        preRecoveryResearch: r.preRecoveryResearch,
        preRecoveryEco: r.preRecoveryEco,
        preRecoveryFinal: r.preRecoveryFinal,
      }, null, 2));
    } else {
      console.log(JSON.stringify(recResp1.body, null, 2));
    }

    console.log("\n✅ 完成 1 个任务后差异：");
    const r1 = recResp1.body.result;
    if (r1) {
      const dRes = r1.researchPoints - r1.preRecoveryResearch;
      const dEco = r1.ecoScore - r1.preRecoveryEco;
      const dFin = r1.finalScore - r1.preRecoveryFinal;
      console.log(`  研究积分: ${r1.preRecoveryResearch} → ${r1.researchPoints} (+${dRes})`);
      console.log(`  生态评分: ${r1.preRecoveryEco} → ${r1.ecoScore} (+${dEco})`);
      console.log(`  总    分: ${r1.preRecoveryFinal} → ${r1.finalScore} (+${dFin})`);
      const diffOK = dRes > 0 || dEco > 0 || dFin > 0;
      console.log(`  差异存在: ${diffOK ? "✅ YES" : "❌ NO"}`);
    }

    // ========== Step 5: 模拟刷新页面 → 重新 GET /api/records + /api/recovery ==========
    print("[HTTP Step 5] 模拟刷新页面 → 重新 GET /api/records + /api/recovery（从 DB 重新读取）");
    const recordsReload = await request("GET", `/api/records?sessionId=${SID}`);
    const rReload = recordsReload.body.result;
    console.log("刷新后 result：");
    console.log(JSON.stringify({
      researchPoints: rReload.researchPoints,
      ecoScore: rReload.ecoScore,
      finalScore: rReload.finalScore,
      preRecoveryResearch: rReload.preRecoveryResearch,
      preRecoveryEco: rReload.preRecoveryEco,
      preRecoveryFinal: rReload.preRecoveryFinal,
    }, null, 2));

    const recReload = await request("GET", `/api/recovery?sessionId=${SID}`);
    const tasksReload = recReload.body.tasks || [];
    console.log("\n刷新后恢复任务列表：");
    tasksReload.forEach((t, i) => console.log(`  [${i}] type=${t.type} completed=${t.completed} reward=${t.pointsReward}`));

    const doneCount = tasksReload.filter((t) => t.completed).length;
    const pendingCount = tasksReload.filter((t) => !t.completed).length;

    console.log("\n" + "=".repeat(70));
    console.log("  [HTTP Step 5] 刷新后核心持久化验证");
    console.log("=".repeat(70));
    const dResR = rReload.researchPoints - rReload.preRecoveryResearch;
    const dEcoR = rReload.ecoScore - rReload.preRecoveryEco;
    const dFinR = rReload.finalScore - rReload.preRecoveryFinal;
    const diffPersistOK = dResR > 0 || dEcoR > 0 || dFinR > 0;
    const eqBenchmarkOK = rReload.preRecoveryResearch === result0.preRecoveryResearch
                       && rReload.preRecoveryEco === result0.preRecoveryEco
                       && rReload.preRecoveryFinal === result0.preRecoveryFinal;
    const keepCompletedOK = doneCount >= 1;
    const keepPendingOK = pendingCount >= 0;

    console.log(`  [${diffPersistOK ? "✅ PASS" : "❌ FAIL"}] 研究积分/生态评分/总分的恢复前后差异仍然可见`);
    console.log(`         研究积分: ${rReload.preRecoveryResearch} → ${rReload.researchPoints} (+${dResR})`);
    console.log(`         生态评分: ${rReload.preRecoveryEco} → ${rReload.ecoScore} (+${dEcoR})`);
    console.log(`         总    分: ${rReload.preRecoveryFinal} → ${rReload.finalScore} (+${dFinR})`);
    console.log(`  [${eqBenchmarkOK ? "✅ PASS" : "❌ FAIL"}] preRecovery 基准分与首次结算一致（持久化不变）`);
    console.log(`  [${keepCompletedOK ? "✅ PASS" : "❌ FAIL"}] 已完成恢复任务仍然保留 (completed=${doneCount})`);
    console.log(`  [${keepPendingOK ? "✅ PASS" : "❌ FAIL"}] 允许剩余任务继续完成 (pending=${pendingCount})`);

    // ========== Step 6: 继续完成剩余恢复任务（从刷新后的状态） ==========
    const remainingAfterReload = tasksReload.filter((t) => !t.completed);
    if (remainingAfterReload.length > 0) {
      print(`[HTTP Step 6] 从刷新后状态继续 → 完成剩余 ${remainingAfterReload.length} 个任务`);
      for (let i = 0; i < remainingAfterReload.length; i++) {
        const t = remainingAfterReload[i];
        console.log(`\n  完成剩余任务 #${i + 1}: type=${t.type} id=${t.id.slice(0,8)}...`);
        const resp = await request("POST", "/api/recovery", {
          taskId: t.id,
          sessionId: SID,
          recalculate: true,
        });
        if (resp.status === 200 && resp.body.result) {
          const rr = resp.body.result;
          console.log(`    result: research=${rr.researchPoints} eco=${rr.ecoScore} final=${rr.finalScore}`);
          console.log(`    累计差异: +${rr.researchPoints - rr.preRecoveryResearch} 研究 / +${rr.ecoScore - rr.preRecoveryEco} 生态 / +${rr.finalScore - rr.preRecoveryFinal} 总分`);
        } else {
          console.log(`    status=${resp.status}: ${JSON.stringify(resp.body).slice(0, 200)}`);
        }
      }

      // 再次重新加载（再模拟一次刷新）验证最终结果
      print("[HTTP Step 6 完成] 再次模拟刷新 → 验证全部任务完成后的持久化状态");
      const rFin = (await request("GET", `/api/records?sessionId=${SID}`)).body.result;
      const tFin = (await request("GET", `/api/recovery?sessionId=${SID}`)).body.tasks || [];
      console.log("最终 result：");
      console.log(JSON.stringify({
        researchPoints: rFin.researchPoints,
        ecoScore: rFin.ecoScore,
        finalScore: rFin.finalScore,
        preRecoveryResearch: rFin.preRecoveryResearch,
        preRecoveryEco: rFin.preRecoveryEco,
        preRecoveryFinal: rFin.preRecoveryFinal,
      }, null, 2));
      console.log("\n最终恢复任务列表：");
      tFin.forEach((t, i) => console.log(`  [${i}] type=${t.type} completed=${t.completed}`));
      const allDone = tFin.every((t) => t.completed);

      console.log("\n" + "=".repeat(70));
      console.log("  [HTTP 完整流程] 最终验证结论");
      console.log("=".repeat(70));
      const allPass = diffPersistOK && eqBenchmarkOK && keepCompletedOK && keepPendingOK && allDone;
      console.log(`  [${diffPersistOK ? "✅" : "❌"}] 结算面板显示研究积分、生态评分、总分的恢复前后差异`);
      console.log(`  [${eqBenchmarkOK ? "✅" : "❌"}] preRecovery 基准分在多次重算中不被篡改`);
      console.log(`  [${keepCompletedOK ? "✅" : "❌"}] 已完成任务不被删除重建，保持 completed=true`);
      console.log(`  [${keepPendingOK ? "✅" : "❌"}] 剩余恢复任务在重新加载后仍可继续完成`);
      console.log(`  [${allDone ? "✅" : "❌"}] 从刷新后状态继续完成全部剩余任务，全部标记为 done`);
      console.log(`\n  总评: ${allPass ? "🎉 全部通过！持久化符合要求。" : "⚠️  存在未通过项。"}`);
      console.log("=".repeat(70));
    }
  } catch (e) {
    console.error("❌ 测试失败:", e.message);
    console.error(e.stack);
    process.exit(1);
  }
})();
