const BASE = 'http://localhost:3001';

async function test(name: string, method: string, path: string, body?: any) {
  console.log(`\n=== ${name} ===`);
  try {
    const res = await fetch(BASE + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (data.success) {
      console.log(`  ✅ Success`);
      if (data.data?.order?.status) {
        console.log(`     Order status: ${data.data.order.status}`);
      }
      if (data.data?.rework?.id) {
        console.log(`     Rework ID: ${data.data.rework.id}`);
      }
      if (data.data?.compensation?.status) {
        console.log(`     Compensation status: ${data.data.compensation.status}`);
      }
    } else {
      console.log(`  ❌ Failed: ${data.statusMessage || data.message}`);
    }
    return data;
  } catch (e: any) {
    console.log(`  ❌ Error: ${e.message}`);
  }
}

async function main() {
  console.log('开始 API 功能测试...\n');

  await test('1. 订单列表', 'GET', '/api/orders');
  await test('2. 订单详情', 'GET', '/api/orders/1');
  await test('3. 保洁员列表', 'GET', '/api/cleaners');
  await test('4. 赔付规则', 'GET', '/api/compensation-rules');
  await test('5. 统计数据', 'GET', '/api/statistics');

  await test('6. 派单 (订单6 pending→assigned)', 'POST', '/api/orders/6/assign', {
    cleanerId: 1,
  });

  await test('7. 提交完成 (订单6 assigned→completed)', 'POST', '/api/orders/6/complete', {
    photos: [
      { url: 'https://picsum.photos/seed/t1/400/300', type: 'completion' },
      { url: 'https://picsum.photos/seed/t2/400/300', type: 'completion' },
    ],
  });

  await test('8. 验收通过 (订单7 completed→passed)', 'POST', '/api/orders/7/inspect', {
    passed: true,
    remark: '测试验收通过',
  });

  await test('9. 创建返工 (订单2 failed→rework)', 'POST', '/api/orders/2/rework', {
    reason: 'quality_issue',
    description: '测试返工-质量问题',
    deadlineHours: 24,
    cleanerId: 1,
  });

  await test('10. 申请赔付 (订单10)', 'POST', '/api/orders/10/compensation', {
    ruleType: 'item_damage',
    amount: 100,
    reason: '测试赔付申请',
  });

  await test('11. 赔付裁决批准 (赔付1)', 'POST', '/api/compensations/1/review', {
    approved: true,
    remark: '测试批准赔付',
  });

  console.log('\n=== 测试完成 ===');
}

main().catch(console.error);
