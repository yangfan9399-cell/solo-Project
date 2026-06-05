<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Carrier;
use App\Models\WasteCategory;
use App\Models\StorageLocation;
use App\Models\WasteBatch;
use App\Models\TransferRequest;
use App\Models\ManifestForm;
use App\Models\Review;
use App\Models\ProcessHistory;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $warehouseOperator = User::create([
            'name' => '张仓库',
            'email' => 'warehouse@example.com',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_WAREHOUSE_OPERATOR,
            'email_verified_at' => now(),
        ]);

        $environmentalOfficer = User::create([
            'name' => '李环保',
            'email' => 'environmental@example.com',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_ENVIRONMENTAL_OFFICER,
            'email_verified_at' => now(),
        ]);

        $reviewer = User::create([
            'name' => '王复核',
            'email' => 'reviewer@example.com',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_REVIEWER,
            'email_verified_at' => now(),
        ]);

        $validCarrier = Carrier::create([
            'name' => '正规危废运输有限公司',
            'license_number' => 'WF2024001',
            'contact_person' => '陈经理',
            'phone' => '13800138001',
            'qualification_expiry_date' => now()->addYear(),
            'is_active' => true,
        ]);

        $expiredCarrier = Carrier::create([
            'name' => '资质过期运输公司',
            'license_number' => 'WF2023009',
            'contact_person' => '刘主管',
            'phone' => '13800138002',
            'qualification_expiry_date' => now()->subMonth(),
            'is_active' => true,
        ]);

        $category1 = WasteCategory::create([
            'code' => 'HW08',
            'name' => '废矿物油',
            'hazard_code' => 'T, I',
            'max_weight_per_batch' => 500,
            'description' => '废机油、润滑油等',
            'is_active' => true,
        ]);

        $category2 = WasteCategory::create([
            'code' => 'HW09',
            'name' => '废乳化液',
            'hazard_code' => 'T',
            'max_weight_per_batch' => 300,
            'description' => '切削液、乳化液废水等',
            'is_active' => true,
        ]);

        $category3 = WasteCategory::create([
            'code' => 'HW12',
            'name' => '染料、涂料废物',
            'hazard_code' => 'T, I, R',
            'max_weight_per_batch' => 200,
            'description' => '废油漆、废油墨等',
            'is_active' => true,
        ]);

        $location1 = StorageLocation::create([
            'code' => 'A-01',
            'name' => 'A区一号仓库',
            'area' => 'A区',
            'description' => '易燃危废储存区',
            'is_active' => true,
        ]);

        $location2 = StorageLocation::create([
            'code' => 'B-02',
            'name' => 'B区二号仓库',
            'area' => 'B区',
            'description' => '腐蚀性危废储存区',
            'is_active' => true,
        ]);

        $location3 = StorageLocation::create([
            'code' => 'C-03',
            'name' => 'C区三号仓库',
            'area' => 'C区',
            'description' => '毒性危废储存区',
            'is_active' => true,
        ]);

        $normalBatch = WasteBatch::create([
            'batch_number' => 'WB202401001',
            'waste_category_id' => $category1->id,
            'storage_location_id' => $location1->id,
            'weight' => 200,
            'description' => '生产设备更换的废机油',
            'production_date' => now()->subDays(5),
            'status' => 'stored',
            'created_by' => $warehouseOperator->id,
        ]);

        ProcessHistory::create([
            'processable_type' => WasteBatch::class,
            'processable_id' => $normalBatch->id,
            'action' => '暂存登记',
            'from_status' => null,
            'to_status' => 'stored',
            'remark' => '危废暂存登记完成',
            'performed_by' => $warehouseOperator->id,
        ]);

        $normalRequest = TransferRequest::create([
            'request_number' => 'TR202401001',
            'waste_batch_id' => $normalBatch->id,
            'carrier_id' => $validCarrier->id,
            'planned_transfer_date' => now()->addDays(3),
            'destination' => '市危废处理中心',
            'receiver_unit' => '市环保处理有限公司',
            'status' => 'pending',
            'is_weight_over_limit' => false,
            'created_by' => $warehouseOperator->id,
        ]);

        $normalBatch->update(['status' => 'requested']);

        ProcessHistory::create([
            'processable_type' => TransferRequest::class,
            'processable_id' => $normalRequest->id,
            'action' => '转运申请',
            'from_status' => null,
            'to_status' => 'pending',
            'remark' => '正常转运申请',
            'performed_by' => $warehouseOperator->id,
        ]);

        $overweightBatch = WasteBatch::create([
            'batch_number' => 'WB202401002',
            'waste_category_id' => $category2->id,
            'storage_location_id' => $location2->id,
            'weight' => 450,
            'description' => '大量废切削液',
            'production_date' => now()->subDays(3),
            'status' => 'stored',
            'created_by' => $warehouseOperator->id,
        ]);

        ProcessHistory::create([
            'processable_type' => WasteBatch::class,
            'processable_id' => $overweightBatch->id,
            'action' => '暂存登记',
            'from_status' => null,
            'to_status' => 'stored',
            'remark' => '危废暂存登记完成',
            'performed_by' => $warehouseOperator->id,
        ]);

        $overweightRequest = TransferRequest::create([
            'request_number' => 'TR202401002',
            'waste_batch_id' => $overweightBatch->id,
            'carrier_id' => $validCarrier->id,
            'planned_transfer_date' => now()->addDays(5),
            'destination' => '省危废处理基地',
            'receiver_unit' => '省固废处理中心',
            'status' => 'pending',
            'is_weight_over_limit' => true,
            'weight_remark' => '重量450kg超过类别限制300kg',
            'created_by' => $warehouseOperator->id,
        ]);

        $overweightBatch->update(['status' => 'requested']);

        ProcessHistory::create([
            'processable_type' => TransferRequest::class,
            'processable_id' => $overweightRequest->id,
            'action' => '转运申请',
            'from_status' => null,
            'to_status' => 'pending',
            'remark' => '重量超限提醒',
            'performed_by' => $warehouseOperator->id,
        ]);

        $noManifestBatch = WasteBatch::create([
            'batch_number' => 'WB202401003',
            'waste_category_id' => $category3->id,
            'storage_location_id' => $location3->id,
            'weight' => 150,
            'description' => '生产线废油漆渣',
            'production_date' => now()->subDays(7),
            'status' => 'requested',
            'created_by' => $warehouseOperator->id,
        ]);

        ProcessHistory::create([
            'processable_type' => WasteBatch::class,
            'processable_id' => $noManifestBatch->id,
            'action' => '暂存登记',
            'from_status' => null,
            'to_status' => 'stored',
            'remark' => '危废暂存登记完成',
            'performed_by' => $warehouseOperator->id,
        ]);

        $noManifestRequest = TransferRequest::create([
            'request_number' => 'TR202401003',
            'waste_batch_id' => $noManifestBatch->id,
            'carrier_id' => $validCarrier->id,
            'planned_transfer_date' => now()->addDays(2),
            'destination' => '市危废处理中心',
            'receiver_unit' => '市环保处理有限公司',
            'status' => 'pending',
            'is_weight_over_limit' => false,
            'created_by' => $warehouseOperator->id,
        ]);

        ProcessHistory::create([
            'processable_type' => TransferRequest::class,
            'processable_id' => $noManifestRequest->id,
            'action' => '转运申请',
            'from_status' => null,
            'to_status' => 'pending',
            'remark' => '转运申请提交，待上传联单',
            'performed_by' => $warehouseOperator->id,
        ]);

        $expiredBatch = WasteBatch::create([
            'batch_number' => 'WB202401004',
            'waste_category_id' => $category1->id,
            'storage_location_id' => $location1->id,
            'weight' => 300,
            'description' => '废液压油',
            'production_date' => now()->subDays(4),
            'status' => 'manifest_verified',
            'created_by' => $warehouseOperator->id,
        ]);

        ProcessHistory::create([
            'processable_type' => WasteBatch::class,
            'processable_id' => $expiredBatch->id,
            'action' => '暂存登记',
            'from_status' => null,
            'to_status' => 'stored',
            'remark' => '危废暂存登记完成',
            'performed_by' => $warehouseOperator->id,
        ]);

        $expiredRequest = TransferRequest::create([
            'request_number' => 'TR202401004',
            'waste_batch_id' => $expiredBatch->id,
            'carrier_id' => $expiredCarrier->id,
            'planned_transfer_date' => now()->addDay(),
            'destination' => '市危废处理中心',
            'receiver_unit' => '市环保处理有限公司',
            'status' => 'manifest_verified',
            'is_weight_over_limit' => false,
            'created_by' => $warehouseOperator->id,
        ]);

        $expiredBatch->update(['status' => 'requested']);

        ProcessHistory::create([
            'processable_type' => TransferRequest::class,
            'processable_id' => $expiredRequest->id,
            'action' => '转运申请',
            'from_status' => null,
            'to_status' => 'pending',
            'remark' => '转运申请提交',
            'performed_by' => $warehouseOperator->id,
        ]);

        $expiredManifest = ManifestForm::create([
            'manifest_number' => 'MF202401001',
            'transfer_request_id' => $expiredRequest->id,
            'issue_date' => now()->subDay(),
            'manifest_document' => '联单扫描件_资质过期案例.pdf',
            'status' => 'verified',
            'verification_remark' => '联单信息完整',
            'verified_by' => $environmentalOfficer->id,
            'verified_at' => now(),
        ]);

        $expiredRequest->update(['status' => 'manifest_verified']);
        $expiredBatch->update(['status' => 'manifest_verified']);

        ProcessHistory::create([
            'processable_type' => TransferRequest::class,
            'processable_id' => $expiredRequest->id,
            'action' => '联单确认',
            'from_status' => 'pending',
            'to_status' => 'manifest_verified',
            'remark' => '联单确认通过，注意承运商资质即将复核',
            'performed_by' => $environmentalOfficer->id,
        ]);

        $completedBatch = WasteBatch::create([
            'batch_number' => 'WB202401005',
            'waste_category_id' => $category1->id,
            'storage_location_id' => $location1->id,
            'weight' => 250,
            'description' => '齿轮箱废机油',
            'production_date' => now()->subDays(10),
            'status' => 'approved',
            'created_by' => $warehouseOperator->id,
        ]);

        ProcessHistory::create([
            'processable_type' => WasteBatch::class,
            'processable_id' => $completedBatch->id,
            'action' => '暂存登记',
            'from_status' => null,
            'to_status' => 'stored',
            'remark' => '危废暂存登记完成',
            'performed_by' => $warehouseOperator->id,
            'created_at' => now()->subDays(10),
            'updated_at' => now()->subDays(10),
        ]);

        $completedRequest = TransferRequest::create([
            'request_number' => 'TR202401005',
            'waste_batch_id' => $completedBatch->id,
            'carrier_id' => $validCarrier->id,
            'planned_transfer_date' => now()->subDays(5),
            'destination' => '市危废处理中心',
            'receiver_unit' => '市环保处理有限公司',
            'status' => 'approved',
            'is_weight_over_limit' => false,
            'created_by' => $warehouseOperator->id,
            'created_at' => now()->subDays(8),
            'updated_at' => now()->subDays(5),
        ]);

        $completedBatch->update(['status' => 'requested', 'updated_at' => now()->subDays(8)]);

        ProcessHistory::create([
            'processable_type' => TransferRequest::class,
            'processable_id' => $completedRequest->id,
            'action' => '转运申请',
            'from_status' => null,
            'to_status' => 'pending',
            'remark' => '正常转运申请',
            'performed_by' => $warehouseOperator->id,
            'created_at' => now()->subDays(8),
            'updated_at' => now()->subDays(8),
        ]);

        $completedManifest = ManifestForm::create([
            'manifest_number' => 'MF202401002',
            'transfer_request_id' => $completedRequest->id,
            'issue_date' => now()->subDays(7),
            'manifest_document' => '联单扫描件_正常流程.pdf',
            'status' => 'verified',
            'verification_remark' => '联单信息完整无误',
            'verified_by' => $environmentalOfficer->id,
            'verified_at' => now()->subDays(6),
            'created_at' => now()->subDays(7),
            'updated_at' => now()->subDays(6),
        ]);

        $completedRequest->update(['status' => 'manifest_verified', 'updated_at' => now()->subDays(6)]);
        $completedBatch->update(['status' => 'manifest_verified', 'updated_at' => now()->subDays(6)]);

        ProcessHistory::create([
            'processable_type' => TransferRequest::class,
            'processable_id' => $completedRequest->id,
            'action' => '联单确认',
            'from_status' => 'pending',
            'to_status' => 'manifest_verified',
            'remark' => '联单确认通过',
            'performed_by' => $environmentalOfficer->id,
            'created_at' => now()->subDays(6),
            'updated_at' => now()->subDays(6),
        ]);

        Review::create([
            'transfer_request_id' => $completedRequest->id,
            'result' => 'approved',
            'review_remark' => '审核通过，准予转运',
            'reviewed_by' => $reviewer->id,
            'created_at' => now()->subDays(5),
            'updated_at' => now()->subDays(5),
        ]);

        $completedRequest->update(['status' => 'approved', 'updated_at' => now()->subDays(5)]);
        $completedBatch->update(['status' => 'approved', 'updated_at' => now()->subDays(5)]);

        ProcessHistory::create([
            'processable_type' => TransferRequest::class,
            'processable_id' => $completedRequest->id,
            'action' => '复核决定',
            'from_status' => 'manifest_verified',
            'to_status' => 'approved',
            'remark' => '复核结果: 放行',
            'performed_by' => $reviewer->id,
            'created_at' => now()->subDays(5),
            'updated_at' => now()->subDays(5),
        ]);
    }
}
