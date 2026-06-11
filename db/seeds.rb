require 'date'

puts "开始创建种子数据..."

fleets_data = [
  { name: '第一车队（城东片区）', code: 'F001', contact: '张建国', phone: '13800001111' },
  { name: '第二车队（城西片区）', code: 'F002', contact: '李明辉', phone: '13800002222' },
  { name: '第三车队（城南片区）', code: 'F003', contact: '王志强', phone: '13800003333' }
]

fleets = fleets_data.map { |f| Fleet.create!(f) }
puts "✓ 创建了 #{fleets.count} 个车队"

vehicle_models_data = [
  { name: '压缩式垃圾车', brand: '中联重科', category: :garbage_truck,
    fuel_tank_capacity: 200, standard_fuel_consumption: 28.0,
    maintenance_km_interval: 5000, maintenance_day_interval: 90 },
  { name: '洗扫车', brand: '宇通重工', category: :sweeper,
    fuel_tank_capacity: 180, standard_fuel_consumption: 25.0,
    maintenance_km_interval: 5000, maintenance_day_interval: 90 },
  { name: '洒水车', brand: '东风商用车', category: :sprinkler,
    fuel_tank_capacity: 220, standard_fuel_consumption: 22.0,
    maintenance_km_interval: 6000, maintenance_day_interval: 120 },
  { name: '吸污车', brand: '程力威', category: :vacuum_truck,
    fuel_tank_capacity: 190, standard_fuel_consumption: 30.0,
    maintenance_km_interval: 5000, maintenance_day_interval: 90 },
  { name: '密闭式运输车', brand: '福田汽车', category: :transport,
    fuel_tank_capacity: 250, standard_fuel_consumption: 26.0,
    maintenance_km_interval: 8000, maintenance_day_interval: 120 }
]

vehicle_models = vehicle_models_data.map { |vm| VehicleModel.create!(vm) }
puts "✓ 创建了 #{vehicle_models.count} 个车型"

routes_data = [
  { name: '城东主干道巡回路线', code: 'R001', distance: 35.5, estimated_duration: 240, area: '城东片区' },
  { name: '城西商业圈路线', code: 'R002', distance: 28.0, estimated_duration: 200, area: '城西片区' },
  { name: '城南居民小区路线', code: 'R003', distance: 42.0, estimated_duration: 300, area: '城南片区' },
  { name: '工业园区路线', code: 'R004', distance: 55.0, estimated_duration: 360, area: '经开区' },
  { name: '滨水景观带路线', code: 'R005', distance: 22.5, estimated_duration: 180, area: '滨江新区' }
]

routes = routes_data.map { |r| Route.create!(r) }
puts "✓ 创建了 #{routes.count} 条线路"

users_data = [
  { name: '调度员-赵晓东', employee_id: 'U001', role: :dispatcher, phone: '13900000001', department: '运营调度部', status: :active, fleet: fleets[0] },
  { name: '调度员-孙美华', employee_id: 'U002', role: :dispatcher, phone: '13900000002', department: '运营调度部', status: :active, fleet: fleets[1] },
  { name: '维修站-周师傅', employee_id: 'U003', role: :repair_station, phone: '13900000003', department: '维修中心', status: :active },
  { name: '维修站-吴师傅', employee_id: 'U004', role: :repair_station, phone: '13900000004', department: '维修中心', status: :active },
  { name: '安全员-郑海涛', employee_id: 'U005', role: :safety_officer, phone: '13900000005', department: '安全监察部', status: :active, fleet: fleets[0] },
  { name: '安全员-林秀兰', employee_id: 'U006', role: :safety_officer, phone: '13900000006', department: '安全监察部', status: :active, fleet: fleets[1] },
  { name: '队长-陈大伟', employee_id: 'U007', role: :team_leader, phone: '13900000007', department: '第一车队', status: :active, fleet: fleets[0] },
  { name: '队长-刘铁军', employee_id: 'U008', role: :team_leader, phone: '13900000008', department: '第二车队', status: :active, fleet: fleets[1] },
  { name: '管理员-系统主管', employee_id: 'U009', role: :admin, phone: '13900000009', department: '信息中心', status: :active },
  { name: '队长-黄德胜', employee_id: 'U010', role: :team_leader, phone: '13900000010', department: '第三车队', status: :active, fleet: fleets[2] }
]

