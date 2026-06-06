import { db } from "./src/db";
import { defects, defectHistories, users } from "./src/db/schema";
import { eq, desc } from "drizzle-orm";

async function runTest() {
  console.log("=== 验证 rejected 重新处理链路 ===\n");

  // 先找到一个 pending_review 状态的缺陷用于测试
  const pendingDefects = await db
    .select()
    .from(defects)
    .where(eq(defects.status, "pending_review"))
    .limit(1);

  if (pendingDefects.length === 0) {
    console.log("没有找到待验收状态的缺陷，跳过测试");
    process.exit(0);
  }

  const testDefect = pendingDefects[0];
  console.log(`测试缺陷: #${testDefect.id} - ${testDefect.title}`);
  console.log(`当前状态: ${testDefect.status}\n`);

  // 找到一个 reviewer
  const reviewers = await db
    .select()
    .from(users)
    .where(eq(users.role, "reviewer"))
    .limit(1);
  const reviewer = reviewers[0];

  // 1. 退回缺陷
  console.log("--- 步骤1: 退回缺陷 ---");
  const now = new Date();
  const [rejectedDefect] = await db
    .update(defects)
    .set({
      status: "rejected",
      reviewerId: reviewer.id,
      reviewComment: "处理不彻底，需重新处理",
      reviewedAt: now,
      updatedAt: now,
    })
    .where(eq(defects.id, testDefect.id))
    .returning();

  await db.insert(defectHistories).values({
    defectId: testDefect.id,
    action: "reject",
    userId: reviewer.id,
    userName: reviewer.name,
    description: "验收退回：处理不彻底，需重新处理",
    statusBefore: "pending_review",
    statusAfter: "rejected",
  });

  console.log(`退回后状态: ${rejectedDefect.status}`);
  console.log(`复核意见: ${rejectedDefect.reviewComment}\n`);

  // 2. 尝试从 rejected 状态开始处理
  console.log("--- 步骤2: 从 rejected 开始重新处理 ---");
  const workers = await db
    .select()
    .from(users)
    .where(eq(users.role, "maintenance_worker"))
    .limit(1);
  const worker = workers[0];

  const defectBefore = await db
    .select()
    .from(defects)
    .where(eq(defects.id, testDefect.id))
    .limit(1);
  const d = defectBefore[0];

  if (d.status !== "rejected") {
    console.log("状态错误，不是 rejected");
    process.exit(1);
  }

  const now2 = new Date();
  let historyDescription = "开始现场检修";
  if (d.status === "rejected") {
    historyDescription = "验收退回，重新开始处理";
  }

  const [processingDefect] = await db
    .update(defects)
    .set({
      status: "processing",
      processingStartedAt: now2,
      updatedAt: now2,
    })
    .where(eq(defects.id, testDefect.id))
    .returning();

  await db.insert(defectHistories).values({
    defectId: testDefect.id,
    action: "start_processing",
    userId: worker.id,
    userName: worker.name,
    description: historyDescription,
    statusBefore: "rejected",
    statusAfter: "processing",
  });

  console.log(`重新处理后状态: ${processingDefect.status}`);
  console.log(`历史描述: ${historyDescription}\n`);

  // 3. 查看最新历史记录
  console.log("--- 步骤3: 验证历史记录 ---");
  const histories = await db
    .select()
    .from(defectHistories)
    .where(eq(defectHistories.defectId, testDefect.id))
    .orderBy(desc(defectHistories.id))
    .limit(3);

  console.log("最近3条历史记录:");
  for (const h of histories) {
    console.log(`  [${h.action}] ${h.description} (${h.statusBefore} -> ${h.statusAfter})`);
  }

  // 4. 恢复原状态（为了不破坏种子数据）
  console.log("\n--- 步骤4: 恢复原状态 ---");
  // 先删除刚添加的两条历史
  const allHistories = await db
    .select()
    .from(defectHistories)
    .where(eq(defectHistories.defectId, testDefect.id))
    .orderBy(desc(defectHistories.id));
  
  const lastTwoIds = allHistories.slice(0, 2).map(h => h.id);
  for (const hid of lastTwoIds) {
    await db.delete(defectHistories).where(eq(defectHistories.id, hid));
  }

  // 恢复缺陷状态为 pending_review
  await db
    .update(defects)
    .set({
      status: "pending_review",
      reviewerId: null,
      reviewComment: null,
      reviewedAt: null,
      updatedAt: testDefect.updatedAt,
      processingStartedAt: testDefect.processingStartedAt,
    })
    .where(eq(defects.id, testDefect.id));

  console.log("已恢复原状态为 pending_review\n");

  console.log("=== 测试通过: rejected 重新处理链路正常 ===");
  process.exit(0);
}

runTest().catch(err => {
  console.error("测试失败:", err);
  process.exit(1);
});
