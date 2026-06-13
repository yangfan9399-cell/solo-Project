const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function test() {
  console.log('=== 测试页面访问 ===');
  
  const pages = [
    '/',
    '/record/1',
    '/review?id=1',
    '/dashboard',
    '/review-board'
  ];

  for (const page of pages) {
    try {
      const result = await get(`http://localhost:3001${page}`);
      console.log(`${page.padEnd(20)} -> ${result.status} (${result.body.length} bytes)`);
      if (result.status !== 200) {
        console.log('  Body preview:', result.body.slice(0, 200));
      }
    } catch (e) {
      console.log(`${page.padEnd(20)} -> ERROR: ${e.message}`);
    }
  }

  console.log('\n✅ 页面访问测试完成！');
}

test().catch(console.error);
