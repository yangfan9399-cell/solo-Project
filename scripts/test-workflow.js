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

  console.log('=== 第1步：导入底图（创建主记录+结果记录）===');
  try {
    const master = await apiPost('/masters', {
      name: '测试工作流地形', batch: 'WF20260616', version: '1', terrainType: '山地',
      status: 'draft', mapWidth: 800, mapHeight: 600, scale: 0, scaleUnit: 'm',
      description: '工作流测试导入', mapImage: ''
    });
    console.log('  主记录:', master.id, master.name, 'status=' + master.status);
    if (!master.id) { errors.push('导入底图：主记录创建失败'); }

    const result = await apiPost('/results', {
      masterId: master.id, version: '1', status: 'pending',
      layers: [], pointLabels: [], errorNotes: []
    });
    console.log('  结果记录:', result.id, 'status=' + result.status);

    // 第2步：标定比例尺
    console.log('\n=== 第2步：标定比例尺 ===');
    const updated = await apiPut('/masters/' + master.id, { scale: 2.5, scaleUnit: 'm', status: 'processing' });
    console.log('  更新后 scale=' + updated.scale + ', status=' + updated.status);
    if (updated.scale !== 2.5) { errors.push('标定比例尺：scale 未更新'); }

    // 第3步：描绘等高线
    console.log('\n=== 第3步：描绘等高线 ===');
    const contour1 = await apiPost('/details', {
      masterId: master.id, contourIndex: 0, elevation: 150,
      points: [{ x: 100, y: 300 }, { x: 250, y: 250 }, { x: 400, y: 280 }, { x: 550, y: 220 }, { x: 700, y: 260 }],
      color: '#00ff88', isSmooth: true
    });
    console.log('  等高线1:', contour1.id, 'elevation=' + contour1.elevation, 'points=' + contour1.points.length);
    if (!contour1.id) { errors.push('描绘等高线：第一条创建失败'); }

    const contour2 = await apiPost('/details', {
      masterId: master.id, contourIndex: 1, elevation: 200,
      points: [{ x: 80, y: 200 }, { x: 220, y: 180 }, { x: 380, y: 210 }, { x: 530, y: 160 }, { x: 680, y: 190 }],
      color: '#00d4ff', isSmooth: true
    });
    console.log('  等高线2:', contour2.id, 'elevation=' + contour2.elevation);

    // 添加图层到结果
    const layers = [
      { id: 'l1', layerId: contour1.id, visible: true, opacity: 1, color: '#00ff88' },
      { id: 'l2', layerId: contour2.id, visible: true, opacity: 1, color: '#00d4ff' }
    ];
    const updResult = await apiPut('/results/' + master.id, { layers: layers, status: 'ready' });
    console.log('  结果图层:', updResult.layers.length, 'status=' + updResult.status);
    if (updResult.layers.length !== 2) { errors.push('描绘等高线：图层未正确更新'); }

    // 第4步：描绘山脊
    console.log('\n=== 第4步：描绘山脊 ===');
    const ridge = await apiPost('/histories', {
      masterId: master.id, type: 'ridge', version: '1',
      data: { name: '主脊线', points: [{ x: 120, y: 150 }, { x: 300, y: 100 }, { x: 500, y: 120 }, { x: 680, y: 80 }] },
      operator: 'user', remark: '手动描绘山脊'
    });
    console.log('  山脊历史:', ridge.id, 'type=' + ridge.type);
    if (ridge.type !== 'ridge') { errors.push('描绘山脊：类型不正确'); }

    // 第5步：测量坡向
    console.log('\n=== 第5步：测量坡向 ===');
    const aspect = await apiPost('/histories', {
      masterId: master.id, type: 'aspect', version: '1',
      data: { position: { x: 350, y: 200 }, direction: 225, slope: 18.5 },
      operator: 'user', remark: '坡向测量'
    });
    console.log('  坡向历史:', aspect.id, 'direction=' + aspect.data.direction);
    if (aspect.data.direction !== 225) { errors.push('测量坡向：方向数据不正确'); }

    // 第6步：生成剖面
    console.log('\n=== 第6步：生成剖面 ===');
    const elevData = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      elevData.push({ distance: t * 500, elevation: 120 + Math.sin(t * Math.PI * 2) * 30 + Math.sin(t * Math.PI * 5) * 10 });
    }
    const profile = await apiPost('/histories', {
      masterId: master.id, type: 'profile', version: '1',
      data: {
        name: '剖面 A-A1',
        startPoint: { x: 100, y: 400 }, endPoint: { x: 700, y: 100 },
        totalDistance: 1250, elevationData: elevData
      },
      operator: 'user', remark: '生成剖面'
    });
    console.log('  剖面历史:', profile.id, 'type=' + profile.type, '采样点=' + profile.data.elevationData.length);
    if (!profile.data.elevationData) { errors.push('生成剖面：高程数据缺失'); }

    // 验证 full 接口
    console.log('\n=== 全操作完成，验证 full 接口 ===');
    const full = await apiGet('/masters/' + master.id + '/full');
    console.log('  主记录:', full.master.name, 'scale=' + full.master.scale, 'status=' + full.master.status);
    console.log('  明细数量:', full.details.length);
    console.log('  历史数量:', full.histories.length);
    console.log('  结果图层:', full.result.layers.length, 'status=' + full.result.status);
    console.log('  历史类型:', full.histories.map(h => h.type).join(', '));

    if (full.details.length !== 2) { errors.push('验证：明细数量不正确，期望2 实际' + full.details.length); }
    if (full.histories.length !== 3) { errors.push('验证：历史数量不正确，期望3 实际' + full.histories.length); }
    if (full.result.layers.length !== 2) { errors.push('验证：图层数量不正确，期望2 实际' + full.result.layers.length); }

    // 验证记录列表
    console.log('\n=== 验证记录列表 ===');
    const masters = await apiGet('/masters');
    console.log('  总记录数:', masters.length);
    const found = masters.find(m => m.id === master.id);
    console.log('  新建记录在列表中:', !!found, found ? found.name : 'NOT FOUND');
    if (!found) { errors.push('验证：新建记录不在列表中'); }

  } catch (e) {
    errors.push('异常: ' + e.message);
    console.error('异常:', e);
  }

  console.log('\n' + '='.repeat(50));
  if (errors.length === 0) {
    console.log('✅ 全部验证通过！');
  } else {
    console.log('❌ 发现 ' + errors.length + ' 个问题：');
    errors.forEach((e, i) => console.log('  ' + (i + 1) + '. ' + e));
  }
}

main();
