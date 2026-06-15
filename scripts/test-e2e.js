const BASE = 'http://localhost:3000/api';

async function apiPost(url, body) {
  const r = await fetch(BASE + url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}
async function apiPut(url, body) {
  const r = await fetch(BASE + url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
}
async function apiGet(url) {
  const r = await fetch(BASE + url);
  return r.json();
}

async function main() {
  const errors = [];

  // 1. 导入底图
  console.log('=== 1. 导入底图 ===');
  const master = await apiPost('/masters', {
    name: '端到端验证地形', batch: 'E2E2026', version: '1', terrainType: '丘陵',
    status: 'draft', mapWidth: 800, mapHeight: 600, scale: 0, scaleUnit: 'm',
    description: '端到端验证', mapImage: ''
  });
  console.log('  主记录:', master.name, 'id:', master.id);
  if (!master.id) errors.push('1.导入底图: 主记录ID为空');

  const result = await apiPost('/results', {
    masterId: master.id, version: '1', status: 'pending',
    layers: [], pointLabels: [], errorNotes: []
  });
  console.log('  结果:', result.id, result.status);

  // 2. 标定比例尺
  console.log('\n=== 2. 标定比例尺 ===');
  const m2 = await apiPut('/masters/' + master.id, { scale: 3.14, scaleUnit: 'm', status: 'processing' });
  console.log('  scale:', m2.scale, 'status:', m2.status);
  if (m2.scale !== 3.14) errors.push('2.标定比例尺: scale不匹配');

  // 3. 描绘等高线 (3条)
  console.log('\n=== 3. 描绘等高线 ===');
  const colors = ['#00ff88', '#00d4ff', '#ffd93d'];
  const contourIds = [];
  for (let i = 0; i < 3; i++) {
    const c = await apiPost('/details', {
      masterId: master.id, contourIndex: i, elevation: 100 + i * 50,
      points: [{x: 50 + i*20, y: 300 - i*30}, {x: 200 + i*20, y: 250 - i*30}, {x: 400 + i*20, y: 280 - i*30}, {x: 600 + i*20, y: 220 - i*30}],
      color: colors[i], isSmooth: true
    });
    contourIds.push(c.id);
    console.log('  等高线' + (i+1) + ':', c.elevation + 'm', c.id);
  }
  const layers = contourIds.map((cid, i) => ({id: 'l'+i, layerId: cid, visible: true, opacity: 1, color: colors[i]}));
  const r3 = await apiPut('/results/' + master.id, {layers: layers, status: 'ready'});
  console.log('  图层更新:', r3.layers.length, '个');
  if (r3.layers.length !== 3) errors.push('3.描绘等高线: 图层数不匹配');

  // 4. 描绘山脊
  console.log('\n=== 4. 描绘山脊 ===');
  const ridge = await apiPost('/histories', {
    masterId: master.id, type: 'ridge', version: '1',
    data: {name: '验证脊线', points: [{x:100,y:100},{x:300,y:80},{x:500,y:110}]},
    operator: 'user', remark: '山脊验证'
  });
  console.log('  山脊:', ridge.id, ridge.type);
  if (ridge.type !== 'ridge') errors.push('4.描绘山脊: 类型不匹配');

  // 5. 测量坡向
  console.log('\n=== 5. 测量坡向 ===');
  const aspect = await apiPost('/histories', {
    masterId: master.id, type: 'aspect', version: '1',
    data: {position: {x:350, y:200}, direction: 315, slope: 22.5},
    operator: 'user', remark: '坡向验证'
  });
  console.log('  坡向:', aspect.id, '方向:', aspect.data.direction);
  if (aspect.data.direction !== 315) errors.push('5.测量坡向: 方向不匹配');

  // 6. 生成剖面
  console.log('\n=== 6. 生成剖面 ===');
  const elevData = [];
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    elevData.push({distance: t * 600, elevation: 100 + Math.sin(t * Math.PI * 3) * 40});
  }
  const profile = await apiPost('/histories', {
    masterId: master.id, type: 'profile', version: '1',
    data: {
      name: '验证剖面', startPoint: {x:50,y:400}, endPoint: {x:750,y:80},
      totalDistance: 1500, elevationData: elevData
    },
    operator: 'user', remark: '剖面验证'
  });
  console.log('  剖面:', profile.id, '采样:', profile.data.elevationData.length);

  // === 模拟刷新：重新获取全部数据验证 ===
  console.log('\n' + '='.repeat(60));
  console.log('=== 模拟页面刷新，重新获取数据 ===');
  console.log('='.repeat(60));

  const masters = await apiGet('/masters');
  const found = masters.find(m => m.id === master.id);
  console.log('\n--- 记录列表 ---');
  console.log('总记录数:', masters.length);
  console.log('新建记录在列表中:', !!found);
  if (!found) errors.push('刷新: 新建记录不在列表中');
  else console.log('  名称:', found.name, '状态:', found.status, '比例尺:', found.scale);

  const full = await apiGet('/masters/' + master.id + '/full');
  console.log('\n--- 详情验证 ---');
  console.log('主记录:', full.master.name, 'scale=' + full.master.scale);
  console.log('明细数量:', full.details.length, '(期望3)');
  console.log('历史数量:', full.histories.length, '(期望3: ridge+aspect+profile)');
  console.log('结果图层:', full.result.layers.length, '(期望3)');
  console.log('结果状态:', full.result.status);
  console.log('历史类型:', full.histories.map(h => h.type).sort().join(', '));

  if (full.details.length !== 3) errors.push('刷新: 明细数量=' + full.details.length + ' 期望3');
  if (full.histories.length !== 3) errors.push('刷新: 历史数量=' + full.histories.length + ' 期望3');
  if (full.result.layers.length !== 3) errors.push('刷新: 图层数量=' + full.result.layers.length + ' 期望3');
  if (full.master.scale !== 3.14) errors.push('刷新: 比例尺=' + full.master.scale + ' 期望3.14');

  // 验证图层切换（显示/隐藏）
  console.log('\n--- 图层切换验证 ---');
  const firstLayerId = full.result.layers[0].layerId;
  const toggled = (full.result.layers || []).map(function(l) {
    return l.layerId === firstLayerId ? Object.assign({}, l, {visible: false}) : l;
  });
  const rToggle = await apiPut('/results/' + master.id, {layers: toggled});
  console.log('切换后隐藏图层数:', rToggle.layers.filter(function(l){return !l.visible;}).length);
  if (rToggle.layers.filter(function(l){return !l.visible;}).length !== 1) {
    errors.push('图层切换: 隐藏数不正确');
  }

  // 验证误差备注解决
  console.log('\n--- 误差备注验证 ---');
  const resolvedNotes = [{id: 'e1', masterId: master.id, x: 200, y: 300, message: '测试误差', severity: 'high', resolved: true, createdAt: new Date().toISOString(), resolvedAt: new Date().toISOString()}];
  const rErr = await apiPut('/results/' + master.id, {errorNotes: resolvedNotes});
  console.log('解决后已解决误差数:', rErr.errorNotes.filter(function(n){return n.resolved;}).length);
  if (rErr.errorNotes.filter(function(n){return n.resolved;}).length !== 1) {
    errors.push('误差备注: 解决状态不正确');
  }

  // 最终刷新验证
  console.log('\n--- 最终刷新验证 ---');
  const finalFull = await apiGet('/masters/' + master.id + '/full');
  console.log('明细:', finalFull.details.length, '条');
  console.log('历史:', finalFull.histories.length, '条');
  console.log('图层:', finalFull.result.layers.length, '个 (其中隐藏:', finalFull.result.layers.filter(function(l){return !l.visible;}).length + ')');
  console.log('误差:', finalFull.result.errorNotes.length, '条 (其中已解决:', finalFull.result.errorNotes.filter(function(n){return n.resolved;}).length + ')');

  console.log('\n' + '='.repeat(60));
  if (errors.length === 0) {
    console.log('✅ 全部端到端验证通过！刷新后数据完整保留。');
  } else {
    console.log('❌ 发现 ' + errors.length + ' 个问题：');
    errors.forEach(function(e, i) { console.log('  ' + (i+1) + '. ' + e); });
  }
}

main();
