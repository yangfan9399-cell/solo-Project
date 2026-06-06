puts "开始创建种子数据..."

users = [
  { name: "张舞美", role: :stage_manager, phone: "13800138001", email: "zhangwumei@theater.com" },
  { name: "李舞美", role: :stage_manager, phone: "13800138002", email: "liwumei@theater.com" },
  { name: "王导", role: :crew_leader, phone: "3800138003", email: "wangdao@theater.com" },
  { name: "刘导", role: :crew_leader, phone: "13800138004", email: "liudao@theater.com" },
  { name: "陈资产", role: :asset_auditor, phone: "13800138005", email: "chenzichan@theater.com" },
  { name: "赵资产", role: :asset_auditor, phone: "13800138006", email: "zhao_zichan@theater.com" }
]

User.create!(users)
puts "已创建 #{User.count} 个用户"

stage_managers = User.stage_manager.to_a
crew_leaders = User.crew_leader.to_a
asset_auditors = User.asset_auditor.to_a

crews = [
  { name: "雷雨剧组", play_name: "雷雨", description: "经典话剧《雷雨》演出剧组", leader: crew_leaders[0], start_date: "2024-03-01", end_date: "2024-06-30" },
  { name: "茶馆剧组", play_name: "茶馆", description: "老舍经典话剧《茶馆》复排", leader: crew_leaders[1], start_date: "2024-04-15", end_date: "2024-08-15" },
  { name: "牡丹亭剧组", play_name: "牡丹亭", description: "昆曲《牡丹亭》演出剧组", leader: crew_leaders[0], start_date: "2024-05-01", end_date: "2024-09-30" },
  { name: "暗恋桃花源剧组", play_name: "暗恋桃花源", description: "经典话剧《暗恋桃花源》巡演", leader: crew_leaders[1], start_date: "2024-07-01", end_date: "2024-12-31" }
]

Crew.create!(crews)
puts "已创建 #{Crew.count} 个剧组"

props_data = [
  { name: "紫檀木八仙桌", category: "家具道具", code: "JJ-001", description: "清代风格紫檀木八仙桌，用于民国戏场景", status: :available, value: 25000, notes: "贵重道具，需轻拿轻放" },
  { name: "红木太师椅", category: "家具道具", code: "JJ-002", description: "红木太师椅一对，中式古典风格", status: :available, value: 18000, notes: "成对使用，不可拆分" },
  { name: "龙纹青花瓶", category: "瓷器道具", code: "CQ-001", description: "仿清代龙纹青花瓷瓶，高约60cm", status: :available, value: 8000, notes: "易碎品，搬运需用专用箱" },
  { name: "粉彩花鸟盘", category: "瓷器道具", code: "CQ-002", description: "粉彩花鸟纹瓷盘，直径30cm", status: :available, value: 3500, notes: "易碎品" },
  { name: "刺绣牡丹屏风", category: "布幔道具", code: "BM-001", description: "苏绣牡丹图案四折屏风", status: :available, value: 15000, notes: "注意防潮防虫" },
  { name: "金丝绒幕布", category: "布幔道具", code: "BM-002", description: "大红色金丝绒幕布，3x5米", status: :available, value: 6000, notes: "避免沾染油污" },
  { name: "青铜鼎", category: "金属道具", code: "JS-001", description: "仿商代青铜方鼎，高50cm", status: :available, value: 12000, notes: "较重，需两人搬运" },
  { name: "鎏金烛台", category: "金属道具", code: "JS-002", description: "鎏金铜烛台一对", status: :available, value: 4500, notes: "注意表面保护" },
  { name: "线装古籍", category: "文书道具", code: "WS-001", description: "仿清代线装书籍一套12本", status: :available, value: 2800, notes: "避免潮湿" },
  { name: "文房四宝", category: "文书道具", code: "WS-002", description: "湖笔、徽墨、宣纸、端砚一套", status: :available, value: 3200, notes: "砚台较重" },
  { name: "凤冠霞帔", category: "服饰道具", code: "FS-001", description: "中式婚礼凤冠霞帔一套", status: :available, value: 28000, notes: "贵重戏服，专人保管" },
  { name: "蟒袍玉带", category: "服饰道具", code: "FS-002", description: "明代官员蟒袍玉带", status: :available, value: 22000, notes: "贵重戏服" }
]

props = Prop.create!(props_data)
puts "已创建 #{Prop.count} 个道具"

