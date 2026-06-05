User.create!([
  { name: '张店长', role: 'manager' },
  { name: '李顾问', role: 'consultant' },
  { name: '王顾问', role: 'consultant' },
  { name: '陈顾问', role: 'consultant' }
])

puts "✓ 创建了 4 个用户"

member = Member.create!(
  name: '王美丽',
  phone: '13800138000',
  email: 'wangmeili@example.com'
)

puts "✓ 创建了会员: 王美丽"

consultant1 = User.find_by(name: '李顾问')
consultant2 = User.find_by(name: '王顾问')
manager = User.find_by(name: '张店长')

package1 = CoursePackage.create!(
  member:,
  consultant: consultant1,
  name: '面部护理年卡',
  original_price: 9800.00,
  total_sessions: 48,
  remaining_sessions: 32,
  purchased_at: 3.months.ago,
  status: 'active',
  notes: '含补水、美白、抗衰各16次'
)

3.times do |i|
  package1.consumption_records.create!(
    service_name: '深层补水护理',
    sessions_used: 1,
    performed_by: consultant1,
    performed_at: (i + 1).weeks.ago,
    customer_notes: i == 0 ? '客户皮肤较干，建议增加保湿产品' : nil,
    record_type: 'normal'
  )
end

6.times do |i|
  package1.consumption_records.create!(
    service_name: '美白淡斑护理',
    sessions_used: 1,
    performed_by: consultant1,
    performed_at: (i + 4).weeks.ago,
    record_type: 'normal'
  )
end

package1.update!(remaining_sessions: 32)

puts "✓ 样本1: 正常消耗 - 面部护理年卡 (48次，剩余32次，已消耗9次补水+7次美白)"

package2 = CoursePackage.create!(
  member:,
  consultant: consultant2,
  name: '身体SPA套餐',
  original_price: 5680.00,
  total_sessions: 20,
  remaining_sessions: 8,
  purchased_at: 2.months.ago,
  status: 'active',
  notes: '含精油按摩和热石护理'
)

6.times do |i|
  package2.consumption_records.create!(
    service_name: '全身精油按摩',
    sessions_used: 1,
    performed_by: consultant2,
    performed_at: (i + 1).weeks.ago,
    record_type: 'normal'
  )
end

package2.consumption_records.create!(
  service_name: '换购面部刮痧项目',
  sessions_used: 2,
  performed_by: consultant2,
  performed_at: 1.week.ago,
  customer_notes: '客户要求用2次身体SPA换购价值相等的面部刮痧',
  record_type: 'exchange'
)

package2.consumption_records.create!(
  service_name: '换购颈部护理',
  sessions_used: 1,
  performed_by: consultant2,
  performed_at: 3.days.ago,
  customer_notes: '换购一次颈部护理',
  record_type: 'exchange'
)

package2.update!(remaining_sessions: 10)

puts "✓ 样本2: 项目换购 - 身体SPA套餐 (20次，剩余10次，含2次换购记录)"

package2.transfer_consultant!(consultant1, manager, '王顾问离职，转交李顾问跟进')

puts "✓ 样本3: 顾问转交 - 从王顾问转交给李顾问"

package3 = CoursePackage.create!(
  member:,
  consultant: consultant1,
  name: '至尊VIP综合卡',
  original_price: 19800.00,
  total_sessions: 100,
  remaining_sessions: 65,
  purchased_at: 6.months.ago,
  status: 'refund_pending',
  notes: '综合美容卡，全项目通用'
)

25.times do |i|
  package3.consumption_records.create!(
    service_name: ['面部护理', '身体护理', '手部护理'].sample,
    sessions_used: 1,
    performed_by: consultant1,
    performed_at: (i + 1).days.ago,
    record_type: 'normal'
  )
end

package3.update!(remaining_sessions: 75)

review_node = package3.review_nodes.create!(
  reviewer: consultant1,
  status: 'pending',
  refund_amount: package3.calculate_refund('standard'),
  refund_algorithm: 'standard',
  dispute_reason: '客户因搬家距离太远，申请全额退款'
)

package3.update!(status: 'refund_pending')

puts "✓ 样本4: 退款待复核 - 至尊VIP综合卡 (申请退款中)"

package4 = CoursePackage.create!(
  member:,
  consultant: consultant2,
  name: '纤体塑形套餐',
  original_price: 12800.00,
  total_sessions: 30,
  remaining_sessions: 18,
  purchased_at: 4.months.ago,
  status: 'refund_approved',
  notes: '仪器塑形项目'
)

8.times do |i|
  package4.consumption_records.create!(
    service_name: '超声刀塑形',
    sessions_used: 1,
    performed_by: consultant2,
    performed_at: (i + 1).weeks.ago,
    record_type: 'normal'
  )
end

package4.update!(remaining_sessions: 22)

old_node = package4.review_nodes.create!(
  reviewer: consultant1,
  status: 'approved',
  refund_amount: package4.calculate_refund('penalty'),
  refund_algorithm: 'penalty',
  review_notes: '首次批准按违约金算法',
  reviewed_at: 1.week.ago
)
package4.update!(status: 'refund_approved')

package4.review_nodes.create!(
  reviewer: manager,
  status: 'archived',
  refund_amount: package4.calculate_refund('penalty'),
  refund_algorithm: 'penalty',
  parent_node: old_node,
  reviewed_at: 5.days.ago
)
package4.update!(status: 'archived')

puts "✓ 样本5: 已归档 - 纤体塑形套餐"

package5 = CoursePackage.create!(
  member:,
  consultant: consultant1,
  name: '眼部护理年卡',
  original_price: 3800.00,
  total_sessions: 24,
  remaining_sessions: 12,
  purchased_at: 5.months.ago,
  status: 'refund_pending'
)

8.times do |i|
  package5.consumption_records.create!(
    service_name: '眼部抗衰护理',
    sessions_used: 1,
    performed_by: consultant1,
    performed_at: (i + 1).weeks.ago,
    record_type: 'normal'
  )
end

package5.update!(remaining_sessions: 16)

archived_node = package5.review_nodes.create!(
  reviewer: consultant1,
  status: 'archived',
  refund_amount: package5.calculate_refund('standard'),
  refund_algorithm: 'standard',
  reviewed_at: 2.weeks.ago
)
package5.update!(status: 'archived')

archived_node.reopen!(
  manager,
  'discounted',
  '客户提出异议，店长介入重新审核，改用优惠算法'
)

puts "✓ 样本6: 退款金额争议 - 眼部护理年卡 (有争议记录，显示新旧算法对比)"

puts ""
puts "🎉 所有样本数据创建完成！"
puts "=" * 50
puts "登录账号切换方式：点击右上角用户名切换"
puts "- 张店长 (manager) - 可复核、转交、归档、返工"
puts "- 李顾问 (consultant) - 可登记消耗、换购、申请退款"
puts "- 王顾问 (consultant)"
puts "- 陈顾问 (consultant)"
