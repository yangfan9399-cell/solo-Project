import { getDb } from "./src/lib/db.js";

try {
  const db = getDb();
  console.log("✅ 数据库连接成功");
  
  const trays = db.prepare("SELECT COUNT(*) as cnt FROM tray_slots").get();
  console.log(`📦 字盘格位数: ${trays.cnt}`);
  
  const tasks = db.prepare("SELECT COUNT(*) as cnt FROM print_tasks").get();
  console.log(`📋 印刷任务数: ${tasks.cnt}`);
  
  const batches = db.prepare("SELECT COUNT(*) as cnt FROM carve_batches").get();
  console.log(`🔨 补刻批次: ${batches.cnt}`);
  
  const history = db.prepare("SELECT COUNT(*) as cnt FROM tray_history").get();
  console.log(`📜 历史记录: ${history.cnt}`);
  
  const alerts = db.prepare("SELECT COUNT(*) as cnt FROM alerts").get();
  console.log(`🔔 预警数量: ${alerts.cnt}`);
  
  console.log("\n✅ 所有种子数据加载成功！");
} catch (e) {
  console.error("❌ 数据库测试失败:", e.message);
  process.exit(1);
}
