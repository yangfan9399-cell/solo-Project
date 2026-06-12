<?php

namespace Database\Seeders;

use App\Enums\CaseStatus;
use App\Enums\CaseType;
use App\Enums\NodeType;
use App\Enums\UserRole;
use App\Models\CaseNode;
use App\Models\Evidence;
use App\Models\ResponsiblePerson;
use App\Models\Tool;
use App\Models\ToolCase;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->createUsers();
        $this->createSampleCases();
    }

    private function createUsers(): void
    {
        User::create([
            'name' => '张专员',
            'email' => 'clerk@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::Clerk,
            'employee_id' => 'EMP001',
            'department' => '机务工程部',
        ]);

        User::create([
            'name' => '李审批',
            'email' => 'approver@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::Approver,
            'employee_id' => 'EMP002',
            'department' => '质量管理部',
        ]);

        User::create([
            'name' => '王专员',
            'email' => 'clerk2@example.com',
            'password' => Hash::make('password123'),
            'role' => UserRole::Clerk,
            'employee_id' => 'EMP003',
            'department' => '机务工程部',
        ]);
    }

    private function createSampleCases(): void
    {
        $clerk = User::where('role', UserRole::Clerk)->first();
        $approver = User::where('role', UserRole::Approver)->first();

        $this->createNormalArchivedCase($clerk, $approver);
        $this->createCodeConflictCase($clerk, $approver);
        $this->createQuantityDiffCase($clerk, $approver);
        $this->createAppealCase($clerk, $approver);
    }

    private function createNormalArchivedCase($clerk, $approver): void
    {
        $case = ToolCase::create([
            'case_number' => 'CASE-2024-001',
            'title' => 'B737-800机型例行工具清点',
            'type' => CaseType::Normal,
            'status' => CaseStatus::Archived,
            'source_description' => '2024年1月15日航后例行清点，工具编号TWL-001至TWL-010扭力扳手组',
            'incident_at' => '2024-01-15 22:30:00',
            'location' => '首都机场T3机库A区',
            'current_responsible' => '赵建国',
            'business_record' => '该工具组为2023年12月1日借入，用于B-1234飞机C检工作，借用人：赵建国，班组长确认：孙立。',
            'scene_description' => '清点现场工具摆放整齐，10件扭力扳手编号齐全，校准标签均在有效期内，外观无损伤。',
            'conclusion' => '工具清点无误，全部归还入库。数量10/10，金额合计¥15,800.00与台账一致。',
            'basis' => '《民用航空器维修工具管理规范》AC-121-065R3 第6.3条；《机务部工具借还管理细则》MW-GL-007',
            'reported_by' => $clerk->id,
            'handled_by' => $clerk->id,
            'reviewed_by' => $approver->id,
            'handled_at' => '2024-01-15 23:15:00',
            'reviewed_at' => '2024-01-16 09:00:00',
            'archived_at' => '2024-01-16 09:30:00',
            'is_archived' => true,
        ]);

        Tool::create([
            'case_id' => $case->id,
            'tool_code' => 'TWL-001',
            'tool_name' => '扭力扳手',
            'specification' => '10-60N·m',
            'expected_quantity' => 1,
            'actual_quantity' => 1,
            'expected_amount' => 1580.00,
            'actual_amount' => 1580.00,
            'status' => 'normal',
            'remark' => '校准有效期至2024-06-30',
        ]);
        Tool::create([
            'case_id' => $case->id,
            'tool_code' => 'TWL-002',
            'tool_name' => '扭力扳手',
            'specification' => '20-100N·m',
            'expected_quantity' => 1,
            'actual_quantity' => 1,
            'expected_amount' => 1580.00,
            'actual_amount' => 1580.00,
            'status' => 'normal',
        ]);
        Tool::create([
            'case_id' => $case->id,
            'tool_code' => 'TWL-003',
            'tool_name' => '扭力扳手',
            'specification' => '40-200N·m',
            'expected_quantity' => 1,
            'actual_quantity' => 1,
            'expected_amount' => 1580.00,
            'actual_amount' => 1580.00,
            'status' => 'normal',
        ]);
        Tool::create([
            'case_id' => $case->id,
            'tool_code' => 'TWL-004',
            'tool_name' => '扭力扳手',
            'specification' => '10-60N·m',
            'expected_quantity' => 1,
            'actual_quantity' => 1,
            'expected_amount' => 1580.00,
            'actual_amount' => 1580.00,
            'status' => 'normal',
        ]);
        Tool::create([
            'case_id' => $case->id,
            'tool_code' => 'TWL-005',
            'tool_name' => '扭力扳手',
            'specification' => '20-100N·m',
            'expected_quantity' => 1,
            'actual_quantity' => 1,
            'expected_amount' => 1580.00,
            'actual_amount' => 1580.00,
            'status' => 'normal',
        ]);
        Tool::create([
            'case_id' => $case->id,
            'tool_code' => 'TWL-006',
            'tool_name' => '扭力扳手',
            'specification' => '40-200N·m',
            'expected_quantity' => 1,
            'actual_quantity' => 1,
            'expected_amount' => 1580.00,
            'actual_amount' => 1580.00,
            'status' => 'normal',
        ]);
        Tool::create([
            'case_id' => $case->id,
            'tool_code' => 'TWL-007',
            'tool_name' => '扭力扳手',
            'specification' => '10-60N·m',
            'expected_quantity' => 1,
            'actual_quantity' => 1,
            'expected_amount' => 1580.00,
            'actual_amount' => 1580.00,
            'status' => 'normal',
        ]);
        Tool::create([
            'case_id' => $case->id,
            'tool_code' => 'TWL-008',
            'tool_name' => '扭力扳手',
            'specification' => '20-100N·m',
            'expected_quantity' => 1,
            'actual_quantity' => 1,
            'expected_amount' => 1580.00,
            'actual_amount' => 1580.00,
            'status' => 'normal',
        ]);
        Tool::create([
            'case_id' => $case->id,
            'tool_code' => 'TWL-009',
            'tool_name' => '扭力扳手',
            'specification' => '40-200N·m',
            'expected_quantity' => 1,
            'actual_quantity' => 1,
            'expected_amount' => 1580.00,
            'actual_amount' => 1580.00,
            'status' => 'normal',
        ]);
        Tool::create([
            'case_id' => $case->id,
            'tool_code' => 'TWL-010',
            'tool_name' => '扭力扳手',
            'specification' => '10-60N·m',
            'expected_quantity' => 1,
            'actual_quantity' => 1,
            'expected_amount' => 1580.00,
            'actual_amount' => 1580.00,
            'status' => 'normal',
        ]);

        ResponsiblePerson::create([
            'case_id' => $case->id,
            'name' => '赵建国',
            'employee_id' => 'EMP101',
            'department' => '维修一队',
            'role_in_case' => '借用人',
        ]);
        ResponsiblePerson::create([
            'case_id' => $case->id,
            'name' => '孙立',
            'employee_id' => 'EMP102',
            'department' => '维修一队',
            'role_in_case' => '班组长',
        ]);

        Evidence::create([
            'case_id' => $case->id,
            'file_name' => '工具归还签收单.pdf',
            'file_path' => '/evidences/CASE-2024-001/receipt.pdf',
            'file_type' => 'application/pdf',
            'file_size' => 102400,
            'description' => '赵建国签字的工具归还确认单',
            'uploaded_by' => $clerk->id,
        ]);
        Evidence::create([
            'case_id' => $case->id,
            'file_name' => '现场清点照片.jpg',
            'file_path' => '/evidences/CASE-2024-001/photo.jpg',
            'file_type' => 'image/jpeg',
            'file_size' => 2048000,
            'description' => '工具清点现场照片',
            'uploaded_by' => $clerk->id,
        ]);

        $this->addNode($case, NodeType::Report, CaseStatus::Pending, '业务专员受理登记B737-800机型工具借还清点', $clerk);
        $this->addNode($case, NodeType::Accept, CaseStatus::Processing, '确认受理，进入处理流程', $clerk);
        $this->addNode($case, NodeType::Process, CaseStatus::Reviewing, '完成清点处理：工具10件全部回收，数量金额核对无误', $clerk);
        $this->addNode($case, NodeType::Review, CaseStatus::Archived, '复核通过：清点记录完整，证据链齐全，同意归档', $approver);
        $this->addNode($case, NodeType::Archive, CaseStatus::Archived, '系统自动归档，记录封存', $approver);
    }

    private function createCodeConflictCase($clerk, $approver): void
    {
        $case = ToolCase::create([
            'case_number' => 'CASE-2024-002',
            'title' => 'A320neo专用力矩工具编号重复异常',
            'type' => CaseType::CodeConflict,
            'status' => CaseStatus::Blocked,
            'source_description' => '2024年1月18日工具盘点发现，编号MCT-A320-015出现两个实体，分别在工具柜第二层和第三层，疑似编号标签重复打印或登记错误。',
            'incident_at' => '2024-01-18 14:20:00',
            'location' => '首都机场T2工具库房',
            'current_responsible' => '钱文博',
            'business_record' => 'MCT-A320-015首次登记时间为2022年5月10日，用于A320neo发动机吊架螺栓紧固。2023年11月补购同型号工具一批，疑似未分配新编号。',
            'scene_description' => '现场发现两件型号完全一致的力矩工具，均贴有MCT-A320-015编号标签，序列号分别为SN-88201和SN-88345。其中SN-88201校准有效期至2024-05，SN-88345校准有效期至2024-08。',
            'blocking_reason' => '工具编号唯一约束被破坏。编号MCT-A320-015对应两件实物，无法通过唯一性校验，存在工具错用导致维修质量事故的风险。',
            'diff_fields' => [
                ['field' => 'tool_code', 'label' => '工具编号', 'expected' => '唯一编号MCT-A320-015', 'actual' => '两件工具重复使用MCT-A320-015'],
                ['field' => 'serial_number', 'label' => '序列号', 'expected' => '单条记录', 'actual' => 'SN-88201 / SN-88345 双记录'],
            ],
            'remedy_path' => '1. 核对工具采购台账，确认两件工具的入库时间和原始编号；2. 对后入库的工具(SN-88345)重新分配编号MCT-A320-015A；3. 打印新标签并更换；4. 更新台账记录，补充变更审批单；5. 确认后重新提交复核。',
            'reported_by' => $clerk->id,
            'handled_by' => $clerk->id,
            'handled_at' => '2024-01-18 16:00:00',
        ]);

        Tool::create([
            'case_id' => $case->id,
            'tool_code' => 'MCT-A320-015',
            'tool_name' => '力矩扳手(发动机专用)',
            'specification' => '100-500N·m',
            'expected_quantity' => 1,
            'actual_quantity' => 2,
            'expected_amount' => 8500.00,
            'actual_amount' => 17000.00,
            'status' => 'conflict',
            'remark' => '序列号SN-88201与SN-88345同号冲突',
        ]);

        ResponsiblePerson::create([
            'case_id' => $case->id,
            'name' => '钱文博',
            'employee_id' => 'EMP201',
            'department' => '工具管理组',
            'role_in_case' => '工具管理员',
        ]);
        ResponsiblePerson::create([
            'case_id' => $case->id,
            'name' => '吴晓峰',
            'employee_id' => 'EMP202',
            'department' => '采购部',
            'role_in_case' => '采购经办人',
        ]);

        Evidence::create([
            'case_id' => $case->id,
            'file_name' => '编号对比照片.jpg',
            'file_path' => '/evidences/CASE-2024-002/compare.jpg',
            'file_type' => 'image/jpeg',
            'file_size' => 3072000,
            'description' => '两件贴有相同编号标签工具的对比照片',
            'uploaded_by' => $clerk->id,
        ]);
        Evidence::create([
            'case_id' => $case->id,
            'file_name' => '采购入库台账.xlsx',
            'file_path' => '/evidences/CASE-2024-002/ledger.xlsx',
            'file_type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'file_size' => 51200,
            'description' => '2023年11月工具采购入库明细',
            'uploaded_by' => $clerk->id,
        ]);

        $this->addNode($case, NodeType::Report, CaseStatus::Pending, '发现MCT-A320-015编号重复异常，业务专员受理登记', $clerk);
        $this->addNode($case, NodeType::Accept, CaseStatus::Processing, '确认编号冲突异常，启动异常处理流程', $clerk);
        $this->addNode($case, NodeType::Process, CaseStatus::Blocked, '提交处理，系统检测到编号唯一性冲突，流程阻断。差异字段：工具编号(预期唯一/实际重复)、序列号(预期单条/实际双条)。需按补救路径完成纠正后再提交。', $clerk);
    }

    private function createQuantityDiffCase($clerk, $approver): void
    {
        $case = ToolCase::create([
            'case_number' => 'CASE-2024-003',
            'title' => 'B787-9起落架维修工具包数量金额差异',
            'type' => CaseType::QuantityDiff,
            'status' => CaseStatus::Returned,
            'source_description' => '2024年1月20日起落架专项维修完成后归还工具包TLK-B787-LG，清点发现数量不符且金额存在差异。',
            'incident_at' => '2024-01-20 18:45:00',
            'location' => '首都机场大修机库B区',
            'current_responsible' => '周志刚',
            'business_record' => '工具包TLK-B787-LG于2024年1月18日借出，用于B-2088飞机起落架润滑和扭力复查。借出时登记28件工具，合计金额¥42,680.00。借用人：周志刚。',
            'scene_description' => '归还时清点：专用套筒缺失1件（编号SLG-B787-14），数字式扭力测量仪已损坏无法正常使用；另有2件内六角扳手以旧换新未登记。现场清点人：张专员，监交人：刘班长。',
            'blocking_reason' => '工具数量与金额均与台账不符。预期数量28件，实际回收27件（缺失1件）；预期金额¥42,680.00，实际折合金额¥38,880.00，差异¥3,800.00。存在遗失工具和损坏未赔偿的情况。',
            'diff_fields' => [
                ['field' => 'quantity', 'label' => '工具数量', 'expected' => 28, 'actual' => 27, 'diff' => -1],
                ['field' => 'amount', 'label' => '工具金额', 'expected' => 42680.00, 'actual' => 38880.00, 'diff' => -3800.00],
                ['field' => 'tool_status', 'label' => '工具状态', 'expected' => '全部完好', 'actual' => '1件缺失/1件损坏'],
            ],
            'remedy_path' => '1. 立即排查缺失套筒SLG-B787-14位置，检查维修现场、工具箱夹层、起落架舱等区域；2. 对损坏扭力测量仪评估维修或赔偿方案；3. 补充以旧换新登记手续；4. 责任人书面说明并签字；5. 补齐以上材料后重新提交。',
            'reported_by' => $clerk->id,
            'handled_by' => $clerk->id,
            'reviewed_by' => $approver->id,
            'handled_at' => '2024-01-20 20:00:00',
            'reviewed_at' => '2024-01-21 10:30:00',
        ]);

        Tool::create([
            'case_id' => $case->id,
            'tool_code' => 'SLG-B787-01',
            'tool_name' => '专用套筒组',
            'specification' => 'B787起落架专用',
            'expected_quantity' => 12,
            'actual_quantity' => 11,
            'expected_amount' => 14400.00,
            'actual_amount' => 13200.00,
            'status' => 'missing_parts',
            'remark' => 'SLG-B787-14缺失',
        ]);
        Tool::create([
            'case_id' => $case->id,
            'tool_code' => 'DTM-787-01',
            'tool_name' => '数字式扭力测量仪',
            'specification' => '0-1000N·m',
            'expected_quantity' => 1,
            'actual_quantity' => 1,
            'expected_amount' => 28000.00,
            'actual_amount' => 24200.00,
            'status' => 'damaged',
            'remark' => '传感器损坏，读数偏移超标，评估损坏折损¥3,800',
        ]);
        Tool::create([
            'case_id' => $case->id,
            'tool_code' => 'HEX-SET-05',
            'tool_name' => '内六角扳手套装',
            'specification' => '公制2-10mm',
            'expected_quantity' => 9,
            'actual_quantity' => 9,
            'expected_amount' => 280.00,
            'actual_amount' => 280.00,
            'status' => 'normal',
            'remark' => '含2件以旧换新',
        ]);
        Tool::create([
            'case_id' => $case->id,
            'tool_code' => 'MISC-787-01',
            'tool_name' => '辅助工具组',
            'specification' => '铜棒/撬棍等',
            'expected_quantity' => 6,
            'actual_quantity' => 6,
            'expected_amount' => 0.00,
            'actual_amount' => 1200.00,
            'status' => 'normal',
        ]);

        ResponsiblePerson::create([
            'case_id' => $case->id,
            'name' => '周志刚',
            'employee_id' => 'EMP301',
            'department' => '结构维修组',
            'role_in_case' => '借用人/主要责任人',
        ]);
        ResponsiblePerson::create([
            'case_id' => $case->id,
            'name' => '刘建华',
            'employee_id' => 'EMP302',
            'department' => '结构维修组',
            'role_in_case' => '班组长',
        ]);

        Evidence::create([
            'case_id' => $case->id,
            'file_name' => '清点差异清单.pdf',
            'file_path' => '/evidences/CASE-2024-003/diff_list.pdf',
            'file_type' => 'application/pdf',
            'file_size' => 153600,
            'description' => '双方签字确认的差异清单',
            'uploaded_by' => $clerk->id,
        ]);
        Evidence::create([
            'case_id' => $case->id,
            'file_name' => '损坏扭力仪照片.jpg',
            'file_path' => '/evidences/CASE-2024-003/damaged.jpg',
            'file_type' => 'image/jpeg',
            'file_size' => 2560000,
            'description' => '损坏扭力测量仪外观和读数照片',
            'uploaded_by' => $clerk->id,
        ]);

        $this->addNode($case, NodeType::Report, CaseStatus::Pending, 'B787起落架工具包数量金额存在差异，受理登记', $clerk);
        $this->addNode($case, NodeType::Accept, CaseStatus::Processing, '差异异常确认，进入处理', $clerk);
        $this->addNode($case, NodeType::Process, CaseStatus::Reviewing, '业务专员提交处理：数量差异-1件，金额差异-¥3,800，附差异清单和损坏照片', $clerk);
        $this->addNode($case, NodeType::Return, CaseStatus::Returned, '审批负责人退回补证：缺失工具尚未完成排查，损坏仪器赔偿方案未确认，以旧换新手续不齐。请按补救路径补齐后重提。', $approver);
    }

    private function createAppealCase($clerk, $approver): void
    {
        $case = ToolCase::create([
            'case_number' => 'CASE-2024-004',
            'title' => 'A330货舱门专用工具遗失追责申诉',
            'type' => CaseType::Appeal,
            'status' => CaseStatus::Appealing,
            'source_description' => '2024年1月10日A330-300货舱门维修后，专用定位销CKD-A330-03未归还。初查结论为遗失，由借用人郑海涛全额赔偿¥5,600。当事人提出申诉。',
            'incident_at' => '2024-01-10 11:00:00',
            'location' => '首都机场货运机坪18号位',
            'current_responsible' => '郑海涛',
            'business_record' => '2024年1月10日08:00借出CKD-A330-03定位销，用于B-6099飞机货舱门调节工作。同日16:30归还时未包含该定位销。借用人签字：郑海涛。',
            'scene_description' => '初始结论：工具遗失，郑海涛负全责。申诉后补充情况：当日交班记录显示，14:00另一组维修人员跨组借用该工具用于相邻B-6088飞机，当时未履行签字手续。',
            'conclusion' => '（初版）借用人郑海涛未妥善保管工具，CKD-A330-03定位销遗失，按规定全额赔偿¥5,600，计入个人安全档案。',
            'basis' => '《机务工具遗失赔偿管理办法》MW-GL-012 第5.2条',
            'blocking_reason' => '当事人对责任认定提出申诉，提交了新的证据表明存在跨组借用情况。在申诉核实完成前，原结论不得执行。',
            'diff_fields' => [
                ['field' => 'responsible_person', 'label' => '责任对象', 'expected' => '郑海涛(唯一借用人)', 'actual' => '存在跨组借用，责任可能涉及多方'],
                ['field' => 'evidence_chain', 'label' => '证据链', 'expected' => '完整闭环', 'actual' => '跨组借用环节无签字记录，证据链存在断点'],
            ],
            'remedy_path' => '1. 调取1月10日14:00-16:00期间B-6088飞机附近监控视频；2. 询问第二组维修人员核实是否实际使用CKD-A330-03；3. 核查交接班记录和工具使用登记本原始笔迹；4. 根据核实结果重新划分责任比例或排除郑海涛责任；5. 补充完证据后重新提交。',
            'reported_by' => $clerk->id,
            'handled_by' => $clerk->id,
            'reviewed_by' => $approver->id,
            'handled_at' => '2024-01-12 15:00:00',
            'reviewed_at' => '2024-01-13 09:00:00',
        ]);

        Tool::create([
            'case_id' => $case->id,
            'tool_code' => 'CKD-A330-03',
            'tool_name' => '货舱门定位销',
            'specification' => 'A330专用/长度220mm',
            'expected_quantity' => 1,
            'actual_quantity' => 0,
            'expected_amount' => 5600.00,
            'actual_amount' => 0.00,
            'status' => 'lost',
            'remark' => '状态：遗失。申诉中。',
        ]);

        $rp = ResponsiblePerson::create([
            'case_id' => $case->id,
            'name' => '郑海涛',
            'employee_id' => 'EMP401',
            'department' => '机身维修二队',
            'role_in_case' => '借用人/申诉人',
            'appeal_content' => '本人申诉：1月10日14:00交班时，第二组的陈铭辉因B-6088货舱门紧急维修，从我工具箱中拿走该定位销使用，当时答应随后补签但未兑现。本人并非最后经手人，不应承担全部遗失责任。附交班记录时间线说明。',
            'appealed_at' => '2024-01-15 14:30:00',
        ]);
        ResponsiblePerson::create([
            'case_id' => $case->id,
            'name' => '陈铭辉',
            'employee_id' => 'EMP402',
            'department' => '机身维修一队',
            'role_in_case' => '涉嫌二次借用人',
        ]);

        Evidence::create([
            'case_id' => $case->id,
            'file_name' => '郑海涛申诉书.pdf',
            'file_path' => '/evidences/CASE-2024-004/appeal.pdf',
            'file_type' => 'application/pdf',
            'file_size' => 204800,
            'description' => '郑海涛签字的书面申诉材料',
            'uploaded_by' => $clerk->id,
        ]);
        Evidence::create([
            'case_id' => $case->id,
            'file_name' => '交接班记录扫描件.jpg',
            'file_path' => '/evidences/CASE-2024-004/handover.jpg',
            'file_type' => 'image/jpeg',
            'file_size' => 1792000,
            'description' => '1月10日交接班记录（14:00时段）',
            'uploaded_by' => $clerk->id,
        ]);
        Evidence::create([
            'case_id' => $case->id,
            'file_name' => '初版处理结论.pdf',
            'file_path' => '/evidences/CASE-2024-004/initial_conclusion.pdf',
            'file_type' => 'application/pdf',
            'file_size' => 102400,
            'description' => '申诉前的初版处理结论（已搁置）',
            'uploaded_by' => $clerk->id,
        ]);

        $this->addNode($case, NodeType::Report, CaseStatus::Pending, 'CKD-A330-03定位销遗失登记，受理', $clerk);
        $this->addNode($case, NodeType::Accept, CaseStatus::Processing, '确认遗失，按流程处理', $clerk);
        $this->addNode($case, NodeType::Process, CaseStatus::Reviewing, '初版处理：郑海涛全额赔偿¥5,600，提交复核', $clerk);
        $this->addNode($case, NodeType::Review, CaseStatus::Reviewing, '复核通过初版结论，待执行', $approver);
        $this->addNode($case, NodeType::Appeal, CaseStatus::Appealing, '当事人郑海涛提出申诉，提交新证据：存在跨组借用未签字情况，原证据链存在断点。流程进入申诉处理状态，原结论暂停执行。', $approver);
    }

    private function addNode(ToolCase $case, NodeType $type, CaseStatus $status, string $content, User $operator): void
    {
        CaseNode::create([
            'case_id' => $case->id,
            'node_type' => $type->value,
            'status' => $status->value,
            'content' => $content,
            'snapshot' => [
                'status' => $status->value,
                'title' => $case->title,
                'type' => $case->type->value,
                'current_responsible' => $case->current_responsible,
            ],
            'operator_id' => $operator->id,
            'operator_name' => $operator->name,
            'operator_role' => $operator->role->value,
        ]);
    }
}
