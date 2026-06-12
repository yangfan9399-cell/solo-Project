puts "Seeding database..."

User.create_with(name: "一线张工", role: :field_handler, password: "password")
  .find_or_create_by!(email: "zhang@example.com")
User.create_with(name: "一线李工", role: :field_handler, password: "password")
  .find_or_create_by!(email: "li@example.com")
User.create_with(name: "质控王工", role: :quality_reviewer, password: "password")
  .find_or_create_by!(email: "wang@example.com")
User.create_with(name: "质控赵工", role: :quality_reviewer, password: "password")
  .find_or_create_by!(email: "zhao@example.com")
User.create_with(name: "管理员", role: :admin, password: "password")
  .find_or_create_by!(email: "admin@example.com")

puts "Users created."

field_zhang = User.find_by(email: "zhang@example.com")
field_li = User.find_by(email: "li@example.com")
qc_wang = User.find_by(email: "wang@example.com")
qc_zhao = User.find_by(email: "zhao@example.com")
admin = User.find_by(email: "admin@example.com")

def create_normal_sample(reporter, owner, reviewer)
  record = FaultRecord.create!(
    ticket_no: "PD-NORMAL-#{rand(1000..9999)}",
    source_type: :system_report,
    line_name: "1号线",
    station_name: "人民广场站",
    platform_door_no: "A-12",
    fault_type: :door_not_closing,
    fault_level: :general,
    fault_description: "站台门A-12关门到位信号丢失，门无法正常关闭",
    reported_at: 2.hours.ago,
    current_status: :archived,
    reporter: reporter,
    current_owner: owner,
    responsible_unit: "第一维修工区",
    responsible_person: owner.name,
    maintenance_window_start: 1.hour.ago.beginning_of_hour,
    maintenance_window_end: 1.hour.ago.beginning_of_hour + 45.minutes,
    actual_start_at: 1.hour.ago.beginning_of_hour + 5.minutes,
    actual_end_at: 1.hour.ago.beginning_of_hour + 38.minutes,
    estimated_cost: 350.00,
    actual_cost: 320.00,
    notified_confirmation: true,
    handler_qualified: true,
    on_site_description: "现场检查发现门控单元DCU接线松动，重新紧固后恢复正常。测试三次开关门均正常。",
    business_record: "工单号WO-2024-0612-001；维修人员：张工；到达时间：09:35；完成时间：10:13",
    conclusion: "经紧固DCU接线端子，站台门A-12已恢复正常运营，符合交付标准。",
    basis_doc: "《轨道交通站台门维护规程V3.2》第6.3.2条；《电气接线检查作业指导书》",
    abnormal_type: :normal,
    blocking_reason: nil,
    remediation_path: nil,
    is_archived: true
  )

  node1 = record.workflow_nodes.create!(
    node_type: :status_change, from_status: nil, to_status: FaultRecord.current_statuses[:pending_acceptance],
    operator: reporter, action_type: :create_record, comment: "系统检测到故障自动生成工单",
    snapshot_data: {}, processed_at: record.reported_at
  )

  node2 = record.workflow_nodes.create!(
    node_type: :status_change,
    from_status: FaultRecord.current_statuses[:pending_acceptance],
    to_status: FaultRecord.current_statuses[:accepted],
    operator: reviewer, action_type: :accept, comment: "已受理，安排张工处理",
    processed_at: record.reported_at + 5.minutes
  )

  node3 = record.workflow_nodes.create!(
    node_type: :status_change,
    from_status: FaultRecord.current_statuses[:accepted],
    to_status: FaultRecord.current_statuses[:processing],
    operator: reviewer, action_type: :assign_handler, comment: "分配给张工",
    processed_at: record.reported_at + 8.minutes
  )

  node4 = record.workflow_nodes.create!(
    node_type: :info_update,
    from_status: FaultRecord.current_statuses[:processing],
    to_status: FaultRecord.current_statuses[:processing],
    operator: owner, action_type: :update_info, comment: "现场处理：紧固DCU接线",
    processed_at: record.actual_start_at
  )

  EvidenceAttachment.create!(
    fault_record: record, workflow_node: node4, uploader: owner,
    attachment_type: :photo, description: "DCU接线端子紧固前照片",
    file_name: "dcu_before.jpg", content_type: "image/jpeg", file_size: 1_024_000
  )
  EvidenceAttachment.create!(
    fault_record: record, workflow_node: node4, uploader: owner,
    attachment_type: :photo, description: "DCU接线端子紧固后照片",
    file_name: "dcu_after.jpg", content_type: "image/jpeg", file_size: 980_000
  )

  node5 = record.workflow_nodes.create!(
    node_type: :status_change,
    from_status: FaultRecord.current_statuses[:processing],
    to_status: FaultRecord.current_statuses[:pending_review],
    operator: owner, action_type: :submit_for_review, comment: "处理完成，提交复核",
    processed_at: record.actual_end_at
  )

  node6 = record.workflow_nodes.create!(
    node_type: :status_change,
    from_status: FaultRecord.current_statuses[:pending_review],
    to_status: FaultRecord.current_statuses[:reviewing],
    operator: reviewer, action_type: :process, comment: "开始复核",
    processed_at: record.actual_end_at + 3.minutes
  )

  node7 = record.workflow_nodes.create!(
    node_type: :status_change,
    from_status: FaultRecord.current_statuses[:reviewing],
    to_status: FaultRecord.current_statuses[:archived],
    operator: reviewer, action_type: :archive, comment: "复核通过，材料完整，归档",
    processed_at: record.actual_end_at + 12.minutes
  )

  DiffSnapshot.create!(
    fault_record: record, workflow_node: node4,
    field_name: "actual_start_at", before_value: "",
    after_value: record.actual_start_at.to_s, diff_type: :critical_time
  )
  DiffSnapshot.create!(
    fault_record: record, workflow_node: node4,
    field_name: "on_site_description", before_value: "",
    after_value: record.on_site_description, diff_type: :normal
  )
  DiffSnapshot.create!(
    fault_record: record, workflow_node: node5,
    field_name: "actual_end_at", before_value: "",
    after_value: record.actual_end_at.to_s, diff_type: :critical_time
  )
  DiffSnapshot.create!(
    fault_record: record, workflow_node: node5,
    field_name: "actual_cost", before_value: "0",
    after_value: record.actual_cost.to_s, diff_type: :amount
  )

  record
