puts "Seeding database..."

ActiveRecord::Base.transaction do
  Department.delete_all
  Employee.delete_all
  Visitor.delete_all
  Vehicle.delete_all
  Entrance.delete_all
  Reservation.delete_all
  Blacklist.delete_all
  VisitRecord.delete_all
  HistoryNode.delete_all

  departments = Department.create!([
    { name: '技术研发部', code: 'RD', description: '负责公司技术研发工作' },
    { name: '市场营销部', code: 'MKT', description: '负责公司市场营销推广' },
    { name: '人力资源部', code: 'HR', description: '负责公司人力资源管理' },
    { name: '行政部', code: 'ADMIN', description: '负责公司行政事务' },
    { name: '财务部', code: 'FIN', description: '负责公司财务管理' }
  ])

  security_supervisor = Employee.create!(
    name: '张保安',
    employee_number: 'S001',
    department: departments[0],
    phone: '13800001001',
    email: 'zhangba@example.com',
    position: '安保主管',
    is_security_guard: true,
    is_security_supervisor: true
  )

  security_guards = Employee.create!([
    { name: '李门岗', employee_number: 'G001', department: departments[0], phone: '13800001002', email: 'limen@example.com', position: '门岗', is_security_guard: true, is_security_supervisor: false },
    { name: '王门岗', employee_number: 'G002', department: departments[0], phone: '13800001003', email: 'wamen@example.com', position: '门岗', is_security_guard: true, is_security_supervisor: false }
  ])

  employees = Employee.create!([
    { name: '刘经理', employee_number: 'E001', department: departments[0], phone: '13900001001', email: 'liujl@example.com', position: '技术总监' },
    { name: '陈经理', employee_number: 'E002', department: departments[1], phone: '13900001002', email: 'chenl@example.com', position: '市场总监' },
    { name: '王工程师', employee_number: 'E003', department: departments[0], phone: '13900001003', email: 'wange@example.com', position: '高级工程师' },
    { name: '赵经理', employee_number: 'E004', department: departments[2], phone: '13900001004', email: 'zhaol@example.com', position: '人事经理' },
    { name: '孙助理', employee_number: 'E005', department: departments[3], phone: '13900001005', email: 'suna@example.com', position: '行政助理' }
  ])

  entrances = Entrance.create!([
    { name: '东门', location: '园区东侧', gate_type: 'main', is_active: true },
    { name: '西门', location: '园区西侧', gate_type: 'main', is_active: true },
    { name: '南门', location: '园区南侧', gate_type: 'side', is_active: true },
    { name: '北门', location: '园区北侧', gate_type: 'side', is_active: false }
  ])

  visitors = Visitor.create!([
    { name: '张三', phone: '15000001001', company: '北京科技有限公司', id_card_number: '110101199001011234' },
    { name: '李四', phone: '15000001002', company: '上海贸易公司', id_card_number: '310101199002022345' },
    { name: '王五', phone: '15000001003', company: '深圳创新企业', id_card_number: '440301199003033456' },
    { name: '赵六', phone: '15000001004', company: '广州实业集团', id_card_number: '440101199004044567' },
    { name: '钱七', phone: '15000001005', company: '杭州互联网公司', id_card_number: '330101199005055678' }
  ])

  vehicles = Vehicle.create!([
    { license_plate: '京A12345', vehicle_type: 'car', color: '黑色', visitor: visitors[0], active: true },
    { license_plate: '沪B67890', vehicle_type: 'car', color: '白色', visitor: visitors[1], active: true },
    { license_plate: '粤C11111', vehicle_type: 'truck', color: '蓝色', visitor: visitors[2], active: true },
    { license_plate: '京D22222', vehicle_type: 'car', color: '红色', visitor: visitors[3], active: true },
    { license_plate: '浙E33333', vehicle_type: 'car', color: '灰色', visitor: visitors[4], active: true }
  ])

  Blacklist.create!(
    license_plate: '浙E33333',
    reason: '上次来访损坏公司财物',
    added_by: security_supervisor,
    added_at: 7.days.ago,
    is_active: true
  )

  now = Time.current

  res1 = Reservation.create!(
    visitor: visitors[0],
    vehicle: vehicles[0],
    host: employees[0],
    entrance: entrances[0],
    scheduled_at: 2.hours.ago,
    scheduled_end_at: 2.hours.ago + 4.hours,
    purpose: '技术方案讨论会议',
    status: :confirmed
  )

  vr1 = VisitRecord.create!(
    reservation: res1,
    actual_entry_at: 2.hours.ago,
    entry_entrance: entrances[0],
    entry_guard: security_guards[0],
    actual_exit_at: 30.minutes.ago,
    exit_entrance: entrances[0],
    exit_guard: security_guards[0],
    status: :exited
  )

  vr1.add_history_node(action: '预约创建', actor: visitors[0], notes: '访客提交预约')
  vr1.add_history_node(action: '接待人确认', actor: employees[0], notes: '确认访问')
  vr1.add_history_node(action: '车牌核验通过', actor: security_guards[0], notes: '车牌: 京A12345')
  vr1.add_history_node(action: '安保主管批准', actor: security_supervisor, notes: '批准入园')
  vr1.add_history_node(action: '入园', actor: security_guards[0], notes: '东门')
  vr1.add_history_node(action: '离园', actor: security_guards[0], notes: '东门')

  res2 = Reservation.create!(
    visitor: visitors[1],
    vehicle: vehicles[1],
    host: employees[1],
    entrance: entrances[1],
    scheduled_at: now + 1.hour,
    scheduled_end_at: now + 5.hours,
    purpose: '市场合作洽谈',
    status: :confirmed
  )

  vr2 = VisitRecord.create!(
    reservation: res2,
    status: :pending_approval
  )

  vr2.add_history_node(action: '预约创建', actor: visitors[1], notes: '访客提交预约')
  vr2.add_history_node(action: '接待人确认', actor: employees[1], notes: '确认访问')
  vr2.add_history_node(action: '车牌核验通过', actor: security_guards[1], notes: '车牌: 沪B67890')

  res3 = Reservation.create!(
    visitor: visitors[4],
    vehicle: vehicles[4],
    host: employees[2],
    entrance: entrances[0],
    scheduled_at: 1.hour.ago,
    scheduled_end_at: 1.hour.ago + 3.hours,
    purpose: '技术支持',
    status: :confirmed
  )

  vr3 = VisitRecord.create!(
    reservation: res3,
    status: :blocked,
    blocking_reason: '该车辆在黑名单中'
  )

  vr3.add_history_node(action: '预约创建', actor: visitors[4], notes: '访客提交预约')
  vr3.add_history_node(action: '接待人确认', actor: employees[2], notes: '确认访问')
  vr3.add_history_node(action: '车牌核验', actor: security_guards[0], notes: '该车辆在黑名单中，禁止入园')
  vr3.add_history_node(action: '系统自动拦截', actor: security_guards[0], notes: '黑名单车辆自动拦截')

  res4 = Reservation.create!(
    visitor: visitors[2],
    vehicle: vehicles[2],
    host: employees[3],
    entrance: entrances[0],
    scheduled_at: 3.days.ago,
    scheduled_end_at: 3.days.ago + 2.hours,
    purpose: '货物运送',
    status: :expired
  )

  res5 = Reservation.create!(
    visitor: visitors[3],
    vehicle: vehicles[3],
    host: employees[4],
    entrance: entrances[1],
    scheduled_at: now - 30.minutes,
    scheduled_end_at: now + 3.hours,
    purpose: '商务会议',
    status: :confirmed
  )

  vr5 = VisitRecord.create!(
    reservation: res5,
    actual_entry_at: 20.minutes.ago,
    entry_entrance: entrances[1],
    entry_guard: security_guards[1],
    status: :entered
  )

  vr5.add_history_node(action: '预约创建', actor: visitors[3], notes: '访客提交预约')
  vr5.add_history_node(action: '接待人确认', actor: employees[4], notes: '确认访问')
  vr5.add_history_node(action: '车牌核验通过', actor: security_guards[1], notes: '车牌: 京D22222')
  vr5.add_history_node(action: '安保主管批准', actor: security_supervisor, notes: '批准入园')
  vr5.add_history_node(action: '入园', actor: security_guards[1], notes: '西门')

  res6 = Reservation.create!(
    visitor: visitors[0],
    vehicle: vehicles[0],
    host: employees[2],
    entrance: entrances[0],
    scheduled_at: 1.day.ago,
    scheduled_end_at: 1.day.ago + 5.hours,
    purpose: '产品演示',
    status: :confirmed
  )

  vr6 = VisitRecord.create!(
    reservation: res6,
    actual_entry_at: 1.day.ago + 1.hour,
    entry_entrance: entrances[0],
    entry_guard: security_guards[0],
    actual_exit_at: 1.day.ago + 4.hours,
    exit_entrance: entrances[0],
    exit_guard: security_guards[0],
    status: :exited
  )

  vr6.add_history_node(action: '预约创建', actor: visitors[0], notes: '访客提交预约')
  vr6.add_history_node(action: '接待人确认', actor: employees[2], notes: '确认访问')
  vr6.add_history_node(action: '车牌核验通过', actor: security_guards[0], notes: '车牌: 京A12345')
  vr6.add_history_node(action: '安保主管批准', actor: security_supervisor, notes: '批准入园')
  vr6.add_history_node(action: '入园', actor: security_guards[0], notes: '东门')
  vr6.add_history_node(action: '离园', actor: security_guards[0], notes: '东门')

  res7 = Reservation.create!(
    visitor: visitors[1],
    vehicle: vehicles[1],
    host: employees[0],
    entrance: entrances[1],
    scheduled_at: 5.days.ago,
    scheduled_end_at: 5.days.ago + 3.hours,
    purpose: '技术交流',
    status: :confirmed
  )

  vr7 = VisitRecord.create!(
    reservation: res7,
    actual_entry_at: 5.days.ago + 30.minutes,
    entry_entrance: entrances[1],
    entry_guard: security_guards[1],
    actual_exit_at: 5.days.ago + 2.hours + 30.minutes,
    exit_entrance: entrances[1],
    exit_guard: security_guards[1],
    status: :exited,
    blocking_reason: nil
  )

  vr7.add_history_node(action: '预约创建', actor: visitors[1], notes: '访客提交预约')
  vr7.add_history_node(action: '接待人确认', actor: employees[0], notes: '确认访问')
  vr7.add_history_node(action: '车牌核验通过', actor: security_guards[1], notes: '车牌: 沪B67890')
  vr7.add_history_node(action: '安保主管批准', actor: security_supervisor, notes: '批准入园')
  vr7.add_history_node(action: '入园', actor: security_guards[1], notes: '西门')
  vr7.add_history_node(action: '离园', actor: security_guards[1], notes: '西门')

  res8 = Reservation.create!(
    visitor: visitors[2],
    vehicle: vehicles[2],
    host: employees[1],
    entrance: entrances[0],
    scheduled_at: 7.days.ago,
    scheduled_end_at: 7.days.ago + 4.hours,
    purpose: '商务合作',
    status: :confirmed
  )

  vr8 = VisitRecord.create!(
    reservation: res8,
    status: :blocked,
    blocking_reason: '车辆类型不符合园区规定'
  )

  vr8.add_history_node(action: '预约创建', actor: visitors[2], notes: '访客提交预约')
  vr8.add_history_node(action: '接待人确认', actor: employees[1], notes: '确认访问')
  vr8.add_history_node(action: '车牌核验通过', actor: security_guards[0], notes: '车牌: 粤C11111')
  vr8.add_history_node(action: '安保主管拦截', actor: security_supervisor, notes: '车辆类型不符合园区规定')
end

puts "Seeding completed!"
puts "Created:"
puts "- #{Department.count} departments"
puts "- #{Employee.count} employees"
puts "- #{Visitor.count} visitors"
puts "- #{Vehicle.count} vehicles"
puts "- #{Entrance.count} entrances"
puts "- #{Reservation.count} reservations"
puts "- #{Blacklist.count} blacklisted vehicles"
puts "- #{VisitRecord.count} visit records"
puts "- #{HistoryNode.count} history nodes"
