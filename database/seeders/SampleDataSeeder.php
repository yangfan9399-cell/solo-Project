<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\ReviewRecord;
use App\Models\ReviewNode;
use App\Models\DiscrepancyRecord;
use App\Models\AppealRecord;
use App\Services\ReviewService;
use Illuminate\Database\Seeder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class SampleDataSeeder extends Seeder
{
    protected $reviewService;

    public function __construct(ReviewService $reviewService)
    {
        $this->reviewService = $reviewService;
    }

    public function run(): void
    {
        $businessUser = User::where('email', 'business@example.com')->first();
        $approvalUser = User::where('email', 'approval@example.com')->first();

        if (ReviewRecord::count() === 0) {
            $this->createNormalArchivedSample($businessUser, $approvalUser);
            $this->createNumberConflictSample($businessUser, $approvalUser);
            $this->createAmountDifferenceSample($businessUser, $approvalUser);
            $this->createAppealSample($businessUser, $approvalUser);
            
            $this->createAdditionalSamples($businessUser, $approvalUser);
        }
    }

    protected function createNormalArchivedSample($businessUser, $approvalUser)
    {
        DB::transaction(function () use ($businessUser, $approvalUser) {
            $record = ReviewRecord::create([
                'record_no' => 'SRA-20260601-0001',
                'title' => '2026年度国家奖学金评审-张明',
                'source' => '计算机学院',
                'source_dept' => '计算机学院学工办',
                'student_name' => '张明',
                'student_id' => '20230101001',
                'college' => '计算机学院',
                'major' => '软件工程',
                'grade' => '2023级',
                'scholarship_type' => '国家奖学金',
                'scholarship_level' => '国家级',
                'apply_amount' => 8000.00,
                'approved_amount' => 8000.00,
                'apply_count' => 1,
                'approved_count' => 1,
                'status' => ReviewRecord::STATUS_ARCHIVED,
                'anomaly_type' => null,
                'current_owner_id' => $approvalUser->id,
                'original_data' => [
                    'apply_amount' => 8000.00,
                    'apply_count' => 1,
                    'student_id' => '20230101001',
                    'scholarship_type' => '国家奖学金',
                ],
                'processed_data' => [
                    'approved_amount' => 8000.00,
                    'approved_count' => 1,
                ],
                'diff_fields' => [],
                'basis' => '根据《国家奖学金评审办法》，学生综合成绩排名专业第一，符合国家奖学金评审条件。GPA 3.92/4.0，获得省级竞赛一等奖2项，发表学术论文1篇。',
                'conclusion' => '经审核，该生符合国家奖学金评审条件，同意授予国家奖学金，奖励金额8000元。',
                'is_archived' => true,
                'received_at' => Carbon::now()->subDays(15),
                'processed_at' => Carbon::now()->subDays(12),
                'reviewed_at' => Carbon::now()->subDays(8),
                'archived_at' => Carbon::now()->subDays(5),
                'created_by' => $businessUser->id,
            ]);

            $this->createNodesForNormal($record, $businessUser, $approvalUser);
        });
    }

    protected function createNodesForNormal($record, $businessUser, $approvalUser)
    {
        ReviewNode::create([
            'review_record_id' => $record->id,
            'node_type' => ReviewNode::NODE_TYPE_RECEIVE,
            'node_name' => '受理',
            'status' => ReviewNode::STATUS_COMPLETED,
            'sequence' => 1,
            'operator_id' => $businessUser->id,
            'operated_at' => $record->received_at,
            'business_note' => '材料齐全，符合受理条件。提交材料包括：申请表、成绩单、获奖证书、科研成果证明。',
            'snapshot' => $record->toArray(),
        ]);

        ReviewNode::create([
            'review_record_id' => $record->id,
            'node_type' => ReviewNode::NODE_TYPE_PROCESS,
            'node_name' => '业务处理',
            'status' => ReviewNode::STATUS_COMPLETED,
            'sequence' => 2,
            'operator_id' => $businessUser->id,
            'operated_at' => $record->processed_at,
            'business_note' => '经核查，学生成绩排名专业第1/120，综合素质测评排名第1。',
            'site_description' => '现场核实了学生成绩单原件、获奖证书原件，均真实有效。',
            'evidence_note' => '上传成绩单扫描件、获奖证书扫描件、论文首页扫描件共5份证据材料。',
            'changes' => [],
            'snapshot' => $record->toArray(),
        ]);

        ReviewNode::create([
            'review_record_id' => $record->id,
            'node_type' => ReviewNode::NODE_TYPE_REVIEW,
            'node_name' => '复核审批',
            'status' => ReviewNode::STATUS_COMPLETED,
            'sequence' => 3,
            'operator_id' => $approvalUser->id,
            'operated_at' => $record->reviewed_at,
            'review_opinion' => '同意业务处理意见。该生表现优异，符合国家奖学金评审标准。',
            'action' => 'confirm',
            'from_status' => ReviewRecord::STATUS_REVIEWING,
            'to_status' => ReviewRecord::STATUS_ARCHIVED,
            'snapshot' => $record->toArray(),
        ]);

        ReviewNode::create([
            'review_record_id' => $record->id,
            'node_type' => ReviewNode::NODE_TYPE_ARCHIVE,
            'node_name' => '归档',
            'status' => ReviewNode::STATUS_COMPLETED,
            'sequence' => 4,
            'operator_id' => $approvalUser->id,
            'operated_at' => $record->archived_at,
            'review_opinion' => '材料完整，流程合规，同意归档。',
            'snapshot' => $record->toArray(),
        ]);
    }

    protected function createNumberConflictSample($businessUser, $approvalUser)
    {
        DB::transaction(function () use ($businessUser, $approvalUser) {
            $record = ReviewRecord::create([
                'record_no' => 'SRA-20260602-0002',
                'title' => '2026年度励志奖学金评审-李华',
                'source' => '经济管理学院',
                'source_dept' => '经济管理学院学工办',
                'student_name' => '李华',
                'student_id' => '20230202002',
                'college' => '经济管理学院',
                'major' => '会计学',
                'grade' => '2023级',
                'scholarship_type' => '国家励志奖学金',
                'scholarship_level' => '国家级',
                'apply_amount' => 5000.00,
                'approved_amount' => 5000.00,
                'apply_count' => 1,
                'approved_count' => 1,
                'status' => ReviewRecord::STATUS_PROCESSING,
                'anomaly_type' => ReviewRecord::ANOMALY_NO_CONFLICT,
                'block_reason' => '学号20230202002与系统中已有记录的学号重复。系统中已有记录为王芳，20230202002，工商管理专业。',
                'remedy_path' => '1. 联系经济管理学院核实学生正确学号；2. 要求学院提交学生证扫描件进行核对；3. 确认正确后更新学生信息。',
                'current_owner_id' => $businessUser->id,
                'original_data' => [
                    'apply_amount' => 5000.00,
                    'apply_count' => 1,
                    'student_id' => '20230202002',
                    'scholarship_type' => '国家励志奖学金',
                ],
                'processed_data' => [
                    'approved_amount' => 5000.00,
                    'approved_count' => 1,
                ],
                'diff_fields' => [],
                'basis' => '根据《学生学籍管理规定》，每位学生应有唯一的学号标识。',
                'conclusion' => null,
                'is_archived' => false,
                'received_at' => Carbon::now()->subDays(10),
                'processed_at' => null,
                'reviewed_at' => null,
                'archived_at' => null,
                'created_by' => $businessUser->id,
            ]);

            $this->createNodesForConflict($record, $businessUser, $approvalUser);

            DiscrepancyRecord::create([
                'review_record_id' => $record->id,
                'discrepancy_type' => DiscrepancyRecord::TYPE_NO_CONFLICT,
                'field_name' => 'student_id',
                'expected_value' => '唯一学号',
                'actual_value' => '20230202002（重复）',
                'description' => '系统中已存在相同学号的学生记录：王芳，工商管理专业，2023级。当前申请学生为李华，会计学专业，2023级。',
                'block_reason' => '学号重复将导致奖学金发放错误，可能造成资金损失和管理混乱。',
                'remedy_path' => '1. 联系经济管理学院教学办公室，核实两位学生的正确学号；2. 要求提交学生证扫描件作为佐证；3. 待学院反馈后更新学生信息。',
                'status' => DiscrepancyRecord::STATUS_PENDING,
            ]);
        });
    }

    protected function createNodesForConflict($record, $businessUser, $approvalUser)
    {
        ReviewNode::create([
            'review_record_id' => $record->id,
            'node_type' => ReviewNode::NODE_TYPE_RECEIVE,
            'node_name' => '受理',
            'status' => ReviewNode::STATUS_COMPLETED,
            'sequence' => 1,
            'operator_id' => $businessUser->id,
            'operated_at' => $record->received_at,
            'business_note' => '材料接收时发现学号与系统已有记录重复，已标记异常待处理。',
            'snapshot' => $record->toArray(),
        ]);

        ReviewNode::create([
            'review_record_id' => $record->id,
            'node_type' => ReviewNode::NODE_TYPE_PROCESS,
            'node_name' => '业务处理',
            'status' => ReviewNode::STATUS_PENDING,
            'sequence' => 2,
            'operator_id' => null,
            'operated_at' => null,
            'business_note' => '等待学院核实正确学号并提交证明材料。',
            'snapshot' => $record->toArray(),
        ]);
    }

    protected function createAmountDifferenceSample($businessUser, $approvalUser)
    {
        DB::transaction(function () use ($businessUser, $approvalUser) {
            $record = ReviewRecord::create([
                'record_no' => 'SRA-20260603-0003',
                'title' => '2026年度校级一等奖学金-王芳',
                'source' => '外国语学院',
                'source_dept' => '外国语学院学工办',
                'student_name' => '王芳',
                'student_id' => '20230303003',
                'college' => '外国语学院',
                'major' => '英语翻译',
                'grade' => '2023级',
                'scholarship_type' => '校级一等奖学金',
                'scholarship_level' => '校级',
                'apply_amount' => 3000.00,
                'approved_amount' => 2000.00,
                'apply_count' => 1,
                'approved_count' => 1,
                'status' => ReviewRecord::STATUS_REVIEWING,
                'anomaly_type' => ReviewRecord::ANOMALY_AMOUNT_DIFF,
                'block_reason' => '申请金额3000元与校级一等奖学金标准2000元不符，存在1000元差额。',
                'remedy_path' => '1. 核对《校级奖学金管理办法》一等奖学金金额标准；2. 如学生符合特殊条件需附相关证明；3. 按实际标准调整或补充说明。',
                'current_owner_id' => $approvalUser->id,
                'original_data' => [
                    'apply_amount' => 3000.00,
                    'apply_count' => 1,
                    'student_id' => '20230303003',
                    'scholarship_type' => '校级一等奖学金',
                ],
                'processed_data' => [
                    'approved_amount' => 2000.00,
                    'approved_count' => 1,
                ],
                'diff_fields' => [
                    [
                        'field' => 'apply_amount',
                        'field_label' => '申请金额',
                        'old_value' => 3000.00,
                        'new_value' => 2000.00,
                        'changed_at' => Carbon::now()->subDays(3)->toDateTimeString(),
                    ]
                ],
                'basis' => '根据《2026年度校级奖学金评审实施细则》，校级一等奖学金奖励标准为2000元/人。学生综合测评排名专业第2，符合一等奖学金条件，但申请金额超出标准。',
                'conclusion' => null,
                'is_archived' => false,
                'received_at' => Carbon::now()->subDays(12),
                'processed_at' => Carbon::now()->subDays(6),
                'reviewed_at' => null,
                'archived_at' => null,
                'created_by' => $businessUser->id,
            ]);

            $this->createNodesForAmountDiff($record, $businessUser, $approvalUser);

            DiscrepancyRecord::create([
                'review_record_id' => $record->id,
                'discrepancy_type' => DiscrepancyRecord::TYPE_AMOUNT_DIFF,
                'field_name' => 'apply_amount',
                'expected_value' => '2000.00',
                'actual_value' => '3000.00',
                'description' => '学生申请金额3000元，而校级一等奖学金标准金额为2000元，差额1000元。',
                'block_reason' => '奖学金发放必须严格按照标准执行，超出部分无预算安排，可能导致财务违规。',
                'remedy_path' => '1. 告知外国语学院奖学金标准，建议调整申请金额；2. 如学生获得特殊荣誉可申请专项奖励，需另行提交申请；3. 确认调整后进入复核程序。',
                'status' => DiscrepancyRecord::STATUS_PENDING,
            ]);
        });
    }

    protected function createNodesForAmountDiff($record, $businessUser, $approvalUser)
    {
        ReviewNode::create([
            'review_record_id' => $record->id,
            'node_type' => ReviewNode::NODE_TYPE_RECEIVE,
            'node_name' => '受理',
            'status' => ReviewNode::STATUS_COMPLETED,
            'sequence' => 1,
            'operator_id' => $businessUser->id,
            'operated_at' => $record->received_at,
            'business_note' => '材料齐全，但发现申请金额与标准不符，标记异常。',
            'snapshot' => $record->toArray(),
        ]);

        ReviewNode::create([
            'review_record_id' => $record->id,
            'node_type' => ReviewNode::NODE_TYPE_PROCESS,
            'node_name' => '业务处理',
            'status' => ReviewNode::STATUS_COMPLETED,
            'sequence' => 2,
            'operator_id' => $businessUser->id,
            'operated_at' => $record->processed_at,
            'business_note' => '经核对《校级奖学金管理办法》，一等奖学金确实为2000元。已联系学院说明情况，建议调整。',
            'site_description' => '电话联系外国语学院辅导员刘老师，告知金额差异问题，对方表示将通知学生。',
            'evidence_note' => '上传《校级奖学金管理办法》文件扫描件，明确标注一等奖学金金额为2000元。',
            'changes' => [
                [
                    'field' => 'approved_amount',
                    'field_label' => '核定金额',
                    'old_value' => 3000.00,
                    'new_value' => 2000.00,
                    'changed_at' => $record->processed_at->toDateTimeString(),
                ]
            ],
            'snapshot' => $record->toArray(),
        ]);

        ReviewNode::create([
            'review_record_id' => $record->id,
            'node_type' => ReviewNode::NODE_TYPE_REVIEW,
            'node_name' => '复核审批',
            'status' => ReviewNode::STATUS_PENDING,
            'sequence' => 3,
            'operator_id' => null,
            'operated_at' => null,
            'business_note' => '等待审批负责人确认金额调整是否合理。',
            'snapshot' => $record->toArray(),
        ]);
    }

    protected function createAppealSample($businessUser, $approvalUser)
    {
        DB::transaction(function () use ($businessUser, $approvalUser) {
            $record = ReviewRecord::create([
                'record_no' => 'SRA-20260604-0004',
                'title' => '2026年度社会奖学金评审-陈伟',
                'source' => '机械工程学院',
                'source_dept' => '机械工程学院学工办',
                'student_name' => '陈伟',
                'student_id' => '20230404004',
                'college' => '机械工程学院',
                'major' => '机械设计制造',
                'grade' => '2023级',
                'scholarship_type' => 'XX企业奖学金',
                'scholarship_level' => '社会捐助',
                'apply_amount' => 10000.00,
                'approved_amount' => 5000.00,
                'apply_count' => 1,
                'approved_count' => 1,
                'status' => ReviewRecord::STATUS_APPEALING,
                'anomaly_type' => ReviewRecord::ANOMALY_APPEAL,
                'block_reason' => '当事人陈伟对评审结果提出申诉，认为综合测评计分有误，影响奖学金等级评定。',
                'remedy_path' => '1. 成立申诉处理小组，重新核算学生综合测评成绩；2. 调取原始评分材料，核实申诉内容；3. 与奖学金捐赠方沟通，说明情况并协商处理方案。',
                'current_owner_id' => $approvalUser->id,
                'original_data' => [
                    'apply_amount' => 10000.00,
                    'apply_count' => 1,
                    'student_id' => '20230404004',
                    'scholarship_type' => 'XX企业奖学金',
                ],
                'processed_data' => [
                    'approved_amount' => 5000.00,
                    'approved_count' => 1,
                ],
                'diff_fields' => [
                    [
                        'field' => 'apply_amount',
                        'field_label' => '申请金额',
                        'old_value' => 10000.00,
                        'new_value' => 5000.00,
                        'changed_at' => Carbon::now()->subDays(8)->toDateTimeString(),
                    ]
                ],
                'basis' => '根据《XX企业奖学金捐赠协议》，一等奖10000元（1名），二等奖5000元（3名）。陈伟综合测评排名第2，初评为二等奖。',
                'conclusion' => null,
                'is_archived' => false,
                'received_at' => Carbon::now()->subDays(20),
                'processed_at' => Carbon::now()->subDays(15),
                'reviewed_at' => Carbon::now()->subDays(10),
                'archived_at' => null,
                'created_by' => $businessUser->id,
            ]);

            $this->createNodesForAppeal($record, $businessUser, $approvalUser);

            AppealRecord::create([
                'review_record_id' => $record->id,
                'appeal_no' => 'APA-20260610-0001',
                'appealer_name' => '陈伟',
                'appealer_contact' => '13900139004',
                'appealer_type' => 'student',
                'appeal_reason' => '综合测评计分错误',
                'appeal_content' => '申诉人认为综合测评中科研创新加分计算有误。本人作为第一作者发表的EI会议论文应加15分，但实际只加了10分。如加上缺失的5分，本人排名应从第2升至第1，应获得一等奖学金10000元。',
                'appeal_evidence' => [
                    '论文录用通知扫描件',
                    'EI检索证明',
                    '综合测评加分细则',
                ],
                'appealed_at' => Carbon::now()->subDays(7),
                'handling_opinion' => null,
                'final_result' => null,
                'status' => AppealRecord::STATUS_PROCESSING,
                'handled_by' => $approvalUser->id,
                'handled_at' => null,
                'is_verified' => false,
            ]);

            DiscrepancyRecord::create([
                'review_record_id' => $record->id,
                'discrepancy_type' => DiscrepancyRecord::TYPE_DATA_MISMATCH,
                'field_name' => '综合测评加分',
                'expected_value' => '15分',
                'actual_value' => '10分',
                'description' => '学生申诉EI会议论文加分少计5分，影响最终排名。',
                'block_reason' => '申诉涉及评审公正性，必须重新核查后才能确定最终结果。',
                'remedy_path' => '1. 调取综合测评加分细则，核实EI会议论文的加分标准；2. 核实学生论文发表情况的真实性；3. 重新计算学生综合测评成绩，确定最终排名；4. 将处理结果反馈学生。',
                'status' => DiscrepancyRecord::STATUS_PENDING,
            ]);
        });
    }

    protected function createNodesForAppeal($record, $businessUser, $approvalUser)
    {
        ReviewNode::create([
            'review_record_id' => $record->id,
            'node_type' => ReviewNode::NODE_TYPE_RECEIVE,
            'node_name' => '受理',
            'status' => ReviewNode::STATUS_COMPLETED,
            'sequence' => 1,
            'operator_id' => $businessUser->id,
            'operated_at' => $record->received_at,
            'business_note' => '材料齐全，受理XX企业奖学金申请。',
            'snapshot' => $record->toArray(),
        ]);

        ReviewNode::create([
            'review_record_id' => $record->id,
            'node_type' => ReviewNode::NODE_TYPE_PROCESS,
            'node_name' => '业务处理',
            'status' => ReviewNode::STATUS_COMPLETED,
            'sequence' => 2,
            'operator_id' => $businessUser->id,
            'operated_at' => $record->processed_at,
            'business_note' => '根据综合测评排名，陈伟排名第2，初评为二等奖5000元。',
            'site_description' => '核实学生成绩单、科研成果证明，材料真实有效。',
            'evidence_note' => '上传综合测评排名表、成绩单、科研成果证明等材料。',
            'changes' => [
                [
                    'field' => 'approved_amount',
                    'field_label' => '核定金额',
                    'old_value' => 10000.00,
                    'new_value' => 5000.00,
                    'changed_at' => $record->processed_at->toDateTimeString(),
                ]
            ],
            'snapshot' => $record->toArray(),
        ]);

        ReviewNode::create([
            'review_record_id' => $record->id,
            'node_type' => ReviewNode::NODE_TYPE_REVIEW,
            'node_name' => '复核审批',
            'status' => ReviewNode::STATUS_COMPLETED,
            'sequence' => 3,
            'operator_id' => $approvalUser->id,
            'operated_at' => $record->reviewed_at,
            'review_opinion' => '同意业务处理意见，按综合测评排名评定。',
            'action' => 'confirm',
            'from_status' => ReviewRecord::STATUS_REVIEWING,
            'to_status' => ReviewRecord::STATUS_ARCHIVED,
            'snapshot' => $record->toArray(),
        ]);

        ReviewNode::create([
            'review_record_id' => $record->id,
            'node_type' => ReviewNode::NODE_TYPE_APPEAL,
            'node_name' => '申诉处理',
            'status' => ReviewNode::STATUS_PENDING,
            'sequence' => 4,
            'operator_id' => null,
            'operated_at' => null,
            'business_note' => '收到学生申诉，申请重新核算综合测评成绩。申诉材料包括论文录用通知、EI检索证明等。',
            'snapshot' => $record->toArray(),
        ]);
    }

    protected function createAdditionalSamples($businessUser, $approvalUser)
    {
        $colleges = ['计算机学院', '经济管理学院', '外国语学院', '机械工程学院', '材料科学学院', '电子信息学院'];
        $majors = ['软件工程', '计算机科学', '会计学', '金融学', '英语', '日语', '机械设计', '材料工程', '电子工程', '通信工程'];
        $scholarships = ['国家奖学金', '国家励志奖学金', '校级一等奖学金', '校级二等奖学金', '校级三等奖学金', 'XX企业奖学金', 'YY校友会奖学金'];
        $names = ['赵阳', '钱雨', '孙磊', '周婷', '吴昊', '郑雪', '王强', '冯琳', '陈杰', '褚瑶', '卫明', '蒋丽', '沈鹏', '韩梅', '杨帆'];

        for ($i = 0; $i < 15; $i++) {
            $college = $colleges[array_rand($colleges)];
            $major = $majors[array_rand($majors)];
            $scholarship = $scholarships[array_rand($scholarships)];
            $name = $names[$i];
            $studentId = '2023' . str_pad($i + 10, 6, '0', STR_PAD_LEFT);
            $amounts = [1000, 2000, 3000, 5000, 8000, 10000];
            $amount = $amounts[array_rand($amounts)];
            $statuses = [
                ReviewRecord::STATUS_PENDING,
                ReviewRecord::STATUS_PROCESSING,
                ReviewRecord::STATUS_REVIEWING,
                ReviewRecord::STATUS_ARCHIVED,
                ReviewRecord::STATUS_RETURNED,
            ];
            $status = $statuses[array_rand($statuses)];
            $daysAgo = rand(3, 30);

            DB::transaction(function () use (
                $businessUser, $approvalUser, $college, $major, $scholarship,
                $name, $studentId, $amount, $status, $daysAgo, $i
            ) {
                $recordNo = 'SRA-202606' . str_pad($i + 10, 2, '0', STR_PAD_LEFT) . '-' . str_pad($i + 10, 4, '0', STR_PAD_LEFT);
                
                $record = ReviewRecord::create([
                    'record_no' => $recordNo,
                    'title' => "2026年度{$scholarship}评审-{$name}",
                    'source' => $college,
                    'source_dept' => "{$college}学工办",
                    'student_name' => $name,
                    'student_id' => $studentId,
                    'college' => $college,
                    'major' => $major,
                    'grade' => '2023级',
                    'scholarship_type' => $scholarship,
                    'scholarship_level' => $this->getScholarshipLevel($scholarship),
                    'apply_amount' => $amount,
                    'approved_amount' => $status === ReviewRecord::STATUS_ARCHIVED ? $amount : null,
                    'apply_count' => 1,
                    'approved_count' => $status === ReviewRecord::STATUS_ARCHIVED ? 1 : null,
                    'status' => $status,
                    'anomaly_type' => null,
                    'current_owner_id' => $status === ReviewRecord::STATUS_REVIEWING ? $approvalUser->id : $businessUser->id,
                    'original_data' => [
                        'apply_amount' => $amount,
                        'apply_count' => 1,
                        'student_id' => $studentId,
                        'scholarship_type' => $scholarship,
                    ],
                    'processed_data' => $status !== ReviewRecord::STATUS_PENDING ? [
                        'approved_amount' => $amount,
                        'approved_count' => 1,
                    ] : null,
                    'diff_fields' => [],
                    'basis' => "学生综合成绩优良，符合{$scholarship}申请条件。",
                    'conclusion' => $status === ReviewRecord::STATUS_ARCHIVED ? "经审核，同意授予{$scholarship}，奖励金额{$amount}元。" : null,
                    'is_archived' => $status === ReviewRecord::STATUS_ARCHIVED,
                    'received_at' => Carbon::now()->subDays($daysAgo + 5),
                    'processed_at' => $status !== ReviewRecord::STATUS_PENDING ? Carbon::now()->subDays($daysAgo + 3) : null,
                    'reviewed_at' => in_array($status, [ReviewRecord::STATUS_REVIEWING, ReviewRecord::STATUS_ARCHIVED, ReviewRecord::STATUS_RETURNED]) ? Carbon::now()->subDays($daysAgo + 1) : null,
                    'archived_at' => $status === ReviewRecord::STATUS_ARCHIVED ? Carbon::now()->subDays($daysAgo) : null,
                    'created_by' => $businessUser->id,
                ]);

                $this->createSampleNodes($record, $businessUser, $approvalUser, $status);
            });
        }
    }

    protected function getScholarshipLevel($type)
    {
        if (str_contains($type, '国家')) return '国家级';
        if (str_contains($type, '校级')) return '校级';
        return '社会捐助';
    }

    protected function createSampleNodes($record, $businessUser, $approvalUser, $status)
    {
        $sequence = 1;

        ReviewNode::create([
            'review_record_id' => $record->id,
            'node_type' => ReviewNode::NODE_TYPE_RECEIVE,
            'node_name' => '受理',
            'status' => ReviewNode::STATUS_COMPLETED,
            'sequence' => $sequence++,
            'operator_id' => $businessUser->id,
            'operated_at' => $record->received_at,
            'business_note' => '材料齐全，受理申请。',
            'snapshot' => $record->toArray(),
        ]);

        if ($status !== ReviewRecord::STATUS_PENDING) {
            ReviewNode::create([
                'review_record_id' => $record->id,
                'node_type' => ReviewNode::NODE_TYPE_PROCESS,
                'node_name' => '业务处理',
                'status' => ReviewNode::STATUS_COMPLETED,
                'sequence' => $sequence++,
                'operator_id' => $businessUser->id,
                'operated_at' => $record->processed_at,
                'business_note' => '经核查，学生符合申请条件。',
                'site_description' => '核实材料原件，真实有效。',
                'evidence_note' => '上传相关证明材料。',
                'changes' => [],
                'snapshot' => $record->toArray(),
            ]);
        }

        if (in_array($status, [ReviewRecord::STATUS_REVIEWING, ReviewRecord::STATUS_ARCHIVED, ReviewRecord::STATUS_RETURNED])) {
            $action = $status === ReviewRecord::STATUS_RETURNED ? 'return' : 'confirm';
            ReviewNode::create([
                'review_record_id' => $record->id,
                'node_type' => ReviewNode::NODE_TYPE_REVIEW,
                'node_name' => '复核审批',
                'status' => $status === ReviewRecord::STATUS_REVIEWING ? ReviewNode::STATUS_PENDING : ReviewNode::STATUS_COMPLETED,
                'sequence' => $sequence++,
                'operator_id' => $status === ReviewRecord::STATUS_REVIEWING ? null : $approvalUser->id,
                'operated_at' => $status === ReviewRecord::STATUS_REVIEWING ? null : $record->reviewed_at,
                'review_opinion' => $status !== ReviewRecord::STATUS_REVIEWING ? ($action === 'return' ? '材料需补充，请退回完善。' : '同意评审意见。') : null,
                'action' => $status === ReviewRecord::STATUS_REVIEWING ? null : $action,
                'from_status' => ReviewRecord::STATUS_REVIEWING,
                'to_status' => $status,
                'snapshot' => $record->toArray(),
            ]);
        }

        if ($status === ReviewRecord::STATUS_ARCHIVED) {
            ReviewNode::create([
                'review_record_id' => $record->id,
                'node_type' => ReviewNode::NODE_TYPE_ARCHIVE,
                'node_name' => '归档',
                'status' => ReviewNode::STATUS_COMPLETED,
                'sequence' => $sequence++,
                'operator_id' => $approvalUser->id,
                'operated_at' => $record->archived_at,
                'review_opinion' => '材料完整，流程合规，同意归档。',
                'snapshot' => $record->toArray(),
            ]);
        }
    }
}
