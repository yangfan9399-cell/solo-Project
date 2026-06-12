<?php

namespace Database\Seeders;

use App\Models\InspectionRecord;
use App\Models\RecordNode;
use App\Models\BusinessSupplement;
use App\Models\EvidenceAttachment;
use App\Models\AbnormalRecord;
use App\Models\DifferenceComparison;
use App\Models\User;
use App\Services\InspectionRecordService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    protected $service;

    public function __construct(InspectionRecordService $service)
    {
        $this->service = $service;
    }

    public function run(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        }

        User::truncate();
        InspectionRecord::truncate();
        RecordNode::truncate();
        BusinessSupplement::truncate();
        EvidenceAttachment::truncate();
        AbnormalRecord::truncate();
        DifferenceComparison::truncate();

        if (DB::getDriverName() !== 'sqlite') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }

        $businessSpecialist = User::create([
            'name' => '张伟',
            'email' => 'zhangwei@gas.com',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_BUSINESS_SPECIALIST,
            'department' => '安检一部',
            'phone' => '13800138001',
        ]);

        $approvalLeader = User::create([
            'name' => '李明',
            'email' => 'liming@gas.com',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_APPROVAL_LEADER,
            'department' => '安全管理部',
            'phone' => '13800138002',
        ]);

        $businessSpecialist2 = User::create([
            'name' => '王芳',
            'email' => 'wangfang@gas.com',
            'password' => bcrypt('password123'),
            'role' => User::ROLE_BUSINESS_SPECIALIST,
            'department' => '安检二部',
            'phone' => '13800138003',
        ]);

        $this->createNormalSample($businessSpecialist, $approvalLeader);
        $this->createNumberConflictSample($businessSpecialist, $approvalLeader, $businessSpecialist2);
        $this->createAmountDifferenceSample($businessSpecialist, $approvalLeader);
        $this->createAppealSample($businessSpecialist, $approvalLeader);
        $this->createReviewingSample($businessSpecialist, $approvalLeader);
    }

    protected function createNormalSample($specialist, $leader)
    {
        DB::transaction(function () use ($specialist, $leader) {
            $record = InspectionRecord::create([
                'record_no' => 'GA-' . date('Ymd') . '-001',
                'source' => '日常巡检',
                'source_no' => 'XJ20260601001',
                'current_responsible_id' => $specialist->id,
                'household_name' => '陈建国',
                'household_phone' => '13900139001',
                'address' => '北京市朝阳区建国路88号院3号楼1502室',
                'gas_meter_no' => 'GM20240001',
                'inspection_time' => '2026-06-10 09:30:00',
                'inspector' => '张伟',
                'hidden_danger' => '厨房燃气软管老化开裂，存在漏气风险；燃气报警器未接通电源；灶具无熄火保护装置。',
                'danger_level' => 'major',
                'danger_type' => '软管老化',
                'involve_amount' => 850.00,
                'involve_quantity' => 3,
                'evidence_conclusion' => '经现场检测，燃气软管使用年限超过5年，出现明显龟裂；报警器断电无法正常工作；灶具为不合格产品。以上情况属实。',
                'handling_basis' => '《城镇燃气管理条例》第二十八条、《燃气用户安全用气管理规范》第6.2.3条',
                'status' => InspectionRecord::STATUS_ARCHIVED,
                'sample_type' => InspectionRecord::SAMPLE_NORMAL,
                'conclusion' => '已更换燃气专用不锈钢波纹管（3米），安装带熄火保护的合格灶具，燃气报警器恢复供电并检测正常。经复查，所有隐患已消除，符合安全用气标准。',
                'is_archived' => true,
                'archived_at' => '2026-06-12 16:00:00',
                'archived_by' => $leader->id,
                'created_by' => $specialist->id,
            ]);

            $this->createCompleteNodes($record, $specialist, $leader, [
                'accepted' => ['2026-06-10 10:00:00', '受理日常巡检发现的安全隐患，登记建档'],
                'processing' => ['2026-06-10 14:30:00', '现场核实隐患情况，拍摄证据照片，告知用户整改要求'],
                'reviewing' => ['2026-06-11 10:00:00', '用户完成整改后提交复查申请，业务专员现场复查确认'],
                'archived' => ['2026-06-12 16:00:00', '审批负责人复核通过，同意归档'],
            ]);

            BusinessSupplement::create([
                'inspection_record_id' => $record->id,
                'supplement_type' => BusinessSupplement::TYPE_BUSINESS_RECORD,
                'content' => '2026年6月10日第一次上门检查，用户不在家，电话联系后约定6月10日下午上门。现场检查发现三处隐患，已向用户出具《燃气安全隐患整改通知书》，用户签字确认。',
                'operator_id' => $specialist->id,
                'supplemented_at' => '2026-06-10 16:00:00',
            ]);

            BusinessSupplement::create([
                'inspection_record_id' => $record->id,
                'supplement_type' => BusinessSupplement::TYPE_ON_SITE_EXPLAIN,
                'content' => '2026年6月11日复查：软管已更换为不锈钢波纹管，长度3米，接口处用肥皂水检测无漏气；灶具已更换为带熄火保护的品牌产品，型号为XX-888；报警器已插电，测试报警功能正常。',
                'operator_id' => $specialist->id,
                'supplemented_at' => '2026-06-11 11:30:00',
            ]);

            EvidenceAttachment::create([
                'inspection_record_id' => $record->id,
                'attachment_type' => EvidenceAttachment::TYPE_PHOTO,
                'file_name' => '老化软管照片.jpg',
                'file_path' => 'attachments/GA20260601001/hose_old.jpg',
                'file_size' => '2.3MB',
                'file_mime' => 'image/jpeg',
                'description' => '整改前：老化开裂的燃气软管',
                'uploaded_by' => $specialist->id,
                'uploaded_at' => '2026-06-10 09:45:00',
            ]);

            EvidenceAttachment::create([
                'inspection_record_id' => $record->id,
                'attachment_type' => EvidenceAttachment::TYPE_PHOTO,
                'file_name' => '新软管安装照片.jpg',
                'file_path' => 'attachments/GA20260601001/hose_new.jpg',
                'file_size' => '2.1MB',
                'file_mime' => 'image/jpeg',
                'description' => '整改后：新安装的不锈钢波纹管',
                'uploaded_by' => $specialist->id,
                'uploaded_at' => '2026-06-11 10:15:00',
            ]);

            EvidenceAttachment::create([
                'inspection_record_id' => $record->id,
                'attachment_type' => EvidenceAttachment::TYPE_DOCUMENT,
                'file_name' => '整改通知书.pdf',
                'file_path' => 'attachments/GA20260601001/notice.pdf',
                'file_size' => '156KB',
                'file_mime' => 'application/pdf',
                'description' => '用户签字的整改通知书',
                'uploaded_by' => $specialist->id,
                'uploaded_at' => '2026-06-10 16:30:00',
            ]);

            $this->service->updateSummaryAndConclusion($record);
            $record->saveQuietly();
        });
    }

    protected function createNumberConflictSample($specialist, $leader, $specialist2)
    {
        DB::transaction(function () use ($specialist, $leader, $specialist2) {
            $conflictRecord = InspectionRecord::create([
                'record_no' => 'GA-' . date('Ymd') . '-002',
                'source' => '群众举报',
                'source_no' => 'JB20260608001',
                'current_responsible_id' => $specialist2->id,
                'household_name' => '刘桂兰',
                'household_phone' => '13900139002',
                'address' => '北京市海淀区中关村大街1号院2号楼803室',
                'gas_meter_no' => 'GM20230678',
                'inspection_time' => '2026-06-08 14:00:00',
                'inspector' => '王芳',
                'hidden_danger' => '私接燃气管道，擅自拆除燃气计量装置封印。',
                'danger_level' => 'serious',
                'danger_type' => '私接管道',
                'involve_amount' => 25680.00,
                'involve_quantity' => 12,
                'evidence_conclusion' => '经现场核查，该用户确有私接管道行为，燃气表编号为GM20230678，但系统中该编号已登记在另一用户名下。',
                'handling_basis' => '《城镇燃气管理条例》第四十九条，涉嫌盗用燃气',
                'status' => InspectionRecord::STATUS_NUMBER_CONFLICT,
                'sample_type' => InspectionRecord::SAMPLE_NUMBER_CONFLICT,
                'has_blocking' => true,
                'blocking_reason' => '燃气表编号[GM20230678]与记录存在冲突',
                'created_by' => $specialist2->id,
            ]);

            $record = InspectionRecord::create([
                'record_no' => 'GA-' . date('Ymd') . '-003',
                'source' => '上级交办',
                'source_no' => 'BJ20260609001',
                'current_responsible_id' => $specialist->id,
                'household_name' => '赵志强',
                'household_phone' => '13900139003',
                'address' => '北京市西城区金融街15号院5号楼1201室',
                'gas_meter_no' => 'GM20230678',
                'inspection_time' => '2026-06-09 10:00:00',
                'inspector' => '张伟',
                'hidden_danger' => '燃气表封印松动，疑似存在篡改行为；燃气用量与实际居住情况不符。',
                'danger_level' => 'serious',
                'danger_type' => '计量异常',
                'involve_amount' => 18500.00,
                'involve_quantity' => 8,
                'evidence_conclusion' => '现场检查发现燃气表封印有撬动痕迹，表号GM20230678。经核对系统，该表号已于2023年10月登记在海淀区用户刘桂兰名下，目前地址与登记地址不符，存在编号冲突。',
                'handling_basis' => '《城镇燃气管理条例》第二十八条、第四十九条',
                'status' => InspectionRecord::STATUS_NUMBER_CONFLICT,
                'sample_type' => InspectionRecord::SAMPLE_NUMBER_CONFLICT,
                'has_blocking' => true,
                'blocking_reason' => '燃气表编号[GM20230678]与记录[' . $conflictRecord->record_no . ']存在冲突',
                'created_by' => $specialist->id,
            ]);

            $this->createCompleteNodes($record, $specialist, $leader, [
                'accepted' => ['2026-06-09 10:30:00', '受理上级交办案件，涉嫌盗用燃气'],
                'processing' => ['2026-06-09 15:00:00', '现场核查发现表号冲突，已拍照取证并联系表具厂家核实'],
                'number_conflict' => ['2026-06-10 09:00:00', '系统检测到表号GM20230678存在重复登记，流程自动阻断'],
            ]);

            $abnormal = AbnormalRecord::create([
                'inspection_record_id' => $record->id,
                'abnormal_type' => AbnormalRecord::TYPE_NUMBER_CONFLICT,
                'blocking_reason' => '燃气表编号[GM20230678]与记录[' . $conflictRecord->record_no . ']存在冲突：该编号于2023年10月登记给海淀区用户刘桂兰，当前用户赵志强为2025年购入该二手房，但未办理燃气过户手续。经调取历史记录，两个地址的用气记录均存在，无法确认表具归属。',
                'difference_fields' => ['gas_meter_no', 'record_no', 'household_name', 'address'],
                'remedy_path' => '1. 核实燃气表编号准确性：联系表具厂家调取出厂记录和安装记录；2. 与冲突记录持有人沟通确认：分别联系刘桂兰和赵志强，询问表具安装时间和过户情况；3. 如为重复记录则合并归档：调取两个地址的历史用气数据，确认表具实际安装位置；4. 如编号有误则更正后重新提交：根据核查结果，更正错误的表号并同步更新用户档案。',
                'resolution_status' => AbnormalRecord::STATUS_PENDING,
            ]);

            BusinessSupplement::create([
                'inspection_record_id' => $record->id,
                'supplement_type' => BusinessSupplement::TYPE_BUSINESS_RECORD,
                'content' => '已联系表具厂家北京XX仪表公司，申请调取GM20230678的出厂合格证和安装工单。厂家回复需3个工作日提供。已电话告知用户赵志强需配合调查，暂不处理过户事宜。',
                'operator_id' => $specialist->id,
                'supplemented_at' => '2026-06-10 11:00:00',
            ]);

            EvidenceAttachment::create([
                'inspection_record_id' => $record->id,
                'attachment_type' => EvidenceAttachment::TYPE_PHOTO,
                'file_name' => '燃气表照片.jpg',
                'file_path' => 'attachments/GA20260601003/meter.jpg',
                'file_size' => '1.8MB',
                'file_mime' => 'image/jpeg',
                'description' => '现场拍摄的燃气表照片，表号清晰可见GM20230678',
                'uploaded_by' => $specialist->id,
                'uploaded_at' => '2026-06-09 10:15:00',
            ]);

            DifferenceComparison::create([
                'inspection_record_id' => $record->id,
                'field_name' => 'gas_meter_no',
                'field_label' => '燃气表编号',
                'before_value' => 'GM20230678（刘桂兰，海淀区中关村大街1号院）',
                'after_value' => 'GM20230678（赵志强，西城区金融街15号院）',
                'change_type' => 'update',
                'remark' => '同一表号对应两个不同用户和地址，存在冲突',
                'operator_id' => $specialist->id,
                'compared_at' => '2026-06-10 09:00:00',
            ]);

            $this->service->updateSummaryAndConclusion($record);
            $record->saveQuietly();
            $this->service->updateSummaryAndConclusion($conflictRecord);
            $conflictRecord->saveQuietly();
        });
    }

    protected function createAmountDifferenceSample($specialist, $leader)
    {
        DB::transaction(function () use ($specialist, $leader) {
            $record = InspectionRecord::create([
                'record_no' => 'GA-' . date('Ymd') . '-004',
                'source' => '日常巡检',
                'source_no' => 'XJ20260605002',
                'current_responsible_id' => $specialist->id,
                'household_name' => '孙秀珍',
                'household_phone' => '13900139004',
                'address' => '北京市东城区王府井大街50号院1号楼605室',
                'gas_meter_no' => 'GM20221234',
                'inspection_time' => '2026-06-05 14:30:00',
                'inspector' => '张伟',
                'hidden_danger' => '长期未抄表，燃气用量异常，疑似存在计量故障或盗用行为。',
                'danger_level' => 'major',
                'danger_type' => '用量异常',
                'involve_amount' => 15680.00,
                'involve_quantity' => 2,
                'evidence_conclusion' => '经调取近12个月用气记录，该用户仅抄表2次，但根据历史用量推算，累计欠费金额约15680元。现场表具显示用气量与申报用量差距较大。',
                'handling_basis' => '《城镇燃气管理条例》第二十八条，《供用气合同》相关条款',
                'status' => InspectionRecord::STATUS_AMOUNT_DIFFERENCE,
                'sample_type' => InspectionRecord::SAMPLE_AMOUNT_DIFFERENCE,
                'has_blocking' => true,
                'blocking_reason' => '涉及金额(15680.00元)与数量(2)存在明显差异',
                'created_by' => $specialist->id,
            ]);

            $this->createCompleteNodes($record, $specialist, $leader, [
                'accepted' => ['2026-06-05 15:00:00', '发现用量异常，立案调查'],
                'processing' => ['2026-06-06 09:30:00', '调取历史用气数据和缴费记录，计算差额'],
                'amount_difference' => ['2026-06-07 10:00:00', '金额与数量差异过大，系统自动阻断，需复核计算依据'],
            ]);

            $abnormal = AbnormalRecord::create([
                'inspection_record_id' => $record->id,
                'abnormal_type' => AbnormalRecord::TYPE_AMOUNT_DIFFERENCE,
                'blocking_reason' => '涉及金额(15680.00元)与数量(2)存在明显差异：业务记录显示仅抄表2次，但推算欠费金额高达15680元。按照燃气费2.63元/立方米计算，15680元对应约5962立方米，与仅2次抄表记录严重不符。需核实：1. 欠费金额计算是否正确；2. 实际用气数量是多少；3. 是否存在表具故障。',
                'difference_fields' => ['involve_amount', 'involve_quantity'],
                'remedy_path' => '1. 重新核对计费标准和计算过程：确认燃气单价、违约金计算方式是否正确；2. 现场复核实际数量：拆卸燃气表送检计量机构，核实实际用气量；3. 补充金额计算依据说明：调取12个月的每日用气记录（如有远传数据），列出详细计算过程；4. 如有误则调整数据后重新提交：根据核查结果，修正金额或数量，补充相关凭证后再提交审批。',
                'resolution_status' => AbnormalRecord::STATUS_PENDING,
            ]);

            BusinessSupplement::create([
                'inspection_record_id' => $record->id,
                'supplement_type' => BusinessSupplement::TYPE_BUSINESS_RECORD,
                'content' => '已联系客服中心调取该用户2025年6月至2026年5月的全部用气记录和缴费凭证。经初步核对，2025年8月、11月、2026年2月、5月均有上门抄表记录，但系统仅登记2次，疑似数据录入遗漏。已申请调取纸质抄表存根。',
                'operator_id' => $specialist->id,
                'supplemented_at' => '2026-06-07 14:00:00',
            ]);

            BusinessSupplement::create([
                'inspection_record_id' => $record->id,
                'supplement_type' => BusinessSupplement::TYPE_ON_SITE_EXPLAIN,
                'content' => '2026年6月8日现场复核：用户称2025年9月至11月家中装修，确实用气量较大，但否认有盗用行为。现场表具显示累计用气量8560立方米，上次抄表（2025年6月）显示2598立方米，差值5962立方米，与推算用量基本一致。但系统记录的抄表次数确实存在遗漏。',
                'operator_id' => $specialist->id,
                'supplemented_at' => '2026-06-08 11:30:00',
            ]);

            DifferenceComparison::create([
                'inspection_record_id' => $record->id,
                'field_name' => 'involve_quantity',
                'field_label' => '涉及数量',
                'before_value' => '2次抄表记录',
                'after_value' => '5962立方米用气量',
                'change_type' => 'update',
                'remark' => '数量统计维度不一致，2次是抄表次数，应修正为实际用气量',
                'operator_id' => $specialist->id,
                'compared_at' => '2026-06-07 10:00:00',
            ]);

            DifferenceComparison::create([
                'inspection_record_id' => $record->id,
                'field_name' => 'involve_amount',
                'field_label' => '涉及金额',
                'before_value' => '15680.00元（推算值）',
                'after_value' => '待核实',
                'change_type' => 'update',
                'remark' => '金额计算需以实际表具读数和计量检定结果为准',
                'operator_id' => $specialist->id,
                'compared_at' => '2026-06-07 10:00:00',
            ]);

            EvidenceAttachment::create([
                'inspection_record_id' => $record->id,
                'attachment_type' => EvidenceAttachment::TYPE_PHOTO,
                'file_name' => '燃气表读数照片.jpg',
                'file_path' => 'attachments/GA20260601004/meter_reading.jpg',
                'file_size' => '1.5MB',
                'file_mime' => 'image/jpeg',
                'description' => '现场表具读数：8560立方米',
                'uploaded_by' => $specialist->id,
                'uploaded_at' => '2026-06-08 10:30:00',
            ]);

            EvidenceAttachment::create([
                'inspection_record_id' => $record->id,
                'attachment_type' => EvidenceAttachment::TYPE_DOCUMENT,
                'file_name' => '用气记录明细表.xlsx',
                'file_path' => 'attachments/GA20260601004/usage_records.xlsx',
                'file_size' => '48KB',
                'file_mime' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'description' => '2025年6月-2026年5月用气记录明细',
                'uploaded_by' => $specialist->id,
                'uploaded_at' => '2026-06-07 15:30:00',
            ]);

            $this->service->updateSummaryAndConclusion($record);
            $record->saveQuietly();
        });
    }

    protected function createAppealSample($specialist, $leader)
    {
        DB::transaction(function () use ($specialist, $leader) {
            $record = InspectionRecord::create([
                'record_no' => 'GA-' . date('Ymd') . '-005',
                'source' => '日常巡检',
                'source_no' => 'XJ20260603003',
                'current_responsible_id' => $specialist->id,
                'household_name' => '周海涛',
                'household_phone' => '13900139005',
                'address' => '北京市丰台区方庄路10号院4号楼302室',
                'gas_meter_no' => 'GM20245678',
                'inspection_time' => '2026-06-03 09:00:00',
                'inspector' => '张伟',
                'hidden_danger' => '擅自改动燃气设施，将燃气热水器排烟管接入公共烟道。',
                'danger_level' => 'major',
                'danger_type' => '私改设施',
                'involve_amount' => 3200.00,
                'involve_quantity' => 1,
                'evidence_conclusion' => '经检查，该用户家中燃气热水器排烟管确实接入了公共烟道，违反《城镇燃气设计规范》第10.7.6条规定。现场拍摄了照片作为证据。',
                'handling_basis' => '《城镇燃气管理条例》第二十八条第（四）项，《城镇燃气设计规范》GB50028-2006第10.7.6条',
                'status' => InspectionRecord::STATUS_APPEALED,
                'sample_type' => InspectionRecord::SAMPLE_APPEAL,
                'has_blocking' => true,
                'blocking_reason' => '当事人提出申诉，需按申诉流程处理',
                'created_by' => $specialist->id,
            ]);

            $this->createCompleteNodes($record, $specialist, $leader, [
                'accepted' => ['2026-06-03 09:30:00', '发现私改排烟管，责令限期整改'],
                'processing' => ['2026-06-04 14:00:00', '用户提交书面申诉，认为排烟管接入公共烟道符合建筑设计'],
                'appealed' => ['2026-06-05 10:00:00', '当事人提出申诉，需启动申诉处理流程'],
            ]);

            $abnormal = AbnormalRecord::create([
                'inspection_record_id' => $record->id,
                'abnormal_type' => AbnormalRecord::TYPE_APPEAL,
                'blocking_reason' => '当事人周海涛提出申诉：1. 该房屋为2024年新建商品住宅，收房时热水器和排烟管已由开发商安装完毕；2. 公共烟道设计时已考虑燃气热水器排烟需求，有独立的排烟通道；3. 已向物业核实，该楼所有住户均采用此种安装方式，物业出具了相关证明；4. 认为我司适用规范不当，《城镇燃气设计规范》第10.7.6条针对的是自建烟道情况。',
                'difference_fields' => ['status', 'evidence_conclusion', 'handling_basis', 'hidden_danger'],
                'remedy_path' => '1. 登记申诉内容并通知当事人：已收到申诉材料，将于15个工作日内给出答复；2. 组织重新核查：联系开发商调取建筑施工图纸和排烟道设计说明，核实烟道设计标准；3. 补充核查证据：邀请建筑设计专家现场勘察，确认排烟方式是否符合规范；4. 召开申诉评审会：由安全、技术、法务等部门组成评审组，集体研究申诉事项；5. 出具最终结论：根据评审结果，作出维持原决定或撤销原决定的书面答复。',
                'resolution_status' => AbnormalRecord::STATUS_PENDING,
            ]);

            BusinessSupplement::create([
                'inspection_record_id' => $record->id,
                'supplement_type' => BusinessSupplement::TYPE_BUSINESS_RECORD,
                'content' => '2026年6月5日收到用户书面申诉材料，包括：1. 申诉书1份；2. 购房合同复印件（证明房屋为精装交付）；3. 物业公司出具的《关于方庄路10号院排烟系统的说明》；4. 邻居用户的情况说明5份。已按规定登记，申诉编号：SS20260605001。',
                'operator_id' => $specialist->id,
                'supplemented_at' => '2026-06-05 11:30:00',
            ]);

            BusinessSupplement::create([
                'inspection_record_id' => $record->id,
                'supplement_type' => BusinessSupplement::TYPE_ON_SITE_EXPLAIN,
                'content' => '2026年6月6日与技术部、设计院专家共同现场勘察：该楼公共烟道为子母烟道设计，每层有独立的进气口和防火止回阀，垂直主烟道截面尺寸为500mm×400mm，符合燃气热水器排烟要求。查阅设计图纸，该烟道设计使用年限内可容纳60台燃气热水器同时排烟。',
                'operator_id' => $specialist->id,
                'supplemented_at' => '2026-06-06 16:00:00',
            ]);

            DifferenceComparison::create([
                'inspection_record_id' => $record->id,
                'field_name' => 'hidden_danger',
                'field_label' => '隐患描述',
                'before_value' => '擅自改动燃气设施，将燃气热水器排烟管接入公共烟道',
                'after_value' => '待核查：房屋交付时已安装，公共烟道设计符合要求',
                'change_type' => 'update',
                'remark' => '申诉对隐患认定提出异议',
                'operator_id' => $specialist->id,
                'compared_at' => '2026-06-05 10:00:00',
            ]);

            DifferenceComparison::create([
                'inspection_record_id' => $record->id,
                'field_name' => 'handling_basis',
                'field_label' => '采用依据',
                'before_value' => '《城镇燃气设计规范》GB50028-2006第10.7.6条',
                'after_value' => '待评审：规范适用条件需进一步核实',
                'change_type' => 'update',
                'remark' => '申诉认为规范适用不当',
                'operator_id' => $specialist->id,
                'compared_at' => '2026-06-05 10:00:00',
            ]);

            EvidenceAttachment::create([
                'inspection_record_id' => $record->id,
                'attachment_type' => EvidenceAttachment::TYPE_DOCUMENT,
                'file_name' => '申诉书.pdf',
                'file_path' => 'attachments/GA20260601005/appeal.pdf',
                'file_size' => '2.1MB',
                'file_mime' => 'application/pdf',
                'description' => '用户签署的申诉书及附件材料',
                'uploaded_by' => $specialist->id,
                'uploaded_at' => '2026-06-05 10:30:00',
            ]);

            EvidenceAttachment::create([
                'inspection_record_id' => $record->id,
                'attachment_type' => EvidenceAttachment::TYPE_DOCUMENT,
                'file_name' => '排烟道设计图纸.pdf',
                'file_path' => 'attachments/GA20260601005/design_drawing.pdf',
                'file_size' => '5.6MB',
                'file_mime' => 'application/pdf',
                'description' => '开发商提供的排烟系统设计图纸',
                'uploaded_by' => $specialist->id,
                'uploaded_at' => '2026-06-06 14:00:00',
            ]);

            EvidenceAttachment::create([
                'inspection_record_id' => $record->id,
                'attachment_type' => EvidenceAttachment::TYPE_PHOTO,
                'file_name' => '现场勘察照片.jpg',
                'file_path' => 'attachments/GA20260601005/site_photo.jpg',
                'file_size' => '3.2MB',
                'file_mime' => 'image/jpeg',
                'description' => '专家现场勘察公共烟道情况',
                'uploaded_by' => $specialist->id,
                'uploaded_at' => '2026-06-06 11:00:00',
            ]);

            $this->service->updateSummaryAndConclusion($record);
            $record->saveQuietly();
        });
    }

    protected function createReviewingSample($specialist, $leader)
    {
        DB::transaction(function () use ($specialist, $leader) {
            $record = InspectionRecord::create([
                'record_no' => 'GA-' . date('Ymd') . '-006',
                'source' => '日常巡检',
                'source_no' => 'XJ20260613001',
                'current_responsible_id' => $specialist->id,
                'household_name' => '王大明',
                'household_phone' => '13800138006',
                'address' => '北京市朝阳区建国路88号院3号楼1501室',
                'gas_meter_no' => 'GM20240002',
                'inspection_time' => '2026-06-13 09:00:00',
                'inspector' => '张伟',
                'hidden_danger' => '厨房燃气管道接口处存在轻微漏气，需重新密封处理',
                'danger_level' => 'minor',
                'danger_type' => '管道漏气',
                'involve_amount' => 500.00,
                'involve_quantity' => 1,
                'evidence_conclusion' => '经检测，厨房燃气管道接口处存在轻微漏气',
                'handling_basis' => '《城镇燃气管理条例》第二十八条',
                'status' => InspectionRecord::STATUS_REVIEWING,
                'sample_type' => InspectionRecord::SAMPLE_NORMAL,
                'created_by' => $specialist->id,
            ]);

            $this->createCompleteNodes($record, $specialist, $leader, [
                'accepted' => ['2026-06-13 09:30:00', '受理日常巡检发现的安全隐患，登记建档'],
                'processing' => ['2026-06-13 10:30:00', '现场核实隐患情况，检测确认管道接口漏气'],
                'reviewing' => ['2026-06-13 14:00:00', '整改完成，业务专员现场复查确认，提交审批'],
            ]);

            $this->service->updateSummaryAndConclusion($record);
            $record->saveQuietly();
        });
    }

    protected function createCompleteNodes($record, $specialist, $leader, $nodeConfig)
    {
        $nodeOrder = 1;
        $previousNode = null;

        foreach ($nodeConfig as $nodeType => $config) {
            [$operatedAt, $description] = $config;

            $actionMap = [
                'accepted' => RecordNode::ACTION_CREATE,
                'processing' => RecordNode::ACTION_UPDATE,
                'reviewing' => RecordNode::ACTION_SUBMIT,
                'approved' => RecordNode::ACTION_APPROVE,
                'archived' => RecordNode::ACTION_ARCHIVE,
                'returned' => RecordNode::ACTION_REJECT,
                'appealed' => RecordNode::ACTION_APPEAL,
                'number_conflict' => RecordNode::ACTION_UPDATE,
                'amount_difference' => RecordNode::ACTION_UPDATE,
            ];

            $operator = in_array($nodeType, ['approved', 'archived']) ? $leader : $specialist;

            $node = RecordNode::create([
                'inspection_record_id' => $record->id,
                'node_type' => $nodeType,
                'node_name' => RecordNode::NODE_NAMES[$nodeType] ?? $nodeType,
                'description' => $description,
                'operator_id' => $operator->id,
                'action' => $actionMap[$nodeType] ?? RecordNode::ACTION_UPDATE,
                'operated_at' => $operatedAt,
                'node_order' => $nodeOrder++,
            ]);

            if ($previousNode && $node->changed_fields) {
                foreach ($node->changed_fields as $field => $values) {
                    DifferenceComparison::create([
                        'inspection_record_id' => $record->id,
                        'from_node_id' => $previousNode->id,
                        'to_node_id' => $node->id,
                        'field_name' => $field,
                        'field_label' => DifferenceComparison::FIELD_LABELS[$field] ?? $field,
                        'before_value' => $values['before'] ?? '-',
                        'after_value' => $values['after'] ?? '-',
                        'change_type' => 'update',
                        'operator_id' => $operator->id,
                        'compared_at' => $operatedAt,
                    ]);
                }
            }

            $previousNode = $node;
        }
    }
}