def create_borrow_record(prop, crew, applicant, confirmer, auditor, status, start_date, end_date, options = {})
  borrow = BorrowRecord.create!(
    prop: prop,
    crew: crew,
    applicant: applicant,
    confirmer: confirmer,
    auditor: auditor,
    status: status,
    expected_start_date: start_date,
    expected_end_date: end_date,
    purpose: options[:purpose] || "#{crew.play_name}演出使用",
    checked_out_at: options[:checked_out_at],
    returned_at: options[:returned_at],
    confirmed_at: options[:confirmed_at],
    return_notes: options[:return_notes],
    damage_type: options[:damage_type],
    damage_description: options[:damage_description]
  )
  borrow
end

thunderstorm_crew = Crew.find_by(name: "雷雨剧组")
teahouse_crew = Crew.find_by(name: "茶馆剧组")
peony_pavilion_crew = Crew.find_by(name: "牡丹亭剧组")
secret_love_crew = Crew.find_by(name: "暗恋桃花源剧组")

rosewood_table = Prop.find_by(name: "紫檀木八仙桌")
redwood_chair = Prop.find_by(name: "红木太师椅")
blue_vase = Prop.find_by(name: "龙纹青花瓶")
porcelain_plate = Prop.find_by(name: "粉彩花鸟盘")
screen = Prop.find_by(name: "刺绣牡丹屏风")
bronze_ding = Prop.find_by(name: "青铜鼎")
phoenix_crown = Prop.find_by(name: "凤冠霞帔")
python_robe = Prop.find_by(name: "蟒袍玉带")

# 样本1：按期归还的借调记录
borrow1 = create_borrow_record(
  rosewood_table, thunderstorm_crew,
  stage_managers[0], crew_leaders[0], asset_auditors[0],
  :returned,
  30.days.ago.to_date, 20.days.ago.to_date,
  purpose: "《雷雨》第三幕客厅场景使用",
  confirmed_at: 31.days.ago,
  checked_out_at: 30.days.ago + 8.hours,
  returned_at: 20.days.ago + 17.hours
)
borrow1.inspection_records.create!(
  inspector: asset_auditors[0],
  inspection_type: :checkout,
  condition: :good,
  notes: "出库检查：桌面完好，无划痕，结构牢固"
)
borrow1.inspection_records.create!(
  inspector: asset_auditors[0],
  inspection_type: :return,
  condition: :good,
  notes: "归还检查：完好无损，与出库时一致"
)
puts "已创建按期归还样本：紫檀木八仙桌 - 雷雨剧组"

borrow2 = create_borrow_record(
  python_robe, peony_pavilion_crew,
  stage_managers[1], crew_leaders[0], asset_auditors[1],
  :returned,
  25.days.ago.to_date, 15.days.ago.to_date,
  purpose: "《牡丹亭》男主人公演出服",
  confirmed_at: 26.days.ago,
  checked_out_at: 25.days.ago + 9.hours,
  returned_at: 15.days.ago + 18.hours
)
borrow2.inspection_records.create!(
  inspector: asset_auditors[1],
  inspection_type: :checkout,
  condition: :good,
  notes: "出库检查：刺绣完好，无脱线"
)
borrow2.inspection_records.create!(
  inspector: asset_auditors[1],
  inspection_type: :return,
  condition: :good,
  notes: "归还检查：完好，已清洁"
)
puts "已创建按期归还样本：蟒袍玉带 - 牡丹亭剧组"

# 样本2：道具破损的借调记录
borrow3 = create_borrow_record(
  blue_vase, teahouse_crew,
  stage_managers[0], crew_leaders[1], asset_auditors[0],
  :damaged,
  10.days.ago.to_date, 3.days.ago.to_date,
  purpose: "《茶馆》第一幕桌上陈设",
  confirmed_at: 11.days.ago,
  checked_out_at: 10.days.ago + 10.hours,
  return_notes: "归还时发现瓶身有裂纹",
  damage_type: :moderate,
  damage_description: "瓶身腹部有一道约5cm长的裂纹，口沿处有小磕碰"
)
borrow3.inspection_records.create!(
  inspector: asset_auditors[0],
  inspection_type: :checkout,
  condition: :good,
  notes: "出库检查：瓶身完整，无裂纹，釉面光亮"
)
borrow3.inspection_records.create!(
  inspector: asset_auditors[0],
  inspection_type: :return,
  condition: :damaged,
  notes: "归还检查：瓶身腹部有裂纹，口沿有磕损",
  issues_found: "瓶身裂纹、口沿磕损"
)

