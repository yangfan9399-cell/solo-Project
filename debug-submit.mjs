import { spawn } from 'node:child_process';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 5175;

function request(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
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

function waitForServer() {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 10;

    function tryConnect() {
      attempts++;
      const req = http.request({ hostname: 'localhost', port: PORT, path: '/api/levels', method: 'GET' }, (res) => {
        resolve();
      });
      req.on('error', () => {
        if (attempts < maxAttempts) {
          setTimeout(tryConnect, 500);
        } else {
          reject(new Error('Server did not start in time'));
        }
      });
      req.end();
    }
    tryConnect();
  });
}

async function runTests() {
  console.log('=== 调试提交回合 API ===\n');

  console.log('🚀 启动服务器...');
  const server = spawn('node', ['server.js'], {
    cwd: __dirname,
    env: { ...process.env, PORT: PORT.toString() },
  });

  try {
    await waitForServer();
    console.log('✅ 服务器已启动\n');

    console.log('1. 创建会话:');
    const session = await request('/api/session', 'POST', {
      playerId: 'player_demo',
      levelId: 1,
    });
    console.log('返回结构:', JSON.stringify(session, null, 2).substring(0, 500));

    console.log('\n2. 提交回合:');
    const submit = await request('/api/session', 'PATCH', {
      action: 'submitRound',
      sessionId: session.session.id,
      roundNumber: 0,
      targetStops: session.targetCombinations[0],
      playerStops: session.targetCombinations[0],
      timeTaken: 12,
      hintUsed: false,
    });
    console.log('返回结构:', JSON.stringify(submit, null, 2));

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
    process.exitCode = 1;
  } finally {
    server.kill();
    setTimeout(() => process.exit(0), 500);
  }
}

runTests();
