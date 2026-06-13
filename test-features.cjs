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
  console.log('=== 重新处理 & 补充材料 测试 ===\n');

  // 1. 查看记录 4 (REPROCESS 状态)
  console.log('1. 重新处理样本 (ID 4) 初始状态');
  let rec = await get('/api/records/4');
  console.log('   状态:', rec.status);
  console.log('   异常类型:', rec.abnormalType);
  console.log('   节点数:', rec.reviewNodes?.length);
  console.log('   节点列表:');
  rec.reviewNodes.forEach(n => {
    console.log('     -', n.nodeType, '|', n.nodeStatus, '|', n.operatorName || '待执行');
  });

  // 2. 补充材料测试 (申请人视角)
  console.log('\n2. 测试补充材料 (ID 2, 记录漏填)');
  let rec2 = await get('/api/records/2');
  console.log('   补充前状态:', rec2.status);
  console.log('   附件数:', rec2.attachments?.length);
  
  let res = await post('/api/records/2/supplement', {
    operatorId: 1, operatorName: '张医生',
    content: '补充了耗材序列号和手术护士信息',
    attachments: [
      { fileName: '补充记录.pdf', fileType: 'pdf', fileUrl: '/attachments/2/supplement.pdf', isEvidence: true }
    ]
  });
  console.log('   补充结果:', res.statusCode, res.data?.success || res.data?.message || '');
  
  rec2 = await get('/api/records/2');
  console.log('   补充后状态:', rec2.status);
  console.log('   附件数:', rec2.attachments?.length);
  console.log('   节点数:', rec2.reviewNodes?.length);

  // 3. 验证数据一致性 - 列表 vs 详情
  console.log('\n3. 验证数据一致性');
  const list = await get('/api/records?pageSize=20');
  const listRecord = list.data.find(r => r.id === 4);
  const detailRecord = await get('/api/records/4');
  console.log('   列表状态:', listRecord?.status);
  console.log('   详情状态:', detailRecord.status);
  console.log('   一致:', listRecord?.status === detailRecord.status);

  // 4. 统计数据验证
  console.log('\n4. 统计数据');
  const stats = await get('/api/stats');
  console.log('   总记录:', stats.overview.total);
  console.log('   异常率:', stats.overview.abnormalRate);
  console.log('   正常数:', stats.abnormalStats.normal);
  console.log('   异常数:', stats.abnormalStats.abnormal);

  // 5. 验证四类样本
  console.log('\n5. 四类样本验证');
  const types = ['NORMAL', 'MISSING_RECORD', 'ATTACHMENT_VERSION_MISMATCH', 'REPROCESS'];
  const typeNames = { NORMAL: '正常核销', MISSING_RECORD: '记录漏填', ATTACHMENT_VERSION_MISMATCH: '附件版本不一致', REPROCESS: '重新处理' };
  types.forEach(t => {
    const count = stats.abnormalStats.byType.find(x => x.type === t)?.count;
    console.log('   -', typeNames[t], ':', count, '条');
  });

  console.log('\n=== 测试完成 ===');
}

main().catch(console.error);
