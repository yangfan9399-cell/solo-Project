User.create!(
  email: "admin@example.com",
  password: "admin123",
  name: "系统管理员",
  role: "admin"
)

User.create!(
  email: "biz@example.com",
  password: "biz123",
  name: "张商务",
  role: "biz_admin"
)

User.create!(
  email: "copyright@example.com",
  password: "copyright123",
  name: "李版权",
  role: "copyright_admin"
)

User.create!(
  email: "legal@example.com",
  password: "legal123",
  name: "王法务",
  role: "legal"
)

User.create!(
  email: "finance@example.com",
  password: "finance123",
  name: "赵财务",
  role: "finance"
)

tracks_data = [
  { title: "阳光旋律", artist: "音乐家A", copyright_holder: "版权方A", duration: 180, genre: "流行" },
  { title: "夜色温柔", artist: "音乐家B", copyright_holder: "版权方B", duration: 240, genre: "抒情" },
  { title: "激情燃烧", artist: "音乐家C", copyright_holder: "版权方C", duration: 210, genre: "摇滚" },
  { title: "青春记忆", artist: "音乐家D", copyright_holder: "版权方D", duration: 195, genre: "流行" },
  { title: "都市节奏", artist: "音乐家E", copyright_holder: "版权方E", duration: 165, genre: "电子" },
  { title: "古典之声", artist: "音乐家F", copyright_holder: "版权方F", duration: 300, genre: "古典" },
  { title: "民谣故事", artist: "音乐家G", copyright_holder: "版权方G", duration: 225, genre: "民谣" },
  { title: "爵士夜曲", artist: "音乐家H", copyright_holder: "版权方H", duration: 270, genre: "爵士" },
  { title: "动感节拍", artist: "音乐家I", copyright_holder: "版权方I", duration: 150, genre: "电子" },
  { title: "浪漫小调", artist: "音乐家J", copyright_holder: "版权方J", duration: 200, genre: "抒情" },
  { title: "摇滚风暴", artist: "音乐家K", copyright_holder: "版权方K", duration: 180, genre: "摇滚" },
  { title: "清新旋律", artist: "音乐家L", copyright_holder: "版权方L", duration: 210, genre: "流行" },
  { title: "电子脉冲", artist: "音乐家M", copyright_holder: "版权方M", duration: 165, genre: "电子" },
  { title: "古典交响", artist: "音乐家N", copyright_holder: "版权方N", duration: 360, genre: "古典" },
  { title: "民谣情怀", artist: "音乐家O", copyright_holder: "版权方O", duration: 240, genre: "民谣" },
  { title: "爵士即兴", artist: "音乐家P", copyright_holder: "版权方P", duration: 280, genre: "爵士" },
  { title: "动感舞曲", artist: "音乐家Q", copyright_holder: "版权方Q", duration: 140, genre: "电子" },
  { title: "浪漫夜曲", artist: "音乐家R", copyright_holder: "版权方R", duration: 220, genre: "抒情" },
  { title: "摇滚经典", artist: "音乐家S", copyright_holder: "版权方S", duration: 190, genre: "摇滚" },
  { title: "清新小调", artist: "音乐家T", copyright_holder: "版权方T", duration: 180, genre: "流行" }
]

tracks = tracks_data.map { |data| Track.create!(data) }

TrackAuthorizationScope.create!(
  track: tracks[0],
  scope_type: "tv_ad",
  territory: "中国大陆",
  valid_from: Date.new(2024, 1, 1),
  valid_to: Date.new(2024, 12, 31)
)

TrackAuthorizationScope.create!(
  track: tracks[0],
  scope_type: "online_video",
  territory: "中国大陆",
  valid_from: Date.new(2024, 1, 1),
  valid_to: Date.new(2024, 12, 31)
)

TrackAuthorizationScope.create!(
  track: tracks[1],
  scope_type: "tv_ad",
  territory: "中国大陆",
  valid_from: Date.new(2024, 1, 1),
  valid_to: Date.new(2024, 12, 31)
)

TrackAuthorizationScope.create!(
  track: tracks[1],
  scope_type: "online_video",
  territory: "中国大陆",
  valid_from: Date.new(2024, 1, 1),
  valid_to: Date.new(2024, 12, 31)
)