# 为破损道具创建赔付
compensation1 = borrow3.create_compensation!(
  amount: 4000,
  basis: "根据道具价值8000元，中度损坏按50%赔付，需支付4000元。裂纹修复难度较大，影响道具外观和使用价值。",
  handler: asset_auditors[0],
  status: :pending
)
puts "已创建道具破损样本：龙纹青花瓶 - 茶馆剧组（中度损坏，赔付4000元）"

# 样本3：跨剧组借调冲突 - 两个剧组同时借同一个道具
borrow4 = create_borrow_record(
  screen, thunderstorm_crew,
  stage_managers[0], crew_leaders[0], asset_auditors[0],
  :confirmed,
  5.days.from_now.to_date, 15.days.from_now.to_date,
  purpose: "《雷雨》第二幕背景装饰",
  confirmed_at: 1.day.ago
)
puts "已创建借调样本：刺绣牡丹屏风 - 雷雨剧组（已确认）"

# 这个是冲突的，创建为待确认状态
borrow5 = create_borrow_record(
  screen, teahouse_crew,
  stage_managers[1], nil, nil,
  :pending,
  8.days.from_now.to_date, 20.days.from_now.to_date,
  purpose: "《茶馆》场景布置使用"
)
puts "已创建借调冲突样本：刺绣牡丹屏风 - 茶馆剧组（待确认，与雷雨剧组冲突）"

# 样本4：赔付争议样本
borrow6 = create_borrow_record(
  porcelain_plate, secret_love_crew,
  stage_managers[1], crew_leaders[1], asset_auditors[1],
  :compensating,
  20.days.ago.to_date, 10.days.ago.to_date,
  purpose: "《暗恋桃花源》道具陈设",
  confirmed_at: 21.days.ago,
  checked_out_at: 20.days.ago + 8.hours,
  damage_type: :severe,
  damage_description: "盘沿大面积缺损，盘面有贯穿裂纹"
)
borrow6.inspection_records.create!(
  inspector: asset_auditors[1],
  inspection_type: :checkout,
  condition: :minor_issue,
  notes: "出库检查：盘沿有轻微旧磕，不影响使用"
)
borrow6.inspection_records.create!(
  inspector: asset_auditors[1],
  inspection_type: :return,
  condition: :unusable,
  notes: "归还检查：盘沿大面积缺损，盘面有裂纹，已无法正常使用",
  issues_found: "盘沿缺损、盘面贯穿裂纹"
)

compensation2 = borrow6.create_compensation!(
  amount: 3500,
  basis: "粉彩花鸟盘完全损毁，按全价3500元赔付。该道具为易碎品，使用不当造成严重损坏。",
  handler: asset_auditors[1],
  status: :disputed,
  dispute_reason: "剧组认为损坏程度被夸大，出库时就有旧伤，且3500元价格过高。认为应按折旧后价格赔付，约2000元。",
  disputed_at: 5.days.ago,
  resolution: nil
)
puts "已创建赔付争议样本：粉彩花鸟盘 - 暗恋桃花源剧组（赔付争议中）"

# 正在进行中的借调
borrow7 = create_borrow_record(
  bronze_ding, peony_pavilion_crew,
  stage_managers[0], crew_leaders[0], asset_auditors[0],
  :checked_out,
  2.days.ago.to_date, 10.days.from_now.to_date,
  purpose: "《牡丹亭》祭祀场景道具",
  confirmed_at: 3.days.ago,
  checked_out_at: 2.days.ago + 9.hours
)
borrow7.inspection_records.create!(
  inspector: asset_auditors[0],
  inspection_type: :checkout,
  condition: :good,
  notes: "出库检查：鼎身完整，纹饰清晰"
)
puts "已创建进行中借调：青铜鼎 - 牡丹亭剧组（已出库）"

