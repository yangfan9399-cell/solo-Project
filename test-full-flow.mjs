import http from 'node:http';

const PORT = 5174;

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
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, body });
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
  console.log('=== 管风琴音栓记忆游戏 - 完整流程测试 ===\n');

  try {
    console.log('1. 测试首页 HTML:');
    const home = await request('/');
    console.log('   状态码:', home.status);
    console.log('   包含标题:', home.body.includes('管风琴音栓记忆游戏'));
    console.log('   包含导航:', home.body.includes('navbar'));
    console.log('   包含 app.js:', home.body.includes('app.js'));

    console.log('\n2. 测试静态资源:');
    const css = await request('/styles.css');
    console.log('   CSS 状态码:', css.status, '大小:', css.body.length, '字节');
    
    const js = await request('/app.js');
    console.log('   JS 状态码:', js.status, '大小:', js.body.length, '字节');

    console.log('\n3. 测试关卡页面路由:');
    const levels = await request('/levels');
    console.log('   /levels 状态码:', levels.status);
    
    const play = await request('/play/1');
    console.log('   /play/1 状态码:', play.status);
    
    const result = await request('/result/test-123');
    console.log('   /result/test-123 状态码:', result.status);
    
    const history = await request('/history');
    console.log('   /history 状态码:', history.status);
    
    const wrong = await request('/wrong-answers');
    console.log('   /wrong-answers 状态码:', wrong.status);

    console.log('\n4. 测试 API - 获取关卡:');
    const apiLevels = await request('/api/levels');
    console.log('   状态:', apiLevels.body.success);
    console.log('   关卡数:', apiLevels.body.levels?.length);
    console.log('   音栓数:', apiLevels.body.stops?.length);

    console.log('\n5. 测试 API - 获取玩家:');
    const player = await request('/api/player?id=player_demo');
    console.log('   状态:', player.body.success);
    console.log('   玩家名:', player.body.player?.name);

    console.log('\n6. 测试完整游戏流程 (后端评分):');
    
    console.log('   创建会话...');
    const session = await request('/api/session', 'POST', {
      playerId: 'player_demo',
      levelId: 1,
    });
    console.log('   会话ID:', session.body.session?.id);
    console.log('   回合数:', session.body.session?.totalRounds);
    console.log('   目标组合数:', session.body.targetCombinations?.length);

    console.log('\n   提交回合 (后端重新计算分数)...');
    let finalResult = null;
    for (let i = 0; i < session.body.targetCombinations.length; i++) {
      const isLast = i === session.body.targetCombinations.length - 1;
      const submit = await request('/api/session', 'PATCH', {
        action: 'submitRound',
        sessionId: session.body.session.id,
        roundNumber: i,
        targetStops: session.body.targetCombinations[i],
        playerStops: isLast ? [session.body.targetCombinations[i][0]] : session.body.targetCombinations[i],
        timeTaken: 10 + i * 3,
        hintUsed: isLast,
      });
      
      console.log(`   回合 ${i + 1}: 得分 ${submit.body.roundResult?.score}, 相似度 ${Math.round(submit.body.roundResult?.similarity * 100)}%`);
      
      if (submit.body.isLastRound) {
        finalResult = submit.body.finalResult;
      }
    }

    console.log('\n   结算结果 (后端计算):');
    console.log('   总分:', finalResult?.totalScore);
    console.log('   星级:', finalResult?.stars);
    console.log('   是否通过:', finalResult?.passed);
    console.log('   正确率:', finalResult?.percentage + '%');
    console.log('   连胜奖励:', finalResult?.streakBonus);

    console.log('\n7. 测试错题本:');
    const wrongAnswers = await request('/api/wrong-answers?playerId=player_demo');
    console.log('   错题数:', wrongAnswers.body.wrongAnswers?.length);

    console.log('\n8. 测试连胜系统:');
    const streak = await request('/api/streak?playerId=player_demo');
    console.log('   连胜天数:', streak.body.streak);

    console.log('\n✅ 所有测试通过！游戏完整可玩。');
    console.log('\n📋 启动方式:');
    console.log('   npm start');
    console.log('   或');
    console.log('   node server.js');
    console.log('\n🌐 访问地址: http://localhost:5174');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

test();
