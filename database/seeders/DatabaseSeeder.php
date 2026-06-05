<?php

namespace Database\Seeders;

use App\Models\Disposal;
use App\Models\InspectionResult;
use App\Models\ReinspectionRequest;
use App\Models\Sample;
use App\Models\StatusHistory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $sampler = User::create([
            'name' => '张三',
            'email' => 'sampler@example.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_SAMPLER,
        ]);

        $inspector = User::create([
            'name' => '李四',
            'email' => 'inspector@example.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_INSPECTOR,
        ]);

        $reviewer = User::create([
            'name' => '王五',
            'email' => 'reviewer@example.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_REVIEWER,
        ]);

        $this->createQualifiedSample($sampler, $inspector);
        $this->createPesticideExceededSample($sampler, $inspector);
        $this->createConflictSamples($sampler);
        $this->createReinspectionSample($sampler, $inspector, $reviewer);
    }

    protected function createQualifiedSample($sampler, $inspector)
    {
        $sample = Sample::create([
            'sample_number' => 'AG-2024-001',
            'product_name' => '有机大白菜',
            'origin' => '山东省寿光市蔬菜基地',
            'batch_number' => 'SC-2024-0115',
            'production_date' => '2024-01-15',
            'quantity' => 50.5,
            'unit' => 'kg',
            'sample_source' => '产地直采，农户：王建国',
            'evidence_photos' => json_encode([
                'https://example.com/photos/sample1_1.jpg',
                'https://example.com/photos/sample1_2.jpg',
            ]),
            'sampler_id' => $sampler->id,
            'status' => Sample::STATUS_QUALIFIED,
        ]);

        StatusHistory::create([
            'sample_id' => $sample->id,
            'user_id' => $sampler->id,
            'old_status' => null,
            'new_status' => Sample::STATUS_REGISTERED,
            'note' => '样品登记',
        ]);

        StatusHistory::create([
            'sample_id' => $sample->id,
            'user_id' => $inspector->id,
            'old_status' => Sample::STATUS_REGISTERED,
            'new_status' => Sample::STATUS_TESTING,
            'note' => '开始检测',
        ]);

        InspectionResult::create([
            'sample_id' => $sample->id,
            'inspector_id' => $inspector->id,
            'inspection_date' => '2024-01-16',
            'indicators' => json_encode([
                ['name' => '敌敌畏', 'limit' => 0.05, 'unit' => 'mg/kg', 'value' => 0.01],
                ['name' => '乐果', 'limit' => 0.02, 'unit' => 'mg/kg', 'value' => 0.005],
                ['name' => '毒死蜱', 'limit' => 0.05, 'unit' => 'mg/kg', 'value' => 0.02],
                ['name' => '氯氰菊酯', 'limit' => 0.5, 'unit' => 'mg/kg', 'value' => 0.1],
                ['name' => '溴氰菊酯', 'limit' => 0.2, 'unit' => 'mg/kg', 'value' => 0.05],
                ['name' => '多菌灵', 'limit' => 0.5, 'unit' => 'mg/kg', 'value' => 0.2],
            ]),
            'result' => InspectionResult::RESULT_QUALIFIED,
            'conclusion' => '所有检测指标均符合国家标准限值要求，判定为合格。',
        ]);

        StatusHistory::create([
            'sample_id' => $sample->id,
            'user_id' => $inspector->id,
            'old_status' => Sample::STATUS_TESTING,
            'new_status' => Sample::STATUS_QUALIFIED,
            'note' => '检测结果: 合格',
        ]);
    }

    protected function createPesticideExceededSample($sampler, $inspector)
    {
        $sample = Sample::create([
            'sample_number' => 'AG-2024-002',
            'product_name' => '普通菠菜',
            'origin' => '河南省郑州市中牟县',
            'batch_number' => 'ZZ-2024-0118',
            'production_date' => '2024-01-18',
            'quantity' => 30.0,
            'unit' => 'kg',
            'sample_source' => '本地批发市场，批发商：李记蔬菜行',
            'evidence_photos' => json_encode([
                'https://example.com/photos/sample2_1.jpg',
            ]),
            'sampler_id' => $sampler->id,
            'status' => Sample::STATUS_UNQUALIFIED,
        ]);

        StatusHistory::create([
            'sample_id' => $sample->id,
            'user_id' => $sampler->id,
            'old_status' => null,
            'new_status' => Sample::STATUS_REGISTERED,
            'note' => '样品登记',
        ]);

        InspectionResult::create([
            'sample_id' => $sample->id,
            'inspector_id' => $inspector->id,
            'inspection_date' => '2024-01-19',
            'indicators' => json_encode([
                ['name' => '敌敌畏', 'limit' => 0.05, 'unit' => 'mg/kg', 'value' => 0.02],
                ['name' => '乐果', 'limit' => 0.02, 'unit' => 'mg/kg', 'value' => 0.08],
                ['name' => '毒死蜱', 'limit' => 0.05, 'unit' => 'mg/kg', 'value' => 0.03],
                ['name' => '氯氰菊酯', 'limit' => 0.5, 'unit' => 'mg/kg', 'value' => 0.2],
                ['name' => '溴氰菊酯', 'limit' => 0.2, 'unit' => 'mg/kg', 'value' => 0.08],
                ['name' => '多菌灵', 'limit' => 0.5, 'unit' => 'mg/kg', 'value' => 0.3],
            ]),
            'result' => InspectionResult::RESULT_PESTICIDE_EXCEEDED,
            'conclusion' => '乐果检测值为0.08mg/kg，超过国家标准限值0.02mg/kg，判定为农残超标。',
        ]);

        StatusHistory::create([
            'sample_id' => $sample->id,
            'user_id' => $inspector->id,
            'old_status' => Sample::STATUS_REGISTERED,
            'new_status' => Sample::STATUS_UNQUALIFIED,
            'note' => '检测结果: 农残超标 - 乐果超标',
        ]);
    }

    protected function createConflictSamples($sampler)
    {
        $sample1 = Sample::create([
            'sample_number' => 'AG-2024-003',
            'product_name' => '西红柿',
            'origin' => '河北省石家庄市藁城区',
            'batch_number' => 'SJZ-2024-0120',
            'production_date' => '2024-01-20',
            'quantity' => 25.0,
            'unit' => 'kg',
            'sample_source' => '农户：赵大宝',
            'sampler_id' => $sampler->id,
            'status' => Sample::STATUS_REGISTERED,
            'conflict_note' => '与样品 AG-2024-003 编号冲突',
        ]);

        $sample2 = Sample::create([
            'sample_number' => 'AG-2024-003-2',
            'product_name' => '草莓',
            'origin' => '辽宁省大连市庄河市',
            'batch_number' => 'DL-2024-0120',
            'production_date' => '2024-01-20',
            'quantity' => 15.0,
            'unit' => 'kg',
            'sample_source' => '草莓种植合作社',
            'sampler_id' => $sampler->id,
            'status' => Sample::STATUS_REGISTERED,
            'conflict_sample_id' => $sample1->id,
            'conflict_note' => '与样品 AG-2024-003 编号冲突',
        ]);

        $sample1->update([
            'conflict_sample_id' => $sample2->id,
            'conflict_note' => "与样品 {$sample2->sample_number} 编号冲突",
        ]);

        StatusHistory::create([
            'sample_id' => $sample1->id,
            'user_id' => $sampler->id,
            'old_status' => null,
            'new_status' => Sample::STATUS_REGISTERED,
            'note' => '样品登记 - 存在编号冲突',
        ]);

        StatusHistory::create([
            'sample_id' => $sample2->id,
            'user_id' => $sampler->id,
            'old_status' => null,
            'new_status' => Sample::STATUS_REGISTERED,
            'note' => '样品登记 - 存在编号冲突',
        ]);
    }

    protected function createReinspectionSample($sampler, $inspector, $reviewer)
    {
        $sample = Sample::create([
            'sample_number' => 'AG-2024-004',
            'product_name' => '芹菜',
            'origin' => '江苏省徐州市沛县',
            'batch_number' => 'XZ-2024-0122',
            'production_date' => '2024-01-22',
            'quantity' => 40.0,
            'unit' => 'kg',
            'sample_source' => '蔬菜产业园A区',
            'sampler_id' => $sampler->id,
            'status' => Sample::STATUS_REINSPECTION_APPLIED,
        ]);

        StatusHistory::create([
            'sample_id' => $sample->id,
            'user_id' => $sampler->id,
            'old_status' => null,
            'new_status' => Sample::STATUS_REGISTERED,
            'note' => '样品登记',
        ]);

        InspectionResult::create([
            'sample_id' => $sample->id,
            'inspector_id' => $inspector->id,
            'inspection_date' => '2024-01-23',
            'indicators' => json_encode([
                ['name' => '敌敌畏', 'limit' => 0.05, 'unit' => 'mg/kg', 'value' => 0.03],
                ['name' => '乐果', 'limit' => 0.02, 'unit' => 'mg/kg', 'value' => 0.01],
                ['name' => '毒死蜱', 'limit' => 0.05, 'unit' => 'mg/kg', 'value' => 0.06],
                ['name' => '氯氰菊酯', 'limit' => 0.5, 'unit' => 'mg/kg', 'value' => 0.15],
                ['name' => '溴氰菊酯', 'limit' => 0.2, 'unit' => 'mg/kg', 'value' => 0.04],
                ['name' => '多菌灵', 'limit' => 0.5, 'unit' => 'mg/kg', 'value' => 0.25],
            ]),
            'result' => InspectionResult::RESULT_PESTICIDE_EXCEEDED,
            'conclusion' => '毒死蜱检测值为0.06mg/kg，超过国家标准限值0.05mg/kg，判定为农残超标。',
        ]);

        StatusHistory::create([
            'sample_id' => $sample->id,
            'user_id' => $inspector->id,
            'old_status' => Sample::STATUS_REGISTERED,
            'new_status' => Sample::STATUS_UNQUALIFIED,
            'note' => '检测结果: 农残超标 - 毒死蜱超标',
        ]);

        ReinspectionRequest::create([
            'sample_id' => $sample->id,
            'requester_id' => $sampler->id,
            'reason' => '对检测结果有异议，认为可能存在操作误差，申请复检确认。',
            'status' => ReinspectionRequest::STATUS_PENDING,
        ]);

        StatusHistory::create([
            'sample_id' => $sample->id,
            'user_id' => $sampler->id,
            'old_status' => Sample::STATUS_UNQUALIFIED,
            'new_status' => Sample::STATUS_REINSPECTION_APPLIED,
            'note' => '复检申请: 对检测结果有异议',
        ]);
    }
}