TrackAuthorizationScope.create!(
  track: tracks[2],
  scope_type: "film",
  territory: "中国大陆",
  valid_from: Date.new(2024, 1, 1),
  valid_to: Date.new(2024, 6, 30)
)

TrackAuthorizationScope.create!(
  track: tracks[3],
  scope_type: "tv_ad",
  territory: "中国大陆",
  valid_from: Date.new(2024, 1, 1),
  valid_to: Date.new(2024, 12, 31)
)

biz_user = User.find_by(email: "biz@example.com")
copyright_user = User.find_by(email: "copyright@example.com")
legal_user = User.find_by(email: "legal@example.com")
finance_user = User.find_by(email: "finance@example.com")

normal_app = Application.create!(
  user: biz_user,
  track: tracks[0],
  client_name: "某知名广告公司",
  client_industry: "广告",
  client_contact: "联系人A",
  usage_scenario: "tv_ad",
  territory: "中国大陆",
  start_date: Date.new(2024, 1, 1),
  end_date: Date.new(2024, 12, 31),
  status: "approved",
  budget: 50000.00
)

Review.create!(
  application: normal_app,
  reviewer: copyright_user,
  review_type: "copyright",
  status: "approved",
  comment: "权利核验通过，授权范围符合要求"
)

Review.create!(
  application: normal_app,
  reviewer: legal_user,
  review_type: "legal",
  status: "approved",
  comment: "合同条款审核通过，无法律风险"
)

Review.create!(
  application: normal_app,
  reviewer: finance_user,
  review_type: "finance",
  status: "approved",
  comment: "结算金额确认无误"
)

Contract.create!(
  application: normal_app,
  status: "signed",
  signed_date: Date.new(2024, 1, 15)
)

Settlement.create!(
  application: normal_app,
  total_amount: 50000.00,
  copyright_holder_share: 70.00,
  agent_share: 30.00,
  tax_amount: 5000.00,
  status: "confirmed",
  confirmed_at: Time.current
)

out_of_range_app = Application.create!(
  user: biz_user,
  track: tracks[1],
  client_name: "某电商平台",
  client_industry: "电商",
  client_contact: "联系人B",
  usage_scenario: "live_stream",
  territory: "中国大陆",
  start_date: Date.new(2024, 3, 1),
  end_date: Date.new(2024, 6, 30),
  status: "draft",
  budget: 30000.00,
  metadata: {
    block_reason: "曲库仅授权电视广告和线上视频，不包含直播场景"
  }
)

date_conflict_app = Application.create!(
  user: biz_user,
  track: tracks[2],
  client_name: "某影视制作公司",
  client_industry: "影视",
  client_contact: "联系人C",
  usage_scenario: "film",
  territory: "中国大陆",
  start_date: Date.new(2024, 4, 1),
  end_date: Date.new(2024, 8, 31),
  status: "pending_copyright",
  budget: 80000.00,
  metadata: {
    conflict_info: "申请期限与现有授权重叠"
  }
)

dispute_app = Application.create!(
  user: biz_user,
  track: tracks[3],
  client_name: "某品牌营销公司",
  client_industry: "营销",
  client_contact: "联系人D",
  usage_scenario: "tv_ad",
  territory: "中国大陆",
  start_date: Date.new(2024, 2, 1),
  end_date: Date.new(2024, 7, 31),
  status: "disputed",
  budget: 60000.00
)

Review.create!(
  application: dispute_app,
  reviewer: copyright_user,
  review_type: "copyright",
  status: "approved",
  comment: "权利核验通过"
)

Review.create!(
  application: dispute_app,
  reviewer: legal_user,
  review_type: "legal",
  status: "approved",
  comment: "合同审核通过"
)

Settlement.create!(
  application: dispute_app,
  total_amount: 60000.00,
  copyright_holder_share: 60.00,
  agent_share: 40.00,
  status: "disputed",
  dispute_reason: "版权方与代理商分成比例分歧，版权方要求70%，代理商坚持40%"
)

puts "种子数据创建完成！"
puts "用户: #{User.count} 个"
puts "曲目: #{Track.count} 首"
puts "授权范围: #{TrackAuthorizationScope.count} 条"
puts "授权申请: #{Application.count} 个"
puts "审核记录: #{Review.count} 条"
puts "合同: #{Contract.count} 个"
puts "结算: #{Settlement.count} 条"