users = users_data.map { |u| User.create!(u) }
puts "✓ 创建了 #{users.count} 个用户"

vehicles_data = [
  {
    plate_number: '环卫A-0001', vin_number: 'LZZ5ELNB2HA123456',
    fleet: fleets[0], vehicle_model: vehicle_models[0], route: routes[0],
    manufacture_date: '2022-03-15', purchase_date: '2022-05-01',
    current_mileage: 58320, status: :available,
    last_maintenance_date: 60.days.ago.to_date, next_maintenance_date: 30.days.from_now.to_date,
    driver_name: '驾驶员-马师傅', remarks: '状况良好，正常出车样本车辆'
  },
  {
    plate_number: '环卫A-0002', vin_number: 'LZZ5ELNB2HA123457',
    fleet: fleets[0], vehicle_model: vehicle_models[1], route: routes[2],
    manufacture_date: '2022-06-20', purchase_date: '2022-08-10',
    current_mileage: 45680, status: :available,
    last_maintenance_date: 120.days.ago.to_date, next_maintenance_date: 30.days.ago.to_date,
    driver_name: '驾驶员-杨师傅', remarks: '保养超期样本车辆-未做保养超30天'
  },
  {
    plate_number: '环卫A-0003', vin_number: 'LZZ5ELNB2HA123458',
    fleet: fleets[1], vehicle_model: vehicle_models[2], route: routes[1],
    manufacture_date: '2021-11-08', purchase_date: '2022-01-15',
    current_mileage: 72500, status: :under_repair,
    last_maintenance_date: 45.days.ago.to_date, next_maintenance_date: 45.days.from_now.to_date,
    driver_name: '驾驶员-朱师傅', remarks: '维修未完成样本车辆-液压系统故障维修中'
  },
  {
    plate_number: '环卫A-0004', vin_number: 'LZZ5ELNB2HA123459',
    fleet: fleets[1], vehicle_model: vehicle_models[3], route: routes[3],
    manufacture_date: '2023-02-14', purchase_date: '2023-04-20',
    current_mileage: 28900, status: :available,
    last_maintenance_date: 20.days.ago.to_date, next_maintenance_date: 70.days.from_now.to_date,
    driver_name: '驾驶员-秦师傅', remarks: '油耗异常样本车辆-近期多次超标'
  },
  {
    plate_number: '环卫A-0005', vin_number: 'LZZ5ELNB2HA123460',
    fleet: fleets[2], vehicle_model: vehicle_models[0], route: routes[2],
    manufacture_date: '2022-09-30', purchase_date: '2022-12-01',
    current_mileage: 51200, status: :pending_review,
    last_maintenance_date: 55.days.ago.to_date, next_maintenance_date: 35.days.from_now.to_date,
    driver_name: '驾驶员-许师傅', remarks: '维修刚完成待队长复核出车'
  },
  {
    plate_number: '环卫A-0006', vin_number: 'LZZ5ELNB2HA123461',
    fleet: fleets[0], vehicle_model: vehicle_models[4], route: routes[4],
    manufacture_date: '2021-05-10', purchase_date: '2021-07-25',
    current_mileage: 95800, status: :available,
    last_maintenance_date: 15.days.ago.to_date, next_maintenance_date: 105.days.from_now.to_date,
    driver_name: '驾驶员-何师傅', remarks: '老车辆，正常使用'
  },
  {
    plate_number: '环卫A-0007', vin_number: 'LZZ5ELNB2HA123462',
    fleet: fleets[2], vehicle_model: vehicle_models[1], route: routes[0],
    manufacture_date: '2023-07-01', purchase_date: '2023-09-10',
    current_mileage: 15600, status: :available,
    last_maintenance_date: 10.days.ago.to_date, next_maintenance_date: 80.days.from_now.to_date,
    driver_name: '驾驶员-吕师傅', remarks: '新车，正常运行'
  },
  {
    plate_number: '环卫A-0008', vin_number: 'LZZ5ELNB2HA123463',
    fleet: fleets[1], vehicle_model: vehicle_models[0], route: routes[1],
    manufacture_date: '2020-12-01', purchase_date: '2021-02-28',
    current_mileage: 128400, status: :decommissioned,
    last_maintenance_date: 180.days.ago.to_date, next_maintenance_date: 90.days.ago.to_date,
    driver_name: '驾驶员-施师傅', remarks: '停用样本车辆-多次重大维修后停用'
  }
]

