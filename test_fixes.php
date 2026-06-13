<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$service = app(\App\Services\ReviewService::class);
$businessUser = \App\Models\User::where('email', 'business@example.com')->first();
$approvalUser = \App\Models\User::where('email', 'approval@example.com')->first();

echo "=== 高校奖学金评审系统 - 修复验证测试 ===\n\n";

// 测试1: 业务专员权限收紧验证
echo "1. 业务专员权限收紧验证\n";
$testRecord = \App\Models\ReviewRecord::where('status', 'processing')->whereNull('anomaly_type')->first();
if ($testRecord) {
    $oldAmount = $testRecord->approved_amount;
    $oldBasis = $testRecord->basis;
    $oldConclusion = $testRecord->conclusion;
    $oldAnomaly = $testRecord->anomaly_type;
    
    // 尝试用业务专员身份提交包含审批字段的数据
    try {
        $result = $service->processRecord($testRecord, [
            'approved_amount' => 9999,
            'basis' => '非法修改依据',
            'conclusion' => '非法修改结论',
            'anomaly_type' => 'amount_diff',
            'business_note' => '业务专员正常提交业务记录',
            'on_site_note' => '业务专员正常提交现场说明',
        ], $businessUser);
        
        $testRecord->refresh();
        echo "   业务专员提交后:\n";
        echo "     核定金额: {$testRecord->approved_amount} (预期不变: {$oldAmount})\n";
        echo "     依据: " . (substr($testRecord->basis, 0, 20)) . " (预期不变)\n";
        echo "     结论: " . (substr($testRecord->conclusion, 0, 20)) . " (预期不变)\n";
        echo "     异常类型: " . ($testRecord->anomaly_type ?? '无') . " (预期不变)\n";
        echo "     业务记录: " . (substr($testRecord->latestNode->business_note, 0, 30)) . "... (预期被更新)\n";
        
        $amountOk = $testRecord->approved_amount == $oldAmount;
        $basisOk = $testRecord->basis == $oldBasis;
        $conclusionOk = $testRecord->conclusion == $oldConclusion;
        $anomalyOk = $testRecord->anomaly_type == $oldAnomaly;
        
        echo "   权限收紧验证:\n";
        echo "     核定金额未被修改: " . ($amountOk ? '✓ 正确' : '✗ 错误') . "\n";
        echo "     依据未被修改: " . ($basisOk ? '✓ 正确' : '✗ 错误') . "\n";
        echo "     结论未被修改: " . ($conclusionOk ? '✓ 正确' : '✗ 错误') . "\n";
        echo "     异常类型未被修改: " . ($anomalyOk ? '✓ 正确' : '✗ 错误') . "\n";
        echo "     业务记录正常提交: " . ($testRecord->latestNode->business_note ? '✓ 正确' : '✗ 错误') . "\n";
    } catch (\Exception $e) {
        echo "   错误: {$e->getMessage()}\n";
    }
}

// 测试2: 重新处理后所有历史节点可追溯
echo "\n2. 重新处理后所有历史节点可追溯\n";
$archivedRecord = \App\Models\ReviewRecord::where('is_archived', true)->first();
if ($archivedRecord) {
    $oldNodeCount = $archivedRecord->nodes->count();
    echo "   重新处理前节点数: {$oldNodeCount}\n";
    
    // 重新处理
    $reopenedRecord = $service->reopenRecord($archivedRecord, '测试重新处理，验证历史节点保留', $approvalUser);
    $reopenedRecord->refresh();
    
    $totalNodeCount = $reopenedRecord->nodes->count();
    $activeNodeCount = $reopenedRecord->nodes()->where('is_active', true)->count();
    $inactiveNodeCount = $reopenedRecord->nodes()->where('is_active', false)->count();
    
    echo "   重新处理后:\n";
    echo "     总节点数: {$totalNodeCount} (预期: " . ($oldNodeCount + 1) . ")\n";
    echo "     活动节点数: {$activeNodeCount}\n";
    echo "     失效节点数: {$inactiveNodeCount}\n";
    
    $totalOk = $totalNodeCount == $oldNodeCount + 1;
    $inactiveOk = $inactiveNodeCount > 0;
    
    echo "   节点保留验证:\n";
    echo "     总节点数正确: " . ($totalOk ? '✓ 正确' : '✗ 错误') . "\n";
    echo "     存在失效节点: " . ($inactiveOk ? '✓ 正确' : '✗ 错误') . "\n";
    
    // 检查getDetail是否返回所有节点
    $detail = $service->getDetail($reopenedRecord);
    $detailNodeCount = count($detail['nodes']);
    echo "     getDetail返回节点数: {$detailNodeCount}\n";
    echo "     getDetail返回所有节点: " . ($detailNodeCount == $totalNodeCount ? '✓ 正确' : '✗ 错误') . "\n";
    
    // 检查节点详情中是否包含is_active标记
    $hasIsActive = isset($detail['nodes'][0]['is_active']);
    echo "     节点包含is_active标记: " . ($hasIsActive ? '✓ 正确' : '✗ 错误') . "\n";
}

