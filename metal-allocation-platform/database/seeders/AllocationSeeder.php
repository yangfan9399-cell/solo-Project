<?php

namespace Database\Seeders;

use App\Models\Allocation;
use App\Models\AllocationAttachment;
use App\Models\AllocationDifference;
use App\Models\AllocationNode;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AllocationSeeder extends Seeder
{
    public function run(): void
    {
        $zhangsan = User::create([
            'name' => '张三',
            'email' => 'zhangsan@example.com',
            'password' => Hash::make('password'),
            'role' => 'business_specialist',
        ]);

        $lisi = User::create([
            'name' => '李四',
            'email' => 'lisi@example.com',
            'password' => Hash::make('password'),
            'role' => 'approval_manager',
        ]);

        $this->seedArchivedAllocation($zhangsan, $lisi);
        $this->seedBlockedAllocation($zhangsan, $lisi);
        $this->seedReviewingAllocation($zhangsan, $lisi);
        $this->seedAppealedAllocation($zhangsan, $lisi);
    }

    private function seedArchivedAllocation(User $zhangsan, User $lisi): void
    {
        $allocation = Allocation::create([
            'allocation_no' => 'PM-2025-0001',
            'source_vault' => '总行金库A区',
            'target_vault' => '分行金库B区',
            'metal_type' => 'gold',
            'quantity' => 500.0000,
            'unit' => 'g',
            'amount' => 2250000.00,
            'status' => 'archived',
            'current_handler_id' => $lisi->id,
            'source_info' => '总行调拨令 #2025-A001',
            'conclusion' => '清点无误，完成调拨',
            'created_at' => '2025-01-15 08:00:00',
            'updated_at' => '2025-01-15 14:00:00',
        ]);

        $baseTime = '2025-01-15';

        AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'created',
            'handler_id' => $zhangsan->id,
            'handler_role' => 'business_specialist',
            'description' => '张三创建调拨单 PM-2025-0001',
            'basis' => '总行调拨令 #2025-A001',
            'created_at' => "$baseTime 08:00:00",
            'updated_at' => "$baseTime 08:00:00",
        ]);

        AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'accepted',
            'handler_id' => $zhangsan->id,
            'handler_role' => 'business_specialist',
            'description' => '张三确认接受调拨任务',
            'created_at' => "$baseTime 09:00:00",
            'updated_at' => "$baseTime 09:00:00",
        ]);

        AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'processed',
            'handler_id' => $zhangsan->id,
            'handler_role' => 'business_specialist',
            'description' => '张三完成出库处理，黄金500g已从总行金库A区调出',
            'created_at' => "$baseTime 10:30:00",
            'updated_at' => "$baseTime 10:30:00",
        ]);

        AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'reviewed',
            'handler_id' => $lisi->id,
            'handler_role' => 'approval_manager',
            'description' => '李四审核通过，清点数量无误',
            'created_at' => "$baseTime 13:00:00",
            'updated_at' => "$baseTime 13:00:00",
        ]);

        AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'archived',
            'handler_id' => $lisi->id,
            'handler_role' => 'approval_manager',
            'description' => '李四归档，调拨完成',
            'created_at' => "$baseTime 14:00:00",
            'updated_at' => "$baseTime 14:00:00",
        ]);
    }

    private function seedBlockedAllocation(User $zhangsan, User $lisi): void
    {
        $allocation = Allocation::create([
            'allocation_no' => 'PM-2025-0002',
            'source_vault' => '总行金库A区',
            'target_vault' => '分行金库B区',
            'metal_type' => 'gold',
            'quantity' => 500.0000,
            'unit' => 'g',
            'amount' => 2250000.00,
            'status' => 'blocked',
            'current_handler_id' => null,
            'blocking_reason' => '编号 PM-2025-0002 与已归档记录 PM-2025-0001 的来源库房调出数量存在冲突，总行A区本周已调出 500g，系统记录总调出额为 1500g，超出实际库存 200g',
            'remediation_path' => '需总行金库管理员核实本周全部调拨记录，确认是否存在重复录入；核实后修正数量或撤销冲突调拨单',
            'source_info' => '总行调拨令 #2025-A002',
            'created_at' => '2025-01-16 08:00:00',
            'updated_at' => '2025-01-16 11:00:00',
        ]);

        $baseTime = '2025-01-16';

        AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'created',
            'handler_id' => $zhangsan->id,
            'handler_role' => 'business_specialist',
            'description' => '张三创建调拨单 PM-2025-0002',
            'basis' => '总行调拨令 #2025-A002',
            'created_at' => "$baseTime 08:00:00",
            'updated_at' => "$baseTime 08:00:00",
        ]);

        AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'accepted',
            'handler_id' => $zhangsan->id,
            'handler_role' => 'business_specialist',
            'description' => '张三确认接受调拨任务',
            'created_at' => "$baseTime 09:00:00",
            'updated_at' => "$baseTime 09:00:00",
        ]);

        $blockedNode = AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'blocked',
            'handler_id' => $lisi->id,
            'handler_role' => 'approval_manager',
            'description' => '系统检测到数量差异：期望 300.0000g，实际 500.0000g，调拨已被阻断',
            'before_data' => ['quantity' => '300.0000'],
            'after_data' => ['quantity' => '500.0000'],
            'created_at' => "$baseTime 11:00:00",
            'updated_at' => "$baseTime 11:00:00",
        ]);

        AllocationDifference::create([
            'allocation_id' => $allocation->id,
            'node_id' => $blockedNode->id,
            'field_name' => 'quantity',
            'expected_value' => '300.0000',
            'actual_value' => '500.0000',
            'created_at' => "$baseTime 11:00:00",
            'updated_at' => "$baseTime 11:00:00",
        ]);
    }

    private function seedReviewingAllocation(User $zhangsan, User $lisi): void
    {
        $allocation = Allocation::create([
            'allocation_no' => 'PM-2025-0003',
            'source_vault' => '分行金库C区',
            'target_vault' => '支行金库D区',
            'metal_type' => 'silver',
            'quantity' => 2000.0000,
            'unit' => 'kg',
            'amount' => 1520000.00,
            'status' => 'reviewing',
            'current_handler_id' => $lisi->id,
            'source_info' => '分行调拨令 #2025-C003',
            'created_at' => '2025-01-17 08:00:00',
            'updated_at' => '2025-01-17 12:00:00',
        ]);

        $baseTime = '2025-01-17';

        AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'created',
            'handler_id' => $zhangsan->id,
            'handler_role' => 'business_specialist',
            'description' => '张三创建调拨单 PM-2025-0003',
            'basis' => '分行调拨令 #2025-C003',
            'created_at' => "$baseTime 08:00:00",
            'updated_at' => "$baseTime 08:00:00",
        ]);

        AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'accepted',
            'handler_id' => $zhangsan->id,
            'handler_role' => 'business_specialist',
            'description' => '张三确认接受调拨任务',
            'created_at' => "$baseTime 09:00:00",
            'updated_at' => "$baseTime 09:00:00",
        ]);

        $processedNode = AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'processed',
            'handler_id' => $zhangsan->id,
            'handler_role' => 'business_specialist',
            'description' => '张三完成出库处理，发现数量和金额与预期不一致',
            'before_data' => [
                'quantity' => '1800.0000',
                'amount' => '1368000.00',
            ],
            'after_data' => [
                'quantity' => '2000.0000',
                'amount' => '1520000.00',
            ],
            'created_at' => "$baseTime 10:30:00",
            'updated_at' => "$baseTime 10:30:00",
        ]);

        AllocationDifference::create([
            'allocation_id' => $allocation->id,
            'node_id' => $processedNode->id,
            'field_name' => 'quantity',
            'expected_value' => '1800.0000',
            'actual_value' => '2000.0000',
            'created_at' => "$baseTime 10:30:00",
            'updated_at' => "$baseTime 10:30:00",
        ]);

        AllocationDifference::create([
            'allocation_id' => $allocation->id,
            'node_id' => $processedNode->id,
            'field_name' => 'amount',
            'expected_value' => '1368000.00',
            'actual_value' => '1520000.00',
            'created_at' => "$baseTime 10:30:00",
            'updated_at' => "$baseTime 10:30:00",
        ]);

        AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'reviewing',
            'handler_id' => $zhangsan->id,
            'handler_role' => 'business_specialist',
            'description' => '系统自动触发复核流程',
            'created_at' => "$baseTime 11:00:00",
            'updated_at' => "$baseTime 11:00:00",
        ]);
    }

    private function seedAppealedAllocation(User $zhangsan, User $lisi): void
    {
        $allocation = Allocation::create([
            'allocation_no' => 'PM-2025-0004',
            'source_vault' => '总行金库A区',
            'target_vault' => '分行金库E区',
            'metal_type' => 'platinum',
            'quantity' => 100.0000,
            'unit' => 'oz',
            'amount' => 98000.00,
            'status' => 'appealed',
            'current_handler_id' => $zhangsan->id,
            'blocking_reason' => '当事人张三对清点数量提出异议，认为实际清点数量为 95oz 而非 100oz',
            'remediation_path' => '需调取现场监控录像和双人清点记录进行核实；当事人需在3个工作日内提交书面申诉材料',
            'source_info' => '总行调拨令 #2025-A004',
            'created_at' => '2025-01-18 08:00:00',
            'updated_at' => '2025-01-18 16:00:00',
        ]);

        $baseTime = '2025-01-18';

        AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'created',
            'handler_id' => $zhangsan->id,
            'handler_role' => 'business_specialist',
            'description' => '张三创建调拨单 PM-2025-0004',
            'basis' => '总行调拨令 #2025-A004',
            'created_at' => "$baseTime 08:00:00",
            'updated_at' => "$baseTime 08:00:00",
        ]);

        AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'accepted',
            'handler_id' => $zhangsan->id,
            'handler_role' => 'business_specialist',
            'description' => '张三确认接受调拨任务',
            'created_at' => "$baseTime 09:00:00",
            'updated_at' => "$baseTime 09:00:00",
        ]);

        AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'processed',
            'handler_id' => $zhangsan->id,
            'handler_role' => 'business_specialist',
            'description' => '张三完成出库处理，铂金100oz已从总行金库A区调出',
            'created_at' => "$baseTime 10:30:00",
            'updated_at' => "$baseTime 10:30:00",
        ]);

        $reviewedNode = AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'reviewed',
            'handler_id' => $lisi->id,
            'handler_role' => 'approval_manager',
            'description' => '李四审核时发现数量差异：期望 100oz，实际清点 95oz',
            'created_at' => "$baseTime 14:00:00",
            'updated_at' => "$baseTime 14:00:00",
        ]);

        AllocationDifference::create([
            'allocation_id' => $allocation->id,
            'node_id' => $reviewedNode->id,
            'field_name' => 'quantity',
            'expected_value' => '100.0000',
            'actual_value' => '95.0000',
            'created_at' => "$baseTime 14:00:00",
            'updated_at' => "$baseTime 14:00:00",
        ]);

        $appealedNode = AllocationNode::create([
            'allocation_id' => $allocation->id,
            'node_type' => 'appealed',
            'handler_id' => $zhangsan->id,
            'handler_role' => 'business_specialist',
            'description' => '当事人张三对清点数量提出异议，认为实际清点数量为 95oz 而非 100oz',
            'created_at' => "$baseTime 16:00:00",
            'updated_at' => "$baseTime 16:00:00",
        ]);

        AllocationAttachment::create([
            'allocation_id' => $allocation->id,
            'node_id' => $appealedNode->id,
            'file_name' => '申诉说明.pdf',
            'file_path' => 'appeals/PM-2025-0004-statement.pdf',
            'file_type' => 'pdf',
            'uploaded_by' => $zhangsan->id,
            'description' => '张三提交的申诉说明文件',
            'created_at' => "$baseTime 16:00:00",
            'updated_at' => "$baseTime 16:00:00",
        ]);
    }
}
