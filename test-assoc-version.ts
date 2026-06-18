import { sectionDao, versionDao, associationDao } from './src/server/dao';
import { prepare } from './src/server/db';

async function test() {
  const sectionId = 1;
  const before = await sectionDao.getById(sectionId);
  console.log('更新前 currentVersion:', before && before.currentVersion);

  const oldAssocs = await associationDao.listBySection(sectionId);
  console.log('更新前伴生关系数量:', oldAssocs.length);
  const albiteOld = oldAssocs.find(a => a.associatedMineral === '钠长石');
  console.log('更新前钠长石含量%:', albiteOld && albiteOld.abundancePercent);

  const oldVersions = await versionDao.listBySection(sectionId);
  console.log('更新前版本历史数量:', oldVersions.length);

  const newAssocs = oldAssocs.map(a => {
    if (a.associatedMineral === '钠长石') {
      return {
        sectionId: a.sectionId,
        associatedMineral: a.associatedMineral,
        relationshipType: a.relationshipType,
        texturalRelation: a.texturalRelation,
        abundancePercent: 12,
        grainSizeMm: a.grainSizeMm,
        parageneticStage: a.parageneticStage,
        notes: '更新：含量从8%提升至12%',
      };
    }
    return {
      sectionId: a.sectionId,
      associatedMineral: a.associatedMineral,
      relationshipType: a.relationshipType,
      texturalRelation: a.texturalRelation,
      abundancePercent: a.abundancePercent,
      grainSizeMm: a.grainSizeMm,
      parageneticStage: a.parageneticStage,
      notes: a.notes,
    };
  });

  const userId = 'test-user';
  const batchId = `test-batch-${Date.now()}`;

  const bumpStmt = await prepare(
    'UPDATE thin_sections SET current_version = current_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  );
  bumpStmt.run([sectionId]);

  for (const ea of oldAssocs) {
    await associationDao.delete(ea.id);
  }
  for (const assoc of newAssocs) {
    await associationDao.create(assoc);
  }

  const newVersion = (before ? before.currentVersion : 0) + 1;
  await versionDao.create({
    sectionId,
    changeType: 'update',
    version: newVersion,
    changeDescription: '伴生关系更新: 含量%, 备注',
    changedBy: userId,
    batchId,
  });

  const after = await sectionDao.getById(sectionId);
  console.log('\n===== 更新结果 =====');
  console.log('更新后 currentVersion:', after && after.currentVersion);

  const newAssocsCheck = await associationDao.listBySection(sectionId);
  const albiteNew = newAssocsCheck.find(a => a.associatedMineral === '钠长石');
  console.log('更新后钠长石含量%:', albiteNew && albiteNew.abundancePercent);
  console.log('更新后钠长石备注:', albiteNew && albiteNew.notes);

  const newVersions = await versionDao.listBySection(sectionId);
  console.log('更新后版本历史数量:', newVersions.length);
  console.log('\n最新版本记录:');
  const latest = newVersions.sort((a, b) => b.id - a.id)[0];
  console.log(JSON.stringify(latest, null, 2));

  const beforeVer = before ? before.currentVersion : 0;
  const afterVer = after ? after.currentVersion : 0;
  if (afterVer === beforeVer + 1) {
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
