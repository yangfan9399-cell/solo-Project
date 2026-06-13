const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3001' + url, (res) => {
      let data = '';
      res.on('data', c => data += c);
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

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); } catch (e) { resolve(d); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== 医院耗材追溯系统 - 业务流程测试 ===\n');

  // 1. 获取初始统计
  console.log('1. 初始统计数据');
  const stats1 = await get('/api/stats');
  console.log('   总记录数:', stats1.overview.total);
  console.log('   状态分布:');
  stats1.statusStats.forEach(s => console.log('     -', s.status, ':', s._count));

  // 2. 获取记录列表
  console.log('\n2. 记录列表');
  const list = await get('/api/records?pageSize=20');
  console.log('   共', list.total, '条记录');
  list.data.forEach(r => {
    console.log('   -', r.recordNo, '|', r.patientName, '|', r.status, '|', r.abnormalType || '正常');
  });

  // 3. 获取异常样本详情 (记录漏填 - ID 2)
  console.log('\n3. 异常样本详情 - 记录漏填 (ID 2)');
  const r2 = await get('/api/records/2');
  console.log('   记录编号:', r2.recordNo);
  console.log('   状态:', r2.status);
  console.log('   异常类型:', r2.abnormalType);
  console.log('   阻断原因:', r2.blockingReason);
  console.log('   补救路径:', r2.remedialPath);
  console.log('   差异字段数:', r2.fieldDiffs?.length || 0);
  console.log('   历史节点数:', r2.reviewNodes?.length || 0);
  if (r2.reviewNodes?.length) {
    console.log('   节点列表:');
    r2.reviewNodes.forEach(n => {
      console.log('     -', n.nodeType, '|', n.status, '|', n.operatorName || '待执行');
    });
  }

  // 4. 测试数据同步 - 修改金额后验证统计变化
  console.log('\n4. 测试业务流程 - 处理操作 (ID 5)');
  const rec5before = await get('/api/records/5');
  console.log('   处理前状态:', rec5before.status);
  
  const processResult = await post('/api/records/5/process', {
    processorId: 2,
    processorName: '李护士',
    conclusion: '处理完成，信息核对无误',
    reviewBasis: '根据《高值耗材管理办法》第三章',
    fieldDiffs: []
  });
  console.log('   处理结果:', processResult.success ? '成功' : '失败');
  
  const rec5after = await get('/api/records/5');
  console.log('   处理后状态:', rec5after.status);

  // 5. 验证统计数据同步
  console.log('\n5. 验证统计数据同步');
  const stats2 = await get('/api/stats');
  console.log('   状态分布变化:');
  stats2.statusStats.forEach(s => {
    const old = stats1.statusStats.find(x => x.status === s.status)?._count || 0;
    const change = s._count - old;
    if (change !== 0) {
      console.log('     -', s.status, ':', s._count, '(变化:', change > 0 ? '+' : '', change, ')');
    }
  });

  console.log('\n=== 测试完成 ===');
}

main().catch(console.error);
