var http = require('http');

var tamperedPayload = JSON.stringify({
    sessionId: 'mao',
    history: [
        { step: 0, state: { unlockValue:15, unlockSlot:2, traceMark:0, renRisk:10, dingReward:2, maoFailure:5 }, eventId: null },
        {
            step: 1,
            eventId: 'mao_e7',
            eventName: '隐匿之触',
            cost: { maoFailure: 999, renRisk: 999, dingReward: 999 },
            effect: { traceMark: 999, unlockValue: 999 },
            _tampered: true
        },
        {
            step: 2,
            eventId: 'mao_FAKE_ID',
            eventName: '伪造事件',
            cost: {},
            effect: { unlockValue: 9999 },
            _fake: true
        },
        {
            step: 3,
            eventId: 'mao_e8',
            eventName: '基础锻造',
            cost: { maoFailure: 100 },
            effect: { unlockValue: 999 },
            _tampered: true
        }
    ]
});

var req = http.request({
    hostname: 'localhost',
    port: 3009,
    path: '/api/recalculate',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(tamperedPayload) }
}, function(res) {
    var body = '';
    res.on('data', function(chunk) { body += chunk; });
    res.on('end', function() {
        var result = JSON.parse(body);
        console.log('=== 篡改防护测试结果 ===');
        console.log('HTTP Status:', res.statusCode);
        console.log('计算方式:', result.calculatedBy);
        console.log('服务端时间戳:', result.serverTimestamp);
        console.log('');
        console.log('前端篡改内容:');
        console.log('  mao_e7 实际 (前端声明 effect: TM+999, UV+999)');
        console.log('  mao_FAKE_ID 伪造事件 (前端声明 UV+9999)');
        console.log('  mao_e8 实际 (前端声明 cost: MF-100, UV+999)');
        console.log('');
        console.log('后端重算结果 (应忽略所有前端cost/effect，按服务端配置重放):');
        console.log('  UV=' + result.state.unlockValue + ' (应=15+5+4=24)');
        console.log('  TM=' + result.state.traceMark + ' (应=0+4=4)');
        console.log('  MF=' + result.state.maoFailure + ' (应=5-1-1=3)');
        console.log('');
        console.log('事件序列 (' + result.events.length + ' 条有效):');
        for (var i = 0; i < result.events.length; i++) {
            console.log('  #' + result.events[i].step + ' ' + result.events[i].eventId + ' ' + result.events[i].eventName);
        }
        console.log('');
        if (result.invalidEventIds) {
            console.log('被后端拒绝的伪造事件 (' + result.invalidEventIds.length + ' 条):');
            for (var j = 0; j < result.invalidEventIds.length; j++) {
                console.log('  步骤#' + result.invalidEventIds[j].step + ': ' + result.invalidEventIds[j].eventId);
            }
        }
        console.log('');
        var uvOk = result.state.unlockValue === 24;
        var tmOk = result.state.traceMark === 4;
        var mfOk = result.state.maoFailure === 3;
        var calcOk = result.calculatedBy === 'server_authoritative';
        var allOk = uvOk && tmOk && mfOk && calcOk;
        console.log('=== 验证结果: ' + (allOk ? '通过 ✓' : '失败 ✗'));
    });
});

req.on('error', function(e) {
    console.error('请求失败:', e.message);
});

req.write(tamperedPayload);
req.end();
