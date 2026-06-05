import { db } from "./app/db/index.js";
import { checkAreaConflict, createPermit, confirmArea, updateAreaAndResubmit } from "./app/lib/services.js";

async function test() {
  console.log("=== 测试区域冲突检测 ===\n");
  
  // 1. 测试 checkAreaConflict
  const result = await checkAreaConflict(1, "2026-06-07", "2026-06-12");
  console.log("1. checkAreaConflict (A栋3楼东侧, 6.7-6.12):");
  console.log("   hasConflict:", result.hasConflict);
  console.log("   冲突许可数:", result.conflictingPermits.length);
  if (result.conflictingPermits.length > 0) {
    console.log("   冲突许可:", result.conflictingPermits.map(p => p.permitNumber).join(", "));
  }
  
  console.log("\n=== 测试 createPermit 区域冲突 ===\n");
  
  // 2. 测试 createPermit - 有冲突的情况
  const permit = await createPermit({
    teamId: 2,
    areaId: 1,
    constructionType: "ELECTRICAL",
    startDate: "2026-06-07",
    endDate: "2026-06-12",
    startTime: "09:00",
    endTime: "17:00",
    workContent: "测试冲突的申请",
    workerIds: [4, 5],
    hasDocuments: true,
  });
  console.log("2. createPermit (有冲突):");
  console.log("   许可号:", permit.permitNumber);
  console.log("   状态:", permit.status);
  console.log("   异常类型:", permit.anomalyType);
  console.log("   是否有区域冲突:", permit.hasAreaConflict);
  console.log("   冲突详情:", permit.areaConflictDetail);
  
  console.log("\n=== 测试 updateAreaAndResubmit 区域冲突 ===\n");
  
  // 3. 测试 updateAreaAndResubmit - 仍然冲突
  const updated1 = await updateAreaAndResubmit(
    permit.id,
    1,
    "2026-06-08",
    "2026-06-11"
  );
  console.log("3. updateAreaAndResubmit (同区域，仍然冲突):");
  console.log("   状态:", updated1?.status);
  console.log("   是否有区域冲突:", updated1?.hasAreaConflict);
  
  // 4. 测试 updateAreaAndResubmit - 换区域后无冲突
  const updated2 = await updateAreaAndResubmit(
    permit.id,
    2,
    "2026-06-07",
    "2026-06-12"
  );
  console.log("\n4. updateAreaAndResubmit (换B栋地下车库，无冲突):");
  console.log("   状态:", updated2?.status);
  console.log("   是否有区域冲突:", updated2?.hasAreaConflict);
  
  console.log("\n=== 测试 confirmArea 区域冲突 ===\n");
  
  // 5. 测试 confirmArea - 先确认一个无冲突的，再创建一个冲突的再确认
  // 先创建一个无冲突的许可
  const permit2 = await createPermit({
    teamId: 3,
    areaId: 2,
    constructionType: "FIRE_SAFETY",
    startDate: "2026-06-15",
    endDate: "2026-06-20",
    startTime: "08:00",
    endTime: "18:00",
    workContent: "测试 confirmArea",
    workerIds: [7, 8],
    hasDocuments: true,
  });
  console.log("5. 创建测试许可 (无冲突):");
  console.log("   状态:", permit2.status);
  
  // 确认区域
  const confirmed = await confirmArea(permit2.id);
  console.log("\n6. confirmArea (无冲突):");
  console.log("   状态:", confirmed?.status);
  
  // 再创建一个冲突的，然后 confirmArea
  const permit3 = await createPermit({
    teamId: 4,
    areaId: 1,
    constructionType: "HVAC",
    startDate: "2026-06-08",
    endDate: "2026-06-10",
    startTime: "09:00",
    endTime: "17:00",
    workContent: "测试 confirmArea 冲突",
    workerIds: [10, 11],
    hasDocuments: true,
  });
  console.log("\n7. 创建测试许可 (有冲突):");
  console.log("   状态:", permit3.status);
  
  // 如果状态是 PENDING_AREA_CONFIRM，则测试 confirmArea 的冲突检测
  if (permit3.status === "PENDING_AREA_CONFIRM") {
    const confirmed2 = await confirmArea(permit3.id);
    console.log("\n8. confirmArea (有冲突):");
    console.log("   状态:", confirmed2?.status);
    console.log("   异常类型:", confirmed2?.anomalyType);
    console.log("   冲突详情:", confirmed2?.areaConflictDetail);
    
    // 清理
    await db.execute(sql`DELETE FROM permit_histories WHERE permit_id = ${permit3.id}`);
    await db.execute(sql`DELETE FROM permit_workers WHERE permit_id = ${permit3.id}`);
    await db.execute(sql`DELETE FROM permits WHERE id = ${permit3.id}`);
  }
  
  // 清理测试数据
  await db.execute(sql`DELETE FROM permit_histories WHERE permit_id = ${permit.id}`);
  await db.execute(sql`DELETE FROM permit_workers WHERE permit_id = ${permit.id}`);
  await db.execute(sql`DELETE FROM permits WHERE id = ${permit.id}`);
  
  await db.execute(sql`DELETE FROM permit_histories WHERE permit_id = ${permit2.id}`);
  await db.execute(sql`DELETE FROM permit_workers WHERE permit_id = ${permit2.id}`);
  await db.execute(sql`DELETE FROM permits WHERE id = ${permit2.id}`);
  
  console.log("\n=== 所有测试完成 ===");
  process.exit(0);
}

test().catch(e => {
  console.error("测试失败:", e);
  process.exit(1);
});
