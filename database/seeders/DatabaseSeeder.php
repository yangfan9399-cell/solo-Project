<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Implant;
use App\Models\Patient;
use App\Models\Surgery;
use App\Models\FollowUp;
use App\Models\AbnormalRecord;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => '张医生',
            'email' => 'zhang@example.com',
            'password' => bcrypt('password'),
            'role' => 2
        ]);

        User::create([
            'name' => '李医生',
            'email' => 'li@example.com',
            'password' => bcrypt('password'),
            'role' => 2
        ]);

        User::create([
            'name' => '王护士',
            'email' => 'wang@example.com',
            'password' => bcrypt('password'),
            'role' => 3
        ]);

        User::create([
            'name' => '刘护士',
            'email' => 'liu@example.com',
            'password' => bcrypt('password'),
            'role' => 3
        ]);

        User::create([
            'name' => '陈医务',
            'email' => 'chen@example.com',
            'password' => bcrypt('password'),
            'role' => 4
        ]);

        $implant1 = Implant::create([
            'batch_number' => 'IMPL-2024-001',
            'brand' => 'Straumann',
            'model' => 'BLX',
            'production_date' => '2024-01-15',
            'expiry_date' => '2029-01-15',
            'quantity' => 50,
            'used_quantity' => 5
        ]);

        $implant2 = Implant::create([
            'batch_number' => 'IMPL-2024-002',
            'brand' => 'Nobel Biocare',
            'model' => 'Active',
            'production_date' => '2024-02-20',
            'expiry_date' => '2029-02-20',
            'quantity' => 30,
            'used_quantity' => 3
        ]);

        $implant3 = Implant::create([
            'batch_number' => 'IMPL-2024-003',
            'brand' => 'Dentsply',
            'model' => 'Astra Tech',
            'production_date' => '2023-11-10',
            'expiry_date' => '2028-11-10',
            'quantity' => 40,
            'used_quantity' => 10,
            'is_recalled' => true,
            'recall_reason' => '发现材料缺陷，存在潜在风险',
            'recall_date' => '2024-05-20'
        ]);

        $patient1 = Patient::create([
            'name' => '张三',
            'id_card' => '110101199001011234',
            'phone' => '13800138001',
            'birth_date' => '1990-01-01',
            'gender' => 1,
            'address' => '北京市朝阳区'
        ]);

        $patient2 = Patient::create([
            'name' => '李四',
            'id_card' => '310101198505055678',
            'phone' => '13900139002',
            'birth_date' => '1985-05-05',
            'gender' => 2,
            'address' => '上海市浦东新区'
        ]);

        $patient3 = Patient::create([
            'name' => '王五',
            'id_card' => '440301199212129012',
            'phone' => '13700137003',
            'birth_date' => '1992-12-12',
            'gender' => 1,
            'address' => '广东省深圳市'
        ]);

        $patient4 = Patient::create([
            'name' => '赵六',
            'id_card' => '330101198808084321',
            'phone' => '13600136004',
            'birth_date' => '1988-08-08',
            'gender' => 2,
            'address' => '浙江省杭州市'
        ]);

        $patient5 = Patient::create([
            'name' => '孙七',
            'id_card' => '320101199503037890',
            'phone' => '13500135005',
            'birth_date' => '1995-03-03',
            'gender' => 1,
            'address' => '江苏省南京市'
        ]);

        $surgery1 = Surgery::create([
            'patient_id' => $patient1->id,
            'implant_id' => $implant1->id,
            'doctor_id' => 1,
            'surgery_date' => '2024-03-10',
            'plan' => '右上颌第一磨牙种植，植入Straumann BLX种植体',
            'notes' => '手术顺利，患者恢复良好'
        ]);

        $surgery2 = Surgery::create([
            'patient_id' => $patient2->id,
            'implant_id' => $implant2->id,
            'doctor_id' => 1,
            'surgery_date' => '2024-03-15',
            'plan' => '左下颌第二前磨牙种植，植入Nobel Active种植体',
            'notes' => '常规手术'
        ]);

        $surgery3 = Surgery::create([
            'patient_id' => $patient3->id,
            'implant_id' => $implant3->id,
            'doctor_id' => 2,
            'surgery_date' => '2024-04-01',
            'plan' => '右上颌第二磨牙种植，植入Dentsply Astra Tech种植体',
            'notes' => '该批次已召回，需密切随访'
        ]);

        $surgery4 = Surgery::create([
            'patient_id' => $patient4->id,
            'implant_id' => $implant1->id,
            'doctor_id' => 2,
            'surgery_date' => '2024-04-10',
            'plan' => '右下颌第一磨牙种植',
            'notes' => ''
        ]);

        $surgery5 = Surgery::create([
            'patient_id' => $patient5->id,
            'implant_id' => $implant2->id,
            'doctor_id' => 1,
            'surgery_date' => '2024-04-15',
            'plan' => '左上颌第一前磨牙种植',
            'notes' => ''
        ]);

        FollowUp::create([
            'surgery_id' => $surgery1->id,
            'nurse_id' => 3,
            'follow_up_date' => '2024-03-11',
            'type' => 1,
            'notes' => '术后1天随访，患者无不适，创口愈合良好',
            'status' => 1
        ]);

        FollowUp::create([
            'surgery_id' => $surgery1->id,
            'nurse_id' => 3,
            'follow_up_date' => '2024-03-17',
            'type' => 2,
            'notes' => '术后7天随访，拆线完成，愈合正常',
            'status' => 1
        ]);

        FollowUp::create([
            'surgery_id' => $surgery2->id,
            'nurse_id' => 4,
            'follow_up_date' => '2024-03-16',
            'type' => 1,
            'notes' => '术后1天随访，轻微肿胀，正常现象',
            'status' => 1
        ]);

        $followUp3 = FollowUp::create([
            'surgery_id' => $surgery3->id,
            'nurse_id' => 3,
            'follow_up_date' => '2024-04-02',
            'type' => 1,
            'notes' => '术后1天随访，患者体温偏高，创口有红肿',
            'status' => 2
        ]);

        AbnormalRecord::create([
            'follow_up_id' => $followUp3->id,
            'type' => 1,
            'description' => '患者术后出现感染症状，体温38.5度，创口红肿疼痛'
        ]);

        $followUp4 = FollowUp::create([
            'surgery_id' => $surgery4->id,
            'nurse_id' => 4,
            'follow_up_date' => '2024-04-11',
            'type' => 1,
            'notes' => '术后1天随访',
            'status' => 3
        ]);

        AbnormalRecord::create([
            'follow_up_id' => $followUp4->id,
            'type' => 2,
            'description' => '术前检查报告缺失，病历不完整'
        ]);

        $followUp5 = FollowUp::create([
            'surgery_id' => $surgery3->id,
            'nurse_id' => 3,
            'follow_up_date' => '2024-05-01',
            'type' => 3,
            'notes' => '术后1个月随访，感染已控制',
            'status' => 1
        ]);

        $abnormalRecord1 = AbnormalRecord::find(1);
        $abnormalRecord1->update([
            'reviewer_id' => 5,
            'review_status' => 2,
            'review_notes' => '已通知患者复诊，建议使用抗生素治疗'
        ]);
    }
}