borrow8 = create_borrow_record(
  redwood_chair, secret_love_crew,
  stage_managers[1], crew_leaders[1], asset_auditors[1],
  :returning,
  7.days.ago.to_date, 1.day.ago.to_date,
  purpose: "《暗恋桃花源》舞台道具",
  confirmed_at: 8.days.ago,
  checked_out_at: 7.days.ago + 10.hours,
  return_notes: "按时归还，外观完好"
)
borrow8.inspection_records.create!(
  inspector: asset_auditors[1],
  inspection_type: :checkout,
  condition: :good,
  notes: "出库检查：一对椅子完好无损"
)
puts "已创建待审核归还：红木太师椅 - 暗恋桃花源剧组（待审核归还）"

# 维修记录
repair1 = bronze_ding.repair_records.create!(
  borrow_record: nil,
  handler: asset_auditors[0],
  damage_description: "鼎耳有轻微松动，需要加固",
  repair_method: "铜焊加固耳根部，表面做旧处理",
  cost: 800,
  start_date: 2.months.ago.to_date,
  expected_finish_date: 2.months.ago.to_date + 7,
  finished_date: 2.months.ago.to_date + 5,
  status: :completed
)
puts "已创建维修记录样本：青铜鼎 - 已完成维修"

# 道具状态更新
rosewood_table.update!(total_borrow_count: 5, damage_count: 0)
blue_vase.update!(total_borrow_count: 3, damage_count: 1)
porcelain_plate.update!(total_borrow_count: 4, damage_count: 1)
bronze_ding.update!(total_borrow_count: 8, damage_count: 1)
python_robe.update!(total_borrow_count: 6, damage_count: 0)
phoenix_crown.update!(total_borrow_count: 2, damage_count: 0)
screen.update!(total_borrow_count: 4, damage_count: 0)
redwood_chair.update!(total_borrow_count: 7, damage_count: 0)

# 再创建一些历史借调记录用于统计
3.times do |i|
  borrow = create_borrow_record(
    redwood_chair, thunderstorm_crew,
    stage_managers[i % 2], crew_leaders[0], asset_auditors[i % 2],
    :returned,
    (60 + i * 30).days.ago.to_date, (50 + i * 30).days.ago.to_date,
    purpose: "《雷雨》演出道具使用",
    confirmed_at: (61 + i * 30).days.ago,
    checked_out_at: (60 + i * 30).days.ago + 8.hours,
    returned_at: (50 + i * 30).days.ago + 17.hours
  )
  borrow.inspection_records.create!(
    inspector: asset_auditors[i % 2],
    inspection_type: :checkout,
    condition: :good
  )
  borrow.inspection_records.create!(
    inspector: asset_auditors[i % 2],
    inspection_type: :return,
    condition: :good
  )
end

2.times do |i|
  borrow = create_borrow_record(
    phoenix_crown, peony_pavilion_crew,
    stage_managers[i], crew_leaders[0], asset_auditors[i],
    :returned,
    (90 + i * 40).days.ago.to_date, (80 + i * 40).days.ago.to_date,
    purpose: "《牡丹亭》演出使用",
    confirmed_at: (91 + i * 40).days.ago,
    checked_out_at: (90 + i * 40).days.ago + 9.hours,
    returned_at: (80 + i * 40).days.ago + 18.hours
  )
  borrow.inspection_records.create!(inspector: asset_auditors[i], inspection_type: :checkout, condition: :good)
  borrow.inspection_records.create!(inspector: asset_auditors[i], inspection_type: :return, condition: :good)
end

puts ""
puts "=" * 50
puts "种子数据创建完成！"
puts "用户数：#{User.count}"
puts "剧组数：#{Crew.count}"
puts "道具数：#{Prop.count}"
puts "借调记录数：#{BorrowRecord.count}"
puts "检查记录数：#{InspectionRecord.count}"
puts "赔付记录数：#{Compensation.count}"
puts "维修记录数：#{RepairRecord.count}"
puts ""
puts "样本数据概览："
puts "  1. 按期归还：紫檀木八仙桌（雷雨剧组）、蟒袍玉带（牡丹亭剧组）"
puts "  2. 道具破损：龙纹青花瓶（茶馆剧组）- 中度损坏，赔付4000元"
puts "  3. 跨剧组冲突：刺绣牡丹屏风 - 雷雨剧组（已确认）vs 茶馆剧组（待确认）"
puts "  4. 赔付争议：粉彩花鸟盘（暗恋桃花源剧组）- 全损赔付3500元有争议"
puts "  5. 待审核归还：红木太师椅（暗恋桃花源剧组）"
puts "  6. 进行中借调：青铜鼎（牡丹亭剧组）"
puts "=" * 50
