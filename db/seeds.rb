puts '===== 开始创建种子数据 ====='

Current.user = User.new(role: 'admin')

handler1 = User.find_or_create_by!(username: 'handler1') do |u|
  u.name = '张三（一线处理人）'
  u.password = '123456'
  u.role = 'handler'
  u.email = 'handler1@example.com'
  u.phone = '13800138001'
  u.department = '环卫一所'
end

handler2 = User.find_or_create_by!(username: 'handler2') do |u|
  u.name = '李四（一线处理人）'
  u.password = '123456'
  u.role = 'handler'
  u.email = 'handler2@example.com'
  u.phone = '13800138002'
  u.department = '环卫二所'
end

reviewer1 = User.find_or_create_by!(username: 'reviewer1') do |u|
  u.name = '王五（质控复核人）'
  u.password = '123456'
  u.role = 'reviewer'
  u.email = 'reviewer1@example.com'
  u.phone = '13900139001'
  u.department = '质控部'
end

reviewer2 = User.find_or_create_by!(username: 'reviewer2') do |u|
  u.name = '赵六（质控复核人）'
  u.password = '123456'
  u.role = 'reviewer'
  u.email = 'reviewer2@example.com'
  u.phone = '13900139002'
  u.department = '质控部'
end

admin = User.find_or_create_by!(username: 'admin') do |u|
  u.name = '系统管理员'
  u.password = '123456'
  u.role = 'admin'
  u.email = 'admin@example.com'
  u.phone = '13000130000'
  u.department = '信息科'
end

puts '✅ 测试账户创建完成'

def create_inspection_record(attrs)
  InspectionRecord.create!(attrs)
end

def add_correction_record(record, user, is_abnormal = false)
  record.correction_records.create!(
    business_record: is_abnormal ? '异常业务处理记录：需要特别关注责任主体资格问题' : '正常业务处理记录：按照标准流程完成整改',
    site_description: is_abnormal ? '现场核实发现保洁人员无上岗证，属于资格不符' : '现场检查确认：地面有污渍、便池有异味、洗手台积水',
    correction_measure: is_abnormal ? '1. 通知责任单位更换合格保洁人员；2. 对责任单位进行约谈警告；3. 重新安排合格人员上岗' : '1. 安排保洁人员全面清洁；2. 补充消毒物资；3. 检查设施设备',
    correction_result: is_abnormal ? '已更换合格保洁人员，整改完成' : '已完成全面清洁，各项指标达标',
    correction_time: Time.current - 30.minutes,
    operator: user.name,
    handler: user,
    remark: is_abnormal ? '异常样本，已按补救路径处理' : '正常交付样本'
  )
end

def with_current_user(user)
  original_user = Current.user
  Current.user = user
  yield
ensure
  Current.user = original_user
end

puts '===== 创建四类样本数据 ====='

date_str = Time.current.strftime('%Y%m%d')

sample1 = create_inspection_record(
  record_no: "XC#{date_str}0001",
  toilet_name: '人民广场东侧公厕',
  toilet_address: '人民大道100号东侧',
  inspection_time: Time.current - 2.days,
  source: 'daily_inspection',
  defect_type: 'cleanliness',
  sample_type: 'normal_delivery',
  defect_level: 'minor',
  description: '地面有明显污渍，洗手台有积水，便池有异味',
  score_before: 72,
  score_after: 95,
  department: '环卫一所',
  responsible_unit: '城市环卫服务有限公司',
  responsible_person: '张三',
  contact_phone: '13900000001',
  handler_id: handler1.id,
  reviewer_id: reviewer1.id,
  fine_amount: 500.00,
  reward_amount: 0,
  evidence_conclusion: '有效',
  basis: '城市公厕保洁标准第3.1条',
  conclusion: '整改合格，通过复核',
  review_comment: '整改到位，评分合理，同意归档',
  deadline: Time.current + 1.day
)

