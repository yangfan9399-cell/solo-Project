import { sectionDao, versionDao, associationDao } from './src/server/dao';
import { prepare } from './src/server/db';

async function test() {
  const sectionId = 1;
  const before = await sectionDao.getById(sectionId);
  console.log('更新前 currentVersion:', before!.currentVersion);

  const oldAssocs = await associationDao.listBySection(sectionId);
  console.log('更新前伴生关系数量:', oldAssocs.length);
  console.log('更新前钠长石含量%:', oldAssocs.find(a => a.associatedMineral === '钠长石')?.abundancePercent);

  const oldVersions = await versionDao.listBySection(sectionId);
  console.log('更新前版本历史数量:', oldVersions.length);

  const newAssocs = oldAssocs.map(a => {
    if (a.associatedMineral === '钠长石') {
      return {
        ...a,
        abundancePercent: 12,
        notes: '更新：含量从8%提升至12%',
      };
    }
    return a;
  });

  const userId = 'test-user';
  const batchId = `test-batch-${Date.now()}`;
  const existing = before!;

  const hasRelatedChanges = true;
  const changeDescriptions = ['伴生关系更新: 含量%, 备注'];

  const bumpStmt = await prepare(
    'UPDATE thin_sections SET current_version = current_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  );
  bumpStmt.run([sectionId]);

  for (const ea of oldAssocs) {
    await associationDao.delete(ea.id);
  }
  for (const assoc of newAssocs) {
    const { id, ...rest } = assoc as any;
    await associationDao.create(rest);
  }

  const newVersion = existing.currentVersion + 1;
  await versionDao.create({
    sectionId,
    changeType: 'update',
    version: newVersion,
    changeDescription: changeDescriptions.join('；'),
    changedBy: userId,
    batchId,
  });

  const after = await sectionDao.getById(sectionId);
  console.log('\n===== 更新结果 =====');
  console.log('更新后 currentVersion:', after!.currentVersion);

  const newAssocsCheck = await associationDao.listBySection(sectionId);
  console.log('更新后钠长石含量%:', newAssocsCheck.find(a => a.associatedMineral === '钠长石')?.abundancePercent);
  console.log('更新后钠长石备注:', newAssocsCheck.find(a => a.associatedMineral === '钠长石')?.notes);

  const newVersions = await versionDao.listBySection(sectionId);
  console.log('更新后版本历史数量:', newVersions.length);
  console.log('\n最新版本记录:');
  const latest = newVersions.sort((a, b) => b.id - a.id)[0];
  console.log(JSON.stringify(latest, null, 2));

  if (after!.currentVersion === before!.currentVersion + 1) {
    console.log('\n✅ 版本号递增成功！');
  } else {
    console.log('\n❌ 版本号未正确递增！');
  }

  if (newVersions.length > oldVersions.length) {
    console.log('✅ 版本历史新增记录成功！');
  } else {
    console.log('❌ 版本历史未新增记录！');
  }
}

test().catch(console.error);
