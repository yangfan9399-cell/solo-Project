const http = require('http');
function post(data) {
  return new Promise(r => {
    const body = JSON.stringify(data);
    const req = http.request({hostname:'localhost',port:3777,path:'/api/settle',method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(body)}}, res => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>r(JSON.parse(d))); });
    req.write(body); req.end();
  });
}
(async()=>{
  const r = await post({levelId:'chen',actions:[{cellId:'A1',players:2},{cellId:'C1',players:2},{cellId:'A1',players:2},{cellId:'C1',players:2},{cellId:'A1',players:2}]});
  console.log('won:', r.won, 'fumigation:', r.finalState.fumigation, 'lightMarks:', r.finalState.lightMarks);
  console.log('events:', r.steps.filter(s=>s.event).map(s=>'T'+s.turn+':'+s.event).join(' | '));
  console.log('request body keys sent: levelId, actions (no _firedEvents)');
})();
