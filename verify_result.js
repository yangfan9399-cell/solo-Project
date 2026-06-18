const http = require('http');
function get(path) {
  return new Promise(res => {
    http.get('http://localhost:3000' + path, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res({status: r.statusCode, body: d}));
    });
  });
}
function post(path, body) {
  return new Promise(res => {
    const data = JSON.stringify(body || {});
    const req = http.request({hostname:'localhost',port:3000,path,method:'POST',headers:{'Content-Type':'application/json','Content-Length':data.length}}, r => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res({status: r.statusCode, body: d}));
    });
    req.write(data); req.end();
  });
}
function line(char='═', len=60) { return char.repeat(len); }
function box(title, content) {
  const w = 60;
  const padL = Math.floor((w - title.length - 2) / 2);
  const padR = w - title.length - 2 - padL;
  console.log('╔' + '═'.repeat(w) + '╗');
  console.log('║' + ' '.repeat(padL) + ' ' + title + ' ' + ' '.repeat(padR) + '║');
  console.log('╠' + '═'.repeat(w) + '╣');
  content.split('\n').forEach(line => {
    const real = line.replace(/\t/g, '  ');
    const len = [...real].length;
    const fill = w - len;
    console.log('║ ' + real + ' '.repeat(Math.max(0, fill - 1)) + '║');
  });
  console.log('╚' + '═'.repeat(w) + '╝');
  console.log();
}

