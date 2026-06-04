front_desk = User.create!(name: "张前台", email: "front_desk@hotel.com", password: "password", role: :front_desk)
manager = User.create!(name: "李经理", email: "manager@hotel.com", password: "password", role: :duty_manager)

rooms_data = [
  { room_number: "101", room_type: :standard, floor: 1, status: :occupied },
  { room_number: "102", room_type: :standard, floor: 1, status: :available },
  { room_number: "201", room_type: :deluxe, floor: 2, status: :occupied },
  { room_number: "202", room_type: :deluxe, floor: 2, status: :available },
  { room_number: "301", room_type: :suite, floor: 3, status: :occupied },
  { room_number: "302", room_type: :suite, floor: 3, status: :available },
  { room_number: "401", room_type: :presidential, floor: 4, status: :occupied },
  { room_number: "402", room_type: :presidential, floor: 4, status: :available },
  { room_number: "103", room_type: :standard, floor: 1, status: :occupied },
  { room_number: "203", room_type: :deluxe, floor: 2, status: :occupied },
]
rooms = rooms_data.map { |r| Room.create!(r) }

rr1 = RepairRequest.create!(
  original_room: rooms[0],
  repair_category: :plumbing,
  repair_reason: "卫生间水龙头漏水，无法正常关闭",
  status: :archived,
  reporter: front_desk,
  manager: manager,
  needs_transfer: false,
  needs_compensation: false,
  customer_feedback: "维修及时，服务满意",
  resolved_at: 3.hours.ago
)
rr1.status_logs.create!(from_status: nil, to_status: "reported", changed_by: front_desk, note: "创建报修工单")
rr1.status_logs.create!(from_status: "reported", to_status: "archived", changed_by: manager, note: "维修完成，工单归档")

rr2 = RepairRequest.create!(
  original_room: rooms[2],
  repair_category: :ac,
  repair_reason: "空调完全不制冷，室温过高无法入住",
  status: :compensation_approved,
  reporter: front_desk,
  manager: manager,
  needs_transfer: true,
  needs_compensation: true,
  transfer_suggestion: "酒店已满房，无法安排转房，建议给予补偿",
  hotel_full_reason: "当前为旅游旺季，所有同级别及升级房型均已满房",
  new_room_id: nil,
  customer_feedback: "住客对满房无法转房表示不满，要求补偿",
  resolved_at: 6.hours.ago
)
rr2.status_logs.create!(from_status: nil, to_status: "reported", changed_by: front_desk, note: "创建报修工单")
rr2.status_logs.create!(from_status: "reported", to_status: "transfer_suggested", changed_by: front_desk, note: "前台建议转房但酒店满房")
rr2.status_logs.create!(from_status: "transfer_suggested", to_status: "compensation_pending", changed_by: manager, note: "确认满房无法转房，进入补偿流程")
rr2.status_logs.create!(from_status: "compensation_pending", to_status: "compensation_approved", changed_by: manager, note: "值班经理批准补偿 ¥3000")
rr2.build_compensation(
  amount: 3000, basis: "满房无法转房，空调故障导致入住体验严重受损，按客房费用50%补偿",
  status: :approved, approved_by: manager, limit_amount: 5000, compensation_type: :room_fee_discount
).save!

rr3 = RepairRequest.create!(
  original_room: rooms[4],
  repair_category: :electrical,
  repair_reason: "房间电路短路跳闸，存在安全隐患，需要全面检修",
  status: :compensation_exceeded,
  reporter: front_desk,
  manager: manager,
  needs_transfer: true,
  needs_compensation: true,
  transfer_suggestion: "电路检修需要至少2天，建议转房至套房并给予高额补偿",
  new_room_id: rooms[5].id,
  customer_feedback: "住客要求全额退还房费并升级至总统套房",
  resolved_at: nil
)
rr3.status_logs.create!(from_status: nil, to_status: "reported", changed_by: front_desk, note: "创建报修工单")
rr3.status_logs.create!(from_status: "reported", to_status: "transfer_suggested", changed_by: front_desk, note: "前台建议转房至302号套房")
rr3.status_logs.create!(from_status: "transfer_suggested", to_status: "transfer_confirmed", changed_by: manager, note: "值班经理确认转房")
rr3.status_logs.create!(from_status: "transfer_confirmed", to_status: "compensation_exceeded", changed_by: front_desk, note: "提交补偿申请(金额超限)：¥8000")
rr3_comp = rr3.build_compensation(
  amount: 8000, basis: "电路故障存在安全隐患，住客要求全额退房费并升级房型，综合评估补偿金额",
  status: :exceeded, limit_amount: 5000, compensation_type: :cash,
  block_reason: "补偿金额 ¥8000 超出审批限额 ¥5000，需升级审批"
)
rr3_comp.save!
rr3.approval_escalations.create!(
  compensation: rr3_comp,
  level: :senior_manager, reason: "补偿金额超出值班经理审批权限，需高级经理审批",
  suggested_amount: 8000, status: :pending
)

rr4 = RepairRequest.create!(
  original_room: rooms[6],
  repair_category: :furniture,
  repair_reason: "床架松动有异响",
  status: :cancelled,
  reporter: front_desk,
  manager: nil,
  needs_transfer: false,
  needs_compensation: false,
  customer_feedback: "住客表示异响可以接受，不需要维修",
  resolved_at: 30.minutes.ago
)
rr4.status_logs.create!(from_status: nil, to_status: "reported", changed_by: front_desk, note: "创建报修工单")
rr4.status_logs.create!(from_status: "reported", to_status: "cancelled", changed_by: front_desk, note: "住客撤销报修：异响可以接受，不需要维修")

puts "Seed data created: #{User.count} users, #{Room.count} rooms, #{RepairRequest.count} repair requests"
