<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\InspectionRecord;
use App\Models\User;
use App\Services\InspectionRecordService;

$record = InspectionRecord::create([
    'record_no' => 'GA-20260613-006',
    'source' => '日常巡检',
    'source_no' => 'XJ20260613001',
    'current_responsible_id' => 1,
    'household_name' => '王大明',
    'household_phone' => '13800138006',
    'address' => '北京市朝阳区建国路88号院3号楼1501室',
    'gas_meter_no' => 'GM20240001',
    'inspection_time' => now(),
    'inspector' => '张伟',
    'hidden_danger' => '厨房燃气管道接口处存在轻微漏气',
    'danger_level' => 'minor',
    'danger_type' => '管道漏气',
    'involve_amount' => 500.00,
    'involve_quantity' => 1,
    'evidence_conclusion' => '经检测，厨房燃气管道接口处存在轻微漏气，需重新密封处理',
    'handling_basis' => '《城镇燃气管理条例》第二十八条',
    'status' => 'reviewing',
    'sample_type' => 'normal',
    'created_by' => 1,
]);

echo "Created record ID: {$record->id}, status: {$record->status}\n";

$user = User::where('role', 'approval_leader')->first();
$service = app(InspectionRecordService::class);

try {
    $record = $service->processTransition(
        $record,
        InspectionRecord::STATUS_RETURNED,
        $user,
        '材料不完整，需补充现场检测照片'
    );
    echo "Return success! New status: {$record->status}\n";

    $node = $record->nodes()->latest()->first();
    if ($node) {
        echo "Node ID: {$node->id}\n";
        echo "Node type: {$node->node_type}\n";
        echo "Node name: {$node->node_name}\n";
        echo "Action: {$node->action}\n";
        echo "Operator: {$node->operator->name}\n";
        if ($node->node_type === 'returned' && $node->node_name === '退回补证') {
            echo "PASS: returned node created correctly\n";
        } else {
            echo "FAIL: node type or name mismatch\n";
        }
    } else {
        echo "FAIL: no node created\n";
    }
} catch (\Exception $e) {
    echo "ERROR: {$e->getMessage()}\n";
}
