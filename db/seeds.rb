customer1 = Customer.find_or_create_by!(name: '上海印刷科技有限公司', contact: '张经理', phone: '13800138001', email: 'zhang@shprint.com')
customer2 = Customer.find_or_create_by!(name: '北京广告设计公司', contact: '李总监', phone: '13900139002', email: 'li@bjads.com')
customer3 = Customer.find_or_create_by!(name: '广州包装制品厂', contact: '王总', phone: '13700137003', email: 'wang@gzpack.com')
customer4 = Customer.find_or_create_by!(name: '深圳创意设计工作室', contact: '陈设计师', phone: '13600136004', email: 'chen@szdesign.com')

work_order1 = WorkOrder.create!(
  customer: customer1,
  category: '画册',
  target_color: 'CMYK(100,0,0,0)',
  paper_type: '铜版纸200g',
  machine: '海德堡CD102',
  responsible_person: '刘师傅',
  status: 'completed',
  remark: '年度宣传画册'
)
work_order1.work_order_histories.create!(previous_status: nil, current_status: 'draft', operator: '业务经办', action: '创建工单', remark: '工单创建')
work_order1.work_order_histories.create!(previous_status: 'draft', current_status: 'pending_proof', operator: '业务经办', action: '提交工单等待打样', remark: '')
proof1 = work_order1.proofs.create!(version: 1, submitter: '车间小王', submitted_at: 5.days.ago, status: 'confirmed')
proof1.color_measurements.create!(l_value: 65.2, a_value: -2.1, b_value: 15.3, delta_e: 1.8, inspector: '质检小李', measured_at: 4.days.ago, is_qualified: true)
work_order1.work_order_histories.create!(previous_status: 'pending_proof', current_status: 'proof_submitted', operator: '车间小王', action: '提交打样', remark: '提交打样 v1')
work_order1.work_order_histories.create!(previous_status: 'proof_submitted', current_status: 'color_measured', operator: '质检小李', action: '完成色差检测', remark: '色差检测完成，ΔE=1.8')
work_order1.work_order_histories.create!(previous_status: 'color_measured', current_status: 'customer_confirmed', operator: '张经理', action: '客户确认', remark: '')
work_order1.work_order_histories.create!(previous_status: 'customer_confirmed', current_status: 'in_production', operator: '刘师傅', action: '进入批量生产', remark: '')
work_order1.work_order_histories.create!(previous_status: 'in_production', current_status: 'completed', operator: '刘师傅', action: '工单完成', remark: '')

work_order2 = WorkOrder.create!(
  customer: customer2,
  category: '海报',
  target_color: 'CMYK(0,100,100,0)',
  paper_type: '哑粉纸157g',
  machine: '罗兰700',
  responsible_person: '赵师傅',
  status: 'rejected',
  remark: '新品发布会海报'
)
work_order2.work_order_histories.create!(previous_status: nil, current_status: 'draft', operator: '业务经办', action: '创建工单', remark: '工单创建')
work_order2.work_order_histories.create!(previous_status: 'draft', current_status: 'pending_proof', operator: '业务经办', action: '提交工单等待打样', remark: '')
proof2 = work_order2.proofs.create!(version: 1, submitter: '车间小张', submitted_at: 3.days.ago, status: 'measured')
proof2.color_measurements.create!(l_value: 58.7, a_value: 45.2, b_value: 52.1, delta_e: 4.5, inspector: '质检小李', measured_at: 2.days.ago, is_qualified: false)
work_order2.work_order_histories.create!(previous_status: 'pending_proof', current_status: 'proof_submitted', operator: '车间小张', action: '提交打样', remark: '提交打样 v1')
work_order2.work_order_histories.create!(previous_status: 'proof_submitted', current_status: 'color_measured', operator: '质检小李', action: '完成色差检测', remark: '色差检测完成，ΔE=4.5')
work_order2.work_order_histories.create!(previous_status: 'color_measured', current_status: 'rejected', operator: '李总监', action: '客户拒绝/返工', remark: '客户拒绝：色差超标')

work_order3 = WorkOrder.create!(
  customer: customer3,
  category: '包装盒',
  target_color: 'CMYK(60,40,0,20)',
  paper_type: '白卡纸300g',
  machine: '海德堡CD102',
  responsible_person: '孙师傅',
  status: 'rejected',
  remark: '食品包装盒'
)
work_order3.work_order_histories.create!(previous_status: nil, current_status: 'draft', operator: '业务经办', action: '创建工单', remark: '工单创建')
work_order3.work_order_histories.create!(previous_status: 'draft', current_status: 'pending_proof', operator: '业务经办', action: '提交工单等待打样', remark: '')
proof3 = work_order3.proofs.create!(version: 1, submitter: '车间小王', submitted_at: 6.days.ago, status: 'rejected')
proof3.color_measurements.create!(l_value: 72.3, a_value: -3.2, b_value: 8.5, delta_e: 2.1, inspector: '质检小张', measured_at: 5.days.ago, is_qualified: true)
work_order3.work_order_histories.create!(previous_status: 'pending_proof', current_status: 'proof_submitted', operator: '车间小王', action: '提交打样', remark: '提交打样 v1')
work_order3.work_order_histories.create!(previous_status: 'proof_submitted', current_status: 'color_measured', operator: '质检小张', action: '完成色差检测', remark: '色差检测完成，ΔE=2.1')
work_order3.work_order_histories.create!(previous_status: 'color_measured', current_status: 'customer_confirmed', operator: '王总', action: '客户确认', remark: '')
work_order3.work_order_histories.create!(previous_status: 'customer_confirmed', current_status: 'rejected', operator: '王总', action: '客户拒绝/返工', remark: '客户拒绝：纸张替换')

