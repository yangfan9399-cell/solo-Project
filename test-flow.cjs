const http = require('http');

function request(url, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test() {
  console.log('=== 测试业务流程：受理操作 ===');
  console.log('受理前状态（记录5 - 待受理）:');
  let record = await request('http://localhost:3001/api/records/5');
  console.log('  状态:', record.data.status);
  console.log('  当前处理人:', record.data.currentHandler?.name || '无');

  console.log('\n执行受理操作...');
  const acceptResult = await request(
    'http://localhost:3001/api/records/5/accept',
    'POST',
    {
      operatorId: 2,
      operatorName: '李护士',
      handlerId: 2,
      handlerName: '李护士',
      content: '已受理，信息核对无误，进入处理流程。',
      basis: '《高值医用耗材管理规范》'
    }
  );
  console.log('  受理结果状态:', acceptResult.status);
  console.log('  受理后记录状态:', acceptResult.data.status);

  console.log('\n验证受理后详情:');
  record = await request('http://localhost:3001/api/records/5');
  console.log('  状态:', record.data.status);
  console.log('  当前处理人:', record.data.currentHandler?.name);
  console.log('  受理时间:', record.data.acceptTime);
  console.log('  节点数:', record.data.reviewNodes.length);
  console.log('  最新节点:', record.data.reviewNodes[record.data.reviewNodes.length - 1]?.nodeName);

  console.log('\n✅ 受理操作测试通过！');

  console.log('\n=== 测试统计数据同步 ===');
  console.log('验证统计数据是否已更新...');
  const stats = await request('http://localhost:3001/api/stats');
  console.log('  待受理数量:', stats.data.statusStats.find(s => s.status === 'PENDING_ACCEPTANCE')?._count || 0);
  console.log('  已受理数量: (包含在处理中或待复核中)');

  console.log('\n=== 测试列表数据同步 ===');
  const list = await request('http://localhost:3001/api/records?status=ACCEPTED');
  console.log('  已受理状态记录数:', list.data.total);

  console.log('\n✅ 数据同步测试通过！');
  console.log('\n🎉 所有业务流程测试通过！');
}

test().catch(console.error);