vehicles = vehicles_data.map { |v| Vehicle.create!(v) }
puts "✓ 创建了 #{vehicles.count} 辆车"

maintenance_items_templates = [
  { name: '更换机油及机滤', description: '发动机润滑油更换，机油滤清器更换', is_required: true },
  { name: '检查空气滤芯', description: '清洁或更换空气滤清器', is_required: true },
  { name: '检查制动系统', description: '刹车片磨损检查，制动液检查', is_required: true },
  { name: '轮胎检查与换位', description: '胎纹深度、气压检查，轮胎换位', is_required: true },
  { name: '液压系统检查', description: '液压油检查，管路渗漏检查', is_required: false },
  { name: '底盘润滑', description: '各润滑点加注润滑脂', is_required: true },
  { name: '灯光电气检查', description: '全车灯光、雨刮、喇叭检查', is_required: true },
  { name: '蓄电池检查', description: '电解液液位、接线端子、电压检查', is_required: false }
]

def create_maintenance_with_items(vehicle, planned_date, status, scheduled_by, items_template, type = :routine)
  plan = MaintenancePlan.create!(
    vehicle: vehicle,
    planned_date: planned_date,
    scheduled_mileage: vehicle.current_mileage + 500,
    maintenance_type: type,
    status: status,
    scheduled_by: scheduled_by,
    notes: "#{type == :routine ? '例行' : type == :comprehensive ? '综合' : '紧急'}保养计划",
    completed_at: [:completed].include?(status) ? Time.current : nil
  )
  items_template.each do |item|
    item_status = if status == :completed
                    item[:is_required] ? :completed : [:completed, :skipped].sample
                  elsif status == :in_progress
                    [:pending, :completed].sample
                  else
                    :pending
                  end
    MaintenanceItem.create!(
      maintenance_plan: plan,
      name: item[:name],
      description: item[:description],
      is_required: item[:is_required],
      status: item_status,
      completed_by: [:completed].include?(item_status) ? '周师傅' : nil,
      completed_at: [:completed].include?(item_status) ? Time.current : nil
    )
  end
  plan
end

vehicle_001 = vehicles[0]
create_maintenance_with_items(vehicle_001, 60.days.ago.to_date, :completed, '赵晓东', maintenance_items_templates, :comprehensive)
create_maintenance_with_items(vehicle_001, 30.days.from_now.to_date, :pending, '赵晓东', maintenance_items_templates, :routine)

vehicle_002 = vehicles[1]
create_maintenance_with_items(vehicle_002, 120.days.ago.to_date, :completed, '赵晓东', maintenance_items_templates)
create_maintenance_with_items(vehicle_002, 30.days.ago.to_date, :overdue, '赵晓东', maintenance_items_templates)

vehicle_003 = vehicles[2]
create_maintenance_with_items(vehicle_003, 45.days.ago.to_date, :completed, '孙美华', maintenance_items_templates)
create_maintenance_with_items(vehicle_003, 45.days.from_now.to_date, :pending, '孙美华', maintenance_items_templates)

vehicle_004 = vehicles[3]
create_maintenance_with_items(vehicle_004, 20.days.ago.to_date, :completed, '孙美华', maintenance_items_templates, :routine)
create_maintenance_with_items(vehicle_004, 70.days.from_now.to_date, :pending, '孙美华', maintenance_items_templates)

vehicle_005 = vehicles[4]
create_maintenance_with_items(vehicle_005, 55.days.ago.to_date, :completed, '赵晓东', maintenance_items_templates)

vehicle_006 = vehicles[5]
create_maintenance_with_items(vehicle_006, 15.days.ago.to_date, :completed, '赵晓东', maintenance_items_templates, :comprehensive)

