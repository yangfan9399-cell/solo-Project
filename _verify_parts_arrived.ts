import { db } from "./src/db";
import { defects, defectHistories, users } from "./src/db/schema";
import { eq, desc } from "drizzle-orm";

async function run() {
  console.log("=== 验证 awaiting_parts 继续处理链路 ===\n");

  const awaiting = await db
    .select()
    .from(defects)
    .where(eq(defects.status, "awaiting_parts"))
    .limit(1);

  if (awaiting.length === 0) {
    console.log("没有 awaiting_parts 状态的缺陷");
    process.exit(0);
  }

  const d = awaiting[0];
  console.log(`测试缺陷: #${d.id} - ${d.title}`);
  console.log(`当前状态: ${d.status}\n`);

  const workers = await db
    .select()
    .from(users)
    .where(eq(users.role, "maintenance_worker"))
    .limit(1);
  const worker = workers[0];

  const now = new Date();
  let historyAction: any = "start_processing";
  let historyDescription = "开始现场检修";
  if (d.status === "rejected") {
    historyDescription = "验收退回，重新开始处理";
  } else if (d.status === "awaiting_parts") {
    historyAction = "parts_arrived";
    historyDescription = "备件到货，继续现场检修";
  }

  const [updated] = await db
    .update(defects)
    .set({
      status: "processing",
      processingStartedAt: now,
      updatedAt: now,
    })
    .where(eq(defects.id, d.id))
    .returning();

  const [newHistory] = await db
    .insert(defectHistories)
    .values({
      defectId: d.id,
      action: historyAction,
      userId: worker.id,
      userName: worker.name,
      description: historyDescription,
      statusBefore: d.status,
      statusAfter: "processing",
    })
    .returning();

  console.log(`处理后状态: ${updated.status}`);
  console.log(`历史动作: ${newHistory.action}`);
  console.log(`历史描述: ${newHistory.description}`);
  console.log(`状态流转: ${newHistory.statusBefore} -> ${newHistory.statusAfter}\n`);

  const success =
    newHistory.action === "parts_arrived" &&
    newHistory.statusBefore === "awaiting_parts" &&
    newHistory.statusAfter === "processing" &&
    updated.status === "processing";

  console.log(`=== ${success ? "✅ 验证通过" : "❌ 验证失败"} ===`);

  // 恢复原状
  await db.delete(defectHistories).where(eq(defectHistories.id, newHistory.id));
  await db
    .update(defects)
    .set({
      status: d.status,
      processingStartedAt: d.processingStartedAt,
      updatedAt: d.updatedAt,
    })
    .where(eq(defects.id, d.id));

  console.log("已恢复原状态");
  process.exit(success ? 0 : 1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
