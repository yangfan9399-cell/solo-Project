const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get('http://localhost:3001' + url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { resolve(d); } });
    }).on('error', reject);
  });
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost', port: 3001, path: url, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, data: JSON.parse(d) }); }
        catch(e) { resolve({ statusCode: res.statusCode, data: d }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== 重新处理节点验证 ===\n');
  
  const rec = await get('/api/records/4');
  console.log('记录编号:', rec.recordNo);
  console.log('当前状态:', rec.status);
  console.log('当前节点数:', rec.reviewNodes.length);
  console.log('节点列表:');
  rec.reviewNodes.forEach((n, i) => {
    console.log('  ' + (i+1) + '. ' + n.nodeType + ' | ' + n.nodeStatus + ' | ' + (n.operatorName || '待执行'));
  });
  
  console.log('\n执行处理操作...');
  const res = await post('/api/records/4/process', {
    processorId: 2, processorName: '李护士',
    conclusion: '重新处理完成，已补充完整信息',
    reviewBasis: '重新核查原始记录',
    fieldDiffs: []
  });
  console.log('结果:', res.statusCode, res.data?.success ? '成功' : res.data?.message || '');
  
  const rec2 = await get('/api/records/4');
  console.log('\n处理后状态:', rec2.status);
  console.log('节点数:', rec2.reviewNodes.length);
  console.log('节点列表:');
  rec2.reviewNodes.forEach((n, i) => {
    console.log('  ' + (i+1) + '. ' + n.nodeType + ' | ' + n.nodeStatus + ' | ' + (n.operatorName || '待执行'));
  });
  
  console.log('\n=== 验证完成 ===');
}

main().catch(console.error);
