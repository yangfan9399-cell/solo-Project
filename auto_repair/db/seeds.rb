service_advisor = User.create!(name: '张服务', role: 'service_advisor', phone: '13800138001')
technician = User.create!(name: '李技师', role: 'technician', phone: '13800138002')
manager = User.create!(name: '王店长', role: 'manager', phone: '13800138003')
customer_service = User.create!(name: '陈客服', role: 'customer_service', phone: '13800138004')

vehicle1 = Vehicle.create!(
  plate_number: '京A12345',
  vin: 'LSVHJ6BM7JN123456',
  brand: '大众',
  model: '帕萨特',
  color: '黑色',
  year: 2020,
  mileage: 45000,
  owner_name: '刘先生',
  owner_phone: '13900139001'
)

vehicle2 = Vehicle.create!(
  plate_number: '京B67890',
  vin: 'LHGCR2F1XJ0123456',
  brand: '本田',
  model: '雅阁',
  color: '白色',
  year: 2019,
  mileage: 62000,
  owner_name: '赵女士',
  owner_phone: '13900139002'
)

vehicle3 = Vehicle.create!(
  plate_number: '京C11111',
  vin: 'WAUZZZ8KXAA123456',
  brand: '奥迪',
  model: 'A4L',
  color: '银色',
  year: 2021,
  mileage: 28000,
  owner_name: '孙先生',
  owner_phone: '13900139003'
)

vehicle4 = Vehicle.create!(
  plate_number: '京D22222',
  vin: 'WDDGF8BBXCR123456',
  brand: '奔驰',
  model: 'C200L',
  color: '红色',
  year: 2018,
  mileage: 85000,
  owner_name: '周女士',
  owner_phone: '13900139004'
)

normal_order = RepairOrder.create!(
  vehicle: vehicle1,
  service_advisor: service_advisor,
  technician: technician,
  manager: manager,
  customer_service: customer_service,
  status: 'archived',
  customer_description: '发动机异响，需要检修',
  budget_limit: 5000,
  total_amount: 3800,
  quote_approved: true,
  warranty_months: 3,
  warranty_expires_at: 3.months.from_now,
  archived: true
)

normal_order.add_history(service_advisor, '创建维修单', nil, 'other')

normal_order.faults.create!(
  title: '发动机怠速异响',
  description: '冷车启动时发动机有明显的"哒哒"异响，热车后减轻',
  reported_by: service_advisor,
  severity: 'high',
  category: 'engine'
)

normal_order.add_history(service_advisor, '记录故障', '发动机怠速异响', 'fault')

normal_order.quote_items.create!(
  item_type: 'labor',
  name: '发动机检修工时',
  description: '发动机拆解检查及组装',
  quantity: 4,
  unit_price: 200,
  total_price: 800,
  approved: true
)

normal_order.quote_items.create!(
  item_type: 'part',
  name: '正时链条套件',
  description: '原厂正时链条套装',
  quantity: 1,
  unit_price: 2500,
  total_price: 2500,
  approved: true
)

normal_order.quote_items.create!(
  item_type: 'part',
  name: '张紧器',
  description: '液压张紧器',
  quantity: 1,
  unit_price: 500,
  total_price: 500,
  approved: true
)

normal_order.add_history(service_advisor, '提交报价', '报价在预算内，自动确认', 'quote')

normal_order.parts.create!(
  name: '正时链条套件',
  part_number: '06K109158AD',
  brand: '大众原厂',
  quantity: 1,
  unit_price: 2500,
  status: 'used'
)

normal_order.parts.create!(
  name: '张紧器',
  part_number: '06K109467K',
  brand: '大众原厂',
  quantity: 1,
  unit_price: 500,
  status: 'used'
)

normal_order.add_history(technician, '开始维修', nil, 'repair')

normal_order.repair_logs.create!(
  technician: technician,
  title: '拆解检查',
  description: '拆解气门室盖，检查正时系统，确认正时链条磨损',
  started_at: 2.hours.ago,
  completed_at: 1.hour.ago,
  status: 'completed'
)

normal_order.repair_logs.create!(
  technician: technician,
  title: '更换正时链条',
  description: '更换正时链条和张紧器，重新校准正时',
  started_at: 1.hour.ago,
  completed_at: 30.minutes.ago,
  status: 'completed'
)

