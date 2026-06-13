const RECORD_ID = "c0000003-0000-0000-0000-000000000003";
const USER_ID = "a0000002-0000-0000-0000-000000000002";
const BASE = "http://localhost:5173";

async function test() {
  console.log("=== 1. 添加业务记录 ===");
  let res = await fetch(`${BASE}/api/records/${RECORD_ID}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "add_business_record",
      userId: USER_ID,
      content: "已协调客户调整会议时间",
      recordType: "coordination_note"
    })
  });
  let data = await res.json();
  console.log("业务记录ID:", data.businessRecord?.id ?? "ERROR");
  console.log("状态码:", res.status);

  console.log("\n=== 2. 添加现场说明 ===");
  res = await fetch(`${BASE}/api/records/${RECORD_ID}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "add_explanation",
      userId: USER_ID,
      content: "现场核实车辆使用时间确有调整需求"
    })
  });
  data = await res.json();
  console.log("现场说明ID:", data.explanation?.id ?? "ERROR");
  console.log("状态码:", res.status);

  console.log("\n=== 3. 提交复核 ===");
  res = await fetch(`${BASE}/api/records/${RECORD_ID}/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "submit_for_review",
      userId: USER_ID
    })
  });
  data = await res.json();
  console.log("状态:", data.record?.status ?? "ERROR");
  console.log("当前处理人ID:", data.record?.currentAssigneeId ?? "ERROR");
  console.log("状态码:", res.status);

  console.log("\n=== 4. 验证详情页数据 ===");
  res = await fetch(`${BASE}/api/records/${RECORD_ID}`);
  data = await res.json();
  console.log("业务记录数:", data.businessRecords?.length ?? 0);
  console.log("现场说明数:", data.onSiteExplanations?.length ?? 0);
  if (data.businessRecords?.length > 0) {
    const br = data.businessRecords[0];
    console.log("第一条业务记录 createdBy:", br.createdBy?.name ?? "MISSING");
  }
  if (data.onSiteExplanations?.length > 0) {
    const exp = data.onSiteExplanations[0];
    console.log("第一条现场说明 createdBy:", exp.createdBy?.name ?? "MISSING");
  }
  console.log("处理节点数:", data.processingNodes?.length ?? 0);
}

test().catch(console.error);
