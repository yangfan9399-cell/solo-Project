const http = require('http');
const post = (path, body) => new Promise((res, rej) => {
  const d = JSON.stringify(body);
  const req = http.request({hostname:'localhost',port:3001,path,method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}}, r => {
    let b=''; r.on('data',c=>b+=c); r.on('end',()=>res(JSON.parse(b)));
  });
  req.on('error',rej); req.write(d); req.end();
});

(async () => {
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

  const settle = await post('/api/game/settle', {phase:'wu', steps});
  console.log('SETTLE victory:', settle.result.victory, 'score:', settle.result.finalScore, 'stepsCount:', settle.result.stepsCount);
})();
