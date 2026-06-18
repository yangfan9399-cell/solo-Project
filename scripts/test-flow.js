const http = require('http');
const post = (path, body) => new Promise((res, rej) => {
  const d = JSON.stringify(body);
  const req = http.request({hostname:'localhost',port:3001,path,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}}, r => {
    let b=''; r.on('data',c=>b+=c); r.on('end',()=>res(JSON.parse(b)));
  });
  req.on('error',rej); req.write(d); req.end();
});
const get = (path) => new Promise((res, rej) => {
  const req = http.request({hostname:'localhost',port:3001,path,method:'GET'}, r => {
    let b=''; r.on('data',c=>b+=c); r.on('end',()=>res(JSON.parse(b)));
  });
  req.on('error',rej); req.end();
});

(async () => {
  const meta = await get('/api/meta/phases');
  console.log('=== META PHASES (formulaMeta check) ===');
  for (const p of meta.phases) {
    console.log(p.phase, '|', p.formulaMeta.name, '| thr:', p.formulaMeta.threshold,
      '| hidden:', p.formulaMeta.hiddenCondition ? p.formulaMeta.hiddenCondition.name : '—');
  }
  console.log();

  const init = await post('/api/game/init', {phase:'wu'});
  console.log('INIT round:', init.state.round, 'steps:', init.state.steps.length, 'gameOver:', init.state.gameOver);

  let steps = [];
  let state = init.state;
  let ev = init.event;

  for (let r = 1; r <= 5; r++) {
    const allocs = [{slotId:'w-s1',amount:1},{slotId:'w-s2',amount:1}];
    const res = await post('/api/game/step', {
      phase:'wu', steps, allocations:allocs,
      eventId: ev ? ev.id : undefined
    });
    console.log('ROUND', r, '-> round:', res.state.round, 'steps:', res.state.steps.length, 'gameOver:', res.gameOver, 'gameOverInState:', res.state.gameOver);
    steps = res.state.steps;
    state = res.state;
    ev = res.event;
  }

  const rebuild = await post('/api/game/rebuild', {phase:'wu', steps});
  console.log('REBUILD round:', rebuild.state.round, 'steps:', rebuild.state.steps.length, 'gameOver:', rebuild.state.gameOver);

  for (const phase of ['wu','ding','ji']) {
    const settle = await post('/api/game/settle', {phase, steps});
    const r = settle.result;
    console.log();
    console.log(`=== SETTLE ${phase.toUpperCase()} ===`);
    console.log('victory:', r.victory, '| score:', r.finalScore, '| formula:', r.formula.name);
    console.log('expression:', r.formula.expression);
    console.log('hiddenTriggered:', r.hiddenConditionTriggered, r.hiddenConditionName || '');
    console.log('breakdown:');
    for (const b of r.breakdown) {
      console.log(' ', b.label, (b.weight||'').padStart(5), '=>', String(b.value).padStart(5), ' | ', b.expression);
    }
    if (r.hiddenCheck) {
      console.log('hiddenCheck (', r.hiddenCheck.triggered ? 'triggered' : 'not triggered', '):');
      for (const c of r.hiddenCheck.checks) {
        console.log('   ', c.passed ? '✓' : '✗', c.label, c.actual, '/', c.required);
      }
    }
  }
})();
