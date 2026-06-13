const http = require('http');

function get(url) {
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

function post(url, body) {
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

async function main() {
  console.log('=== 完整业务流程测试 ===\n');

  // 1. 初始状态
  console.log('1. 记录 5 初始状态');
  let rec = await get('/api/records/5');
  console.log('   状态:', rec.status, '- 节点数:', rec.reviewNodes?.length);

  // 2. 处理 (ACCEPTED -> PENDING_REVIEW)
  console.log('\n2. 执行处理操作');
  let res = await post('/api/records/5/process', {
    processorId: 2, processorName: '李护士',
    conclusion: '处理完成，信息核对无误',
    reviewBasis: '《高值耗材管理办法》第三章',
    fieldDiffs: []
  });
  console.log('   结果:', res.statusCode, res.data?.success || res.data?.message || '');
  
  rec = await get('/api/records/5');
  console.log('   处理后状态:', rec.status);

  // 3. 复核通过 (PENDING_REVIEW -> REVIEW_PASSED)
  console.log('\n3. 执行复核通过');
  res = await post('/api/records/5/review', {
    reviewerId: 3, reviewerName: '王主任',
    passed: true, conclusion: '复核通过，信息完整准确',
    reviewBasis: '《高值耗材管理办法》第三章第五条',
    fieldDiffs: []
  });
  console.log('   结果:', res.statusCode, res.data?.success || res.data?.message || '');
  
  rec = await get('/api/records/5');
  console.log('   复核后状态:', rec.status);

  // 4. 归档 (REVIEW_PASSED -> ARCHIVED)
  console.log('\n4. 执行归档');
  res = await post('/api/records/5/archive', {
    archivistId: 4, archivistName: '赵档案',
    conclusion: '归档完成，资料齐全'
  });
  console.log('   结果:', res.statusCode, res.data?.success || res.data?.message || '');
  
  rec = await get('/api/records/5');
  console.log('   归档后状态:', rec.status);
  console.log('   历史节点数:', rec.reviewNodes?.length);
  console.log('   节点列表:');
  rec.reviewNodes.forEach(n => {
    console.log('     -', n.nodeType, '|', n.nodeStatus, '|', n.operatorName || '待执行');
  });

  // 5. 归档后尝试修改，应该失败
  console.log('\n5. 归档后尝试重新处理（应失败）');
  res = await post('/api/records/5/reprocess', {
    operatorId: 3, operatorName: '王主任',
    reason: '测试归档后修改'
  });
  console.log('   结果:', res.statusCode, res.data?.message || res.data);

  // 6. 统计数据验证
  console.log('\n6. 统计数据');
  const stats = await get('/api/stats');
  console.log('   总记录:', stats.overview.total);
  console.log('   已归档:', stats.statusStats.find(s => s.status === 'ARCHIVED')?._count);

  console.log('\n=== 测试完成 ===');
}

main().catch(console.error);
