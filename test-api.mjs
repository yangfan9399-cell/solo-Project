const BASE = 'http://localhost:3001/api'

async function test() {
  console.log('=== Test 1: Create Anomaly ===')
  const r1 = await fetch(`${BASE}/anomalies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sensorCode: 'WD-TEST-001',
      towerPosition: 'T99-Z区',
      preCalibration: 100,
      postCalibration: 200,
      threshold: 5,
      handler: '测试工程师',
    }),
  })
  const j1 = await r1.json()
  console.log('Status:', r1.status, '| Response:', JSON.stringify(j1).slice(0, 200))

  console.log('\n=== Test 2: Create Retest ===')
  const list = await (await fetch(`${BASE}/anomalies`)).json()
  const openAnomaly = list.data.find(a => a.status !== 'closed')
  console.log('Using anomaly:', openAnomaly?.id, openAnomaly?.sensor_code)
  const r2 = await fetch(`${BASE}/retests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      anomalyId: openAnomaly.id,
      preCalibration: 100,
      postCalibration: 102,
      retester: '复测员张三',
    }),
  })
  const j2 = await r2.json()
  console.log('Status:', r2.status, '| Response:', JSON.stringify(j2).slice(0, 300))

  console.log('\n=== Test 3: Create Rule ===')
  const r3 = await fetch(`${BASE}/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '测试温度量程',
      minValue: -50,
      maxValue: 150,
      threshold: 3,
    }),
  })
  const j3 = await r3.json()
  console.log('Status:', r3.status, '| Response:', JSON.stringify(j3).slice(0, 300))

  console.log('\n=== Test 4: Verify Status Transition after Retest ===')
  const trans = await (await fetch(`${BASE}/transitions/${openAnomaly.id}`)).json()
  console.log('Transitions count:', trans.data.length)
  trans.data.forEach(t => console.log(`  ${t.from_status} → ${t.to_status} (${t.comment})`))
}

test().catch(console.error)
