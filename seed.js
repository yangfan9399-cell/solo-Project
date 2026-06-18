const http = require('http');

const API_HOST = 'localhost';
const API_PORT = 37688;

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      host: API_HOST,
      port: API_PORT,
      path: '/api' + path,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
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

function pad(s, n, c = ' ') { return String(s).padEnd(n, c); }
function hr() { console.log('─'.repeat(68)); }
function title(t) { console.log(); hr(); console.log(`❄ ${t}`); hr(); }

async function ensureServer() {
  try { await api('GET', '/health'); return true; }
  catch (e) {
    console.log('⚠ 后端服务未检测到 (http://' + API_HOST + ':' + API_PORT + ')');
    console.log('  请先在项目根目录运行:  npm start');
    console.log('  或:  node server.js');
    console.log();
    return false;
  }
}

async function playSi() {
  title('巳局 · 初雪之径（教学局） - 完整路径 S→B→D→E→T');
  const s = await api('POST', '/sessions/start/si');
  console.log(`Session: ${s.sessionId}  起点: ${s.currentState.currentNode}  换轨=${s.currentState.railSwitchValue}  转译=${s.currentState.translationSlots}`);

  const moves = [['B', false], ['D', false], ['E', true], ['T', false]];
  const labels = { B: '霜华栈', D: '冻云渡', E: '雪霁峰', T: '终抵屋' };
  for (const [t, useTrans] of moves) {
    const mv = await api('POST', `/sessions/${s.sessionId}/move`, { targetNode: t, useTranslation: useTrans });
    const cs = mv.currentState;
    const ev = mv.eventTriggered ? ` ⚑${mv.eventTriggered.name}` : '';
    const tr = useTrans ? ' [+转译]' : '';
    console.log(`  → ${pad(labels[t], 6)} 换轨=${pad(cs.railSwitchValue, 2)} 转译=${pad(cs.translationSlots, 2)} 复写=${pad(cs.rewriteTraces, 2)} 巳号风险=${pad(cs.siRisk, 2)}${ev}${tr}  [${mv.gameStatus}]`);
    if (mv.gameStatus !== 'playing') break;
  }

  const h = await api('GET', `/sessions/${s.sessionId}/history`);
  console.log(`  回放轴共 ${h.history.length} 步，每步 state 字段存在: ${h.history.every(x => x.state && typeof x.state === 'object') ? '✔' : '✘'}`);

  const settle = await api('POST', `/sessions/${s.sessionId}/settle`);
  console.log(`  结算: 结果=${settle.result}  等级=${settle.grade}  分数=${settle.score}  路径=${settle.finalState.path.join('→')}`);
  return { sessionId: s.sessionId, settle, history: h.history };
}

async function playShen() {
  title('申局 · 暴雪之途（资源短缺局） - S→B→E→G→I→T');
  const s = await api('POST', '/sessions/start/shen');
  console.log(`Session: ${s.sessionId}  起点: ${s.currentState.currentNode}  换轨=${s.currentState.railSwitchValue}  转译=${s.currentState.translationSlots}`);

  const moves = [
    ['B', false],
    ['E', false],
    ['G', false],
    ['I', true],
    ['T', false]
  ];
  const labels = { B: '风啸谷', E: '凛冬驿', G: '白茫渡', I: '暮光径', T: '终抵塔' };
  for (const [t, useTrans] of moves) {
    try {
      const mv = await api('POST', `/sessions/${s.sessionId}/move`, { targetNode: t, useTranslation: useTrans });
      const cs = mv.currentState;
      const ev = mv.eventTriggered ? ` ⚑${mv.eventTriggered.name}` : '';
      const tr = useTrans ? ' [+转译]' : '';
      console.log(`  → ${pad(labels[t], 6)} 换轨=${pad(cs.railSwitchValue, 2)} 转译=${pad(cs.translationSlots, 2)} 申号奖励=${pad(cs.shenReward, 2)}${ev}${tr}  [${mv.gameStatus}]`);
      if (mv.gameStatus !== 'playing') break;
    } catch (e) {
      console.log(`  → ${pad(labels[t], 6)} ✘ 失败: ${e.message}`);
    }
  }

  const settle = await api('POST', `/sessions/${s.sessionId}/settle`);
  console.log(`  结算: 结果=${settle.result}  等级=${settle.grade}  分数=${settle.score}`);
  return { sessionId: s.sessionId, settle };
}