with_current_user(handler1) { sample1.accept! }
with_current_user(handler1) { sample1.process! }
add_correction_record(sample1, handler1)
with_current_user(handler1) { sample1.submit_review! }
with_current_user(reviewer1) { sample1.start_review! }
with_current_user(reviewer1) { sample1.archive! }
puts '✅ 样本1：正常交付（已归档）'

sample2 = create_inspection_record(
  record_no: "XC#{date_str}0002",
  toilet_name: '火车站北广场公厕',
  toilet_address: '站前路88号北广场',
  inspection_time: Time.current - 3.days,
  source: 'complaint',
  defect_type: 'facility',
  sample_type: 'qualification_mismatch',
  defect_level: 'major',
  description: '市民投诉公厕保洁人员未持证上岗，保洁质量不达标',
  block_reason: '责任单位派遣的保洁人员无《公厕保洁人员上岗证》，不符合《城市公厕管理办法》第15条规定，属于资格不符。根据合同条款第8.3条，此类情况可拒绝服务并扣除相应履约保证金。',
  remedy_path: '1. 立即通知责任单位更换合格保洁人员（24小时内）；2. 对责任单位发出书面警告；3. 按合同约定扣除本次服务费用的30%作为违约金；4. 重新安排具备资质的保洁人员上岗；5. 后续3天增加巡检频次。',
  diff_fields: { responsible_unit: ['城市环卫服务有限公司', '城市清洁服务有限公司'], score_before: [75, 68], fine_amount: [800, 1200] },
  score_before: 68,
  score_after: 82,
  department: '环卫二所',
  responsible_unit: '城市清洁服务有限公司',
  responsible_person: '李四',
  contact_phone: '13900000002',
  handler_id: handler2.id,
  reviewer_id: reviewer2.id,
  fine_amount: 1200.00,
  reward_amount: 0,
  evidence_conclusion: '有效',
  basis: '城市公厕管理办法第15条、合同条款第8.3条',
  conclusion: '资格不符，按异常流程处理',
  review_comment: '正在复核资格不符的处理流程，需要确认违约金计算是否准确',
  deadline: Time.current + 12.hours
)

with_current_user(handler2) { sample2.accept! }
with_current_user(handler2) { sample2.process! }
add_correction_record(sample2, handler2, true)
with_current_user(handler2) { sample2.submit_review! }
with_current_user(reviewer2) { sample2.start_review! }
puts '✅ 样本2：资格不符（复核中）'

sample3 = create_inspection_record(
  record_no: "XC#{date_str}0003",
  toilet_name: '市民公园南门公厕',
  toilet_address: '公园路50号南门',
  inspection_time: Time.current - 5.days,
  source: 'special_inspection',
  defect_type: 'maintenance',
  sample_type: 'time_window_conflict',
  defect_level: 'major',
  description: '创文检查期间发现公厕设备损坏，但报修时间与大型活动保障时间窗口冲突',
  block_reason: '该公厕位于市民公园南门，正处于创文检查关键期（6月10日-6月20日），且本周六有大型游园活动。常规维修需要关闭公厕48小时，与创文迎检和活动保障的时间窗口严重冲突。根据《应急保障预案》，此类情况需启动应急维修流程。',
  remedy_path: '1. 启动应急维修预案，采用夜间错峰施工方案（22:00-次日6:00）；2. 协调应急保洁队伍在施工期间加强周边流动厕所管理；3. 在公厕门口张贴临时公告，引导市民使用附近公厕；4. 维修完成后立即组织验收；5. 创文检查组备案说明情况。',
  diff_fields: { deadline: [(Time.current - 2.days).to_s, (Time.current + 3.days).to_s], fine_amount: [3000, 8000] },
  score_before: 65,
  score_after: 88,
  department: '环卫一所',
  responsible_unit: '市政设施维修有限公司',
  responsible_person: '王五',
  contact_phone: '13900000003',
  handler_id: handler1.id,
  reviewer_id: reviewer1.id,
  fine_amount: 8000.00,
  reward_amount: 0,
  evidence_conclusion: '待确认',
  basis: '应急保障预案第5.2条',
  conclusion: '时间窗口冲突，启动应急流程',
  deadline: Time.current + 3.days
)

