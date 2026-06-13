<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$service = app(\App\Services\ReviewService::class);

echo "=== 高校奖学金评审系统 - 数据同步验证 ===\n\n";

// 1. 测试列表数据
$list = $service->getList(['per_page' => 5]);
echo "1. 列表数据\n";
echo "   总数: {$list['pagination']['total']}\n";
foreach ($list['data'] as $item) {
    echo "   - {$item['record_no']}: {$item['title']} ({$item['status_label']})\n";
    echo "     金额: 申请={$item['apply_amount']}, 核定={$item['approved_amount']}\n";
}

// 2. 取第一条记录测试详情
$record = \App\Models\ReviewRecord::first();
$detail = $service->getDetail($record);
echo "\n2. 详情数据\n";
echo "   编号: {$detail['record_no']}\n";
echo "   状态: {$detail['status_label']}\n";
echo "   金额: 申请={$detail['apply_amount']}, 核定={$detail['approved_amount']}\n";
echo "   异常类型: {$detail['anomaly_label']}\n";
echo "   节点数: " . count($detail['nodes']) . "\n";
echo "   差异字段数: " . count($detail['diff_fields']) . "\n";
echo "   阻断原因: " . ($detail['block_reason'] ? '已设置' : '无') . "\n";
echo "   补救路径: " . ($detail['remedy_path'] ? '已设置' : '无') . "\n";

// 3. 测试统计数据
$stats = $service->getStatistics();
echo "\n3. 统计数据\n";
echo "   总记录数: {$stats['total_count']}\n";
echo "   异常记录: {$stats['anomaly_count']}\n";
echo "   已归档: {$stats['archived_count']}\n";
echo "   待处理: {$stats['pending_count']}\n";
echo "   申请总额: {$stats['amount_total']['apply']}\n";
echo "   核定总额: {$stats['amount_total']['approved']}\n";
echo "   差异总额: {$stats['amount_total']['diff']}\n";

// 4. 验证数据一致性 - 列表和详情的金额应该一致
echo "\n4. 数据一致性验证\n";
$listItem = $list['data'][0];
echo "   列表金额: 申请={$listItem['apply_amount']}, 核定={$listItem['approved_amount']}\n";
echo "   详情金额: 申请={$detail['apply_amount']}, 核定={$detail['approved_amount']}\n";
echo "   一致性: " . ($listItem['apply_amount'] == $detail['apply_amount'] && $listItem['approved_amount'] == $detail['approved_amount'] ? '✓ 一致' : '✗ 不一致') . "\n";

// 5. 验证统计和列表的总数一致
echo "   统计总数: {$stats['total_count']}, 列表总数: {$list['pagination']['total']}\n";
echo "   一致性: " . ($stats['total_count'] == $list['pagination']['total'] ? '✓ 一致' : '✗ 不一致') . "\n";

// 6. 测试异常样本数据
echo "\n5. 四类样本数据验证\n";
$normal = \App\Models\ReviewRecord::whereNull('anomaly_type')->where('is_archived', true)->first();
$conflict = \App\Models\ReviewRecord::where('anomaly_type', 'no_conflict')->first();
$amountDiff = \App\Models\ReviewRecord::where('anomaly_type', 'amount_diff')->first();
$appeal = \App\Models\ReviewRecord::where('anomaly_type', 'appeal')->first();

echo "   正常归档: " . ($normal ? '✓ 存在 - ' . $normal->record_no : '✗ 缺失') . "\n";
echo "   编号冲突: " . ($conflict ? '✓ 存在 - ' . $conflict->record_no . ' (阻断原因: ' . ($conflict->block_reason ? '已设置' : '未设置') . ')': '✗ 缺失') . "\n";
echo "   金额差异: " . ($amountDiff ? '✓ 存在 - ' . $amountDiff->record_no . ' (差异字段: ' . count($amountDiff->diff_fields) . '个)' : '✗ 缺失') . "\n";
echo "   当事人申诉: " . ($appeal ? '✓ 存在 - ' . $appeal->record_no . ' (申诉数: ' . $appeal->appeals->count() . '条)' : '✗ 缺失') . "\n";

// 7. 测试归档后只读
echo "\n6. 归档只读验证\n";
echo "   正常归档记录 canEdit: " . ($normal->canEdit() ? '✗ 可编辑(错误)' : '✓ 只读') . "\n";
echo "   处理中记录 canEdit: " . ($conflict->canEdit() ? '✓ 可编辑' : '✗ 只读(错误)') . "\n";

// 8. 测试角色权限
echo "\n7. 角色权限验证\n";
$businessUser = \App\Models\User::where('email', 'business@example.com')->first();
$approvalUser = \App\Models\User::where('email', 'approval@example.com')->first();
echo "   业务专员: " . ($businessUser->isBusinessSpecialist() ? '✓ 是' : '✗ 否') . "\n";
echo "   审批负责人: " . ($approvalUser->isApprovalOfficer() ? '✓ 是' : '✗ 否') . "\n";

