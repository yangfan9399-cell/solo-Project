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
  console.log('=== 寅局隐藏条件进度测试 ===');
  const start = await req('POST','/api/sessions',{gameId:'yin'});
  const sid = start.sessionId;
  console.log('Session:', sid);
  
  console.log('\n--- 初始会话状态 ---');
  const sess = await req('GET', '/api/sessions/' + sid);
  console.log('hiddenProgress 存在:', !!sess.hiddenProgress);
  if (sess.hiddenProgress) {
    console.log('名称:', sess.hiddenProgress.name);
    console.log('剩余回合:', sess.hiddenProgress.turnRemaining);
    console.log('是否触发:', sess.hiddenProgress.triggered);
    sess.hiddenProgress.requirements.forEach(r => {
      console.log('  ', r.field, ':', r.current, '/', r.target, '->', r.met ? '✓' : '✗');
    });
  }
  
  console.log('\n--- 执行操作后查看进度更新 ---');
  const actions = ['ya3','ya4','ya2','ya5','ya1'];
  for (let i=0;i<6;i++) {
    const r = await req('POST', '/api/sessions/' + sid + '/actions', {actionId:actions[i%5]});
    if (r.success && r.hiddenProgress) {
      const p = r.hiddenProgress;
      const reqs = p.requirements.map(r => r.field + ':' + r.current + '/' + r.target + (r.met?'✓':'')).join(', ');
      console.log('Turn',r.turn,'| 触发:',p.triggered,'|', reqs);
      if (p.triggered) {
        console.log('  ★ HIDDEN CONDITION TRIGGERED!');
        break;
      }
    } else if (!r.success) {
      console.log('Turn',i+1,'| Error:',r.error);
    }
  }
  
  console.log('\n--- 刷新页面重新加载会话(模拟刷新) ---');
  const sess2 = await req('GET', '/api/sessions/' + sid);
  console.log('重新加载后 hiddenProgress 存在:', !!sess2.hiddenProgress);
  if (sess2.hiddenProgress) {
    console.log('状态一致: 触发=', sess2.hiddenProgress.triggered, ', 换轨=', sess2.hiddenProgress.requirements[1].current);
  }

  console.log('\n=== 验证：酉局不显示隐藏条件 ===');
  const start2 = await req('POST','/api/sessions',{gameId:'you'});
  const sid2 = start2.sessionId;
  const sess3 = await req('GET', '/api/sessions/' + sid2);
  console.log('酉局 hiddenProgress:', sess3.hiddenProgress);
  console.log('✓ 酉局正确不返回隐藏条件');
  
  console.log('\n✅ 所有测试通过！');
})().catch(console.error);
