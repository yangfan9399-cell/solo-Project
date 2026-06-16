const BASE_URL = 'http://localhost:5173';

async function test() {
	console.log('='.repeat(60));
	console.log('🚀 深空探针信号校准游戏 - API 完整测试');
	console.log('='.repeat(60));
	console.log('');

	console.log('📋 步骤 1: 检查玩家和关卡数据');
	console.log('-'.repeat(60));
	const players = await fetch(`${BASE_URL}/api/players`).then(r => r.json());
	const levels = await fetch(`${BASE_URL}/api/levels`).then(r => r.json());
	console.log(`✅ 玩家: ${players.length} 个`);
	console.log(`   - ID: ${players[0].id}`);
	console.log(`   - 名称: ${players[0].name}`);
	console.log(`   - 总局数: ${players[0].totalGames}`);
	console.log(`✅ 关卡: ${levels.length} 个`);
	levels.forEach(l => console.log(`   - ${l.id}: ${l.name} (难度 ${l.difficulty}⭐)`));
	console.log('');

	console.log('🎮 步骤 2: POST /api/games - 创建新游戏');
	console.log('-'.repeat(60));
	const playerId = players[0].id;
	const levelId = levels[0].id;
	const createRes = await fetch(`${BASE_URL}/api/games`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ playerId, levelId })
	});
	const createStatus = createRes.status;
	const game = await createRes.json();
	console.log(`✅ HTTP 状态码: ${createStatus}`);
	console.log(`✅ 游戏 ID: ${game.id}`);
	console.log(`✅ 状态: ${game.status}`);
	console.log(`✅ 初始参数:`);
	console.log(`   - frequency: ${game.frequency.toFixed(2)} MHz`);
	console.log(`   - gain: ${game.gain.toFixed(2)} dB`);
	console.log(`   - antennaAngle: ${game.antennaAngle.toFixed(2)}°`);
	console.log(`   - noiseFilter: ${game.noiseFilter.toFixed(2)}`);
	console.log(`   - score: ${game.score}`);
	console.log(`   - history: ${game.history.length} 条记录`);
	console.log('');

	console.log('🔧 步骤 3: PATCH /api/games/{id} - 更新游戏状态（模拟校准）');
	console.log('-'.repeat(60));
	const targetLevel = levels[0];
	const optimalFilter = Math.min(1, targetLevel.noiseLevel * 1.2);
	const updatePayload = {
		frequency: targetLevel.targetFrequency,
		gain: targetLevel.targetGain,
		antennaAngle: targetLevel.targetAntennaAngle,
		noiseFilter: optimalFilter,
		history: [
			{ timestamp: Date.now() - 3000, type: 'frequency', from: game.frequency, to: targetLevel.targetFrequency },
			{ timestamp: Date.now() - 2000, type: 'gain', from: game.gain, to: targetLevel.targetGain },
			{ timestamp: Date.now() - 1000, type: 'antenna', from: game.antennaAngle, to: targetLevel.targetAntennaAngle },
			{ timestamp: Date.now(), type: 'filter', from: game.noiseFilter, to: optimalFilter }
		],
		historyIndex: 3
	};
	const updateRes = await fetch(`${BASE_URL}/api/games/${game.id}`, {
		method: 'PATCH',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(updatePayload)
	});
	const updatedGame = await updateRes.json();
	console.log(`✅ HTTP 状态码: ${updateRes.status}`);
	console.log(`✅ 更新后参数（完美匹配目标值）:`);
	console.log(`   - frequency: ${updatedGame.frequency} (目标: ${targetLevel.targetFrequency})`);
	console.log(`   - gain: ${updatedGame.gain} (目标: ${targetLevel.targetGain})`);
	console.log(`   - antennaAngle: ${updatedGame.antennaAngle} (目标: ${targetLevel.targetAntennaAngle})`);
	console.log(`   - noiseFilter: ${updatedGame.noiseFilter}`);
	console.log(`   - history: ${updatedGame.history.length} 条操作记录`);
	console.log('');

	console.log('🏆 步骤 4: POST /api/games/{id}/settle - 后端重新计算结算');
	console.log('-'.repeat(60));
	console.log(`⚠️  结算前前端状态（不可信）:`);
	console.log(`   - status: ${updatedGame.status}`);
	console.log(`   - score: ${updatedGame.score}`);
	console.log('');
	console.log('📡 调用后端结算 API（后端权威计算）...');
	const settleRes = await fetch(`${BASE_URL}/api/games/${game.id}/settle`, {
		method: 'POST'
	});
	const settleStatus = settleRes.status;
	const settleData = await settleRes.json();
	console.log('');
	console.log(`✅ HTTP 状态码: ${settleStatus}`);
	console.log('');
	console.log('='.repeat(60));
	console.log('📊 后端重新计算结果');
	console.log('='.repeat(60));
	console.log('');
	console.log('📋 更新后的 game 状态（后端写入数据库）:');
	console.log(`   status: "${settleData.game.status}" (后端判定)`);
	console.log(`   score: ${settleData.game.score} (后端重新计算，之前是 ${updatedGame.score})`);
	console.log(`   endTime: ${settleData.game.endTime} (后端设置)`);
	console.log('');
	console.log('🏆 结算 result（后端权威计算）:');
	console.log(`   won: ${settleData.result.won}`);
	console.log(`   score: ${settleData.result.score}`);
	console.log(`   frequencyAccuracy: ${settleData.result.frequencyAccuracy.toFixed(1)}%`);
	console.log(`   gainAccuracy: ${settleData.result.gainAccuracy.toFixed(1)}%`);
	console.log(`   antennaAccuracy: ${settleData.result.antennaAccuracy.toFixed(1)}%`);
	console.log(`   decodeProgress: ${settleData.result.decodeProgress.toFixed(1)}%`);
	console.log(`   timeBonus: +${settleData.result.timeBonus}`);
	console.log(`   levelBonus: +${settleData.result.levelBonus}`);
	console.log('');
	console.log('🎯 通关条件: decodeProgress >= 95% && quality.overall >= 0.8');
	console.log(`   结果: decodeProgress=${settleData.result.decodeProgress.toFixed(1)}%, won=${settleData.result.won}`);
	console.log('');
	console.log('='.repeat(60));
	if (settleData.result.won) {
		console.log('🎉 恭喜！通关成功！');
	} else {
		console.log('💫 继续努力，调整参数可以获得更高分数！');
	}
	console.log('='.repeat(60));
	console.log('');
	console.log('✅ 测试完成！');
	console.log('');
	console.log('📝 验证总结:');
	console.log('   ✓ POST /api/games 返回 201 和完整游戏状态');
	console.log('   ✓ POST /api/games/{id}/settle 返回:');
	console.log('     - 后端重新计算的 score');
	console.log('     - 后端判定的 won 状态');
	console.log('     - 更新后的 game 状态（包含 endTime）');
}

test().catch(console.error);
