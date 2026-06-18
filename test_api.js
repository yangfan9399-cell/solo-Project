var http = require('http');

var testData = JSON.stringify({
    sessionId: 'mao',
    history: [
        { step: 0, state: { unlockValue:15, unlockSlot:2, traceMark:0, renRisk:10, dingReward:2, maoFailure:5 }, eventId: null, timestamp: 0 },
        { step: 1, eventId: 'mao_e7', eventName: '隐匿之触', cost: { maoFailure:1, renRisk:1, dingReward:1 }, effect: { traceMark:4, unlockValue:5 }, timestamp: 1 },
        { step: 2, eventId: 'mao_e8', eventName: '基础锻造', cost: { maoFailure:1 }, effect: { unlockValue:4 }, timestamp: 2 }
    ]
});

var req = http.request({
    hostname: 'localhost',
    port: 3009,
    path: '/api/recalculate',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}, function(res) {
    var body = '';
    res.on('data', function(chunk) { body += chunk; });
    res.on('end', function() {
        console.log('HTTP Status:', res.statusCode);
        var result = JSON.parse(body);
        console.log('数据来源:', result.serverTimestamp ? '后端服务' : '未知');
        console.log('最终状态:', JSON.stringify(result.state));
        console.log('胜负:', result.status);
        console.log('评分:', result.score);
        console.log('时间戳:', result.serverTimestamp);
    });
});

req.on('error', function(e) {
    console.error('请求失败:', e.message);
});

req.write(testData);
req.end();
