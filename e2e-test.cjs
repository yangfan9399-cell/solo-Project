const http = require("http");

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(body).toString();
    const req = http.request({
      hostname: "localhost",
      port: 3003,
      path: path,
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": data.length,
      },
    }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d }));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function patch(path, body) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(body).toString();
    const req = http.request({
      hostname: "localhost",
      port: 3003,
      path: path,
      method: "PATCH",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": data.length,
      },
    }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d }));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: "localhost", port: 3003, path: path, method: "GET" },
      (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => resolve({ status: res.statusCode, body: d }));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function runTests() {
  console.log("=== Test 1: Create session ===");
  const create = await post("/api/sessions", { playerId: "1", levelId: "2" });
  console.log("Status:", create.status);
  const sessionId = JSON.parse(create.body).id;
  console.log("Session ID:", sessionId);

  console.log("\n=== Test 2: Write operation history (add) with real annotations ===");
  const ann1 = [
    { id: "test-ann-1", type: "scratch", x: 50, y: 60, width: 120, height: 15 },
    { id: "test-ann-2", type: "particle", x: 200, y: 180, width: 25, height: 25 },
  ];
  const patch1 = await patch("/api/sessions", {
    id: String(sessionId),
    annotations_json: JSON.stringify(ann1),
    elapsed_seconds: "25",
    operation_type: "add",
    annotation_before_json: "[]",
    annotation_after_json: JSON.stringify(ann1),
  });
  console.log("PATCH Status:", patch1.status);

  console.log("\n=== Test 3: Read operation history ===");
  const hist = await get("/api/history?sessionId=" + sessionId);
  console.log("Status:", hist.status, "History count:", JSON.parse(hist.body).length);

  console.log("\n=== Test 4: Submit with real annotations for backend recalculation ===");
  const submit = await post("/api/submit", {
    sessionId: String(sessionId),
    annotations_json: JSON.stringify([
      { id: "a", type: "particle", x: 50, y: 60, width: 120, height: 15 },
      { id: "b", type: "scratch", x: 200, y: 180, width: 25, height: 25 },
      { id: "c", type: "edge", x: 300, y: 300, width: 60, height: 80 },
      { id: "d", type: "particle", x: 400, y: 400, width: 20, height: 20 },
      { id: "e", type: "scratch", x: 10, y: 10, width: 100, height: 10 },
    ]),
    elapsed_seconds: "45",
  });
  console.log("Submit Status:", submit.status);
  const result = JSON.parse(submit.body);
  console.log("Session status:", result.status, "Passed:", result.passed);
  console.log(
    "Confusion Matrix TP/FP/FN/TN:",
    result.confusion_matrix.tp,
    result.confusion_matrix.fp,
    result.confusion_matrix.fn,
    result.confusion_matrix.tn
  );
  console.log(
    "Score total:",
    result.total_score,
    "(base:",
    result.base_score,
    "prec_bonus:",
    result.precision_bonus,
    "rec_bonus:",
    result.recall_bonus,
    "time_bonus:",
    result.time_bonus,
    ")"
  );
  console.log("Training set count:", result.training_set_count);

  console.log("\n=== Test 5: Result page renders all sections ===");
  const resultPage = await get("/result/" + sessionId);
  const hasTraining = resultPage.body.includes("训练集扩充");
  const hasMatrix = resultPage.body.includes("混淆矩阵");
  const hasScore = resultPage.body.includes("得分明细");
  console.log("  Training set section:", hasTraining ? "OK" : "MISSING");
  console.log("  Confusion matrix section:", hasMatrix ? "OK" : "MISSING");
  console.log("  Score breakdown section:", hasScore ? "OK" : "MISSING");

  console.log("\n=== Test 6: Game page restores in_progress session ===");
  const create2 = await post("/api/sessions", { playerId: "1", levelId: "3" });
  const sid2 = JSON.parse(create2.body).id;
  await patch("/api/sessions", {
    id: String(sid2),
    annotations_json: JSON.stringify([
      { id: "restore-test", type: "edge", x: 100, y: 100, width: 50, height: 50 },
    ]),
    elapsed_seconds: "10",
    operation_type: "add",
    annotation_before_json: "[]",
    annotation_after_json: JSON.stringify([
      { id: "restore-test", type: "edge", x: 100, y: 100, width: 50, height: 50 },
    ]),
  });
  const gamePage = await get("/game/3?playerId=1");
  const hasRestore = gamePage.body.includes("已恢复上次进度");
  const hasDefectButtons = gamePage.body.includes("划伤") && gamePage.body.includes("颗粒") && gamePage.body.includes("边缘");
  console.log("  Restore indicator:", hasRestore ? "OK" : "MISSING");
  console.log("  Defect type buttons:", hasDefectButtons ? "OK" : "MISSING");

  console.log("\n=== ALL TESTS COMPLETE ===");
}

runTests().catch(console.error);