async function playWu() {
  title('午局 · 极夜之航（隐藏结局局）- 两焰路径（演示机制）');
  const s = await api('POST', '/sessions/start/wu');
  console.log(`Session: ${s.sessionId}  起点: ${s.currentState.currentNode}  三焰={紫:✗ 绯:✗ 金:✗}  午号因子=${s.currentState.wuFailureFactor}`);

  const moves = [
    ['A', false],
    ['C', false],
    ['E', false]
  ];
  const labels = { A: '紫焰坛', C: '霜语城', E: '金焰坛' };
  for (const [t, useTrans] of moves) {
    const mv = await api('POST', `/sessions/${s.sessionId}/move`, { targetNode: t, useTranslation: useTrans });
    const cs = mv.currentState;
    const flames = cs.wuFlames || {};
    const fs = `紫:${flames.a ? '✔' : '✗'} 绯:${flames.b ? '✔' : '✗'} 金:${flames.c ? '✔' : '✗'}`;
    const ev = mv.eventTriggered ? ` ⚑${mv.eventTriggered.name}` : '';
    console.log(`  → ${pad(labels[t], 6)} 三焰={${fs}} 午号因子=${pad(Math.max(0, cs.wuFailureFactor), 2)} 隐藏=${cs.hiddenUnlocked ? '★已触发' : '未触发'}${ev}`);
  }

  const settle = await api('POST', `/sessions/${s.sessionId}/settle`);
  const flameCount = settle.detailBreakdown.find(b => b.label === '三焰点燃加成');
  console.log(`  结算: 分数=${settle.score}  三焰加成=${flameCount ? flameCount.value : 0}  (未触发绯焰=仅2焰点燃加50分，3焰全点燃+三焰同燃隐藏结局再加100)`);
  return { sessionId: s.sessionId, settle };
}

async function testHistoryStructure() {
  title('回放轴 & localStorage 断点续局 结构一致性验证');
  const s = await api('POST', '/sessions/start/si');
  const mv1 = await api('POST', `/sessions/${s.sessionId}/move`, { targetNode: 'B', useTranslation: false });
  const hist = await api('GET', `/sessions/${s.sessionId}/history`);

  const step0 = hist.history[0];
  const step1 = hist.history[1];
  console.log(`  第0步: step=${step0.step}  state 存在=${!!step0.state}  state.currentNode=${step0.state?.currentNode}  state.unlockedEdges 存在=${Array.isArray(step0.state?.unlockedEdges)}`);
  console.log(`  第1步: step=${step1.step}  state 存在=${!!step1.state}  state.currentNode=${step1.state?.currentNode}  eventTriggered.id=${step1.eventTriggered?.id || '无'}  eventTriggered.description 存在=${!!step1.eventTriggered?.description}`);

  const restorePayload = {
    sessionId: s.sessionId + '_seed_restore',
    gameId: 'si',
    gameStatus: 'playing',
    currentStep: hist.currentStep,
    history: hist.history
  };
  const restored = await api('POST', '/sessions/restore', { sessionData: restorePayload });
  console.log(`  从 history 恢复会话: sessionId=${restored.sessionId.slice(0, 16)}...  节点=${restored.currentState.currentNode}  换轨=${restored.currentState.railSwitchValue}  可用移动=${JSON.stringify(restored.availableMoves.map(m => m.target))}`);

  const mvAfter = await api('POST', `/sessions/${restored.sessionId}/move`, { targetNode: 'D', useTranslation: false });
  console.log(`  恢复后继续移动 → D: 节点=${mvAfter.currentState.currentNode}  事件=${mvAfter.eventTriggered?.name || '无'}  [${mvAfter.gameStatus}]`);
  console.log(`  ✔ localStorage→/sessions/restore→继续推演 闭环验证通过`);
  return true;
}

async function main() {
  console.log();
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║       ❄  雪线缆屋航线推演局 种子数据演示 (seed.js)             ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  console.log('║   运行:  npm run seed   或   node seed.js                        ║');
  console.log('║   功能: 三局完整演示 + 回放轴数据结构 + 断点续局闭环             ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');

  if (!(await ensureServer())) {
    process.exit(1);
  }

  const siResult = await playSi();
  const shenResult = await playShen();
  const wuResult = await playWu();
  await testHistoryStructure();

  title('种子数据闭环 - 三盘对局摘要');
  console.log(`  巳局 ${pad(siResult.settle.result, 10)}  ${pad('等级=' + siResult.settle.grade, 8)}  ${pad('分数=' + siResult.settle.score, 10)}  session=${siResult.sessionId.slice(0, 16)}...`);
  console.log(`  申局 ${pad(shenResult.settle.result, 10)}  ${pad('等级=' + shenResult.settle.grade, 8)}  ${pad('分数=' + shenResult.settle.score, 10)}  session=${shenResult.sessionId.slice(0, 16)}...`);
  console.log(`  午局 ${pad(wuResult.settle.result, 10)}  ${pad('等级=' + wuResult.settle.grade, 8)}  ${pad('分数=' + wuResult.settle.score, 10)}  session=${wuResult.sessionId.slice(0, 16)}...`);
  hr();
  console.log();
  console.log('  ✔ 所有对局流程执行完毕，数据完整写入后端内存 sessions。');
  console.log('  ✔ 前端地址:  http://localhost:' + API_PORT);
  console.log();
}

main().catch(e => {
  console.error('\n✖ 种子数据演示执行失败:', e.message);
  process.exit(1);
});
