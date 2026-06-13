<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$service = app(\App\Services\ReviewService::class);
$businessUser = \App\Models\User::where('email', 'business@example.com')->first();
$approvalUser = \App\Models\User::where('email', 'approval@example.com')->first();

echo "=== 高校奖学金评审系统 - 完整业务流程测试 ===\n\n";

// 1. 创建一条新记录
echo "1. 创建新记录\n";
$newRecord = $service->createRecord([
    'title' => '2026年度校级二等奖学金-测试流程',
    'source' => '学院提交',
    'source_dept' => '计算机学院',
    'student_name' => '测试学生',
    'student_id' => '2023999999',
    'college' => '计算机学院',
    'major' => '软件工程',
    'grade' => '2023级',
    'scholarship_type' => '校级奖学金',
    'scholarship_level' => '二等奖',
    'apply_amount' => 1500,
    'apply_count' => 1,
    'business_note' => '材料齐全，符合申请条件',
], $businessUser);

echo "   创建成功: {$newRecord->record_no} ({$newRecord->status_label})\n";
echo "   初始节点数: " . $newRecord->nodes->count() . "个\n";

// 2. 业务专员处理记录
echo "\n2. 业务专员处理记录\n";
$processedRecord = $service->processRecord($newRecord, [
    'approved_amount' => 1500,
    'approved_count' => 1,
    'business_note' => '经核实，学生成绩排名专业前10%，符合二等奖学金评定标准',
    'site_description' => '已与辅导员确认，学生在校表现良好',
    'basis' => '《校级奖学金评定办法》第五条',
], $businessUser);

echo "   处理后状态: {$processedRecord->status_label}\n";
echo "   节点数: " . $processedRecord->nodes->count() . "个\n";
echo "   最新节点: " . $processedRecord->latestNode->type_label . " - " . $processedRecord->latestNode->operator->name . "\n";

// 3. 审批负责人复核并确认
echo "\n3. 审批负责人复核确认\n";
$reviewedRecord = $service->reviewRecord($processedRecord, 'confirm', [
    'review_opinion' => '同意业务处理意见，建议归档',
    'conclusion' => '符合条件，同意评定',
], $approvalUser);

echo "   复核后状态: {$reviewedRecord->status_label}\n";
echo "   节点数: " . $reviewedRecord->nodes->count() . "个\n";

// 4. 审批负责人归档
echo "\n4. 审批负责人归档\n";
$archivedRecord = $service->reviewRecord($reviewedRecord, 'archive', [
    'review_opinion' => '材料完整，流程合规，予以归档',
    'conclusion' => '材料完整，流程合规，予以归档',
], $approvalUser);

echo "   归档后状态: {$archivedRecord->status_label}\n";
echo "   是否归档: " . ($archivedRecord->is_archived ? '✓ 是' : '✗ 否') . "\n";
echo "   是否可编辑: " . ($archivedRecord->canEdit() ? '✗ 可编辑(错误)' : '✓ 只读') . "\n";
echo "   节点数: " . $archivedRecord->nodes->count() . "个\n";

// 5. 测试归档后不能修改
echo "\n5. 测试归档后只读保护\n";
try {
    $service->processRecord($archivedRecord, ['approved_amount' => 2000], $businessUser);
    echo "   ✗ 错误：归档后仍能修改\n";
} catch (\Exception $e) {
    echo "   ✓ 正确：归档后修改被拒绝 - {$e->getMessage()}\n";
}

// 6. 重新处理归档记录
echo "\n6. 重新处理归档记录\n";
$reopenedRecord = $service->reopenRecord($archivedRecord, '发现新的证明材料，需要重新审核', $approvalUser);

echo "   重新处理后状态: {$reopenedRecord->status_label}\n";
echo "   是否归档: " . ($reopenedRecord->is_archived ? '✗ 是(错误)' : '✓ 否') . "\n";
echo "   节点数: " . $reopenedRecord->nodes->count() . "个\n";
echo "   活动节点数: " . $reopenedRecord->nodes()->where('is_active', true)->count() . "个\n";

// 7. 检查新生成的节点
$activeNodes = $reopenedRecord->nodes()->where('is_active', true)->orderBy('sequence')->get();
echo "\n7. 活动节点列表:\n";
foreach ($activeNodes as $node) {
    echo "   {$node->sequence}. {$node->type_label} ({$node->status_label}) - {$node->operator->name}\n";
}

// 8. 测试退回补证
echo "\n8. 测试退回补证\n";
$pendingRecord = \App\Models\ReviewRecord::where('status', 'pending')->first();
if ($pendingRecord) {
    $returnedRecord = $service->reviewRecord($pendingRecord, 'return', [
        'review_opinion' => '申请材料不完整，缺少成绩单原件',
        'return_reason' => '申请材料不完整，缺少成绩单原件',
    ], $approvalUser);
    
    echo "   退回后状态: {$returnedRecord->status_label}\n";
    echo "   节点数: " . $returnedRecord->nodes->count() . "个\n";
}