normal_order.update!(status: 'repair_completed')
normal_order.add_history(technician, '完成维修', nil, 'repair')

normal_order.update!(status: 'review_approved', manager_note: '检查无误，费用合理')
normal_order.add_history(manager, '复核通过', '检查无误，费用合理', 'review')

normal_order.follow_ups.create!(
  user: customer_service,
  follow_up_at: Time.current,
  contact_method: 'phone',
  satisfaction: 'very_satisfied',
  feedback: '车辆运行正常，没有异响了，服务很好',
  notes: '客户非常满意',
  completed: true
)

normal_order.update!(status: 'follow_up_completed')
normal_order.add_history(customer_service, '完成回访', '客户非常满意', 'followup')

normal_order.add_history(manager, '归档', nil, 'archive')

over_budget_order = RepairOrder.create!(
  vehicle: vehicle2,
  service_advisor: service_advisor,
  technician: technician,
  manager: manager,
  status: 'quote_over_budget',
  customer_description: '变速箱顿挫，需要大修',
  budget_limit: 8000,
  total_amount: 12500,
  quote_approved: false,
  warranty_months: 6
)

over_budget_order.add_history(service_advisor, '创建维修单', nil, 'other')

over_budget_order.faults.create!(
  title: '变速箱换挡顿挫',
  description: '低速换挡时有明显顿挫感，加速无力',
  reported_by: service_advisor,
  severity: 'critical',
  category: 'transmission'
)

over_budget_order.add_history(service_advisor, '记录故障', '变速箱换挡顿挫', 'fault')

over_budget_order.quote_items.create!(
  item_type: 'labor',
  name: '变速箱大修工时',
  description: '变速箱拆解、检修、组装',
  quantity: 8,
  unit_price: 300,
  total_price: 2400,
  approved: false
)

over_budget_order.quote_items.create!(
  item_type: 'part',
  name: '变速箱摩擦片套装',
  description: '原厂摩擦片套装',
  quantity: 1,
  unit_price: 4500,
  total_price: 4500,
  approved: false
)

over_budget_order.quote_items.create!(
  item_type: 'part',
  name: '变速箱阀体',
  description: '再制造阀体总成',
  quantity: 1,
  unit_price: 3800,
  total_price: 3800,
  approved: false
)

over_budget_order.quote_items.create!(
  item_type: 'part',
  name: '变速箱油',
  description: '原厂变速箱油12升',
  quantity: 12,
  unit_price: 150,
  total_price: 1800,
  approved: false
)

over_budget_order.add_history(service_advisor, '提交报价', "报价超出预算 ¥4500.00", 'quote')

out_of_stock_order = RepairOrder.create!(
  vehicle: vehicle3,
  service_advisor: service_advisor,
  technician: technician,
  status: 'parts_pending',
  customer_description: '前刹车异响',
  budget_limit: 3000,
  total_amount: 2800,
  quote_approved: true,
  warranty_months: 3
)

out_of_stock_order.add_history(service_advisor, '创建维修单', nil, 'other')

out_of_stock_order.faults.create!(
  title: '前刹车异响',
  description: '刹车时尖叫声明显，刹车片偏磨',
  reported_by: service_advisor,
  severity: 'medium',
  category: 'brakes'
)

out_of_stock_order.add_history(service_advisor, '记录故障', '前刹车异响', 'fault')

out_of_stock_order.quote_items.create!(
  item_type: 'labor',
  name: '前刹车片更换',
  description: '前刹车片更换及刹车盘光盘',
  quantity: 2,
  unit_price: 150,
  total_price: 300,
  approved: true
)

out_of_stock_order.quote_items.create!(
  item_type: 'part',
  name: '前刹车片',
  description: '原厂刹车片',
  quantity: 1,
  unit_price: 1500,
  total_price: 1500,
  approved: true
)

out_of_stock_order.quote_items.create!(
  item_type: 'part',
  name: '前刹车感应线',
  description: '刹车磨损传感器',
  quantity: 2,
  unit_price: 500,
  total_price: 1000,
  approved: true
)

out_of_stock_order.add_history(service_advisor, '提交报价', '报价在预算内，自动确认', 'quote')

out_of_stock_order.parts.create!(
  name: '前刹车片',
  part_number: '8W0698151AC',
  brand: '奥迪原厂',
  quantity: 1,
  unit_price: 1500,
  status: 'out_of_stock',
  notes: '缺货，预计3天后到货'
)