work_order4 = WorkOrder.create!(
  customer: customer4,
  category: '宣传单',
  target_color: 'CMYK(0,0,100,0)',
  paper_type: '双胶纸100g',
  machine: '小森L440',
  responsible_person: '周师傅',
  status: 'color_measured',
  remark: '开业促销宣传单'
)
work_order4.work_order_histories.create!(previous_status: nil, current_status: 'draft', operator: '业务经办', action: '创建工单', remark: '工单创建')
work_order4.work_order_histories.create!(previous_status: 'draft', current_status: 'pending_proof', operator: '业务经办', action: '提交工单等待打样', remark: '')
proof4 = work_order4.proofs.create!(version: 1, submitter: '车间小李', submitted_at: 8.days.ago, status: 'measured')
proof4.color_measurements.create!(l_value: 85.6, a_value: -1.2, b_value: 92.3, delta_e: 2.5, inspector: '质检小张', measured_at: 7.days.ago, is_qualified: true)
work_order4.work_order_histories.create!(previous_status: 'pending_proof', current_status: 'proof_submitted', operator: '车间小李', action: '提交打样', remark: '提交打样 v1')
work_order4.work_order_histories.create!(previous_status: 'proof_submitted', current_status: 'color_measured', operator: '质检小张', action: '完成色差检测', remark: '色差检测完成，ΔE=2.5')

work_order5 = WorkOrder.create!(
  customer: customer1,
  category: '说明书',
  target_color: 'CMYK(0,0,0,80)',
  paper_type: '书写纸80g',
  machine: '海德堡SM74',
  responsible_person: '吴师傅',
  status: 'pending_proof',
  remark: '产品说明书'
)
work_order5.work_order_histories.create!(previous_status: nil, current_status: 'draft', operator: '业务经办', action: '创建工单', remark: '工单创建')
work_order5.work_order_histories.create!(previous_status: 'draft', current_status: 'pending_proof', operator: '业务经办', action: '提交工单等待打样', remark: '')

work_order6 = WorkOrder.create!(
  customer: customer2,
  category: '折页',
  target_color: 'CMYK(30,80,0,0)',
  paper_type: '铜版纸157g',
  machine: '罗兰700',
  responsible_person: '郑师傅',
  status: 'in_production',
  remark: '活动折页'
)
work_order6.work_order_histories.create!(previous_status: nil, current_status: 'draft', operator: '业务经办', action: '创建工单', remark: '工单创建')
work_order6.work_order_histories.create!(previous_status: 'draft', current_status: 'pending_proof', operator: '业务经办', action: '提交工单等待打样', remark: '')
proof6 = work_order6.proofs.create!(version: 1, submitter: '车间小张', submitted_at: 4.days.ago, status: 'confirmed')
proof6.color_measurements.create!(l_value: 70.2, a_value: 28.5, b_value: -5.2, delta_e: 1.5, inspector: '质检小李', measured_at: 3.days.ago, is_qualified: true)
work_order6.work_order_histories.create!(previous_status: 'pending_proof', current_status: 'proof_submitted', operator: '车间小张', action: '提交打样', remark: '提交打样 v1')
work_order6.work_order_histories.create!(previous_status: 'proof_submitted', current_status: 'color_measured', operator: '质检小李', action: '完成色差检测', remark: '色差检测完成，ΔE=1.5')
work_order6.work_order_histories.create!(previous_status: 'color_measured', current_status: 'customer_confirmed', operator: '李总监', action: '客户确认', remark: '')
work_order6.work_order_histories.create!(previous_status: 'customer_confirmed', current_status: 'in_production', operator: '郑师傅', action: '进入批量生产', remark: '')

work_order7 = WorkOrder.create!(
  customer: customer4,
  category: '海报',
  target_color: 'CMYK(100,60,0,0)',
  paper_type: '铜版纸157g',
  machine: '海德堡CD102',
  responsible_person: '周师傅',
  status: 'customer_confirmed',
  remark: '客户延迟确认样本 - 确认耗时较长'
)
work_order7.work_order_histories.create!(previous_status: nil, current_status: 'draft', operator: '业务经办', action: '创建工单', remark: '工单创建', created_at: 16.days.ago)
work_order7.work_order_histories.create!(previous_status: 'draft', current_status: 'pending_proof', operator: '业务经办', action: '提交工单等待打样', remark: '', created_at: 15.days.ago)
proof7 = work_order7.proofs.create!(version: 1, submitter: '车间小李', submitted_at: 15.days.ago, status: 'measured')
proof7.color_measurements.create!(l_value: 68.5, a_value: 52.3, b_value: 12.8, delta_e: 2.2, inspector: '质检小张', measured_at: 14.days.ago, is_qualified: true)
work_order7.work_order_histories.create!(previous_status: 'pending_proof', current_status: 'proof_submitted', operator: '车间小李', action: '提交打样', remark: '提交打样 v1', created_at: 15.days.ago)
work_order7.work_order_histories.create!(previous_status: 'proof_submitted', current_status: 'color_measured', operator: '质检小张', action: '完成色差检测', remark: '色差检测完成，ΔE=2.2', created_at: 14.days.ago)
work_order7.work_order_histories.create!(previous_status: 'color_measured', current_status: 'customer_confirmed', operator: '陈设计师', action: '客户确认', remark: '', created_at: 2.days.ago)

puts 'Seed data created successfully!'
puts "#{Customer.count} customers created"
puts "#{WorkOrder.count} work orders created"
puts "#{Proof.count} proofs created"
puts "#{ColorMeasurement.count} color measurements created"
puts "#{WorkOrderHistory.count} work order histories created"