// 9. 测试异常样本处理
echo "\n9. 测试异常样本处理\n";
$conflictRecord = \App\Models\ReviewRecord::where('anomaly_type', 'no_conflict')->first();
if ($conflictRecord) {
    $conflictDetail = $service->getDetail($conflictRecord);
    echo "   编号冲突样本:\n";
    echo "     阻断原因: {$conflictDetail['block_reason']}\n";
    echo "     补救路径: {$conflictDetail['remedy_path']}\n";
    echo "     差异记录数: " . count($conflictDetail['discrepancies']) . "条\n";
    if (count($conflictDetail['discrepancies']) > 0) {
        $d = $conflictDetail['discrepancies'][0];
        echo "     差异字段: {$d['field_name']}, 预期: {$d['expected_value']}, 实际: {$d['actual_value']}\n";
    }
}

// 10. 测试数据同步 - 修改关键字段
echo "\n10. 测试关键字段修改同步\n";
$testRecord = \App\Models\ReviewRecord::where('status', 'processing')->whereNull('anomaly_type')->first();
if ($testRecord) {
    $oldList = $service->getList(['per_page' => 100]);
    $oldStats = $service->getStatistics();
    $oldDetail = $service->getDetail($testRecord);
    
    echo "   修改前:\n";
    echo "     列表金额: " . collect($oldList['data'])->firstWhere('id', $testRecord->id)['apply_amount'] . "\n";
    echo "     详情金额: {$oldDetail['apply_amount']}\n";
    echo "     统计申请总额: {$oldStats['amount_total']['apply']}\n";
    
    // 业务专员处理并修改金额
    $newAmount = $oldDetail['apply_amount'] + 500;
    $updatedRecord = $service->processRecord($testRecord, [
        'apply_amount' => $newAmount,
        'approved_amount' => $newAmount,
        'business_note' => '更正申请金额',
    ], $businessUser);
    
    $newList = $service->getList(['per_page' => 100]);
    $newStats = $service->getStatistics();
    $newDetail = $service->getDetail($testRecord);
    
    echo "   修改后:\n";
    echo "     列表金额: " . collect($newList['data'])->firstWhere('id', $testRecord->id)['apply_amount'] . "\n";
    echo "     详情金额: {$newDetail['apply_amount']}\n";
    echo "     统计申请总额: {$newStats['amount_total']['apply']}\n";
    echo "     同步状态: " . (
        collect($newList['data'])->firstWhere('id', $testRecord->id)['apply_amount'] == $newAmount &&
        $newDetail['apply_amount'] == $newAmount &&
        $newStats['amount_total']['apply'] == $oldStats['amount_total']['apply'] + 500
        ? '✓ 全部同步' : '✗ 同步失败'
    ) . "\n";
    
    echo "     新增节点: " . $updatedRecord->nodes->last()->type_label . " - 包含" . count($updatedRecord->nodes->last()->changes) . "处变更\n";
}

// 11. 测试钻取功能
echo "\n11. 测试钻取过滤功能\n";
$stats = $service->getStatistics();
$drillTests = [
    ['label' => '异常记录', 'filter' => ['anomaly_type' => 'has'], 'expected' => $stats['anomaly_count']],
    ['label' => '已归档记录', 'filter' => ['status' => 'archived'], 'expected' => $stats['archived_count']],
    ['label' => '处理中记录', 'filter' => ['status' => 'processing'], 'expected' => $stats['status_distribution'][1]['count'] ?? 0],
    ['label' => '复核中记录', 'filter' => ['status' => 'reviewing'], 'expected' => $stats['status_distribution'][2]['count'] ?? 0],
];

foreach ($drillTests as $test) {
    $result = $service->getList($test['filter']);
    $status = $result['pagination']['total'] == $test['expected'] ? '✓ 正确' : '✗ 错误';
    echo "   {$test['label']}: 应返回{$test['expected']}条, 实际返回{$result['pagination']['total']}条 - {$status}\n";
}

// 12. 测试详情页完整数据结构
echo "\n12. 测试详情页完整数据结构\n";
$anyRecord = \App\Models\ReviewRecord::first();
$detail = $service->getDetail($anyRecord);
$requiredFields = [
    'record_no', 'title', 'source', 'student_name', 'student_id',
    'apply_amount', 'approved_amount', 'current_owner', 'nodes',
    'diff_fields', 'discrepancies', 'appeals', 'attachments',
    'block_reason', 'remedy_path', 'basis',
];
$missingFields = [];
foreach ($requiredFields as $field) {
    if (!array_key_exists($field, $detail)) {
        $missingFields[] = $field;
    }
}
echo "   必需字段: " . (empty($missingFields) ? '✓ 全部存在' : '✗ 缺失: ' . implode(', ', $missingFields)) . "\n";
echo "   历史节点: " . count($detail['nodes']) . "个\n";
echo "   处理前后差异: " . count($detail['diff_calculated']) . "个字段\n";

echo "\n=== 完整业务流程测试完成 ===\n";