end

def create_qualification_mismatch_sample(reporter, owner, reviewer)
  record = FaultRecord.create!(
    ticket_no: "PD-QUAL-#{rand(1000..9999)}",
    source_type: :inspection,
    line_name: "2号线",
    station_name: "静安寺站",
    platform_door_no: "B-05",
    fault_type: :sensor_fault,
    fault_level: :major,
    fault_description: "红外传感器报警，安全回路断开",
    reported_at: 5.hours.ago,
    current_status: :returned_for_supplement,
    reporter: reporter,
    current_owner: owner,
    responsible_unit: "第二维修工区",
    responsible_person: owner.name,
    maintenance_window_start: 4.hours.ago.beginning_of_hour,
    maintenance_window_end: 4.hours.ago.beginning_of_hour + 60.minutes,
    actual_start_at: 4.hours.ago.beginning_of_hour + 10.minutes,
    actual_end_at: 4.hours.ago.beginning_of_hour + 55.minutes,
    estimated_cost: 1500.00,
    actual_cost: 1380.00,
    notified_confirmation: true,
    handler_qualified: false,
    on_site_description: "更换红外传感器组件，调整光路。",
    business_record: "处理人员未提供站台门高级维修资质证书",
    conclusion: "传感器更换完成，但处理人员资质存疑",
    basis_doc: "《站台门维修人员资质管理办法》",
    abnormal_type: :qualification_mismatch,
    blocking_reason: "处理人员资格不符合要求：处理人未持有站台门维修高级资质证书，仅持有初级证书，该故障等级为较大故障，需要高级及以上资质",
    remediation_path: "1. 重新指派具有站台门维修高级资质的人员对现场处理质量进行复核；2. 补签高级资质人员的确认记录；3. 对现有处理人员进行资质培训和升级考试",
    is_archived: false
  )

  node1 = record.workflow_nodes.create!(
    node_type: :status_change, from_status: nil, to_status: FaultRecord.current_statuses[:pending_acceptance],
    operator: reporter, action_type: :create_record, comment: "巡检发现",
    processed_at: record.reported_at
  )
  node2 = record.workflow_nodes.create!(
    node_type: :status_change,
    from_status: FaultRecord.current_statuses[:pending_acceptance],
    to_status: FaultRecord.current_statuses[:accepted],
    operator: reviewer, action_type: :accept, processed_at: record.reported_at + 3.minutes
  )
  node3 = record.workflow_nodes.create!(
    node_type: :status_change,
    from_status: FaultRecord.current_statuses[:accepted],
    to_status: FaultRecord.current_statuses[:processing],
    operator: reviewer, action_type: :assign_handler, comment: "分配给李工（注意：需确认资质）",
    processed_at: record.reported_at + 6.minutes
  )
  node4 = record.workflow_nodes.create!(
    node_type: :info_update,
    from_status: FaultRecord.current_statuses[:processing],
    to_status: FaultRecord.current_statuses[:processing],
    operator: owner, action_type: :update_info, comment: "现场处理完成",
    processed_at: record.actual_start_at
  )
  node5 = record.workflow_nodes.create!(
    node_type: :status_change,
    from_status: FaultRecord.current_statuses[:processing],
    to_status: FaultRecord.current_statuses[:pending_review],
    operator: owner, action_type: :submit_for_review, comment: "提交复核",
    processed_at: record.actual_end_at
  )
  node6 = record.workflow_nodes.create!(
    node_type: :status_change,
    from_status: FaultRecord.current_statuses[:pending_review],
    to_status: FaultRecord.current_statuses[:returned_for_supplement],
    operator: reviewer, action_type: :review_return,
    comment: "处理人资质不符合要求，需高级资质人员复核并补充材料",
    processed_at: record.actual_end_at + 20.minutes
  )

  DiffSnapshot.create!(
    fault_record: record, workflow_node: node4,
    field_name: "handler_qualified", before_value: "true",
    after_value: "false", diff_type: :evidence
  )
  DiffSnapshot.create!(
    fault_record: record, workflow_node: node5,
    field_name: "actual_cost", before_value: "0",
    after_value: "1380.0", diff_type: :amount
  )

  EvidenceAttachment.create!(
    fault_record: record, workflow_node: node4, uploader: owner,
    attachment_type: :maintenance_record, description: "传感器更换记录（但缺少资质章）",
    file_name: "sensor_replacement.pdf", content_type: "application/pdf", file_size: 2_048_000
  )

  record