vehicle_007 = vehicles[6]
create_maintenance_with_items(vehicle_007, 10.days.ago.to_date, :completed, '赵晓东', maintenance_items_templates, :routine)

vehicle_008 = vehicles[7]
create_maintenance_with_items(vehicle_008, 180.days.ago.to_date, :completed, '孙美华', maintenance_items_templates)
create_maintenance_with_items(vehicle_008, 90.days.ago.to_date, :overdue, '孙美华', maintenance_items_templates, :comprehensive)

puts "✓ 创建了保养计划和保养项数据"

def create_repair_record(vehicle, report_date, start_date, end_date, status, repair_type,
                         issue, diagnosis, solution, technician, station,
                         abnormal_reason = nil, decommission_days = nil, urgent = false)
  parts = rand(500.0..3000.0).round(2)
  labor = rand(300.0..1500.0).round(2)
  RepairRecord.create!(
    vehicle: vehicle,
    report_date: report_date,
    start_date: start_date,
    end_date: end_date,
    repair_type: repair_type,
    issue_description: issue,
    diagnosis: diagnosis,
    solution: solution,
    parts_cost: parts,
    labor_cost: labor,
    total_cost: parts + labor,
    status: status,
    technician: technician,
    repair_station: station,
    is_urgent: urgent,
    decommission_days: decommission_days,
    abnormal_reason: abnormal_reason
  )
end

create_repair_record(
  vehicle_003, 5.days.ago.to_date, 4.days.ago.to_date, nil, :in_progress, :breakdown,
  '液压举升系统无法正常工作，垃圾箱无法举升卸料',
  '经检查液压泵密封圈老化导致压力泄漏，液压油污染严重',
  '更换液压泵总成及密封圈，清洗液压系统更换液压油',
  '周师傅', '中心维修站', '液压系统故障', nil, true
)
create_repair_record(
  vehicle_003, 60.days.ago.to_date, 58.days.ago.to_date, 56.days.ago.to_date, :completed, :breakdown,
  '左侧扫盘电机异响',
  '扫盘减速器轴承损坏',
  '更换减速器轴承及齿轮组',
  '吴师傅', '中心维修站', '传动系统', 2
)

create_repair_record(
  vehicle_005, 15.days.ago.to_date, 14.days.ago.to_date, 2.days.ago.to_date, :completed, :breakdown,
  '发动机水温过高报警，动力下降',
  '水泵叶轮损坏导致冷却液循环不畅，节温器失效',
  '更换水泵总成及节温器，清洗冷却系统',
  '周师傅', '中心维修站', '冷却系统故障', 12
)

create_repair_record(
  vehicle_004, 25.days.ago.to_date, 24.days.ago.to_date, 22.days.ago.to_date, :completed, :preventive,
  '例行检查发现喷油嘴雾化不良',
  '喷油嘴积碳严重，3缸喷油嘴堵塞',
  '清洗4个喷油嘴，校喷油量',
  '吴师傅', '中心维修站', '燃油系统', 2
)

create_repair_record(
  vehicle_008, 200.days.ago.to_date, 198.days.ago.to_date, 185.days.ago.to_date, :completed, :accident,
  '倒车时与围墙发生碰撞，尾部严重变形',
  '后保险杠、尾灯支架、垃圾箱后门严重变形',
  '钣金修复垃圾箱后门，更换保险杠及尾灯总成',
  '周师傅', '钣金维修站', '事故损坏', 13
)
create_repair_record(
  vehicle_008, 100.days.ago.to_date, 99.days.ago.to_date, 80.days.ago.to_date, :completed, :breakdown,
  '变速箱异响严重，无法挂档',
  '变速箱同步器严重磨损，齿轮打齿',
  '变速箱大修，更换同步器及损坏齿轮',
  '吴师傅', '中心维修站', '传动系统重大故障', 19
)

create_repair_record(
  vehicle_006, 45.days.ago.to_date, 44.days.ago.to_date, 42.days.ago.to_date, :completed, :preventive,
  '空调制冷效果差',
  '空调压缩机皮带老化，制冷剂不足',
  '更换压缩机皮带，补充制冷剂',
  '吴师傅', '中心维修站', '空调系统', 2
)

