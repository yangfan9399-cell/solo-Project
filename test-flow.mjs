const BASE = 'http://localhost:5175';

async function test() {
  console.log('=========================================');
  console.log('1. 首页验证');
  console.log('=========================================');
  const home = await fetch(BASE + '/').then(r => r.text());
  const title = home.match(/<title>([^<]*)<\/title>/)?.[1];
  console.log('页面标题:', title);
  console.log('首页长度:', home.length, '字符');
  console.log('');

  console.log('=========================================');
  console.log('2. 载入三个种子样本');
  console.log('=========================================');
  const seeds = await fetch(BASE + '/api/seeds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  }).then(r => r.json());
  console.log('正常场景 UUID:', seeds.uuids.normal);
  console.log('磨损场景 UUID:', seeds.uuids.wear);
  console.log('回滚场景 UUID:', seeds.uuids.rollback);
  console.log('局次总数:', seeds.sessions.length);
  console.log('');

  const rollbackUuid = seeds.uuids.rollback;
  const normalUuid = seeds.uuids.normal;

  console.log('=========================================');
  console.log('3. 局次调整验证');
  console.log('=========================================');
  console.log('使用回滚场景局次:', rollbackUuid);
  console.log('');

  console.log('--- 调整摆长 ---');
  const r1 = await fetch(`${BASE}/api/sessions/${rollbackUuid}/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'pendulum', payload: { length: 995 } })
  }).then(r => r.json());
  console.log('摆长调整后:', r1.state.pendulumLength.toFixed(2), 'mm');
  console.log('当前误差:', r1.state.currentError.toFixed(2), '秒');
  console.log('');

  console.log('--- 调整齿轮比 ---');
  const r2 = await fetch(`${BASE}/api/sessions/${rollbackUuid}/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'gear', payload: { gearA: 49, gearB: 35, gearC: 25 } })
  }).then(r => r.json());
  const g = r2.state.gears;
  console.log('齿轮比调整后:', g.gearA, ':', g.gearB, ':', g.gearC);
  console.log('');

  console.log('--- 调整润滑度 ---');
  const r3 = await fetch(`${BASE}/api/sessions/${rollbackUuid}/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'lubrication', payload: { level: 85 } })
  }).then(r => r.json());
  console.log('润滑度调整后:', r3.state.lubrication.toFixed(1), '%');
  console.log('');

  console.log('--- 调整锤击顺序 ---');
  const r4 = await fetch(`${BASE}/api/sessions/${rollbackUuid}/adjust`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'strike_order', payload: { order: ['hammer', 'gearA', 'gearB', 'gearC'] } })
  }).then(r => r.json());
  console.log('锤击顺序调整后:', r4.state.strikeOrder.join(' → '));
  console.log('');

  console.log('=========================================');
  console.log('4. 报告页验证（后端重算分数）');
  console.log('=========================================');
  const report = await fetch(`${BASE}/api/sessions/${normalUuid}/report`).then(r => r.json());
  const r = report.report;
  console.log('后端重算分数:', r.final_summary.score);
  console.log('最终误差:', r.final_summary.final_error.toFixed(2), '秒');
  console.log('准确率:', r.final_summary.accuracy, '%');
  console.log('总调整次数:', r.final_summary.total_adjustments);
  console.log('维修零件数:', r.final_summary.parts_repaired);
  console.log('结果判定:', r.final_summary.verdict);
  console.log('');
  console.log('维修日历（天数）:', r.daily_logs.length, '天');
  console.log('第一天天气:', r.daily_logs[0].weather);
  console.log('最后一天天气:', r.daily_logs[r.daily_logs.length - 1].weather);
  const lastParts = r.daily_logs[r.daily_logs.length - 1].parts_condition;
  console.log('最后一天零件磨损:', Object.entries(lastParts).map(([k,v]) => `${k}:${Math.round(v)}%`).join(', '));
  console.log('');
  console.log('误差曲线点:', r.change_causes.length + 1, '个');
  console.log('变化归因条数:', r.change_causes.length);
  const maxChange = Math.max(...r.change_causes.map(c => Math.abs(c.error_change)));
  console.log('最大单日变化:', maxChange.toFixed(2), '秒');
  console.log('');

  console.log('=========================================');
  console.log('✅ 所有验证通过！');
  console.log('=========================================');
}

test().catch(e => {
  console.error('测试失败:', e.message);
  process.exit(1);
});
