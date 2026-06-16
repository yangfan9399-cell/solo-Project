const http = require('http');

const BASE = 'http://127.0.0.1:8888';
let cookies = {};
let csrfToken = '';

function request(method, path, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: {
                ...headers,
                'Cookie': Object.entries(cookies).map(([k,v]) => `${k}=${v}`).join('; ')
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            const setCookies = res.headers['set-cookie'] || [];
            setCookies.forEach(c => {
                const parts = c.split(';')[0].split('=');
                cookies[parts[0]] = parts.slice(1).join('=');
            });
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
    });
}

async function getCsrf(path) {
    const res = await request('GET', path);
    const match = res.body.match(/name="csrf-token" content="([^"]+)"/);
    return match ? match[1] : null;
}

async function getFormCsrf(path) {
    const res = await request('GET', path);
    const match = res.body.match(/name="_token" value="([^"]+)"/);
    return match ? match[1] : null;
}

async function test() {
    console.log('=== 剧本杀线索编排主持工具 - 端到端测试 ===\n');

    // Step 1: 选择玩家
    console.log('1. 选择玩家...');
    let res = await request('GET', '/players/select/1');
    console.log(`   状态: ${res.status} (期望 302)`);
    if (res.status !== 302) { console.log('   ❌ 失败'); process.exit(1); }
    console.log('   ✅ 玩家已选择\n');

    // Step 2: 获取关卡页面并提取 CSRF
    console.log('2. 创建新游戏...');
    const csrf = await getFormCsrf('/levels/2');
    if (!csrf) { console.log('   ❌ 无法获取 CSRF'); process.exit(1); }
    console.log(`   CSRF: ${csrf.substring(0, 10)}...`);

    res = await request('POST', '/levels/2/start', `_token=${encodeURIComponent(csrf)}`, {
        'Content-Type': 'application/x-www-form-urlencoded'
    });
    console.log(`   状态: ${res.status} (期望 302)`);
    const location = res.headers['location'] || '';
    const gameIdMatch = location.match(/\/games\/(\d+)/);
    const gameId = gameIdMatch ? gameIdMatch[1] : null;
    if (!gameId) { console.log('   ❌ 无法获取游戏 ID'); process.exit(1); }
    console.log(`   ✅ 游戏已创建, ID: ${gameId}\n`);

    // Step 3: 获取游戏页面
    console.log('3. 获取游戏页面...');
    res = await request('GET', `/games/${gameId}`);
    console.log(`   状态: ${res.status} (期望 200)`);

    // 检查页面关键元素
    const hasClueCards = res.body.includes('clue-card');
    const hasDropZone = res.body.includes('drop-zone');
    const hasQuestionForm = res.body.includes('question-form');
    const hasScoreEstimate = res.body.includes('score-estimate');
    const hasRequiredClues = res.body.includes('required-clues-count');
    const hasNoDeprecated = !res.body.includes('Deprecated');

    console.log(`   线索卡 (clue-card): ${hasClueCards ? '✅' : '❌'}`);
    console.log(`   拖放区域 (drop-zone): ${hasDropZone ? '✅' : '❌'}`);
    console.log(`   提问表单 (question-form): ${hasQuestionForm ? '✅' : '❌'}`);
    console.log(`   分数预估 (score-estimate): ${hasScoreEstimate ? '✅' : '❌'}`);
    console.log(`   关键线索计数 (required-clues-count): ${hasRequiredClues ? '✅' : '❌'}`);
    console.log(`   无 Deprecated 警告: ${hasNoDeprecated ? '✅' : '❌'}`);

    // 提取第一个线索卡 ID
    const clueIdMatch = res.body.match(/data-clue-id="(\d+)"/);
    const firstClueId = clueIdMatch ? clueIdMatch[1] : null;
    console.log(`   第一个线索卡 ID: ${firstClueId}\n`);

    if (!hasClueCards || !hasDropZone || !hasQuestionForm || !hasScoreEstimate || !hasRequiredClues) {
        console.log('   ❌ 页面元素缺失，停止测试\n');
        process.exit(1);
    }

    // Step 4: 提取 meta CSRF token 并发放一个关键线索
    console.log('4. 测试发放关键线索 API（验证 required_found 更新）...');
    const metaCsrf = await getCsrf(`/games/${gameId}`);
    if (!metaCsrf) { console.log('   ❌ 无法获取 meta CSRF'); process.exit(1); }

    // 发放关键线索（关卡2的关键线索 ID 范围 11-16）
    const requiredClueId = 11; // 删除的转账记录
    res = await request('POST', `/games/${gameId}/distribute-clue`,
        JSON.stringify({ clue_card_id: requiredClueId, reason: '拖拽发放' }),
        {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': metaCsrf,
            'Accept': 'application/json'
        }
    );
    console.log(`   状态: ${res.status} (期望 200)`);

    const distributeData = JSON.parse(res.body);
    console.log(`   成功: ${distributeData.success ? '✅' : '❌'}`);
    console.log(`   消息: ${distributeData.message || '无'}`);
    console.log(`   线索标题: ${distributeData.clue?.title || '无'}`);
    console.log(`   is_required: ${distributeData.clue?.is_required !== undefined ? distributeData.clue.is_required : '❌ 缺失'}`);
    console.log(`   required_found: ${distributeData.required_found !== undefined ? distributeData.required_found : '❌ 缺失'} (期望 1)`);
    console.log(`   required_total: ${distributeData.required_total !== undefined ? distributeData.required_total : '❌ 缺失'} (期望 6)\n`);

    const requiredFoundUpdated = distributeData.required_found === 1;
    if (!requiredFoundUpdated) {
        console.log('   ⚠️ required_found 未正确更新！\n');
    }

    if (!distributeData.success) {
        console.log('   ❌ 发放线索失败\n');
        process.exit(1);
    }

    // Step 5: 测试分数预估 API
    console.log('5. 测试分数预估 API...');
    res = await request('GET', `/games/${gameId}/score-estimate`, null, { 'Accept': 'application/json' });
    const scoreData = JSON.parse(res.body);
    console.log(`   分数: ${scoreData.score !== undefined ? scoreData.score : '❌ 缺失'}\n`);

    // Step 6: 测试提问 API（用高相关性问题触发新线索）
    console.log('6. 测试提问 API（触发线索）...');
    res = await request('POST', `/games/${gameId}/ask-question`,
        JSON.stringify({ question: '那幅名画是怎么消失的？监控有什么发现？修复室里有什么？' }),
        {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': metaCsrf,
            'Accept': 'application/json'
        }
    );
    const questionData = JSON.parse(res.body);
    console.log(`   成功: ${questionData.success ? '✅' : '❌'}`);
    console.log(`   相关性: ${questionData.is_relevant ? '✅ 相关' : '一般'}`);
    console.log(`   相关度分数: ${questionData.relevance_score}%`);
    console.log(`   主持人回复: ${(questionData.response || '').substring(0, 60)}...`);
    console.log(`   related_clue_id: ${questionData.related_clue_id !== null ? questionData.related_clue_id : 'null'}`);
    console.log(`   triggers_clue: ${questionData.triggers_clue ? '✅ 是' : '否'}\n`);

    // Step 7: 如果触发了线索，测试自动发放
    if (questionData.related_clue_id) {
        console.log('7. 测试自动发放触发的线索...');
        res = await request('POST', `/games/${gameId}/distribute-clue`,
            JSON.stringify({ clue_card_id: questionData.related_clue_id, reason: '提问触发自动发放' }),
            {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': metaCsrf,
                'Accept': 'application/json'
            }
        );
        const autoDistributeData = JSON.parse(res.body);
        console.log(`   成功: ${autoDistributeData.success ? '✅' : '❌'}`);
        console.log(`   消息: ${autoDistributeData.message || '无'}`);
        console.log(`   线索: ${autoDistributeData.clue?.title || '无'}`);
        console.log(`   required_found: ${autoDistributeData.required_found !== undefined ? autoDistributeData.required_found : '❌'}`);
        console.log(`   required_total: ${autoDistributeData.required_total !== undefined ? autoDistributeData.required_total : '❌'}\n`);

        if (autoDistributeData.success) {
            // 检查分数更新
            res = await request('GET', `/games/${gameId}/score-estimate`, null, { 'Accept': 'application/json' });
            const newScore = JSON.parse(res.body);
            console.log(`   更新后分数: ${newScore.score}\n`);
        }
    } else {
        console.log('7. 未触发线索，尝试更有针对性的问题...\n');

        // 尝试另一个问题
        res = await request('POST', `/games/${gameId}/ask-question`,
            JSON.stringify({ question: '凶手是谁？那个策展人林晓月有什么嫌疑？修复室能不能藏画？' }),
            {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': metaCsrf,
                'Accept': 'application/json'
            }
        );
        const q2 = JSON.parse(res.body);
        console.log(`   相关度: ${q2.relevance_score}%`);
        console.log(`   related_clue_id: ${q2.related_clue_id}`);
        console.log(`   triggers_clue: ${q2.triggers_clue}`);

        if (q2.related_clue_id) {
            res = await request('POST', `/games/${gameId}/distribute-clue`,
                JSON.stringify({ clue_card_id: q2.related_clue_id, reason: '提问触发自动发放' }),
                {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': metaCsrf,
                    'Accept': 'application/json'
                }
            );
            const d2 = JSON.parse(res.body);
            console.log(`   自动发放成功: ${d2.success ? '✅' : '❌'}`);
            console.log(`   线索: ${d2.clue?.title || '无'}`);
            console.log(`   required_found: ${d2.required_found}/${d2.required_total}\n`);
        }
    }

    // Step 8: 再发放一个关键线索验证更新
    console.log('8. 再发放一个关键线索验证更新...');
    const secondRequiredClueId = 12; // 修复室的异常日志
    res = await request('POST', `/games/${gameId}/distribute-clue`,
        JSON.stringify({ clue_card_id: secondRequiredClueId, reason: '手动发放' }),
        {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': metaCsrf,
            'Accept': 'application/json'
        }
    );
    const d3 = JSON.parse(res.body);
    console.log(`   成功: ${d3.success ? '✅' : '❌'}`);
    console.log(`   线索: ${d3.clue?.title || '无'}`);
    console.log(`   is_required: ${d3.clue?.is_required}`);
    console.log(`   required_found: ${d3.required_found}/${d3.required_total} (期望 2/6)`);

    res = await request('GET', `/games/${gameId}/score-estimate`, null, { 'Accept': 'application/json' });
    const finalScore = JSON.parse(res.body);
    console.log(`   当前分数: ${finalScore.score}\n`);

    const allPassed = requiredFoundUpdated && d3.required_found === 2;
    console.log(`=== ${allPassed ? '✅ 所有端到端测试通过！关键线索计数正确更新！' : '⚠️ 部分测试需要检查'} ===`);
}

test().catch(err => {
    console.error('测试失败:', err);
    process.exit(1);
});
