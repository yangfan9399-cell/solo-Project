const games = require('../data/games.js');
const g = games.you;

function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

console.log('=== 酉局隐藏路径推演 ===');
let state = deepClone(g.initialState);
let step = 0;

function exec(idx) {
  const e = g.events[idx];
  if (e.cost) {
    if (e.cost.riskC) state.riskC -= e.cost.riskC;
    if (e.cost.rewardM) state.rewardM -= e.cost.rewardM;
  }
  e.effect(state);
  step++;
  state.stepCount = step;
  console.log(`步${step} ${e.name}`);
  console.log(`  丙号=${state.riskC} 卯号=${state.rewardM} 酉号=${state.failureY} 触发=${state.hiddenTrigger}`);
  console.log(`  倒排=${state.invertedValue} 槽前3=[${state.balanceSlots.slice(0,3).join(',')}]`);
  console.log(`  lose?${g.loseCondition(state)} win?${g.winCondition(state)}`);
  if (state.riskC < 0 || state.rewardM < 0) console.log('  ⚠️ 资源不足！');
  console.log();
}

console.log(`初始: 丙号=${state.riskC} 卯号=${state.rewardM} 酉号=${state.failureY}`);
console.log(`      倒排=${state.invertedValue} 槽前3=[${state.balanceSlots.slice(0,3).join(',')}]`);
console.log(`      lose?${g.loseCondition(state)} win?${g.winCondition(state)}\n`);

exec(1); // e2 时序涟漪
exec(0); // e1 琉璃震颤
exec(2); // e3 裂隙窥伺
exec(2); // e3 裂隙窥伺
exec(3); // e4 温室庇护
exec(1); // e2 时序涟漪

console.log('--- 解锁第四槽 ---');
exec(4); // e5 第四共鸣
console.log(`secretUnlocked: ${state.secretUnlocked}, 槽3=${state.balanceSlots[3]}\n`);

exec(6); // e7 完美调和
exec(5); // e6 精准校准
exec(7); // e8 净化仪式

console.log('\n=== 最终检查 ===');
console.log('槽0-3全66?', state.balanceSlots.every(s => s === 66), state.balanceSlots);
console.log('倒排=88?', state.invertedValue === 88, state.invertedValue);
console.log('酉号=0?', state.failureY === 0, state.failureY);
console.log('secretUnlocked?', state.secretUnlocked);
console.log('最终胜利?', g.winCondition(state));
console.log('总步数:', step, '/', g.maxSteps);

console.log('\n\n=== 酉局普通路径推演 ===');
let s2 = deepClone(g.initialState);
step = 0;

function exec2(idx) {
  const e = g.events[idx];
  if (e.cost) {
    if (e.cost.riskC) s2.riskC -= e.cost.riskC;
    if (e.cost.rewardM) s2.rewardM -= e.cost.rewardM;
  }
  e.effect(s2);
  step++;
  s2.stepCount = step;
}

for (let i = 0; i < 4; i++) exec2(1); // e2
for (let i = 0; i < 3; i++) exec2(0); // e1
exec2(2); // e3
exec2(3); // e4

console.log(`步数=${step}`);
console.log(`倒排=${s2.invertedValue} ∈[50,120]? ${s2.invertedValue>=50&&s2.invertedValue<=120}`);
console.log(`槽前3=[${s2.balanceSlots.slice(0,3).join(',')}] 全∈[40,80]? ${s2.balanceSlots.slice(0,3).every(v=>v>=40&&v<=80)}`);
console.log(`酉号=${s2.failureY} <3? ${s2.failureY<3}`);
console.log(`步数≥6或触发≥3? step=${s2.stepCount} trigger=${s2.hiddenTrigger}`);
console.log(`secretUnlocked? ${s2.secretUnlocked}`);
console.log('普通胜利?', g.winCondition(s2));
