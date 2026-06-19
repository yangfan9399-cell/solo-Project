const http = require('http');

function req(method, path, data) {
  return new Promise((resolve, reject) => {
    const body = data ? JSON.stringify(data) : null;
    const r = http.request(
      { hostname: 'localhost', port: 8765, path, method, headers: { 'Content-Type': 'application/json' } },
      res => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => resolve(JSON.parse(d)));
      }
    );
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

(async () => {
  const start = await req('POST','/api/sessions',{gameId:'yin'});
  const sid = start.sessionId;
  console.log('Session:', sid);
  
  const actions = ['ya1','ya2','ya3','ya4'];
  for (let i=0;i<4;i++) {
    await req('POST', '/api/sessions/' + sid + '/actions', {actionId:actions[i]});
  }
  
  const replay = await req('GET', '/api/replays/' + sid);
  console.log('回放步数:', replay.replay.length);
  replay.replay.forEach((s, i) => {
    const hasHp = 'hiddenProgress' in s;
    console.log(`Step ${i+1}: turn=${s.turn}, action=${s.actionName.substring(0,15)}..., hasHidden=${hasHp}`);
    if (hasHp) {
      const hp = s.hiddenProgress;
      const reqs = hp.requirements.map(r => `${r.field}:${r.current}/${r.target}${r.met?'✓':''}`).join(', ');
      console.log(`  -> ${reqs}`);
    }
  });
})().catch(console.error);