create_repair_record(
  vehicle_001, 30.days.ago.to_date, 30.days.ago.to_date, 29.days.ago.to_date, :completed, :preventive,
  '右前大灯不亮',
  '灯泡烧毁，灯座接触不良',
  '更换灯泡及灯座',
  '周师傅', '快修点', '电气系统', 1
)

puts "✓ 创建了维修记录数据"

def create_fuel_record(vehicle, record_date, start_m, end_m, fuel, abnormal = false, note = nil)
  standard = vehicle.vehicle_model.standard_fuel_consumption
  distance = end_m - start_m
  consumption = distance > 0 ? (fuel / distance * 100).round(2) : nil
  is_abnormal = abnormal || (consumption && standard && consumption > standard * 1.3)
  FuelRecord.create!(
    vehicle: vehicle,
    record_date: record_date,
    start_mileage: start_m,
    end_mileage: end_m,
    fuel_amount: fuel,
    fuel_cost: (fuel * 7.85).round(2),
    fuel_consumption: consumption,
    is_abnormal: is_abnormal,
    abnormal_note: is_abnormal ? (note || "油耗超标：标准#{standard}L/100km，实际#{consumption}L/100km") : nil,
    recorded_by: '赵晓东'
  )
end

base_m_001 = 52000
(1..6).each do |i|
  days = (i * 10).days.ago.to_date
  start_b = base_m_001 + (i - 1) * 1100
  end_b = start_b + 1050 + rand(50)
  fuel = (28.5 * 10.5).round(1) + rand(-3.0..2.0)
  create_fuel_record(vehicle_001, days, start_b, end_b, fuel.round(1))
end

base_m_002 = 40000
(1..5).each do |i|
  days = (i * 12).days.ago.to_date
  start_b = base_m_002 + (i - 1) * 1000
  end_b = start_b + 980 + rand(40)
  fuel = (25.0 * 9.8).round(1) + rand(-2.0..3.0)
  create_fuel_record(vehicle_002, days, start_b, end_b, fuel.round(1))
end

base_m_004 = 21000
fuel_patterns = [
  { days: 30, mul: 1.0, abnormal: false },
  { days: 25, mul: 1.45, abnormal: true, note: '疑似漏油或怠速时间过长' },
  { days: 20, mul: 1.02, abnormal: false },
  { days: 15, mul: 1.52, abnormal: true, note: '严重超标，需检查喷油嘴及氧传感器' },
  { days: 10, mul: 1.08, abnormal: false },
  { days: 5, mul: 1.4, abnormal: true, note: '再次超标，建议维修站检查' }
]
fuel_patterns.each_with_index do |fp, idx|
  days = fp[:days].days.ago.to_date
  start_b = base_m_004 + idx * 1300
  end_b = start_b + 1250 + rand(50)
  fuel = (30.0 * 12.5 * fp[:mul]).round(1)
  create_fuel_record(vehicle_004, days, start_b, end_b, fuel, fp[:abnormal], fp[:note])
end

base_m_006 = 88000
(1..4).each do |i|
  days = (i * 15).days.ago.to_date
  start_b = base_m_006 + (i - 1) * 1800
  end_b = start_b + 1750 + rand(80)
  fuel = (26.0 * 17.5).round(1) + rand(-5.0..4.0)
  create_fuel_record(vehicle_006, days, start_b, end_b, fuel.round(1))
end

base_m_007 = 10000
(1..3).each do |i|
  days = (i * 10).days.ago.to_date
  start_b = base_m_007 + (i - 1) * 1800
  end_b = start_b + 1750 + rand(80)
  fuel = (25.0 * 17.5).round(1) + rand(-3.0..2.0)
  create_fuel_record(vehicle_007, days, start_b, end_b, fuel.round(1))
end

puts "✓ 创建了油耗记录数据（含异常样本）"

