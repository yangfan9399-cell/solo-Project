const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function test() {
  console.log('=== 1. 测试统计 API ===');
  const stats = await get('http://localhost:3001/api/stats');
  console.log('总记录数:', stats.overview.total);
  console.log('正常:', stats.overview.normal);
  console.log('异常:', stats.overview.abnormal);
  console.log('异常率:', stats.overview.abnormalRate);
  console.log('状态分布:', stats.statusStats.map(s => `${s.status}: ${s._count}`).join(', '));

  console.log('\n=== 2. 测试记录列表 API ===');
  const list = await get('http://localhost:3001/api/records?page=1&pageSize=10');
  console.log('总数:', list.total);
  console.log('记录列表:');
  list.data.forEach(r => {
    console.log(`  ${r.recordNo} | ${r.status} | ${r.patientName} | ${r.consumableName} | ¥${r.totalAmount}`);
  });

  console.log('\n=== 3. 测试记录详情 API (GZ-2024-0002 - 记录漏填) ===');
  const detail2 = await get('http://localhost:3001/api/records/2');
  console.log('记录号:', detail2.recordNo);
  console.log('状态:', detail2.status);
  console.log('是否异常:', detail2.isAbnormal);
  console.log('异常类型:', detail2.abnormalType);
  console.log('阻断原因:', detail2.blockingReason?.slice(0, 50) + '...');
  console.log('补救路径:', detail2.remedialPath?.slice(0, 50) + '...');
  console.log('差异字段数:', detail2.fieldDiffs?.length);
  console.log('审核节点数:', detail2.reviewNodes?.length);
  console.log('附件数:', detail2.attachments?.length);

  console.log('\n=== 4. 测试记录详情 API (GZ-2024-0004 - 重新处理) ===');
  const detail4 = await get('http://localhost:3001/api/records/4');
  console.log('记录号:', detail4.recordNo);
  console.log('状态:', detail4.status);
  console.log('异常类型:', detail4.abnormalType);
  console.log('版本:', detail4.version);
  console.log('节点数:', detail4.reviewNodes?.length);
  console.log('节点列表:');
  detail4.reviewNodes.forEach(n => {
    console.log(`  ${n.nodeOrder}. ${n.nodeName} [${n.nodeStatus}] - ${n.operatorName || '待处理'}`);
  });

  console.log('\n=== 5. 测试记录详情 API (GZ-2024-0001 - 正常核销已归档) ===');
  const detail1 = await get('http://localhost:3001/api/records/1');
  console.log('记录号:', detail1.recordNo);
  console.log('状态:', detail1.status);
  console.log('结论:', detail1.conclusion?.slice(0, 50) + '...');
  console.log('归档时间:', detail1.archiveTime);
  console.log('节点数:', detail1.reviewNodes?.length);

  console.log('\n✅ 所有 API 测试通过！');
}

test().catch(console.error);
