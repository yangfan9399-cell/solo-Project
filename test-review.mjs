const RECORD_ID = "c0000003-0000-0000-0000-000000000003";
const REVIEWER_ID = "a0000003-0000-0000-0000-000000000003";
const BASE = "http://localhost:5173";

async function test() {
  console.log("=== 复核确认 ===");
  let res = await fetch(`${BASE}/api/records/${RECORD_ID}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "confirm",
      userId: REVIEWER_ID,
      conclusion: "复核通过，时间调整合理",
      basis: "已核实客户会议时间调整，用车时间调整在合理范围内",
      comment: "同意通过"
    })
  });
  let data = await res.json();
  console.log("状态码:", res.status);
  console.log("结论:", data.record?.conclusion ?? "ERROR");
  console.log("依据:", data.record?.basis ?? "ERROR");

  console.log("\n=== 归档 ===");
  res = await fetch(`${BASE}/api/records/${RECORD_ID}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "archive",
      userId: REVIEWER_ID
    })
  });
  data = await res.json();
  console.log("状态码:", res.status);
  console.log("状态:", data.record?.status ?? "ERROR");

  console.log("\n=== 验证详情页历史节点 ===");
  res = await fetch(`${BASE}/api/records/${RECORD_ID}`);
  data = await res.json();
  console.log("处理节点数:", data.processingNodes?.length ?? 0);
  console.log("节点列表:");
  data.processingNodes?.forEach((node, i) => {
    console.log(`  ${i+1}. [${node.nodeType}] ${node.action} - 操作人: ${node.operator?.name ?? '?'}`);
  });

  console.log("\n=== 验证归档后只读（尝试更新） ===");
  res = await fetch(`${BASE}/api/records/${RECORD_ID}/update`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: REVIEWER_ID,
      fields: { conclusion: "测试修改归档记录" }
    })
  });
  console.log("更新状态码:", res.status);
  // 注意：当前API可能没有归档后只读的限制，需要确认
}

test().catch(console.error);