end

def create_time_window_sample(reporter, owner, reviewer)
  record = FaultRecord.create!(
    ticket_no: "PD-TIME-#{rand(1000..9999)}",
    source_type: :manual_report,
    line_name: "3号线",
    station_name: "中山公园站",
    platform_door_no: "C-08",
    fault_type: :control_system_fault,
    fault_level: :major,
    fault_description: "门控网络通讯中断，多扇门无法联动",
    reported_at: 8.hours.ago,
    current_status: :processing,
    reporter: reporter,
    current_owner: owner,
    responsible_unit: "第三维修工区",
    responsible_person: owner.name,
    maintenance_window_start: 7.hours.ago.beginning_of_hour,
    maintenance_window_end: 7.hours.ago.beginning_of_hour + 90.minutes,
    actual_start_at: 7.hours.ago.beginning_of_hour + 120.minutes,
    actual_end_at: 7.hours.ago.beginning_of_hour + 150.minutes,
    estimated_cost: 2800.00,
    actual_cost: 3200.00,
    notified_confirmation: true,
    handler_qualified: true,
    on_site_description: "更换交换机模块，重新配置网络参数",
    business_record: "因等待备件延迟，实际作业超出计划窗口",
    conclusion: "处理中，超出作业窗口",
    basis_doc: "《夜间施工作业管理办法》",
    abnormal_type: :time_window_conflict,
    blocking_reason: "作业时间不在计划时间窗口内：计划窗口 [22:00-23:30]，实际作业时间为 [00:00-00:30]，超出时间窗口约30分钟",
    remediation_path: "1. 向运营管理部门提交超时作业说明及影响评估报告；2. 补办超时作业审批手续；3. 分析备件延误原因，优化备件调度流程；4. 修订应急预案，明确窗口外作业审批流程",
    is_archived: false
  )

  node1 = record.workflow_nodes.create!(
    node_type: :status_change, from_status: nil, to_status: FaultRecord.current_statuses[:pending_acceptance],
    operator: reporter, action_type: :create_record, comment: "OCC人工报修",
    processed_at: record.reported_at
  )
  node2 = record.workflow_nodes.create!(
    node_type: :status_change,
    from_status: FaultRecord.current_statuses[:pending_acceptance],
    to_status: FaultRecord.current_statuses[:accepted],
    operator: reviewer, action_type: :accept, processed_at: record.reported_at + 2.minutes
  )
  node3 = record.workflow_nodes.create!(
    node_type: :status_change,
    from_status: FaultRecord.current_statuses[:accepted],
    to_status: FaultRecord.current_statuses[:processing],
    operator: reviewer, action_type: :assign_handler, comment: "分配张工处理，注意时间窗口",
    processed_at: record.reported_at + 5.minutes
  )
  node4 = record.workflow_nodes.create!(
    node_type: :info_update,
    from_status: FaultRecord.current_statuses[:processing],
    to_status: FaultRecord.current_statuses[:processing],
    operator: owner, action_type: :update_info,
    comment: "备件迟到45分钟，作业将超出时间窗口，已上报",
    processed_at: record.actual_start_at
  )

  DiffSnapshot.create!(
    fault_record: record, workflow_node: node4,
    field_name: "maintenance_window_end",
    before_value: record.maintenance_window_end.to_s,
    after_value: (record.maintenance_window_end + 60.minutes).to_s, diff_type: :critical_time
  )
  DiffSnapshot.create!(
    fault_record: record, workflow_node: node4,
    field_name: "actual_start_at", before_value: "",
    after_value: record.actual_start_at.to_s, diff_type: :critical_time
  )

  record
