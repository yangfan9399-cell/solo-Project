import { spawn } from 'node:child_process';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 5176;

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
  console.log('=== 调试结束会话 API ===\n');

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
    console.log('会话ID:', session.session.id);

    console.log('\n2. 提交所有回合:');
    for (let i = 0; i < session.targetCombinations.length; i++) {
      const submit = await request('/api/session', 'PATCH', {
        action: 'submitRound',
        sessionId: session.session.id,
        roundNumber: i,
        targetStops: session.targetCombinations[i],
        playerStops: session.targetCombinations[i],
        timeTaken: 10 + i * 2,
        hintUsed: false,
      });
      console.log(`   回合 ${i + 1}: 得分 ${submit.roundResult.score}`);
    }

    console.log('\n3. 结束会话:');
    const finish = await request('/api/session', 'PATCH', {
      action: 'finishSession',
      sessionId: session.session.id,
    });
    console.log('返回结构 keys:', Object.keys(finish));
    console.log('session keys:', Object.keys(finish.session));
    console.log('最终得分:', finish.session.finalScore);
    console.log('星级:', finish.session.stars);
    console.log('是否通过:', finish.session.passed);
    console.log('正确率:', finish.session.correctRate);

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