with_current_user(handler1) { sample3.accept! }
with_current_user(handler1) { sample3.process! }
add_correction_record(sample3, handler1, true)
puts '✅ 样本3：时间窗口冲突（处理中）'

sample4 = create_inspection_record(
  record_no: "XC#{date_str}0004",
  toilet_name: '工业园区管委会公厕',
  toilet_address: '工业大道1号管委会大楼',
  inspection_time: Time.current - 4.days,
  source: 'third_party',
  defect_type: 'odor',
  sample_type: 'notification_unconfirmed',
  defect_level: 'critical',
  description: '第三方评估发现公厕异味严重，多次通知责任单位但未获确认回执',
  block_reason: '自6月10日首次发现问题以来，已通过系统通知、短信通知、电话通知三种方式告知责任单位，但责任单位始终未在《整改通知书确认回执》上签字确认。根据《合同履约管理办法》第12条，责任单位逾期未确认视同认可问题事实，但需固化通知证据后才能进入后续流程。',
  remedy_path: '1. 收集并固化三次通知的证据（系统通知截图、短信发送记录、通话录音）；2. 通过EMS邮寄《整改通知书》并留存快递底单；3. 邀请社区居委会作为第三方见证，现场确认问题现状；4. 以上证据齐全后，视同责任单位已确认；5. 启动正常整改流程，同时记录责任单位不配合行为，作为季度考核扣分依据。',
  diff_fields: { evidence_conclusion: ['待确认', '有效'], handler_id: [handler1.id, handler2.id] },
  score_before: 58,
  score_after: nil,
  department: '环卫二所',
  responsible_unit: '工业园区物业服务中心',
  responsible_person: '赵六',
  contact_phone: '13900000004',
  handler_id: handler2.id,
  reviewer_id: reviewer2.id,
  fine_amount: 1500.00,
  reward_amount: 0,
  evidence_conclusion: '待确认',
  basis: '合同履约管理办法第12条',
  conclusion: '通知未确认，需固化证据',
  deadline: Time.current + 5.days
)

with_current_user(handler2) { sample4.accept! }
puts '✅ 样本4：通知未确认（已受理）'

puts '===== 创建其他测试数据 ====='

toilets = [
  { name: '东大街公厕', address: '东大街12号' },
  { name: '西大街公厕', address: '西大街34号' },
  { name: '南大街公厕', address: '南大街56号' },
  { name: '北大街公厕', address: '北大街78号' },
  { name: '中心广场公厕', address: '中心广场负一楼' }
]

sources = ['daily_inspection', 'complaint', 'special_inspection', 'third_party', 'daily_inspection']
defect_types = ['cleanliness', 'facility', 'maintenance', 'odor', 'cleanliness']
sample_types = ['normal_delivery', 'normal_delivery', 'qualification_mismatch', 'time_window_conflict', 'normal_delivery']
defect_descriptions = ['地面有污渍', '冲水阀损坏', '灯具不亮', '异味严重', '洗手台积水']
defect_levels = ['minor', 'minor', 'major', 'major', 'minor']
scores_before = [75, 70, 68, 60, 78]
scores_after = [92, 88, nil, nil, nil]
responsible_units = ['城市环卫服务有限公司', '市政设施维修有限公司', '城市清洁服务有限公司', '工业园区物业服务中心', '城市环卫服务有限公司']
responsible_persons = ['陈一', '林二', '黄三', '周八', '吴九']
contact_phones = ['13900000011', '13900000012', '13900000013', '13900000014', '13900000015']
handlers = [handler1, handler2, handler1, handler2, handler1]
reviewers = [reviewer1, reviewer2, reviewer1, reviewer2, reviewer1]
amounts = [300, 1500, 2000, 800, 250]
evidence_conclusions = ['有效', '有效', '待确认', '待确认', '有效']
departments = ['环卫一所', '环卫二所', '环卫一所', '环卫二所', '环卫一所']

