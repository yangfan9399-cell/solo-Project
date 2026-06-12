const BASE = 'http://localhost:5174';

async function test() {
  const handlerId = 'cmqbgpeboia89f8j1clg0q49r';

  console.log('=== 1. 找一条可处理的记录（非 ARCHIVED）');
  const all = await fetch(`${BASE}/api/records`).then(r => r.json());
  const record = all.find(r => !r.isArchived && r.status !== 'ARCHIVED');
  console.log('  记录:', record.id, record.status, record.title);
  console.log('  原处理人:', record.currentAssignee?.name || '无');

  console.log('\n=== 2. 提交前状态');
  console.log('  status:', record.status);
  console.log('  节点数:', record.nodes.length);
  record.nodes.forEach(n => console.log('   -', n.nodeType, '(', n.status, ')'));

  console.log('\n=== 3. 提交复核（一线处理人张伟，只传三类内容）');
  console.log('  传: fieldNotes, onSiteNotes, attachments');
  console.log('  不传: status, conclusion, blockReason, remediationPath, basisAdopted');

  const res = await fetch(`${BASE}/api/records/${record.id}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      handlerId,
      action: {
        type: 'SUBMIT_REVIEW',
        fieldNotes: '器材已全部回收完毕，清点无误',
        onSiteNotes: '现场回收顺利，无异常情况',
        attachments: [
          { fileName: '回收清单.pdf', fileType: 'application/pdf', fileUrl: '/uploads/recycle.pdf', description: '回收签字清单' }
        ]
      }
    })
  });

  const result = await res.json();
  console.log('  HTTP:', res.status);

  if (res.status !== 200) {
    console.log('  错误:', result.message || result);
    return;
  }

  console.log('\n=== 4. 提交后结果');
  console.log('  状态:', result.status);
  console.log('  节点数:', result.nodes.length);
  result.nodes.forEach(n => console.log('   -', n.nodeType, '(', n.status, ')'));

  console.log('\n=== 5. 核心验证');
  console.log('  ✅ 状态变为 REVIEWING:', result.status === 'REVIEWING' ? '是' : '否');
  console.log('  ✅ 有「现场处理」节点:', result.nodes.some(n => n.nodeType === '现场处理') ? '是' : '否');
  console.log('  ✅ 有「申请复核」节点:', result.nodes.some(n => n.nodeType === '申请复核') ? '是' : '否');
  console.log('  ✅ 「申请复核」状态是 REVIEWING:', result.nodes.find(n => n.nodeType === '申请复核')?.status === 'REVIEWING' ? '是' : '否');

  console.log('\n=== 6. 受限字段验证（一线处理人不应修改）');
  console.log('  blockReason 保留原值:', result.blockReason ? '是' : '否');
  console.log('  remediationPath 保留原值:', result.remediationPath ? '是' : '否');
  console.log('  basisAdopted 保留原值:', result.basisAdopted ? '是' : '否');

  console.log('\n=== 7. 确认在复核台可见');
  const reviewingList = await fetch(`${BASE}/api/records?status=REVIEWING`).then(r => r.json());
  const inReviewList = reviewingList.some(r => r.id === result.id);
  console.log('  ✅ 记录出现在 REVIEWING 列表:', inReviewList ? '是' : '否');
  console.log('  REVIEWING 列表总数:', reviewingList.length);
}

test().catch(console.error);