def create_inspection(vehicle, date, inspector, type, result, items_status = {}, issues = nil, suggestions = nil)
  default_status = proc { |k| items_status[k] || '正常' }
  InspectionRecord.create!(
    vehicle: vehicle,
    inspector: inspector,
    inspection_date: date,
    inspection_type: type,
    brakes_status: default_status.call(:brakes),
    tires_status: default_status.call(:tires),
    lights_status: default_status.call(:lights),
    steering_status: default_status.call(:steering),
    oil_status: default_status.call(:oil),
    water_status: default_status.call(:water),
    cleaning_status: default_status.call(:cleaning),
    overall_result: result,
    issues_found: issues,
    suggestions: suggestions
  )
end

today = Date.today

create_inspection(vehicle_001, today.to_datetime, '郑海涛', :pre_departure, :pass)
create_inspection(vehicle_001, 5.days.ago.to_datetime, '郑海涛', :routine, :pass)
create_inspection(vehicle_001, 30.days.ago.to_datetime, '郑海涛', :special, :pass)

create_inspection(vehicle_002, today.to_datetime, '郑海涛', :pre_departure, :conditional,
                  { tires: '异常' }, '左前轮胎纹深度接近磨损极限1.6mm', '建议本周内更换前轮胎')
create_inspection(vehicle_002, 15.days.ago.to_datetime, '郑海涛', :routine, :pass)

create_inspection(vehicle_003, 8.days.ago.to_datetime, '林秀兰', :special, :fail,
                  { steering: '异常', oil: '异常' },
                  '维修前检查：转向助力油渗漏明显，液压油不足，不适合出车')

create_inspection(vehicle_004, today.to_datetime, '林秀兰', :pre_departure, :pass)
create_inspection(vehicle_004, 3.days.ago.to_datetime, '林秀兰', :routine, :conditional,
                  { cleaning: '异常' }, '车身外侧泥污较多，车容车貌不达标', '出车前冲洗车身')
create_inspection(vehicle_004, 18.days.ago.to_datetime, '林秀兰', :special, :pass)

create_inspection(vehicle_005, 1.day.ago.to_datetime, '郑海涛', :special, :pass,
                  {}, nil, '维修后复检合格，可提交队长复核')

create_inspection(vehicle_006, today.to_datetime, '郑海涛', :pre_departure, :pass)
create_inspection(vehicle_006, 10.days.ago.to_datetime, '郑海涛', :routine, :pass)

create_inspection(vehicle_007, today.to_datetime, '郑海涛', :pre_departure, :pass)

create_inspection(vehicle_008, 210.days.ago.to_datetime, '林秀兰', :special, :fail,
                  { brakes: '异常', lights: '异常', steering: '异常' },
                  '事故后全面检查：多项指标不合格，建议停用评估')

puts "✓ 创建了车况检查记录数据"

def create_trip(vehicle, route, depart_time, driver, reviewer, status, note = nil,
                start_m = nil, end_m = nil, actual_depart = nil, actual_return = nil, skip_validate = false)
  planned_depart = depart_time
  planned_return = depart_time + route.estimated_duration.minutes
  t = TripRecord.new(
    vehicle: vehicle,
    route: route,
    planned_departure_time: planned_depart,
    actual_departure_time: actual_depart,
    planned_return_time: planned_return,
    actual_return_time: actual_return,
    start_mileage: start_m,
    end_mileage: end_m,
    driver_name: driver,
    reviewer: reviewer,
    review_status: status,
    review_note: note,
    reviewed_at: [:approved, :rejected, :decommissioned].include?(status) ? Time.current : nil,
    is_active: status == :approved
  )
  t.save!(validate: !skip_validate)
  t
end

create_trip(vehicle_001, routes[0], today.to_datetime.change(hour: 6, min: 0),
            '马师傅', '陈大伟', :approved, '车况良好，准予出车',
            58320, 58380,
            today.to_datetime.change(hour: 6, min: 5),
            today.to_datetime.change(hour: 9, min: 45))

create_trip(vehicle_001, routes[2], 1.day.ago.to_datetime.change(hour: 6, min: 0),
            '马师傅', '陈大伟', :approved, nil,
            58220, 58275,
            1.day.ago.to_datetime.change(hour: 6, min: 3),
            1.day.ago.to_datetime.change(hour: 10, min: 15))

create_trip(vehicle_001, routes[0], 2.days.ago.to_datetime.change(hour: 6, min: 0),
            '马师傅', '陈大伟', :approved, nil,
            58100, 58160,
            2.days.ago.to_datetime.change(hour: 6, min: 2),
            2.days.ago.to_datetime.change(hour: 9, min: 50))

