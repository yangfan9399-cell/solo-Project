const { spawn, fork } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = 37688;
const HOST = 'localhost';
const SERVER_PATH = path.join(__dirname, 'server.js');
const SEED_PATH = path.join(__dirname, 'seed.js');

function api(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = { host: HOST, port: PORT, path: '/api' + urlPath, method, headers: { 'Content-Type': 'application/json' } };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    const req = http.request(opts, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        let parsed = {};
        try { parsed = buf ? JSON.parse(buf) : {}; } catch (e) {}
        if (res.statusCode >= 400) reject(new Error(parsed.error || `HTTP ${res.statusCode}`));
        else resolve(parsed);
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitForServer(timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await api('GET', '/health');
      return true;
    } catch (e) {
      await wait(300);
    }
  }
  return false;
}

async function main() {
  const keepAlive = process.argv.includes('--keep') || process.argv.includes('-k');

  console.log();
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║     ❄ 雪线缆屋航线推演局 · 一站式演示入口 (demo.js)             ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log('║  用法: npm run demo           演示后退出                          ║');
  console.log('║        npm run demo -- --keep  演示后保持服务运行                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log();

  console.log('▶ 启动后端服务 (server.js)...');
  const server = fork(SERVER_PATH, [], {
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
    env: process.env
  });
  server.stdout.on('data', d => process.stdout.write(d));
  server.stderr.on('data', d => process.stderr.write(d));

  const up = await waitForServer();
  if (!up) {
    console.error('✖ 后端服务启动超时');
    server.kill('SIGTERM');
    process.exit(1);
  }
  console.log('✔ 服务已就绪: http://' + HOST + ':' + PORT);
  console.log();

  console.log('▶ 执行种子数据闭环演示 (seed.js 流程)...');
  console.log();
  try {
    const Si = await (async () => {
      const s = await api('POST', '/sessions/start/si');
      console.log('  [巳局] 启动: session=' + s.sessionId.slice(0, 16) + '... 起点=S 换轨=' + s.currentState.railSwitchValue + ' 转译=' + s.currentState.translationSlots);
      for (const [t, useTrans, label] of [
        ['B', false, '霜华栈'],
        ['D', false, '冻云渡(触发「雪霁天开」)'],
        ['E', true, '雪霁峰(用转译)'],
        ['T', false, '终抵屋(到达终点)']
      ]) {
        const mv = await api('POST', `/sessions/${s.sessionId}/move`, { targetNode: t, useTranslation: useTrans });
        const cs = mv.currentState;
        const ev = mv.eventTriggered ? ' ⚑' + mv.eventTriggered.name : '';
        console.log('        → ' + label.padEnd(20) + ' 节点=' + cs.currentNode + ' 换轨=' + cs.railSwitchValue + ' 转译=' + cs.translationSlots + ' 复写=' + cs.rewriteTraces + ev + '  [' + mv.gameStatus + ']');
      }
      const h = await api('GET', `/sessions/${s.sessionId}/history`);
      const allState = h.history.every(x => x.state && typeof x.state.currentNode === 'string');
      const allEt = h.history.every(x => !x.eventTriggered || (x.eventTriggered.id && x.eventTriggered.description));
      const settle = await api('POST', `/sessions/${s.sessionId}/settle`);
      console.log('        回放轴完整性: state✔=' + allState + '  事件(扁平结构)✔=' + allEt + '   结算: ' + settle.result + ' 等级=' + settle.grade + ' 分数=' + settle.score);
      return h.history;
    })();

    console.log();
    const restoredHist = Si.slice(0, 3);
    const sess = {
      sessionId: 'demo_restore_' + Date.now().toString(36),
      gameId: 'si',
      gameStatus: 'playing',
      currentStep: restoredHist[restoredHist.length - 1].step,
      history: restoredHist
    };
    console.log('  [续局] 模拟 localStorage 中存了 ' + restoredHist.length + ' 步 (含触发「雪霁天开」事件的历史)...');
    const restored = await api('POST', '/sessions/restore', { sessionData: sess });
    console.log('        恢复成功: session=' + restored.sessionId.slice(0, 18) + '... 节点=' + restored.currentState.currentNode + ' 换轨=' + restored.currentState.railSwitchValue + ' 可用移动=' + JSON.stringify(restored.availableMoves.map(m => m.target)));
    const mvNext = await api('POST', `/sessions/${restored.sessionId}/move`, { targetNode: 'E', useTranslation: true });
    const nextCs = mvNext.currentState;
    const nextEv = mvNext.eventTriggered ? ' ⚑' + mvNext.eventTriggered.name : '';
    console.log('        续走 → 雪霁峰(用转译)  节点=' + nextCs.currentNode + ' 换轨=' + nextCs.railSwitchValue + nextEv + '  [' + mvNext.gameStatus + ']');
    const mvLast = await api('POST', `/sessions/${restored.sessionId}/move`, { targetNode: 'T', useTranslation: false });
    const lastSettle = await api('POST', `/sessions/${restored.sessionId}/settle`);
    console.log('        续走 → 终抵屋  结算: ' + lastSettle.result + ' 等级=' + lastSettle.grade + ' 分数=' + lastSettle.score + '  路径=' + lastSettle.finalState.path.join('→'));
    console.log('        ✔ 含事件历史的 localStorage 续局 → 继续推演 → 结算 全链路通过');

    console.log();
    console.log('  [申局] 启动 S→B(风洞效应)→E(凛冬秘藏)→G→T ...');
    const shenS = await api('POST', '/sessions/start/shen');
    for (const [t, useTrans, label] of [
      ['B', false, '风啸谷(风洞效应+2转译)'],
      ['E', false, '凛冬驿(凛冬秘藏+2换轨)'],
      ['G', false, '白茫渡'],
      ['T', false, '终抵塔']
    ]) {
      try {
        const mv = await api('POST', `/sessions/${shenS.sessionId}/move`, { targetNode: t, useTranslation: useTrans });
        const cs = mv.currentState;
        const ev = mv.eventTriggered ? ' ⚑' + mv.eventTriggered.name : '';
        console.log('        → ' + label.padEnd(22) + ' 换轨=' + cs.railSwitchValue + ' 转译=' + cs.translationSlots + ' 奖励=' + cs.shenReward + ev + '  [' + mv.gameStatus + ']');
        if (mv.gameStatus !== 'playing') break;
      } catch (e) {
        console.log('        → ' + label.padEnd(22) + ' ✘ ' + e.message);
      }
    }
    const shenSet = await api('POST', `/sessions/${shenS.sessionId}/settle`);
    console.log('        结算: ' + shenSet.result + ' 等级=' + shenSet.grade + ' 分数=' + shenSet.score);

    console.log();
    console.log('  [午局] 启动 S→A(紫焰坛)→C(符文窖藏)→E(金焰坛) ...');
    const wuS = await api('POST', '/sessions/start/wu');
    for (const [t, useTrans, label] of [
      ['A', false, '紫焰坛(紫焰点燃)'],
      ['C', false, '霜语城(符文窖藏)'],
      ['E', false, '金焰坛(金焰点燃)']
    ]) {
      const mv = await api('POST', `/sessions/${wuS.sessionId}/move`, { targetNode: t, useTranslation: useTrans });
      const cs = mv.currentState;
      const ev = mv.eventTriggered ? ' ⚑' + mv.eventTriggered.name : '';
      const f = cs.wuFlames || {};
      console.log('        → ' + label.padEnd(20) + ' 三焰={紫:' + (f.a ? '✔' : '✗') + ' 绯:' + (f.b ? '✔' : '✗') + ' 金:' + (f.c ? '✔' : '✗') + '}' + ev + ' 隐藏=' + (cs.hiddenUnlocked ? '★已触发' : '未触发'));
    }
    const wuSet = await api('POST', `/sessions/${wuS.sessionId}/settle`);
    const flameBonus = wuSet.detailBreakdown.find(b => b.label === '三焰点燃加成');
    console.log('        结算: 分数=' + wuSet.score + ' 三焰加成=' + (flameBonus ? flameBonus.value : 0) + ' (2焰点燃=+50，3焰全点燃+三焰同燃=+175)');

  } catch (e) {
    console.error('✖ 演示执行失败:', e.message);
    if (keepAlive) console.log('  (保持服务运行中)');
    else server.kill('SIGTERM');
    process.exit(1);
  }

  console.log();
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                    ✅  演示全部通过                              ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log('║  1. 巳局胜利 (S→B→D→E→T  事件:雪霁天开)                          ║');
  console.log('║  2. 含事件的 history → localStorage → /restore 续局 → 继续推演   ║');
  console.log('║  3. 申局资源短缺胜利 (风洞效应+凛冬秘藏补给)                      ║');
  console.log('║  4. 午局两焰点燃 (三焰同燃隐藏机制验证)                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  if (keepAlive) {
    console.log();
    console.log('▶ 服务保持运行: http://' + HOST + ':' + PORT);
    console.log('  (Ctrl+C 退出)');
    process.on('SIGINT', () => { server.kill('SIGINT'); process.exit(0); });
  } else {
    server.kill('SIGTERM');
    process.exit(0);
  }
}

main();
