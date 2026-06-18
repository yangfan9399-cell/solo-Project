var http = require('http');
var fs = require('fs');
var path = require('path');

var PORT = 3009;

var SESSIONS = {
    ren: {
        id: 'ren',
        name: '壬局 · 教学演示',
        initialState: {
            unlockValue: 10,
            unlockSlot: 3,
            traceMark: 0,
            renRisk: 5,
            dingReward: 3,
            maoFailure: 0
        }
    },
    ding: {
        id: 'ding',
        name: '丁局 · 资源短缺',
        initialState: {
            unlockValue: 5,
            unlockSlot: 1,
            traceMark: 0,
            renRisk: 8,
            dingReward: 1,
            maoFailure: 2
        }
    },
    mao: {
        id: 'mao',
        name: '卯局 · 隐匿条件',
        initialState: {
            unlockValue: 15,
            unlockSlot: 2,
            traceMark: 0,
            renRisk: 10,
            dingReward: 2,
            maoFailure: 5
        }
    }
};

var EVENTS = {
    ren: [
        { id: 'ren_e1', cost: { unlockSlot: 0 }, effect: { unlockValue: 5, renRisk: 1 } },
        { id: 'ren_e2', cost: { unlockSlot: 1 }, effect: { traceMark: 2, unlockValue: 2 } },
        { id: 'ren_e3', cost: { dingReward: 1 }, effect: { renRisk: -3 } },
        { id: 'ren_e4', cost: { unlockValue: 3 }, effect: { dingReward: 2, unlockSlot: 1 } },
        { id: 'ren_e5', cost: { traceMark: 1, unlockSlot: 1 }, effect: { maoFailure: -2, unlockValue: 1 } },
        { id: 'ren_e6', cost: { traceMark: 2, renRisk: 2 }, effect: { unlockValue: 10, dingReward: 1 } }
    ],
    ding: [
        { id: 'ding_e1', cost: {}, effect: { unlockValue: 2, maoFailure: 1 } },
        { id: 'ding_e2', cost: { dingReward: 1, unlockSlot: 1 }, effect: { traceMark: 2 } },
        { id: 'ding_e3', cost: { unlockValue: 1 }, effect: { unlockSlot: 1, renRisk: 1 } },
        { id: 'ding_e4', cost: { unlockValue: 5, renRisk: 2 }, effect: { dingReward: 2 } },
        { id: 'ding_e5', cost: { maoFailure: 2 }, effect: { unlockValue: 6, traceMark: 1 } },
        { id: 'ding_e6', cost: { unlockSlot: 1, dingReward: 1, renRisk: 3 }, effect: { unlockValue: 8, traceMark: 2 } }
    ],
    mao: [
        { id: 'mao_e1', cost: { unlockSlot: 1 }, effect: { unlockValue: 5, maoFailure: 2 } },
        { id: 'mao_e2', cost: { unlockSlot: 1, maoFailure: 1 }, effect: { traceMark: 3 } },
        { id: 'mao_e3', cost: { renRisk: 2 }, effect: { maoFailure: 3, unlockValue: 3 } },
        { id: 'mao_e4', cost: { traceMark: 2 }, effect: { dingReward: 3, maoFailure: 1 } },
        { id: 'mao_e5', cost: { unlockValue: 1, renRisk: 1 }, effect: { maoFailure: 2, traceMark: 2 } },
        { id: 'mao_e6', cost: { traceMark: 2, maoFailure: 2, unlockSlot: 1 }, effect: { unlockValue: 12, dingReward: 2 } },
        { id: 'mao_e7', cost: { maoFailure: 1, renRisk: 1, dingReward: 1 }, effect: { traceMark: 4, unlockValue: 5 } },
        { id: 'mao_e8', cost: { maoFailure: 1 }, effect: { unlockValue: 4 } },
        { id: 'mao_e9', cost: { dingReward: 1 }, effect: { unlockSlot: 1, maoFailure: 1 } }
    ]
};

function checkWin(sessionId, state, steps) {
    if (sessionId === 'ren') {
        return state.unlockValue >= 60 && state.maoFailure < 10;
    }
    if (sessionId === 'ding') {
        return state.unlockValue >= 45 && state.traceMark >= 5;
    }
    if (sessionId === 'mao') {
        return state.unlockValue >= 45 && state.traceMark >= 8 && state.maoFailure >= 15 && state.maoFailure <= 20;
    }
    return false;
}