create_trip(vehicle_002, routes[2], today.to_datetime.change(hour: 6, min: 0),
            '杨师傅', nil, :pending, nil, 45680, nil, nil, nil, true)

create_trip(vehicle_004, routes[3], today.to_datetime.change(hour: 5, min: 30),
            '秦师傅', '刘铁军', :approved, '油耗异常需持续关注，但车况检查通过，准予出车',
            28900, nil,
            today.to_datetime.change(hour: 5, min: 35), nil)

create_trip(vehicle_004, routes[3], 2.days.ago.to_datetime.change(hour: 5, min: 30),
            '秦师傅', '刘铁军', :approved, nil,
            28770, 28835,
            2.days.ago.to_datetime.change(hour: 5, min: 32),
            2.days.ago.to_datetime.change(hour: 11, min: 20))

create_trip(vehicle_006, routes[4], today.to_datetime.change(hour: 7, min: 0),
            '何师傅', '陈大伟', :approved, nil,
            95800, nil,
            today.to_datetime.change(hour: 7, min: 4), nil)

create_trip(vehicle_007, routes[0], today.to_datetime.change(hour: 6, min: 30),
            '吕师傅', '黄德胜', :approved, nil,
            15600, nil,
            today.to_datetime.change(hour: 6, min: 32), nil)

create_trip(vehicle_008, routes[1], 200.days.ago.to_datetime.change(hour: 6, min: 0),
            '施师傅', '刘铁军', :decommissioned,
            '事故后经多次维修仍存在多项安全隐患，结合车龄及维修成本评估，决定停用',
            127800, 127850,
            200.days.ago.to_datetime.change(hour: 6, min: 2),
            200.days.ago.to_datetime.change(hour: 10, min: 0), true)

create_trip(vehicle_006, routes[4], 5.days.ago.to_datetime.change(hour: 7, min: 0),
            '何师傅', '陈大伟', :rejected,
            '当日临时交通管制，线路调整，取消本次出车', nil, nil, nil, nil)

puts "✓ 创建了出车记录及复核数据"

puts ""
puts "========================================="
puts "  种子数据创建完成！"
puts "========================================="
puts ""
puts "📊 数据统计："
puts "  车队: #{Fleet.count} 个"
puts "  车型: #{VehicleModel.count} 种"
puts "  线路: #{Route.count} 条"
puts "  用户: #{User.count} 人"
puts "  车辆: #{Vehicle.count} 辆"
puts "    - 正常出车: #{Vehicle.available.count}"
puts "    - 保养中: #{Vehicle.in_maintenance.count}"
puts "    - 维修中: #{Vehicle.under_repair.count}"
puts "    - 待复核: #{Vehicle.pending_review.count}"
puts "    - 已停用: #{Vehicle.decommissioned.count}"
puts "  保养计划: #{MaintenancePlan.count} 项 (超期 #{MaintenancePlan.where(status: :overdue).count} 项)"
puts "  维修记录: #{RepairRecord.count} 条 (未完成 #{RepairRecord.unfinished.count} 条)"
puts "  油耗记录: #{FuelRecord.count} 条 (异常 #{FuelRecord.abnormal.count} 条)"
puts "  检查记录: #{InspectionRecord.count} 条"
puts "  出车记录: #{TripRecord.count} 条 (待复核 #{TripRecord.needs_review.count} 条)"
puts "  历史节点: #{HistoryNode.count} 条"
puts ""
puts "🎯 样本说明："
puts "  1. 环卫A-0001 - 正常出车样本（状态良好，检查通过，已复核出车）"
puts "  2. 环卫A-0002 - 保养超期样本（保养计划超30天未做）"
puts "  3. 环卫A-0003 - 维修未完成样本（液压系统故障维修中，禁止出车）"
puts "  4. 环卫A-0004 - 油耗异常样本（近期3次油耗严重超标）"
puts "  5. 环卫A-0005 - 维修完成待复核样本"
puts "  6. 环卫A-0008 - 停用样本（多次重大维修后停用）"
