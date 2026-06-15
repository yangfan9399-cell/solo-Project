import { getDb } from './src/lib/db.js';

async function test() {
  try {
    console.log('正在初始化数据库...');
    const db = await getDb();
    console.log('✅ 数据库初始化成功');
    
    const trays = db.prepare('SELECT COUNT(*) as cnt FROM tray_slots').get();
    console.log(`📦 字盘格位数: ${trays.cnt}`);
    
    const tasks = db.prepare('SELECT COUNT(*) as cnt FROM print_tasks').get();
    console.log(`📋 印刷任务数: ${tasks.cnt}`);
    
    const batches = db.prepare('SELECT COUNT(*) as cnt FROM carve_batches').get();
    console.log(`🔨 补刻批次: ${batches.cnt}`);
    
    const history = db.prepare('SELECT COUNT(*) as cnt FROM tray_history').get();
    console.log(`📜 历史记录: ${history.cnt}`);
    
    const alerts = db.prepare('SELECT COUNT(*) as cnt FROM alerts').get();
    console.log(`🔔 预警数量: ${alerts.cnt}`);
    
    console.log('\n✅ 所有测试通过！');
    process.exit(0);
  } catch (e) {
    console.error('❌ 测试失败:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

test();
