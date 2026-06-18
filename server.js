const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3040;

const LEVELS = {
  ji: {
    id: 'ji',
    rows: 6,
    cols: 8,
    startPos: { row: 0, col: 0 },
    endPos: { row: 5, col: 7 },
    initialSlot: 20,
    winConvert: 50,
    riskThreshold: 5,
    tiles: [
      ['start', 'path', 'path', 'moss', 'path', 'path', 'reward', 'path'],
      ['path', 'rock', 'path', 'path', 'rock', 'path', 'path', 'path'],
      ['path', 'path', 'risk', 'path', 'path', 'moss', 'path', 'path'],
      ['moss', 'path', 'path', 'rock', 'path', 'path', 'path', 'moss'],
      ['path', 'path', 'reward', 'path', 'path', 'risk', 'path', 'path'],
      ['path', 'moss', 'path', 'path', 'path', 'path', 'path', 'end']
    ],
    tileValues: {
      path: { convert: 1, slot: -1, risk: 0, reward: 0, fail: 0, trace: 1 },
      moss: { convert: 3, slot: -2, risk: 0, reward: 0, fail: 0, trace: 2 },
      reward: { convert: 10, slot: -1, risk: 0, reward: 1, fail: 0, trace: 1 },
      risk: { convert: -2, slot: -1, risk: 1, reward: 0, fail: 0, trace: 1 },
      fail: { convert: 0, slot: 0, risk: 0, reward: 0, fail: 1, trace: 0 },
      start: { convert: 0, slot: 0, risk: 0, reward: 0, fail: 0, trace: 0 },
      end: { convert: 5, slot: 0, risk: 0, reward: 0, fail: 0, trace: 1 }
    },
    totalMoss: 5,
    totalReward: 2,
    hiddenCheck: function (ctx) {
      return null;
    }
  },

  ren: {
    id: 'ren',
    rows: 7,
    cols: 9,
    startPos: { row: 0, col: 0 },
    endPos: { row: 6, col: 8 },
    initialSlot: 15,
    winConvert: 40,
    riskThreshold: 4,
    tiles: [
      ['start', 'path', 'rock', 'path', 'path', 'rock', 'path', 'path', 'path'],
      ['path', 'moss', 'path', 'path', 'rock', 'path', 'moss', 'rock', 'path'],
      ['path', 'rock', 'rock', 'path', 'path', 'path', 'path', 'path', 'reward'],
      ['path', 'path', 'path', 'risk', 'rock', 'path', 'rock', 'moss', 'path'],
      ['rock', 'moss', 'rock', 'path', 'path', 'path', 'path', 'path', 'path'],
      ['path', 'path', 'path', 'rock', 'reward', 'rock', 'risk', 'path', 'path'],
      ['path', 'risk', 'path', 'path', 'path', 'moss', 'path', 'path', 'end']
    ],
    tileValues: {
      path: { convert: 1, slot: -1, risk: 0, reward: 0, fail: 0, trace: 1 },
      moss: { convert: 2, slot: -3, risk: 0, reward: 0, fail: 0, trace: 2 },
      reward: { convert: 8, slot: -2, risk: 0, reward: 1, fail: 0, trace: 1 },
      risk: { convert: -3, slot: -2, risk: 1, reward: 0, fail: 0, trace: 1 },
      fail: { convert: 0, slot: 0, risk: 0, reward: 0, fail: 1, trace: 0 },
      start: { convert: 0, slot: 0, risk: 0, reward: 0, fail: 0, trace: 0 },
      end: { convert: 5, slot: 0, risk: 0, reward: 0, fail: 0, trace: 1 }
    },
    totalMoss: 5,
    totalReward: 2,
    hiddenCheck: function (ctx) {
      if (ctx.mossCount >= 5) {
        return { bonus: 15, title: '隐藏奖励', desc: '踏遍全部5个苔藓格！额外获得+15折算值。' };
      }
      return null;
    }
  },

  geng: {
    id: 'geng',
    rows: 8,
    cols: 10,
    startPos: { row: 0, col: 0 },
    endPos: { row: 7, col: 9 },
    initialSlot: 25,
    winConvert: 60,
    riskThreshold: 6,
    tiles: [
      ['start', 'path', 'path', 'moss', 'rock', 'path', 'path', 'fail', 'path', 'path'],
      ['path', 'rock', 'reward', 'path', 'path', 'rock', 'path', 'path', 'path', 'path'],
      ['path', 'path', 'path', 'rock', 'path', 'path', 'moss', 'rock', 'risk', 'path'],
      ['moss', 'path', 'risk', 'path', 'path', 'fail', 'path', 'path', 'path', 'path'],
      ['path', 'rock', 'path', 'path', 'rock', 'path', 'path', 'rock', 'path', 'reward'],
      ['path', 'path', 'moss', 'path', 'path', 'path', 'reward', 'path', 'path', 'path'],
      ['risk', 'path', 'rock', 'fail', 'path', 'rock', 'path', 'moss', 'rock', 'path'],
      ['path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'end']
    ],
    tileValues: {
      path: { convert: 1, slot: -1, risk: 0, reward: 0, fail: 0, trace: 1 },
      moss: { convert: 4, slot: -2, risk: 0, reward: 0, fail: 0, trace: 2 },
      reward: { convert: 12, slot: -1, risk: 0, reward: 1, fail: 0, trace: 1 },
      risk: { convert: -3, slot: -1, risk: 1, reward: 0, fail: 0, trace: 1 },
      fail: { convert: -20, slot: -3, risk: 0, reward: 0, fail: 1, trace: 1 },
      start: { convert: 0, slot: 0, risk: 0, reward: 0, fail: 0, trace: 0 },
      end: { convert: 5, slot: 0, risk: 0, reward: 0, fail: 0, trace: 1 }
    },
    totalMoss: 5,
    totalReward: 3,
    hiddenCheck: function (ctx) {
      if (ctx.rewardCount >= 3 && ctx.risk === 0) {
        return { multiplier: 2, title: '🌟 完美结局', desc: '收集全部3个壬号奖励且零己号风险！折算值翻倍。' };
      }
      return null;
    }
  }
};

function posKey(r, c) {
  return r + ',' + c;
}

function isAdjacent(a, b) {
  var dr = Math.abs(a.row - b.row);
  var dc = Math.abs(a.col - b.col);
  return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

function settle(levelId, playerPath) {
  var level = LEVELS[levelId];
  if (!level) {
    return { success: false, error: '未知局：' + levelId };
  }

  if (!Array.isArray(playerPath) || playerPath.length < 2) {
    return { success: false, error: '路径无效' };
  }

  var start = playerPath[0];
  if (start.row !== level.startPos.row || start.col !== level.startPos.col) {
    return { success: false, error: '起点不正确' };
  }

  var ctx = {
    convert: 0,
    slot: level.initialSlot,
    trace: 0,
    risk: 0,
    reward: 0,
    fail: 0,
    mossCount: 0,
    rewardCount: 0,
    visited: new Set(),
    steps: 0,
    settleEvents: []
  };

  ctx.visited.add(posKey(start.row, start.col));

  var reachedEnd = false;
  var failReason = null;

  for (var i = 1; i < playerPath.length; i++) {
    var prev = playerPath[i - 1];
    var curr = playerPath[i];

    if (!isAdjacent(prev, curr)) {
      failReason = '路径第' + i + '步不连续';
      break;
    }

    if (curr.row < 0 || curr.row >= level.rows || curr.col < 0 || curr.col >= level.cols) {
      failReason = '路径第' + i + '步越界';
      break;
    }

    var tile = level.tiles[curr.row][curr.col];

    if (tile === 'rock') {
      failReason = '路径第' + i + '步撞入岩障';
      break;
    }

    var values = level.tileValues[tile];
    ctx.trace += values.trace;
    ctx.slot += values.slot;
    ctx.steps++;

    var isFirstVisit = !ctx.visited.has(posKey(curr.row, curr.col));

    if (isFirstVisit) {
      ctx.visited.add(posKey(curr.row, curr.col));
      ctx.convert += values.convert;
      ctx.risk += values.risk;
      ctx.reward += values.reward;
      ctx.fail += values.fail;

      if (tile === 'moss') ctx.mossCount++;
      if (tile === 'reward') ctx.rewardCount++;
    }

    if (ctx.fail > 0) {
      failReason = '触发庚号失败因子！';
      break;
    }

    if (ctx.risk >= level.riskThreshold) {
      failReason = '己号风险已达临界值！';
      break;
    }

    if (ctx.slot <= 0 && tile !== 'end') {
      failReason = '定标槽耗尽，无法继续前行！';
      break;
    }

    if (tile === 'end') {
      reachedEnd = true;
      break;
    }
  }

  var isWin = false;
  var hiddenBonus = null;

  if (failReason) {
    ctx.settleEvents.push({ type: 'bad', title: '💔 任务失败', desc: failReason });
  } else if (!reachedEnd) {
    failReason = '路径未抵达终点';
    ctx.settleEvents.push({ type: 'bad', title: '💔 任务失败', desc: failReason });
  } else {
    hiddenBonus = level.hiddenCheck(ctx);

    if (hiddenBonus) {
      if (hiddenBonus.multiplier) {
        ctx.convert = ctx.convert * hiddenBonus.multiplier;
      }
      if (hiddenBonus.bonus) {
        ctx.convert += hiddenBonus.bonus;
      }
      ctx.settleEvents.push({ type: 'good', title: hiddenBonus.title, desc: hiddenBonus.desc });
    }

    if (ctx.convert >= level.winConvert) {
      isWin = true;
      ctx.settleEvents.push({ type: 'good', title: '🎉 通关成功', desc: '邮包安全送达！结算簿已记录本次成绩。' });
    } else {
      failReason = '折算值未达到通关标准！';
      ctx.settleEvents.push({ type: 'bad', title: '💔 任务失败', desc: failReason });
    }
  }

  return {
    success: true,
    result: {
      convert: ctx.convert,
      slot: ctx.slot,
      trace: ctx.trace,
      risk: ctx.risk,
      reward: ctx.reward,
      fail: ctx.fail,
      mossCount: ctx.mossCount,
      rewardCount: ctx.rewardCount,
      steps: ctx.steps,
      isFinished: true,
      isWin: isWin,
      failReason: failReason,
      settleEvents: ctx.settleEvents
    }
  };
}

var MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function serveStatic(res, filePath) {
  var ext = path.extname(filePath);
  var contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(data);
  });
}

var server = http.createServer(function (req, res) {
  if (req.method === 'POST' && req.url === '/api/settle') {
    var body = '';
    req.on('data', function (chunk) { body += chunk; });
    req.on('end', function () {
      try {
        var parsed = JSON.parse(body);
        var result = settle(parsed.levelId, parsed.path);
        res.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(result));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: '请求解析失败: ' + e.message }));
      }
    });
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  var urlPath = req.url === '/' ? '/index.html' : req.url;
  var safePath = urlPath.split('?')[0].replace(/\.\./g, '');
  var filePath = path.join(__dirname, safePath);
  serveStatic(res, filePath);
});

server.listen(PORT, function () {
  console.log('苔藓邮站后端服务器已启动 → http://localhost:' + PORT);
  console.log('POST /api/settle  结算接口就绪');
});