// 测试3: 附件上传功能
echo "\n3. 附件上传功能验证\n";
$processingRecord = \App\Models\ReviewRecord::where('is_archived', false)->first();
if ($processingRecord) {
    // 创建一个测试文件
    $testFile = tempnam(sys_get_temp_dir(), 'test_');
    file_put_contents($testFile, '测试证据附件内容');
    
    $uploadedFile = new \Illuminate\Http\UploadedFile(
        $testFile,
        '测试附件.pdf',
        'application/pdf',
        null,
        true
    );
    
    try {
        $attachment = $service->uploadAttachment(
            $processingRecord,
            $uploadedFile,
            \App\Models\Attachment::TYPE_EVIDENCE,
            $businessUser
        );
        
        echo "   附件上传成功:\n";
        echo "     附件ID: {$attachment->id}\n";
        echo "     原始文件名: {$attachment->original_name}\n";
        echo "     存储路径: {$attachment->file_path}\n";
        echo "     文件大小: {$attachment->file_size} bytes\n";
        echo "     附件类型: {$attachment->attachment_type_label}\n";
        echo "     上传人: {$attachment->uploadedBy->name}\n";
        echo "   附件记录写入: ✓ 成功\n";
        
        // 检查文件是否真实存在
        $fullPath = storage_path('app/public/' . $attachment->file_path);
        echo "   文件真实存在: " . (file_exists($fullPath) ? '✓ 是' : '✗ 否') . "\n";
        
        // 检查详情页是否返回附件
        $detail = $service->getDetail($processingRecord);
        $hasAttachment = count($detail['attachments']) > 0;
        echo "   详情页返回附件: " . ($hasAttachment ? '✓ 是' : '✗ 否') . "\n";
        
        // 清理测试文件
        unlink($testFile);
        
    } catch (\Exception $e) {
        echo "   错误: {$e->getMessage()}\n";
    }
}

// 测试4: 审批负责人权限验证
echo "\n4. 审批负责人权限验证\n";
$testRecord2 = \App\Models\ReviewRecord::where('status', 'processing')->whereNull('anomaly_type')->first();
if ($testRecord2) {
    $oldAmount = $testRecord2->approved_amount;
    $oldBasis = $testRecord2->basis;
    
    // 审批负责人处理记录，可以修改核定金额、依据等
    $newAmount = $oldAmount + 500;
    $newBasis = '审批负责人修改的依据';
    $newConclusion = '审批负责人修改的结论';
    
    try {
        $result = $service->processRecord($testRecord2, [
            'approved_amount' => $newAmount,
            'basis' => $newBasis,
            'conclusion' => $newConclusion,
            'business_note' => '审批负责人处理记录',
        ], $approvalUser);
        
        $testRecord2->refresh();
        echo "   审批负责人提交后:\n";
        echo "     核定金额: {$testRecord2->approved_amount} (预期: {$newAmount})\n";
        echo "     依据: " . (substr($testRecord2->basis, 0, 20)) . "...\n";
        echo "     结论: " . (substr($testRecord2->conclusion, 0, 20)) . "...\n";
        
        $amountOk = $testRecord2->approved_amount == $newAmount;
        $basisOk = strpos($testRecord2->basis, $newBasis) !== false;
        $conclusionOk = strpos($testRecord2->conclusion, $newConclusion) !== false;
        
        echo "   审批权限验证:\n";
        echo "     核定金额可修改: " . ($amountOk ? '✓ 正确' : '✗ 错误') . "\n";
        echo "     依据可修改: " . ($basisOk ? '✓ 正确' : '✗ 错误') . "\n";
        echo "     结论可修改: " . ($conclusionOk ? '✓ 正确' : '✗ 错误') . "\n";
    } catch (\Exception $e) {
        echo "   错误: {$e->getMessage()}\n";
    }
}

echo "\n=== 修复验证测试完成 ===\n";