5.times do |i|
  record = create_inspection_record(
    record_no: "XC#{date_str}#{'%04d' % (i + 5)}",
    toilet_name: toilets[i][:name],
    toilet_address: toilets[i][:address],
    inspection_time: Time.current - (i + 1).days,
    source: sources[i],
    defect_type: defect_types[i],
    sample_type: sample_types[i],
    defect_level: defect_levels[i],
    description: defect_descriptions[i],
    score_before: scores_before[i],
    score_after: scores_after[i],
    department: departments[i],
    responsible_unit: responsible_units[i],
    responsible_person: responsible_persons[i],
    contact_phone: contact_phones[i],
    handler_id: handlers[i].id,
    reviewer_id: reviewers[i].id,
    fine_amount: amounts[i],
    reward_amount: 0,
    evidence_conclusion: evidence_conclusions[i],
    basis: "城市公厕保洁标准第#{i + 1}.#{i + 1}条",
    conclusion: i < 2 ? '整改合格，通过复核' : (i == 2 ? '资格不符，待核实' : (i == 3 ? '时间冲突，待处理' : '新受理，待处理')),
    review_comment: i == 0 ? '整改合格，归档' : nil,
    block_reason: i == 2 ? '保洁人员资质存疑' : (i == 3 ? '通知未送达' : nil),
    remedy_path: i == 2 ? '核实资质后处理' : (i == 3 ? '重新通知' : nil),
    diff_fields: nil,
    deadline: Time.current + (i + 2).days
  )

  h = handlers[i]
  r = reviewers[i]

  if i == 0
    with_current_user(h) { record.accept! }
    with_current_user(h) { record.process! }
    add_correction_record(record, h)
    with_current_user(h) { record.submit_review! }
    with_current_user(r) { record.start_review! }
    with_current_user(r) { record.archive! }
  elsif i == 1
    with_current_user(h) { record.accept! }
    with_current_user(h) { record.process! }
    add_correction_record(record, h)
    with_current_user(h) { record.submit_review! }
  elsif i == 2
    with_current_user(h) { record.accept! }
    with_current_user(h) { record.process! }
    add_correction_record(record, h, true)
  elsif i == 4
    with_current_user(h) { record.accept! }
  end
end

puts '✅ 其他测试数据创建完成'

puts ''
puts '===== 种子数据创建完成 ====='
puts ''
puts '测试账户信息：'
puts '  一线处理人：handler1 / 123456 （张三）'
puts '  一线处理人：handler2 / 123456 （李四）'
puts '  质控复核人：reviewer1 / 123456 （王五）'
puts '  质控复核人：reviewer2 / 123456 （赵六）'
puts '  系统管理员：admin / 123456'
puts ''
puts '四类样本：'
puts "  ✅ #{sample1.record_no} - #{sample1.toilet_name} - 正常交付（已归档）"
puts "  ⚠️  #{sample2.record_no} - #{sample2.toilet_name} - 资格不符（复核中）"
puts "  ⚠️  #{sample3.record_no} - #{sample3.toilet_name} - 时间窗口冲突（处理中）"
puts "  ⚠️  #{sample4.record_no} - #{sample4.toilet_name} - 通知未确认（已受理）"
puts ''
puts '共计创建：'
puts "  用户：#{User.count} 个"
puts "  巡检记录：#{InspectionRecord.count} 条"
puts "  工作流节点：#{WorkflowNode.count} 个"
puts "  整改记录：#{CorrectionRecord.count} 条"