out_of_stock_order.parts.create!(
  name: '前刹车感应线',
  part_number: '8W0907637',
  brand: '奥迪原厂',
  quantity: 2,
  unit_price: 500,
  status: 'available'
)

out_of_stock_order.add_history(service_advisor, '存在缺货配件', '前刹车片缺货，无法开始维修', 'other')

warranty_parent = RepairOrder.create!(
  vehicle: vehicle4,
  service_advisor: service_advisor,
  technician: technician,
  manager: manager,
  customer_service: customer_service,
  status: 'archived',
  customer_description: '发动机故障灯亮',
  budget_limit: 2000,
  total_amount: 1500,
  quote_approved: true,
  warranty_months: 3,
  warranty_expires_at: 2.months.from_now,
  archived: true
)

warranty_parent.add_history(service_advisor, '创建维修单', nil, 'other')

warranty_parent.faults.create!(
  title: '发动机故障灯亮',
  description: '发动机故障灯点亮，读取故障码为氧传感器故障',
  reported_by: service_advisor,
  severity: 'medium',
  category: 'engine'
)

warranty_parent.add_history(service_advisor, '记录故障', '发动机故障灯亮', 'fault')

warranty_parent.quote_items.create!(
  item_type: 'labor',
  name: '更换氧传感器',
  description: '更换前氧传感器',
  quantity: 1,
  unit_price: 300,
  total_price: 300,
  approved: true
)

warranty_parent.quote_items.create!(
  item_type: 'part',
  name: '前氧传感器',
  description: '原厂氧传感器',
  quantity: 1,
  unit_price: 1200,
  total_price: 1200,
  approved: true
)

warranty_parent.add_history(service_advisor, '提交报价', '报价在预算内，自动确认', 'quote')

warranty_parent.parts.create!(
  name: '前氧传感器',
  part_number: 'A0005423100',
  brand: '奔驰原厂',
  quantity: 1,
  unit_price: 1200,
  status: 'used'
)

warranty_parent.add_history(technician, '开始维修', nil, 'repair')

warranty_parent.repair_logs.create!(
  technician: technician,
  title: '更换氧传感器',
  description: '更换前氧传感器，清除故障码',
  started_at: 2.hours.ago,
  completed_at: 1.hour.ago,
  status: 'completed'
)

warranty_parent.update!(status: 'repair_completed')
warranty_parent.add_history(technician, '完成维修', nil, 'repair')

warranty_parent.update!(status: 'review_approved', manager_note: '正常维修')
warranty_parent.add_history(manager, '复核通过', '正常维修', 'review')

warranty_parent.follow_ups.create!(
  user: customer_service,
  follow_up_at: Time.current,
  contact_method: 'phone',
  satisfaction: 'satisfied',
  feedback: '暂时没问题，再观察看看',
  notes: '',
  completed: true
)

warranty_parent.update!(status: 'follow_up_completed')
warranty_parent.add_history(customer_service, '完成回访', '客户满意', 'followup')

warranty_parent.add_history(manager, '归档', nil, 'archive')

warranty_order = RepairOrder.create!(
  vehicle: vehicle4,
  parent_order: warranty_parent,
  service_advisor: service_advisor,
  technician: technician,
  status: 'warranty_repair',
  customer_description: '质保返修 - 原单号: ' + warranty_parent.order_number,
  budget_limit: 0,
  warranty_repair: true
)

warranty_order.add_history(service_advisor, '创建质保返修单', "基于原维修单 #{warranty_parent.order_number}", 'warranty')

warranty_order.faults.create!(
  title: '发动机故障灯再次点亮',
  description: '质保返修: 发动机故障灯又亮了，相同故障码',
  reported_by: service_advisor,
  severity: 'high',
  category: 'engine'
)

puts "种子数据创建完成！"
puts "已创建 4 个用户，4 辆车，4 个维修订单样本"
puts "- 正常维修 (已归档): #{normal_order.order_number}"
puts "- 报价超预算: #{over_budget_order.order_number}"
puts "- 配件缺货: #{out_of_stock_order.order_number}"
puts "- 质保返修: #{warranty_order.order_number} (基于 #{warranty_parent.order_number})"
