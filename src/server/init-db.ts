import { initDatabase, getDb, prepare, flushSave } from './db';
import {
  sectionDao,
  opticsDao,
  interferenceColorDao,
  cleavageDao,
  associationDao,
  micrographDao,
  sampleBoxDao,
  versionDao,
  anomalyDetector,
} from './dao';
import {
  seedBoxes,
  seedSections,
  seedOptics,
  seedInterferenceColors,
  seedCleavages,
  seedAssociations,
  seedMicrographs,
  seedVersionBatches,
} from './seed-data';

async function main() {
  console.log('开始初始化数据库...');
  
  await initDatabase();
  const db = await getDb();
  
  const countStmt = await prepare('SELECT COUNT(*) as cnt FROM thin_sections');
  const existingCount = countStmt.get() as any;
  if (existingCount.cnt > 0) {
    console.log(`数据库中已存在 ${existingCount.cnt} 条记录，跳过种子数据导入`);
    console.log('如需重新初始化，请删除 data/mineral-archive.db 文件后重试');
    return;
  }
  
  console.log('正在导入样本盒数据...');
  const boxIds: number[] = [];
  for (const box of seedBoxes) {
    const created = await sampleBoxDao.create(box);
    boxIds.push(created.id);
    console.log(`  ✓ 创建样本盒: ${box.name} (${box.code})`);
  }
  
  console.log('正在导入薄片记录...');
  for (let i = 0; i < seedSections.length; i++) {
    const section = seedSections[i];
    const originalBoxId = section.sampleBoxId;
    if (originalBoxId && originalBoxId <= boxIds.length) {
      section.sampleBoxId = boxIds[originalBoxId - 1];
    }
    
    const created = await sectionDao.create({ ...section, coverSlip: section.coverSlip }, '系统初始化');
    console.log(`  ✓ 创建薄片: ${created.mineralName} (${created.thinSectionNumber})`);
  }
  
  console.log('正在导入光学性质数据...');
  for (const optics of seedOptics) {
    try {
      await opticsDao.save(optics);
      console.log(`  ✓ 光学数据: 薄片 #${optics.sectionId}`);
    } catch (e) {
      console.log(`  ✗ 光学数据失败: 薄片 #${optics.sectionId}`, e);
    }
  }
  
  console.log('正在导入干涉色数据...');
  for (const ic of seedInterferenceColors) {
    await interferenceColorDao.create(ic);
    console.log(`  ✓ 干涉色: 薄片 #${ic.sectionId} - ${ic.colorName}`);
  }
  
  console.log('正在导入解理数据...');
  for (const c of seedCleavages) {
    await cleavageDao.create(c);
    console.log(`  ✓ 解理: 薄片 #${c.sectionId} - ${c.quality}`);
  }
  
  console.log('正在导入伴生关系数据...');
  for (const a of seedAssociations) {
    await associationDao.create(a);
    console.log(`  ✓ 伴生: 薄片 #${a.sectionId} - ${a.associatedMineral}`);
  }
  
  console.log('正在导入显微照片元数据...');
  for (const m of seedMicrographs) {
    await micrographDao.create(m);
    console.log(`  ✓ 照片: 薄片 #${m.sectionId} - ${m.mode} ${m.magnification}×`);
  }
  
  console.log('正在创建版本历史批次...');
  for (const batch of seedVersionBatches) {
    for (const sectionId of batch.sectionIds) {
      const section = await sectionDao.getById(sectionId);
      if (section) {
        if (batch.batchId === 'BATCH-2024-001') {
          const checkStmt = await prepare('SELECT id FROM version_history WHERE section_id = ? AND batch_id = ?');
          const existing = checkStmt.get([sectionId, batch.batchId]);
          if (!existing) {
            await versionDao.create({
              sectionId,
              version: 1,
              changeType: 'create',
              changeDescription: batch.description,
              changedBy: '系统初始化',
              batchId: batch.batchId,
            });
          }
        } else {
          await sectionDao.update(sectionId, { currentVersion: section.currentVersion }, '数据复核员');
          const updStmt = await prepare('UPDATE version_history SET batch_id = ? WHERE section_id = ? AND version = ?');
          updStmt.run([batch.batchId, sectionId, section.currentVersion + 1]);
        }
      }
    }
    console.log(`  ✓ 批次: ${batch.batchId}`);
  }
  
  console.log('正在执行异常数据检测...');
  const allSections = await sectionDao.list({ pageSize: 100 });
  for (const s of allSections) {
    const anomalies = await anomalyDetector.checkAll(s.id);
    if (anomalies.length > 0) {
      console.log(`  ⚠ 薄片 #${s.id} ${s.mineralName}: 检测到 ${anomalies.length} 条异常`);
    }
  }
  
  const stmt1 = await prepare('SELECT COUNT(*) as cnt FROM thin_sections');
  const finalCount = stmt1.get() as any;
  const stmt2 = await prepare('SELECT COUNT(*) as cnt FROM micrographs');
  const micrographCount = stmt2.get() as any;
  const stmt3 = await prepare('SELECT COUNT(*) as cnt FROM interference_colors');
  const icCount = stmt3.get() as any;
  const stmt4 = await prepare('SELECT COUNT(*) as cnt FROM associations');
  const assocCount = stmt4.get() as any;
  const stmt5 = await prepare('SELECT COUNT(*) as cnt FROM data_anomalies WHERE resolved_at IS NULL');
  const anomalyCount = stmt5.get() as any;
  
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  数据库初始化完成！');
  console.log('═══════════════════════════════════════════');
  console.log(`  薄片记录: ${finalCount.cnt} 条`);
  console.log(`  显微照片: ${micrographCount.cnt} 张`);
  console.log(`  干涉色记录: ${icCount.cnt} 条`);
  console.log(`  伴生关系: ${assocCount.cnt} 条`);
  console.log(`  待处理异常: ${anomalyCount.cnt} 条`);
  console.log('═══════════════════════════════════════════');
  console.log('');
  console.log('运行 npm run dev 启动开发服务器');
  
  await new Promise(resolve => setTimeout(resolve, 200));
  flushSave();
}

main().catch(console.error);