function checkLose(sessionId, state, steps) {
    if (sessionId === 'ren') {
        return state.renRisk >= 30 || steps > 20;
    }
    if (sessionId === 'ding') {
        return state.unlockSlot <= 0 || state.dingReward <= 0 || steps > 25;
    }
    if (sessionId === 'mao') {
        return state.maoFailure > 25 || state.renRisk >= 40 || steps > 30;
    }
    return false;
}

function calculateScore(state, steps, status) {
    var base = state.unlockValue * 10;
    var traceBonus = state.traceMark * 5;
    var riskPenalty = state.renRisk * 3;
    var failurePenalty = state.maoFailure * 2;
    var stepPenalty = steps * 2;
    var rewardBonus = state.dingReward * 4;
    var slotBonus = state.unlockSlot * 3;
    var raw = base + traceBonus + rewardBonus + slotBonus - riskPenalty - failurePenalty - stepPenalty;
    if (status === 'win') raw = Math.floor(raw * 1.5);
    if (status === 'lose') raw = Math.floor(raw * 0.5);
    return Math.max(0, raw);
}

function recalculate(sessionId, history) {
    var session = SESSIONS[sessionId];
    if (!session) {
        return { error: '未知的局: ' + sessionId };
    }

    var state = Object.assign({}, session.initialState);
    var steps = 0;
    var eventSequence = [];

    for (var i = 1; i < history.length; i++) {
        var entry = history[i];
        var cost = entry.cost || {};
        var effect = entry.effect || {};

        for (var ck in cost) {
            if (cost.hasOwnProperty(ck)) {
                state[ck] = (state[ck] || 0) - cost[ck];
                if (state[ck] < 0) state[ck] = 0;
            }
        }
        for (var ek in effect) {
            if (effect.hasOwnProperty(ek)) {
                state[ek] = (state[ek] || 0) + effect[ek];
                if (state[ek] < 0) state[ek] = 0;
            }
        }
        steps = i;
        eventSequence.push({
            step: i,
            eventId: entry.eventId || null,
            eventName: entry.eventName || '未知事件'
        });
    }

    var finalStatus = 'playing';
    if (checkWin(sessionId, state, steps)) {
        finalStatus = 'win';
    } else if (checkLose(sessionId, state, steps)) {
        finalStatus = 'lose';
    }

    var score = calculateScore(state, steps, finalStatus);

    return {
        state: state,
        steps: steps,
        status: finalStatus,
        events: eventSequence,
        score: score,
        sessionId: sessionId,
        sessionName: session.name,
        serverTimestamp: new Date().toISOString()
    };
}

var MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
};

function serveStatic(filePath, res) {
    var ext = path.extname(filePath);
    var mime = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, function(err, data) {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: '文件未找到' }));
            return;
        }
        res.writeHead(200, {
            'Content-Type': mime,
            'Cache-Control': 'no-cache'
        });
        res.end(data);
    });
}

var server = http.createServer(function(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/api/recalculate') {
        var body = '';
        req.on('data', function(chunk) { body += chunk; });
        req.on('end', function() {
            try {
                var data = JSON.parse(body);
                var result = recalculate(data.sessionId, data.history);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify(result));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ error: '请求数据格式错误: ' + e.message }));
            }
        });
        return;
    }

    if (req.method === 'GET' && req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ status: 'ok', service: '陨铁工坊限时运营盘结算服务', port: PORT }));
        return;
    }

    if (req.method === 'GET') {
        var urlPath = req.url === '/' ? '/index.html' : req.url;
        var safePath = urlPath.replace(/\.\./g, '');
        var filePath = path.join(__dirname, safePath);
        serveStatic(filePath, res);
        return;
    }

    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '方法不允许' }));
});

server.listen(PORT, function() {
    console.log('陨铁工坊限时运营盘 · 后端结算服务');
    console.log('API 地址: http://localhost:' + PORT + '/api/recalculate');
    console.log('健康检查: http://localhost:' + PORT + '/api/health');
    console.log('前端页面: http://localhost:' + PORT + '/');
});