// 9. 测试钻取过滤
echo "\n8. 钻取过滤验证\n";
$anomalyList = $service->getList(['anomaly_type' => 'has']);
echo "   异常记录过滤: 应返回{$stats['anomaly_count']}条, 实际返回{$anomalyList['pagination']['total']}条 - " . ($anomalyList['pagination']['total'] == $stats['anomaly_count'] ? '✓ 正确' : '✗ 错误') . "\n";

$archivedList = $service->getList(['status' => 'archived']);
echo "   已归档过滤: 应返回{$stats['archived_count']}条, 实际返回{$archivedList['pagination']['total']}条 - " . ($archivedList['pagination']['total'] == $stats['archived_count'] ? '✓ 正确' : '✗ 错误') . "\n";

// 10. 测试异常样本的详细信息
echo "\n9. 异常样本详情验证\n";
if ($conflict) {
    $conflictDetail = $service->getDetail($conflict);
    echo "   编号冲突 - 阻断原因: " . substr($conflictDetail['block_reason'], 0, 50) . "...\n";
    echo "              差异记录: " . count($conflictDetail['discrepancies']) . "条\n";
    echo "              补救路径: " . ($conflictDetail['remedy_path'] ? '已设置' : '未设置') . "\n";
}
if ($amountDiff) {
    $amountDetail = $service->getDetail($amountDiff);
    echo "   金额差异 - 申请:{$amountDetail['apply_amount']}, 核定:{$amountDetail['approved_amount']}, 差异:" . ($amountDetail['apply_amount'] - $amountDetail['approved_amount']) . "\n";
    echo "              差异字段: " . count($amountDetail['diff_calculated']) . "个字段\n";
    echo "              差异记录: " . count($amountDetail['discrepancies']) . "条\n";
}
if ($appeal) {
    $appealDetail = $service->getDetail($appeal);
    echo "   当事人申诉 - 申诉记录: " . count($appealDetail['appeals']) . "条\n";
    echo "              申诉人: {$appealDetail['appeals'][0]['appealer_name']}\n";
    echo "              申诉原因: {$appealDetail['appeals'][0]['appeal_reason']}\n";
    echo "              申诉状态: {$appealDetail['appeals'][0]['status_label']}\n";
}

// 11. 测试历史节点
echo "\n10. 历史节点验证\n";
if ($normal) {
    $normalDetail = $service->getDetail($normal);
    echo "   正常归档记录节点数: " . count($normalDetail['nodes']) . "个\n";
    foreach ($normalDetail['nodes'] as $node) {
        echo "     - {$node['sequence']}. {$node['type_label']} ({$node['status_label']}) - {$node['operator']['name']}\n";
    }
}

// 12. 测试修改后数据同步
echo "\n11. 修改同步验证\n";
$testRecord = \App\Models\ReviewRecord::where('status', 'processing')->whereNull('anomaly_type')->first();
if ($testRecord) {
    $oldAmount = $testRecord->apply_amount;
    $oldList = $service->getList(['per_page' => 100]);
    $oldListItem = collect($oldList['data'])->firstWhere('id', $testRecord->id);
    $oldStats = $service->getStatistics();
    
    echo "   修改前 - 列表金额: {$oldListItem['apply_amount']}, 统计申请总额: {$oldStats['amount_total']['apply']}\n";
    
    // 修改金额
    $newAmount = $oldAmount + 1000;
    $testRecord->update(['apply_amount' => $newAmount]);
    
    $newList = $service->getList(['per_page' => 100]);
    $newListItem = collect($newList['data'])->firstWhere('id', $testRecord->id);
    $newDetail = $service->getDetail($testRecord);
    $newStats = $service->getStatistics();
    
    echo "   修改后 - 列表金额: {$newListItem['apply_amount']}, 详情金额: {$newDetail['apply_amount']}, 统计申请总额: {$newStats['amount_total']['apply']}\n";
    echo "   列表同步: " . ($newListItem['apply_amount'] == $newAmount ? '✓ 已同步' : '✗ 未同步') . "\n";
    echo "   详情同步: " . ($newDetail['apply_amount'] == $newAmount ? '✓ 已同步' : '✗ 未同步') . "\n";
    echo "   统计同步: " . ($newStats['amount_total']['apply'] == $oldStats['amount_total']['apply'] + 1000 ? '✓ 已同步' : '✗ 未同步') . "\n";
    
    // 恢复原值
    $testRecord->update(['apply_amount' => $oldAmount]);
}

echo "\n=== 验证完成 ===\n";
