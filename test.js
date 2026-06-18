const http = require('http');

function apiRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
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

async function runTests() {
  console.log('=== 星尘棋盘资源配给盘 功能测试 ===\n');

  try {
    console.log('1. 测试场景列表...');
    const scenarios = await apiRequest('/api/scenarios');
    console.log('   可用场景:', Object.keys(scenarios).join(', '));
    console.log('   ✓ 场景列表正常\n');

    console.log('2. 测试创建丑局...');
    const game = await apiRequest('/api/games', 'POST', { scenarioType: 'chou' });
    console.log('   游戏ID:', game.gameId);
    console.log('   初始星尘值:', game.stardustStrip);
    console.log('   初始排演槽:', game.rehearsalSlots);
    console.log('   初始定标痕:', game.calibrationMarks);
    console.log('   步骤数:', game.steps.length);
    console.log('   ✓ 创建游戏成功\n');

    const gameId = game.gameId;

    console.log('3. 测试资源调配...');
    const allocResult = await apiRequest(`/api/games/${gameId}/actions`, 'POST', {
      actionType: 'allocate_resource',
      actionData: { resource: 'energy', amount: 5, target: 'stardust' }
    });
    console.log('   调配后星尘值:', allocResult.stardustStrip);
    console.log('   调配后能量:', allocResult.resources.energy);
    console.log('   ✓ 资源调配成功\n');

    console.log('4. 测试排演发动...');
    const rehearseResult = await apiRequest(`/api/games/${gameId}/actions`, 'POST', {
      actionType: 'use_rehearsal',
      actionData: { action: 'boost_stardust' }
    });
    console.log('   排演后星尘值:', rehearseResult.stardustStrip);
    console.log('   排演后槽位:', rehearseResult.rehearsalSlots);
    console.log('   ✓ 排演发动成功\n');

    console.log('5. 测试定标增幅...');
    const calibResult = await apiRequest(`/api/games/${gameId}/actions`, 'POST', {
      actionType: 'calibrate',
      actionData: {}
    });
    console.log('   定标后星尘值:', calibResult.stardustStrip.toFixed(1));
    console.log('   定标后定标痕:', calibResult.calibrationMarks);
    console.log('   ✓ 定标增幅成功\n');

    console.log('6. 测试进入下一回合...');
    let nextTurnResult = await apiRequest(`/api/games/${gameId}/actions`, 'POST', {
      actionType: 'next_turn',
      actionData: {}
    });
    console.log('   当前回合:', nextTurnResult.currentTurn);
    console.log('   是否有事件:', nextTurnResult.currentEvent ? '是' : '否');
    console.log('   ✓ 回合推进成功\n');

    if (nextTurnResult.currentEvent) {
      console.log('7. 测试事件选择...');
      const eventChoice = nextTurnResult.currentEvent.choices[0];
      const eventResult = await apiRequest(`/api/games/${gameId}/actions`, 'POST', {
        actionType: 'event_choice',
        actionData: { eventTurn: nextTurnResult.currentEvent.turn, choiceId: eventChoice.id }
      });
      console.log('   选择事件后星尘值:', eventResult.stardustStrip);
      console.log('   ✓ 事件选择成功\n');
    }

    console.log('8. 测试回退功能...');
    const steps = (await apiRequest(`/api/games/${gameId}`)).steps;
    console.log('   当前总步骤:', steps.length);
    const revertResult = await apiRequest(`/api/games/${gameId}/revert`, 'POST', {
      stepNumber: 1
    });
    console.log('   回退后步骤数:', revertResult.steps.length);
    console.log('   回退后回合:', revertResult.currentTurn);
    console.log('   ✓ 回退功能成功\n');

    console.log('9. 测试快进到游戏结束...');
    let fastGame = await apiRequest('/api/games', 'POST', { scenarioType: 'chou' });
    for (let i = 0; i < 10; i++) {
      if (fastGame.status !== 'active') break;
      fastGame = await apiRequest(`/api/games/${fastGame.gameId}/actions`, 'POST', {
        actionType: 'allocate_resource',
        actionData: { resource: 'energy', amount: 10, target: 'stardust' }
      });
      if (fastGame.status !== 'active') break;
      fastGame = await apiRequest(`/api/games/${fastGame.gameId}/actions`, 'POST', {
        actionType: 'next_turn',
        actionData: {}
      });
    }
    console.log('   最终状态:', fastGame.status);
    console.log('   最终星尘值:', fastGame.stardustStrip.toFixed(1));
    console.log('   最终回合:', fastGame.currentTurn);
    console.log('   ✓ 游戏流程完整\n');

    if (fastGame.status !== 'active') {
      console.log('10. 测试结算功能...');
      const settlement = await apiRequest(`/api/games/${fastGame.gameId}/settlement`);
      console.log('   结算分数:', settlement.score.toFixed(1));
      console.log('   结果:', settlement.result);
      console.log('   风险等级:', settlement.riskLevel);
      console.log('   资源效率:', settlement.resourceEfficiency.toFixed(2) + '/步');
      console.log('   ✓ 结算功能正常\n');

      console.log('11. 测试重新结算...');
      const recalc = await apiRequest(`/api/games/${fastGame.gameId}/settlement/recalculate`, 'POST');
      console.log('   重算后分数:', recalc.score.toFixed(1));
      console.log('   ✓ 重新结算成功\n');
    }

    console.log('12. 测试甲局隐藏机制...');
    const jiaGame = await apiRequest('/api/games', 'POST', { scenarioType: 'jia' });
    console.log('   初始秘印:', jiaGame.resources.secretSeals || 0);
    console.log('   初始甲号因子:', jiaGame.jiaFailureFactor);
    console.log('   ✓ 甲局初始化成功\n');

    console.log('=== 所有测试通过! ===');
    process.exit(0);

  } catch (e) {
    console.error('测试失败:', e.message);
    console.error(e.stack);
    process.exit(1);
  }
}

runTests();
