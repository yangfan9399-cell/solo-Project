import http from 'node:http';

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5173,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function test() {
  console.log('=== 调试 API 返回格式 ===\n');

  try {
    console.log('1. 测试评分API:');
    const score1 = await request('/api/score', 'POST', {
      targetStops: ['principal-8', 'flute-8'],
      playerStops: ['principal-8', 'flute-8'],
      timeTaken: 15,
      timeLimit: 30,
      difficulty: 1,
      hintUsed: false,
    });
    console.log('返回结构:', JSON.stringify(score1, null, 2));

    console.log('\n2. 测试创建会话:');
    const session = await request('/api/session', 'POST', {
      playerId: 'player_demo',
      levelId: 1,
    });
    console.log('返回结构:', JSON.stringify(session, null, 2));

    console.log('\n3. 测试连胜API:');
    const streak = await request('/api/streak?playerId=player_demo');
    console.log('返回结构:', JSON.stringify(streak, null, 2));

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    process.exit(1);
  }
}

test();
