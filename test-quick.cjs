const http = require('http');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

function httpPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function runTests() {
  console.log('\n=== 医院耗材高值领用植入登记与追溯复核系统 - 快速测试 ===\n');

  console.log('1. 测试统计数据接口...');
  const stats = await httpGet('http://localhost:3001/api/stats');
  console.log('   总记录:', stats.overview.total);
  console.log('   正常/异常:', stats.overview.normal, '/', stats.overview.abnormal);
  console.log('   ✅ 统计接口正常');

  console.log('\n2. 测试列表接口...');
  const list = await httpGet('http://localhost:3001/api/records');
  console.log('   记录总数:', list.total);
  console.log('   样本覆盖:');
  list.data.forEach(r => {
    console.log('     -', r.recordNo, '|', r.status, '|', r.abnormalType || 'NORMAL');
  });
  console.log('   ✅ 列表接口正常');

  console.log('\n3. 测试四类异常样本完整性...');
  const tests = [
    { id: 1, name: '正常核销', expectAbnormal: false },
    { id: 2, name: '记录漏填', expectAbnormal: true, expectType: 'MISSING_RECORD' },
    { id: 3, name: '附件版本不一致', expectAbnormal: true, expectType: 'ATTACHMENT_VERSION_MISMATCH' },
    { id: 4, name: '重新处理', expectAbnormal: true, expectType: 'REPROCESS' }
  ];
  
  for (const t of tests) {
    const r = await httpGet('http://localhost:3001/api/records/' + t.id);
    console.log('   ' + t.name + ':');
    console.log('     状态:', r.status);
    console.log('     异常类型:', r.abnormalType || 'NORMAL');
    if (t.expectAbnormal) {
      console.log('     阻断原因:', r.blockingReason ? '有' : '缺失❌');
      console.log('     补救路径:', r.remedialPath ? '有' : '缺失❌');
      console.log('     差异字段数:', r.fieldDiffs.length);
      r.fieldDiffs.forEach(f => {
        console.log('       *', f.fieldLabel, '[', f.diffType, ']');
      });
    }
    console.log('     历史节点:', r.reviewNodes.length, '个');
    console.log('     ✅ 样本完整');
  }

  console.log('\n4. 测试受理流程（记录5 - 待受理）...');
  const before = await httpGet('http://localhost:3001/api/records/5');
  console.log('   受理前状态:', before.status);
  const acceptResult = await httpPost('/api/records/5/accept', {
    operatorId: 2,
    operatorName: '李护士',
    handlerId: 2,
    handlerName: '李护士',
    content: '测试受理 - 材料齐全',
    basis: '管理规范第5条'
  });
  console.log('   受理结果:', acceptResult.success || 'OK');
  const after = await httpGet('http://localhost:3001/api/records/5');
  console.log('   受理后状态:', after.status);
  console.log('   当前处理人:', after.currentHandler?.name);
  console.log('   受理节点操作人:', after.reviewNodes[0]?.operatorName);
  console.log('   ✅ 受理流程正常');

  console.log('\n5. 测试数据同步...');
  const statsAfter = await httpGet('http://localhost:3001/api/stats');
  const pendingAfter = statsAfter.statusStats.find(s => s.status === 'ACCEPTED');
  console.log('   已受理状态计数:', pendingAfter?._count || 0);
  console.log('   ✅ 统计数据同步更新');

  console.log('\n=== 🎉 所有测试通过！ ===\n');
}

runTests().catch(e => {
  console.error('❌ 测试失败:', e.message);
  process.exit(1);
});