end

def create_notification_sample(reporter, owner, reviewer)
  record = FaultRecord.create!(
    ticket_no: "PD-NOTIFY-#{rand(1000..9999)}",
    source_type: :passenger_report,
    line_name: "4号线",
    station_name: "世纪大道站",
    platform_door_no: "D-03",
    fault_type: :door_jammed,
    fault_level: :general,
    fault_description: "乘客夹物导致门体卡滞，反复开关",
    reported_at: 12.hours.ago,
    current_status: :pending_review,
    reporter: reporter,
    current_owner: owner,
    responsible_unit: "第四维修工区",
    responsible_person: owner.name,
    maintenance_window_start: 11.hours.ago.beginning_of_hour,
    maintenance_window_end: 11.hours.ago.beginning_of_hour + 30.minutes,
    actual_start_at: 11.hours.ago.beginning_of_hour + 3.minutes,
    actual_end_at: 11.hours.ago.beginning_of_hour + 22.minutes,
    estimated_cost: 200.00,
    actual_cost: 180.00,
    notified_confirmation: false,
    handler_qualified: true,
    on_site_description: "清理门缝异物（乘客掉落的雨伞），检查门体无损伤",
    business_record: "清理完成，恢复运营。但运营方尚未书面确认恢复通知",
    conclusion: "故障已排除，待运营方确认恢复",
    basis_doc: "《站台门异物清理作业流程》",
    abnormal_type: :notification_unconfirmed,
    blocking_reason: "恢复运营通知未被运营方确认：OCC已通过语音通知恢复，但尚未收到运营调度的书面确认回执",
    remediation_path: "1. 主动联系运营调度补发书面确认回执（可通过系统或邮件）；2. 若运营调度无法补发，需由站长级人员在现场确认记录上签字确认；3. 建立恢复通知双确认机制（语音+书面）",
    is_archived: false
  )

  node1 = record.workflow_nodes.create!(
    node_type: :status_change, from_status: nil, to_status: FaultRecord.current_statuses[:pending_acceptance],
    operator: reporter, action_type: :create_record, comment: "乘客服务中心转报",
    processed_at: record.reported_at
  )
  node2 = record.workflow_nodes.create!(
    node_type: :status_change,
    from_status: FaultRecord.current_statuses[:pending_acceptance],
    to_status: FaultRecord.current_statuses[:accepted],
    operator: reviewer, action_type: :accept, processed_at: record.reported_at + 1.minute
  )
  node3 = record.workflow_nodes.create!(
    node_type: :status_change,
    from_status: FaultRecord.current_statuses[:accepted],
    to_status: FaultRecord.current_statuses[:processing],
    operator: reviewer, action_type: :assign_handler, comment: "派李工前往",
    processed_at: record.reported_at + 2.minutes
  )
  node4 = record.workflow_nodes.create!(
    node_type: :info_update,
    from_status: FaultRecord.current_statuses[:processing],
    to_status: FaultRecord.current_statuses[:processing],
    operator: owner, action_type: :update_info, comment: "清理完成，已电话通知OCC恢复",
    processed_at: record.actual_end_at
  )
  node5 = record.workflow_nodes.create!(
    node_type: :status_change,
    from_status: FaultRecord.current_statuses[:processing],
    to_status: FaultRecord.current_statuses[:pending_review],
    operator: owner, action_type: :submit_for_review,
    comment: "提交复核，注意：运营方书面确认待补",
    processed_at: record.actual_end_at + 5.minutes
  )

  DiffSnapshot.create!(
    fault_record: record, workflow_node: node4,
    field_name: "notified_confirmation", before_value: "true",
    after_value: "false", diff_type: :evidence
  )
  DiffSnapshot.create!(
    fault_record: record, workflow_node: node5,
    field_name: "conclusion", before_value: "",
    after_value: record.conclusion, diff_type: :normal
  )

  EvidenceAttachment.create!(
    fault_record: record, workflow_node: node4, uploader: owner,
    attachment_type: :photo, description: "清理出的雨伞异物照片",
    file_name: "umbrella_foreign_object.jpg", content_type: "image/jpeg", file_size: 512_000
  )

  record
end

if FaultRecord.count == 0
  puts "Creating sample records..."

  normal = create_normal_sample(admin, field_zhang, qc_wang)
  puts "✓ 正常交付样本: #{normal.ticket_no}"

  qual = create_qualification_mismatch_sample(qc_zhao, field_li, qc_wang)
  puts "✓ 资格不符样本: #{qual.ticket_no}"

  time = create_time_window_sample(qc_wang, field_zhang, qc_zhao)
  puts "✓ 时间窗口冲突样本: #{time.ticket_no}"

  notify = create_notification_sample(field_li, field_zhang, qc_wang)
  puts "✓ 通知未确认样本: #{notify.ticket_no}"

  puts "\nSeed data completed. Total: #{FaultRecord.count} records"
else
  puts "Records already exist. Skipping seed."
end