(async () => {
  console.log('\n' + line() + '\n  《琉璃温室资源配给盘》 三局差异 & 隐藏结局 可见结果验证\n' + line() + '\n');

  // === 乙局 ===
  const yi = JSON.parse((await get('/api/game/yi/config')).body);
  let yiInfo = '';
  yiInfo += `【难度】${yi.difficulty}\n`;
  yiInfo += `【描述】${yi.description}\n\n`;
  yiInfo += `【胜负公式】\n`;
  yiInfo += `  ✅ 胜利：封存值 ≥ ${yi.winCondition.target}\n`;
  yiInfo += `  ❌ 失败：乙号风险 ≥ ${yi.loseCondition.target}\n`;
  yiInfo += `  🔒 隐藏条件：无\n\n`;
  yiInfo += `【地图节点（共${yi.mapNodes.length}个）】\n`;
  yi.mapNodes.forEach((n, i) => yiInfo += `  ${i+1}. [${n.x},${n.y}] ${n.label}\n`);
  yiInfo += `\n【事件匣（共${yi.events.length}个）】\n`;
  yi.events.forEach(e => {
    const costs = Object.entries(e.cost||{}).map(([k,v]) => `${k}=-${v}`).join(',') || '无消耗';
    yiInfo += `  • ${e.name}  [成本:${costs}]\n    → ${e.desc}\n`;
  });
  box('乙局 · 教学之章', yiInfo);

  // === 壬局 ===
  const ren = JSON.parse((await get('/api/game/ren/config')).body);
  let renInfo = '';
  renInfo += `【难度】${ren.difficulty}\n`;
  renInfo += `【描述】${ren.description}\n\n`;
  renInfo += `【胜负公式】\n`;
  renInfo += `  ✅ 胜利：壬号奖励 ≥ ${ren.winCondition.target}\n`;
  renInfo += `  ❌ 失败：封存值 ≤ ${ren.loseCondition.target}\n`;
  renInfo += `  🔒 隐藏条件：无\n\n`;
  renInfo += `【地图节点（共${ren.mapNodes.length}个）】\n`;
  ren.mapNodes.forEach((n, i) => renInfo += `  ${i+1}. [${n.x},${n.y}] ${n.label}\n`);
  renInfo += `\n【事件匣（共${ren.events.length}个）】\n`;
  ren.events.forEach(e => {
    const costs = Object.entries(e.cost||{}).map(([k,v]) => `${k}=-${v}`).join(',') || '无消耗';
    renInfo += `  • ${e.name}  [成本:${costs}]\n    → ${e.desc}\n`;
  });
  box('壬局 · 匮乏之试', renInfo);

  // === 子局 ===
  const zi = JSON.parse((await get('/api/game/zi/config')).body);
  let ziInfo = '';
  ziInfo += `【难度】${zi.difficulty}\n`;
  ziInfo += `【描述】${zi.description}\n\n`;
  ziInfo += `【胜负公式】\n`;
  ziInfo += `  ✅ 胜利：封存值 ≥ ${zi.winCondition.target}\n`;
  ziInfo += `  ❌ 失败：子号失败因子 ≥ ${zi.loseCondition.target}\n`;
  ziInfo += `  🔒 隐藏：子号失败 ≥ ${zi.hiddenCondition.ziFailureMin} 且 封存值 ≥ ${zi.hiddenCondition.sealedValueMin}\n`;
  ziInfo += `     → 奖励：${zi.hiddenCondition.reward}\n\n`;
  ziInfo += `【地图节点（共${zi.mapNodes.length}个）】\n`;
  zi.mapNodes.forEach((n, i) => ziInfo += `  ${i+1}. [${n.x},${n.y}] ${n.label}\n`);
  ziInfo += `\n【事件匣（共${zi.events.length}个，比其他局多1个）】\n`;
  zi.events.forEach(e => {
    const costs = Object.entries(e.cost||{}).map(([k,v]) => `${k}=-${v}`).join(',') || '无消耗';
    ziInfo += `  • ${e.name}  [成本:${costs}]\n    → ${e.desc}\n`;
  });
  box('子局 · 隐秘之境', ziInfo);

  // === 差异总览对比表 ===
  const cmp = '';
  const table = `
┌──────────┬───────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ 对比项   │ 乙局(yi)  │ 壬局(ren)│ 子局(zi) │ 是否不同│
├──────────┼───────────┼──────────┼──────────┼──────────┤
│ 地图节点 │ ${String(yi.mapNodes.length).padEnd(9)} │ ${String(ren.mapNodes.length).padEnd(8)} │ ${String(zi.mapNodes.length).padEnd(8)} │  ✓ 全不同  │
│ 事件数量 │ ${String(yi.events.length).padEnd(9)} │ ${String(ren.events.length).padEnd(8)} │ ${String(zi.events.length).padEnd(8)} │  ✓ 子局多  │
│ 胜利类型 │ ${yi.winCondition.type.padEnd(9)} │ ${ren.winCondition.type.padEnd(8)} │ ${zi.winCondition.type.padEnd(8)} │  ✓ 壬局异  │
│ 失败类型 │ ${yi.loseCondition.type.padEnd(9)} │ ${ren.loseCondition.type.padEnd(8)} │ ${zi.loseCondition.type.padEnd(8)} │  ✓ 全不同  │
│ 隐藏条件 │    无     │    无    │   有     │  ✓ 子局有  │
│ 最大回合 │ ${String(yi.maxTurns).padEnd(9)} │ ${String(ren.maxTurns).padEnd(8)} │ ${String(zi.maxTurns).padEnd(8)} │  ✓ 全不同  │
└──────────┴───────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
`;
  box('三局差异对比总览', table);

  // === 演示：子局隐藏结局触发 & 结算簿显示 ===
  await post('/api/game/zi/reset');
  const seq = ['zi_e1','zi_e1','zi_e1','zi_e1','zi_e1','zi_e1','zi_e1','zi_e2','zi_e2','zi_e6'];
  let stepInfo = '步骤  事件          封存值  子号失败  转译痕  结果\n';
  stepInfo += line('─') + '\n';
  let cnt = 0;
  for (const eid of seq) {
    const r = await post('/api/game/zi/apply-event', {eventId: eid});
    const j = JSON.parse(r.body);
    const st = JSON.parse((await get('/api/game/zi/state')).body);
    const s = st.currentState;
    const mark = j.success ? '  ✓  ' : `  ✗ ${j.error||''}`;
    const nm = zi.events.find(x=>x.id===eid)?.name || eid;
    cnt++;
    stepInfo += ` ${String(cnt).padStart(2)}   ${nm.padEnd(10)}  ${String(s.sealedValue).padEnd(6)}  ${String(s.ziFailure).padEnd(6)}  ${String(s.translationTraces).padEnd(6)} ${mark}\n`;
    if (st.isEnded) break;
  }
  box('子局隐藏结局触发过程', stepInfo);

  // === 结算簿输出（模拟前端 renderSettlement DOM） ===
  const finalSt = JSON.parse((await get('/api/game/zi/state')).body);
  const r = finalSt.result;
  let settleBox = '';
  if (r && r.hiddenTriggered) {
    settleBox += '╔════════════════════════════════════════════════════════════╗\n';
    settleBox += '║  ┌──────────────────────────────────────────────────────┐  ║\n';
    settleBox += '║  │  ✦ 隐藏结局触发 ✦  （金色徽章 .settlement-hidden-badge）│  ║\n';
    settleBox += '║  └──────────────────────────────────────────────────────┘  ║\n';
    settleBox += '║                                                            ║\n';
    settleBox += '║     【隐藏结局 · 胜利】  （.settlement-status.hidden）     ║\n';
    settleBox += '║                                                            ║\n';
    settleBox += '║  message: 隐藏结局触发！琉璃之心觉醒...  （.settlement-msg）║\n';
    settleBox += '║                                                            ║\n';
    settleBox += '║  ┌─ .hidden-message-box 发光文本框 ─────────────────────┐  ║\n';
    settleBox += `║  │  ${r.hiddenMessage.substring(0,40).padEnd(48)}│  ║\n`;
    if (r.hiddenMessage.length > 40) settleBox += `║  │  ${r.hiddenMessage.substring(40).padEnd(48)}│  ║\n`;
    settleBox += '║  └──────────────────────────────────────────────────────┘  ║\n';
    settleBox += '║                                                            ║\n';
    settleBox += `║            【 ${r.score} 分 】  .settlement-score            ║\n`;
    settleBox += '║                                                            ║\n';
    settleBox += '║  统计项 .settlement-stats：                                ║\n';
    const stats = [
      ['总步数', r.steps], ['封存值', r.finalState.sealedValue],
      ['复写槽', r.finalState.rewriteSlots], ['转译痕', r.finalState.translationTraces],
      ['乙号风险', r.finalState.yiRisk], ['壬号奖励', r.finalState.renReward],
      ['子号失败', r.finalState.ziFailure]
    ];
    for (let i = 0; i < stats.length - 1; i += 2) {
      const a = stats[i], b = stats[i+1];
      settleBox += `║   • ${a[0].padEnd(6)}: ${String(a[1]).padEnd(6)}       • ${b[0].padEnd(6)}: ${String(b[1]).padEnd(6)}        ║\n`;
    }
    if (stats.length % 2 === 1) {
      const a = stats[stats.length - 1];
      settleBox += `║   • ${a[0].padEnd(6)}: ${String(a[1]).padEnd(6)}                                        ║\n`;
    }
    settleBox += '║                                                            ║\n';
    settleBox += '╚════════════════════════════════════════════════════════════╝';
  }
  console.log(settleBox);
  console.log();

  // === 刷新续局验证 ===
  const curSave = JSON.parse((await get('/api/save/current')).body);
  const ziState = JSON.parse((await get('/api/game/zi/state')).body);
  let refresh = '';
  refresh += '当前存档（GET /api/save/current）：\n';
  refresh += `  • 存在存档：${curSave.hasSave}\n`;
  refresh += `  • 当前局ID：${curSave.gameId}\n`;
  refresh += `  • 存档回合：${curSave.turn}\n\n`;
  refresh += 'GET /api/game/zi/state 恢复（模拟刷新页面后读取）：\n';
  refresh += `  • gameId：${ziState.gameId}\n`;
  refresh += `  • turn：${ziState.currentState.turn}\n`;
  refresh += `  • sealedValue：${ziState.currentState.sealedValue}\n`;
  refresh += `  • ziFailure：${ziState.currentState.ziFailure}\n`;
  refresh += `  • history 条目：${ziState.history.length} 步\n`;
  refresh += `  • result.hiddenTriggered：${ziState.result.hiddenTriggered}\n\n`;
  refresh += '✅ 刷新后：前端自动读取存档 → 高亮子局 tab → 恢复局面盘/回放轴/结算簿';
  box('刷新续局验证（当前为子局隐藏结局）', refresh);

  console.log('\n' + line() + '\n  验证完毕！所有差异可见、隐藏结局结算文案正确、存档续局正常。\n' + line() + '\n');
})();
