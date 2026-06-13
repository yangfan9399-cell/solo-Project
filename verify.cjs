const http = require('http');

function apiGet(url) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3001' + url, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { resolve(data); }
      });
    }).on('error', reject);
  });
}

function apiPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost', port: 3001, path: url, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, data: JSON.parse(d) }); }
        catch (e) { resolve({ statusCode: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('='.repeat(70));
  console.log('  医院耗材高值领用植入登记与追溯复核系统 - 功能验证报告');
  console.log('='.repeat(70));

  let passed = 0;
  let failed = 0;

  function check(name, condition, detail = '') {
    if (condition) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name} ${detail ? '- ' + detail : ''}`);
      failed++;
    }
  }

  // ============ 1. 数据完整性验证 ============
  console.log('\n📋 1. 四类样本数据完整性验证');
  console.log('-'.repeat(70));

  const records = await apiGet('/api/records');
  check('列表接口正常返回', records && Array.isArray(records.data));
  check('共 6 条记录', records?.data?.length === 6);

  // 验证四类样本
  const sample1 = records.data?.find(r => r.recordNo === 'GZ-2024-0001');
  const sample2 = records.data?.find(r => r.recordNo === 'GZ-2024-0002');
  const sample3 = records.data?.find(r => r.recordNo === 'GZ-2024-0003');
  const sample4 = records.data?.find(r => r.recordNo === 'GZ-2024-0004');
  const sample5 = records.data?.find(r => r.recordNo === 'GZ-2024-0005');
  const sample6 = records.data?.find(r => r.recordNo === 'GZ-2024-0006');

  check('样本1: 正常核销 (已归档)', sample1?.status === 'ARCHIVED' && sample1?.abnormalType === 'NORMAL');
  check('样本2: 记录漏填 (处理中)', sample2?.status === 'PROCESSING' && sample2?.abnormalType === 'MISSING_RECORD');
  check('样本3: 附件版本不一致 (待复核)', sample3?.status === 'PENDING_REVIEW' && sample3?.abnormalType === 'ATTACHMENT_VERSION_MISMATCH');
  check('样本4: 重新处理 (重新处理中)', sample4?.status === 'REPROCESSING' && sample4?.abnormalType === 'REPROCESS');
  check('样本5: 待受理', sample5?.status === 'PENDING_ACCEPTANCE');
  check('样本6: 复核通过待归档', sample6?.status === 'REVIEW_PASSED');

  // ============ 2. 异常样本详情验证 ============
  console.log('\n🔍 2. 异常样本详情验证');
  console.log('-'.repeat(70));

  const detail2 = await apiGet('/api/records/2');
  check('记录漏填: 有阻断原因', !!detail2.blockingReason);
  check('记录漏填: 有补救路径', !!detail2.remedialPath);
  check('记录漏填: 差异字段 ≥ 2 个', (detail2.fieldDiffs?.length || 0) >= 2);

  const detail3 = await apiGet('/api/records/3');
  check('附件版本不一致: 有阻断原因', !!detail3.blockingReason);
  check('附件版本不一致: 有补救路径', !!detail3.remedialPath);
  check('附件版本不一致: 有差异字段', (detail3.fieldDiffs?.length || 0) >= 1);

  const detail4 = await apiGet('/api/records/4');
  check('重新处理: 有阻断原因', !!detail4.blockingReason);
  check('重新处理: 有补救路径', !!detail4.remedialPath);
  check('重新处理: 差异字段 ≥ 2 个', (detail4.fieldDiffs?.length || 0) >= 2);
  check('重新处理: 历史节点 ≥ 4 个', (detail4.reviewNodes?.length || 0) >= 4);
  check('重新处理: 有 REPROCESS 节点', detail4.reviewNodes?.some(n => n.nodeType === 'REPROCESS'));

  // ============ 3. 详情页关键信息验证 ============
  console.log('\n📄 3. 详情页关键信息验证');
  console.log('-'.repeat(70));

  check('详情页: 有来源信息', !!detail2.sourceType && !!detail2.sourceId);
  check('详情页: 有关键对象(耗材)', !!detail2.consumableName && !!detail2.specification);
  check('详情页: 有当前责任人', !!detail2.currentHandler);
  check('详情页: 有处理依据/结论字段', 'reviewBasis' in detail2);
  check('详情页: 有历史节点时间线', Array.isArray(detail2.reviewNodes));
  check('详情页: 有证据附件', Array.isArray(detail2.attachments));

  // ============ 4. 统计数据验证 ============
  console.log('\n📊 4. 统计数据与钻取验证');
  console.log('-'.repeat(70));

  const stats = await apiGet('/api/stats');
  check('统计接口正常', !!stats.overview);
  check('统计: 总记录数 = 6', stats.overview?.total === 6);
  check('统计: 异常记录数 = 3', stats.overview?.abnormal === 3);
  check('统计: 已归档数 ≥ 1', stats.overview?.archived >= 1);
  check('统计: 有状态分布', Array.isArray(stats.statusStats));
  check('统计: 有异常类型分布', Array.isArray(stats.abnormalTypeStats));

  // ============ 5. 受理流程验证 ============
  console.log('\n📥 5. 受理流程验证 (记录 5)');
  console.log('-'.repeat(70));

  const beforeAccept = await apiGet('/api/records/5');
  check('受理前: 状态 PENDING_ACCEPTANCE', beforeAccept.status === 'PENDING_ACCEPTANCE');
  check('受理前: 无当前处理人', !beforeAccept.currentHandler);

  const acceptResult = await apiPost('/api/records/5/accept', {
    operatorId: 2,
    operatorName: '李护士',
    handlerId: 2,
    handlerName: '李护士',
    content: '测试受理 - 材料齐全',
    basis: '《高值医用耗材管理规范》第5条'
  });
  check('受理操作: 成功执行', acceptResult.statusCode < 400);

  const afterAccept = await apiGet('/api/records/5');
  check('受理后: 状态变为 ACCEPTED', afterAccept.status === 'ACCEPTED');
  check('受理后: 当前处理人为李护士', afterAccept.currentHandler?.name === '李护士');
  check('受理后: 受理节点完成', afterAccept.reviewNodes?.[0]?.nodeStatus === 'COMPLETED');

  // 验证统计数据同步更新
  const statsAfter = await apiGet('/api/stats');
  const pendingStat = statsAfter.statusStats?.find(s => s.status === 'PENDING_ACCEPTANCE');
  const pendingCount = pendingStat ? pendingStat._count : 0;
  check('统计同步: 待受理数减少为0', pendingCount === 0);

  // ============ 6. 处理流程验证 ============
  console.log('\n⚙️  6. 处理流程验证 (记录 5)');
  console.log('-'.repeat(70));

  const processResult = await apiPost('/api/records/5/process', {
    operatorId: 2,
    operatorName: '李护士',
    content: '处理完成，信息核对无误，提交复核',
    basis: '产品注册证、合格证、手术记录',
    isAbnormal: false,
    abnormalType: 'NORMAL',
    attachments: []
  });
  check('处理操作: 成功执行', processResult.statusCode < 400);

  const afterProcess = await apiGet('/api/records/5');
  check('处理后: 状态变为 PENDING_REVIEW', afterProcess.status === 'PENDING_REVIEW');
  check('处理后: 处理节点完成', afterProcess.reviewNodes?.[1]?.nodeStatus === 'COMPLETED');
  check('处理后: 复核节点待处理', afterProcess.reviewNodes?.[2]?.nodeStatus === 'PENDING');

  // ============ 7. 复核流程验证 ============
  console.log('\n✅ 7. 复核通过流程验证 (记录 5)');
  console.log('-'.repeat(70));

  const reviewResult = await apiPost('/api/records/5/review', {
    operatorId: 3,
    operatorName: '王主任',
    passed: true,
    content: '复核通过，信息完整准确',
    conclusion: '经复核，耗材信息完整准确，来源可追溯，同意归档。',
    basis: '《高值医用耗材管理规范》第三章'
  });
  check('复核通过: 成功执行', reviewResult.statusCode < 400);

  const afterReview = await apiGet('/api/records/5');
  check('复核后: 状态变为 REVIEW_PASSED', afterReview.status === 'REVIEW_PASSED');
  check('复核后: 当前处理人变为归档人', afterReview.currentHandler?.role === 'ARCHIVIST' || afterReview.currentHandler?.name === '赵档案');

  // ============ 8. 归档流程 & 归档只读验证 ============
  console.log('\n📦 8. 归档流程 & 归档只读验证 (记录 5)');
  console.log('-'.repeat(70));

  const archiveResult = await apiPost('/api/records/5/archive', {
    operatorId: 4,
    operatorName: '赵档案',
    content: '已完成归档，所有材料齐全',
    basis: '《医院病案管理规定》'
  });
  check('归档操作: 成功执行', archiveResult.statusCode < 400);

  const afterArchive = await apiGet('/api/records/5');
  check('归档后: 状态变为 ARCHIVED', afterArchive.status === 'ARCHIVED');
  check('归档后: 归档节点完成', afterArchive.reviewNodes?.[3]?.nodeStatus === 'COMPLETED');

  // 验证归档后不能再处理
  const tryProcessAfter = await apiPost('/api/records/5/process', {
    operatorId: 2, operatorName: '李护士', content: '尝试修改归档记录', basis: 'test'
  });
  check('归档后: 处理操作被拒绝', tryProcessAfter.statusCode >= 400 || tryProcessAfter.data?.success === false);

  // ============ 9. 复核退回 & 重新处理节点验证 ============
  console.log('\n🔄 9. 复核退回 & 重新处理节点验证 (记录 3)');
  console.log('-'.repeat(70));

  const beforeReject = await apiGet('/api/records/3');
  const nodesBefore = beforeReject.reviewNodes?.length || 0;
  const diffsBefore = beforeReject.fieldDiffs?.length || 0;
  check('退回前: 状态 PENDING_REVIEW', beforeReject.status === 'PENDING_REVIEW');

  const rejectResult = await apiPost('/api/records/3/review', {
    operatorId: 3,
    operatorName: '王主任',
    passed: false,
    content: '复核退回：金额计算有误',
    conclusion: '因金额数量问题退回重新处理',
    basis: '《高值医用耗材追溯管理办法》',
    blockingReason: '总金额计算错误，且附件版本不一致，需重新核实后处理。',
    remedialPath: '1. 核实单价和数量；2. 上传正确版本的附件；3. 补充说明后重新提交',
    fieldDiffs: [{
      fieldName: 'totalAmount',
      fieldLabel: '总金额',
      oldValue: '8600.00',
      newValue: '待核实',
      diffType: 'AMOUNT_QUANTITY',
      changedBy: '王主任'
    }]
  });
  check('复核退回: 成功执行', rejectResult.statusCode < 400, JSON.stringify(rejectResult.data));

  const afterReject = await apiGet('/api/records/3');
  check('退回后: 状态变为 REPROCESSING', afterReject.status === 'REPROCESSING');
  check('退回后: 生成新节点 (节点数增加)', (afterReject.reviewNodes?.length || 0) > nodesBefore);
  check('退回后: 有 REPROCESS 节点', afterReject.reviewNodes?.some(n => n.nodeType === 'REPROCESS'));
  check('退回后: 差异字段增加', (afterReject.fieldDiffs?.length || 0) > diffsBefore);
  check('退回后: 有阻断原因', !!afterReject.blockingReason);
  check('退回后: 有补救路径', !!afterReject.remedialPath);
  check('退回后: 版本号递增', (afterReject.version || 1) > (beforeReject.version || 1));
  check('退回后: 异常类型为 REPROCESS', afterReject.abnormalType === 'REPROCESS');

  // ============ 10. 数据同步验证 ============
  console.log('\n🔗 10. 数据同步验证 (列表/详情/统计一致)');
  console.log('-'.repeat(70));

  const listData = await apiGet('/api/records');
  const detailData = await apiGet('/api/records/1');
  const statsData = await apiGet('/api/stats');

  const listArchived = listData.data?.filter(r => r.status === 'ARCHIVED').length || 0;
  const statsArchived = statsData.overview?.archived || 0;
  check('列表与统计: 已归档数一致', listArchived === statsArchived);

  const listAbnormal = listData.data?.filter(r => r.isAbnormal).length || 0;
  const statsAbnormal = statsData.overview?.abnormal || 0;
  check('列表与统计: 异常数一致', listAbnormal === statsAbnormal);

  check('详情与列表: 记录编号一致', detailData.recordNo === listData.data?.[0]?.recordNo || 
    listData.data?.some(r => r.recordNo === detailData.recordNo));

  // ============ 汇总 ============
  console.log('\n' + '='.repeat(70));
  console.log(`  测试结果: ${passed} 通过, ${failed} 失败`);
  console.log('='.repeat(70));

  if (failed === 0) {
    console.log('\n🎉 所有核心功能验证通过！');
  } else {
    console.log('\n⚠️  有测试未通过，请检查。');
    process.exit(1);
  }
}

run().catch(e => {
  console.error('测试执行失败:', e.message);
  process.exit(1);
});
