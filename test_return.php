<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\InspectionRecord;
use App\Models\User;
use App\Services\InspectionRecordService;

echo "=== 测试退回操作生成节点功能 ===\n\n";

// 创建一条测试记录
$record = InspectionRecord::create([
    'record_no' => 'GA-TEST-001',
    'source' => '测试',
    'source_no' => 'TEST001',
    'current_responsible_id' => 1,
    'household_name' => '测试用户',
    'household_phone' => '13800138000',
    'address' => '测试地址',
    'gas_meter_no' => 'GM-TEST-001',
    'inspection_time' => now(),
    'inspector' => '测试员',
    'hidden_danger' => '测试隐患',
    'danger_level' => 'minor',
    'danger_type' => '测试类型',
    'involve_amount' => 1000,
    'involve_quantity' => 1,
    'evidence_conclusion' => '测试证据结论',
    'handling_basis' => '测试依据',
    'status' => 'reviewing',
    'sample_type' => 'normal',
    'created_by' => 1,
]);

echo "1. 创建测试记录\n";
echo "   ID: {$record->id}\n";
echo "   编号: {$record->record_no}\n";
echo "   当前状态: {$record->status}\n\n";

// 获取审批负责人
$user = User::where('role', 'approval_leader')->first();
echo "2. 以审批负责人身份执行退回操作\n";
echo "   操作人: {$user->name}\n";
echo "   角色: {$user->role}\n\n";

// 执行退回操作
$service = app(InspectionRecordService::class);

try {
    $record = $service->processTransition(
        $record,
        InspectionRecord::STATUS_RETURNED,
        $user,
        '测试退回原因：材料不完整，需要补充现场照片'
    );
    
    echo "3. 退回操作成功！\n";
    echo "   新状态: {$record->status}\n\n";
    
    // 检查生成的节点
    $node = $record->nodes()->latest()->first();
    
    if ($node) {
        echo "4. 验证生成的退回节点\n";
        echo "   节点ID: {$node->id}\n";
        echo "   节点类型: {$node->node_type}\n";
        echo "   节点名称: {$node->node_name}\n";
        echo "   操作类型: {$node->action}\n";
        echo "   操作人: {$node->operator->name}\n";
        echo "   描述: {$node->description}\n";
        echo "   操作时间: {$node->operated_at}\n\n";
        
        // 验证节点类型正确
        if ($node->node_type === 'returned' && $node->node_name === '退回补证') {
            echo "✅ 退回节点生成成功！类型和名称都正确。\n";
        } else {
            echo "❌ 退回节点类型或名称不正确！\n";
        }
    } else {
        echo "❌ 未生成退回节点！\n";
    }
    
} catch (\Exception $e) {
    echo "❌ 错误: {$e->getMessage()}\n";
    echo $e->getTraceAsString() . "\n";
}

echo "\n=== 测试完成 ===\n";
