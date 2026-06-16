const http = require("http");

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(body).toString();
    const req = http.request({
      hostname: "localhost", port: 3003, path: path, method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": data.length },
    }, (res) => {
      let d = ""; res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d }));
    });
    req.on("error", reject); req.write(data); req.end();
  });
}

function patch(path, body) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(body).toString();
    const req = http.request({
      hostname: "localhost", port: 3003, path: path, method: "PATCH",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": data.length },
    }, (res) => {
      let d = ""; res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d }));
    });
    req.on("error", reject); req.write(data); req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname: "localhost", port: 3003, path: path, method: "GET" }, (res) => {
      let d = ""; res.on("data", (c) => (d += c));
      res.on("end", () => resolve({ status: res.statusCode, body: d }));
    });
    req.on("error", reject); req.end();
  });
}

let pass = 0;
let fail = 0;
function check(name, condition) {
  if (condition) { pass++; console.log("  ✅ " + name); }
  else { fail++; console.log("  ❌ " + name); }
}

async function runTests() {
  console.log("=== 测试1: 重复提交防护 ===");
  const s1 = await post("/api/sessions", { playerId: "1", levelId: "1" });
  const sid1 = JSON.parse(s1.body).id;
  await post("/api/submit", { sessionId: String(sid1), annotations_json: "[]", elapsed_seconds: "10" });
  const resubmit = await post("/api/submit", { sessionId: String(sid1), annotations_json: "[]", elapsed_seconds: "10" });
  check("重复提交返回409", resubmit.status === 409);
  check("错误消息中文", JSON.parse(resubmit.body).error.includes("已结算"));

  console.log("\n=== 测试2: 已结算会话PATCH防护 ===");
  const patchRes = await patch("/api/sessions", {
    id: String(sid1), annotations_json: "[]", elapsed_seconds: "5",
    operation_type: "modify", annotation_after_json: "[]",
  });
  check("PATCH已结算会话返回409", patchRes.status === 409);

  console.log("\n=== 测试3: 重复玩家名称处理 ===");
  const dupPlayer = await post("/api/players", { name: "默认工程师" });
  check("重复名称返回已有玩家", dupPlayer.status === 200 && JSON.parse(dupPlayer.body).name === "默认工程师");

  console.log("\n=== 测试4: 缺陷类型按关卡过滤 ===");
  const game1 = await get("/game/1?playerId=1");
  const body1 = game1.body;
  check("关卡1(仅scratch)有划伤按钮", body1.includes("划伤"));
  check("关卡1(仅scratch)无颗粒按钮", !body1.includes("颗粒"));
  check("关卡1(仅scratch)无边缘按钮", !body1.includes("边缘"));

  const game5 = await get("/game/5?playerId=1");
  check("关卡5(三种缺陷)有划伤+颗粒+边缘", game5.body.includes("划伤") && game5.body.includes("颗粒") && game5.body.includes("边缘"));

  console.log("\n=== 测试5: 结算页time_bonus正确 ===");
  const s2 = await post("/api/sessions", { playerId: "1", levelId: "2" });
  const sid2 = JSON.parse(s2.body).id;
  const submitRes = await post("/api/submit", {
    sessionId: String(sid2),
    annotations_json: JSON.stringify([{ id: "a", type: "particle", x: 50, y: 60, width: 120, height: 15 }]),
    elapsed_seconds: "30",
  });
  const submitData = JSON.parse(submitRes.body);
  check("time_bonus > 0", submitData.time_bonus > 0);
  check("total_score = base + prec + recall + time", submitData.total_score === submitData.base_score + submitData.precision_bonus + submitData.recall_bonus + submitData.time_bonus);

  const resultPage = await get("/result/" + sid2);
  check("结算页有时间奖励行", resultPage.body.includes("时间奖励"));

  console.log("\n=== 测试6: 结算页in_progress状态 ===");
  const s3 = await post("/api/sessions", { playerId: "1", levelId: "3" });
  const sid3 = JSON.parse(s3.body).id;
  const inProgressResult = await get("/result/" + sid3);
  check("in_progress状态显示未完成", inProgressResult.body.includes("未完成") || inProgressResult.body.includes("尚未提交"));

  console.log("\n=== 测试7: 操作历史写入 ===");
  const s4 = await post("/api/sessions", { playerId: "1", levelId: "4" });
  const sid4 = JSON.parse(s4.body).id;
  await patch("/api/sessions", {
    id: String(sid4), annotations_json: "[{\"id\":\"t1\",\"type\":\"scratch\",\"x\":10,\"y\":10,\"width\":50,\"height\":10}]",
    elapsed_seconds: "5", operation_type: "add",
    annotation_before_json: "[]",
    annotation_after_json: "[{\"id\":\"t1\",\"type\":\"scratch\",\"x\":10,\"y\":10,\"width\":50,\"height\":10}]",
  });
  const hist = await get("/api/history?sessionId=" + sid4);
  const histData = JSON.parse(hist.body);
  check("操作历史有1条记录", histData.length === 1);
  check("操作类型为add", histData[0].operation_type === "add");

  console.log("\n=== 测试8: 首页错误提示 ===");
  const homePage = await get("/");
  check("首页有输入框", homePage.body.includes("工程师代号"));
  check("首页有关卡列表", homePage.body.includes("选择关卡"));

  console.log("\n=== 测试9: API错误消息中文化 ===");
  const noSessionSubmit = await post("/api/submit", { sessionId: "0", annotations_json: "[]", elapsed_seconds: "0" });
  check("submit错误消息中文", JSON.parse(noSessionSubmit.body).error.includes("不存在") || JSON.parse(noSessionSubmit.body).error.includes("缺少"));

  const noSessionPatch = await patch("/api/sessions", { id: "99999", annotations_json: "[]", elapsed_seconds: "0" });
  check("patch错误消息中文", JSON.parse(noSessionPatch.body).error.includes("不存在"));

  const noNamePlayer = await post("/api/players", { name: "" });
  check("players错误消息中文", JSON.parse(noNamePlayer.body).error.includes("输入"));

  console.log("\n========================================");
  console.log(`总计: ${pass} 通过, ${fail} 失败`);
  console.log("========================================");
}

runTests().catch(console.error);
