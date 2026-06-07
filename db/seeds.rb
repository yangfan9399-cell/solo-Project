puts "开始创建种子数据..."

users_data = [
  { name: "张主管", email: "admin@example.com", role: :supervisor, password: "password" },
  { name: "李设计师", email: "designer@example.com", role: :designer, password: "password" },
  { name: "王版师", email: "pattern@example.com", role: :pattern_maker, password: "password" },
  { name: "赵评审", email: "reviewer@example.com", role: :reviewer, password: "password" }
]

users = {}
users_data.each do |user_data|
  user = User.find_or_create_by!(email: user_data[:email]) do |u|
    u.name = user_data[:name]
    u.role = user_data[:role]
    u.password = user_data[:password]
    u.password_confirmation = user_data[:password]
  end
  users[user_data[:role]] = user
  puts "用户已创建/存在: #{user.name} (#{user.email})"
end

issue_types_data = {
  "尺码偏差" => ["尺码偏大", "尺码偏小", "比例失调"],
  "面料问题" => ["面料起球", "面料褪色", "面料缩水"],
  "版型问题" => ["版型宽松", "版型紧身", "肩部不合"],
  "工艺问题" => ["缝线不平整", "线头过多", "拉链卡顿"],
  "设计问题" => ["款式过时", "颜色不符", "细节缺失"],
  "其他" => ["包装破损", "标签错误", "气味异常"]
}

issue_types = {}
issue_types_data.each do |category, names|
  issue_types[category] = []
  names.each do |name|
    issue_type = IssueType.find_or_create_by!(name: name, category: category)
    issue_types[category] << issue_type
    puts "问题类型已创建/存在: #{category} - #{name}"
  end
end

def size_chart(chest_offset: 0, waist_offset: 0, hip_offset: 0)
  {
    "S" => { "胸围" => 88 + chest_offset, "腰围" => 68 + waist_offset, "臀围" => 92 + hip_offset },
    "M" => { "胸围" => 92 + chest_offset, "腰围" => 72 + waist_offset, "臀围" => 96 + hip_offset },
    "L" => { "胸围" => 96 + chest_offset, "腰围" => 76 + waist_offset, "臀围" => 100 + hip_offset },
    "XL" => { "胸围" => 100 + chest_offset, "腰围" => 80 + waist_offset, "臀围" => 104 + hip_offset }
  }
end

designer = users[:designer]
pattern_maker = users[:pattern_maker]
reviewer = users[:reviewer]
supervisor = users[:supervisor]

sample1 = Sample.find_or_create_by!(style_number: "S2024-001") do |s|
  s.category = "衬衫"
  s.description = "经典款白色商务衬衫，适合日常办公穿着"
  s.fabric = "100%纯棉，80支双股"
  s.size_chart = size_chart
  s.status = :finalized
  s.version_count = 1
  s.designer = designer
  s.pattern_maker = pattern_maker
  s.current_owner = designer
  s.submitted_at = 10.days.ago
  s.finalized_at = 5.days.ago
  s.supervisor_confirmation_required = false
  s.supervisor_confirmed = true
end
puts "样衣已创建/存在: #{sample1.style_number} - #{sample1.category}"

if sample1.sample_versions.empty?
  v1 = sample1.sample_versions.create!(
    version_number: 1,
    description: "初始版本",
    fabric: sample1.fabric,
    size_chart: sample1.size_chart,
    created_by: designer,
    created_at: 10.days.ago
  )
  puts "  版本 v1 已创建"

  sample1.all_reviews.create!(
    sample_version: v1,
    reviewer: reviewer,
    verdict: :pass,
    feedback: "样衣制作精良，版型合身，面料舒适，符合设计要求。",
    issues: [],
    created_at: 7.days.ago
  )
  puts "  评审记录已创建（通过）"

  sample1.all_reviews.create!(
    sample_version: v1,
    reviewer: reviewer,
    verdict: :finalize,
    feedback: "确认定版，可以投入生产。",
    issues: [],
    created_at: 5.days.ago
  )
  puts "  定版评审记录已创建"
end

sample2 = Sample.find_or_create_by!(style_number: "S2024-002") do |s|
  s.category = "裤子"
  s.description = "修身款牛仔裤，经典五袋设计"
  s.fabric = "98%棉 2%氨纶，12盎司牛仔布"
  s.size_chart = size_chart(chest_offset: 0, waist_offset: 2, hip_offset: 2)
  s.status = :revision
  s.version_count = 2
  s.designer = designer
  s.pattern_maker = pattern_maker
  s.current_owner = pattern_maker
  s.submitted_at = 14.days.ago
  s.supervisor_confirmation_required = false
  s.supervisor_confirmed = true
end
puts "样衣已创建/存在: #{sample2.style_number} - #{sample2.category}"

if sample2.sample_versions.empty?
  v1 = sample2.sample_versions.create!(
    version_number: 1,
    description: "初始版本",
    fabric: sample2.fabric,
    size_chart: size_chart(chest_offset: 0, waist_offset: 0, hip_offset: 0),
    created_by: designer,
    created_at: 14.days.ago
  )
  puts "  版本 v1 已创建"

  sample2.all_reviews.create!(
    sample_version: v1,
    reviewer: reviewer,
    verdict: :revise,
    feedback: "腰围和臀围尺码偏小，需要放大一码。整体版型偏紧，建议增加松量。",
    issues: [
      { "type" => "尺码偏小" },
      { "type" => "版型紧身" }
    ],
    created_at: 10.days.ago
  )
  puts "  v1 评审记录已创建（修改）"

  v2 = sample2.sample_versions.create!(
    version_number: 2,
    description: "根据评审意见调整尺码，腰围和臀围各增加2cm",
    fabric: sample2.fabric,
    size_chart: size_chart(chest_offset: 0, waist_offset: 2, hip_offset: 2),
    created_by: pattern_maker,
    created_at: 7.days.ago
  )
  puts "  版本 v2 已创建（尺码调整）"

  sample2.all_reviews.create!(
    sample_version: v2,
    reviewer: reviewer,
    verdict: :revise,
    feedback: "尺码有所改善，但腰部仍然略紧，建议再增加1cm松量。",
    issues: [
      { "type" => "尺码偏小" }
    ],
    created_at: 3.days.ago
  )
  puts "  v2 评审记录已创建（修改）"
end

sample3 = Sample.find_or_create_by!(style_number: "S2024-003") do |s|
  s.category = "连衣裙"
  s.description = "夏季碎花连衣裙，A字版型"
  s.fabric = "100%真丝雪纺，16姆米"
  s.size_chart = size_chart(chest_offset: -2, waist_offset: -2, hip_offset: -2)
  s.status = :review
  s.version_count = 2
  s.designer = designer
  s.pattern_maker = pattern_maker
  s.current_owner = reviewer
  s.submitted_at = 12.days.ago
  s.supervisor_confirmation_required = false
  s.supervisor_confirmed = true
end
puts "样衣已创建/存在: #{sample3.style_number} - #{sample3.category}"

if sample3.sample_versions.empty?
  v1 = sample3.sample_versions.create!(
    version_number: 1,
    description: "初始版本",
    fabric: "100%聚酯纤维，雪纺面料",
    size_chart: size_chart,
    created_by: designer,
    created_at: 12.days.ago
  )
  puts "  版本 v1 已创建"

  sample3.all_reviews.create!(
    sample_version: v1,
    reviewer: reviewer,
    verdict: :revise,
    feedback: "面料品质不佳，手感偏硬，缺乏垂坠感。建议更换为真丝面料。同时整体尺码略大，需要收腰处理。",
    issues: [
      { "type" => "面料起球" },
      { "type" => "尺码偏大" },
      { "type" => "版型宽松" }
    ],
    created_at: 8.days.ago
  )
  puts "  v1 评审记录已创建（修改）"

  v2 = sample3.sample_versions.create!(
    version_number: 2,
    description: "更换真丝雪纺面料，收腰处理，整体尺码减小2cm",
    fabric: "100%真丝雪纺，16姆米",
    size_chart: size_chart(chest_offset: -2, waist_offset: -2, hip_offset: -2),
    created_by: pattern_maker,
    created_at: 4.days.ago
  )
  puts "  版本 v2 已创建（面料替换）"
end

sample4 = Sample.find_or_create_by!(style_number: "S2024-004") do |s|
  s.category = "外套"
  s.description = "秋冬羊毛大衣，双排扣设计"
  s.fabric = "50%羊毛 50%聚酯纤维，混纺面料"
  s.size_chart = size_chart(chest_offset: 4, waist_offset: 2, hip_offset: 4)
  s.status = :review
  s.version_count = 4
  s.designer = designer
  s.pattern_maker = pattern_maker
  s.current_owner = reviewer
  s.submitted_at = 30.days.ago
  s.supervisor_confirmation_required = true
  s.supervisor_confirmed = false
end
puts "样衣已创建/存在: #{sample4.style_number} - #{sample4.category}"

if sample4.sample_versions.empty?
  v1 = sample4.sample_versions.create!(
    version_number: 1,
    description: "初始版本",
    fabric: sample4.fabric,
    size_chart: size_chart,
    created_by: designer,
    created_at: 30.days.ago
  )
  puts "  版本 v1 已创建"

  sample4.all_reviews.create!(
    sample_version: v1,
    reviewer: reviewer,
    verdict: :revise,
    feedback: "肩部设计不合身，版型偏瘦，面料手感一般。需要全面调整。",
    issues: [
      { "type" => "肩部不合" },
      { "type" => "版型紧身" },
      { "type" => "面料起球" }
    ],
    created_at: 26.days.ago
  )
  puts "  v1 评审记录已创建（修改）"

  v2 = sample4.sample_versions.create!(
    version_number: 2,
    description: "调整肩部设计，版型放大一码",
    fabric: sample4.fabric,
    size_chart: size_chart(chest_offset: 2, waist_offset: 1, hip_offset: 2),
    created_by: pattern_maker,
    created_at: 22.days.ago
  )
  puts "  版本 v2 已创建"

  sample4.all_reviews.create!(
    sample_version: v2,
    reviewer: reviewer,
    verdict: :revise,
    feedback: "肩部有所改善，但仍然不够理想。胸围和腰围还需要再放大一些。面料问题仍然存在。",
    issues: [
      { "type" => "肩部不合" },
      { "type" => "尺码偏小" },
      { "type" => "面料起球" }
    ],
    created_at: 18.days.ago
  )
  puts "  v2 评审记录已创建（修改）"

  v3 = sample4.sample_versions.create!(
    version_number: 3,
    description: "继续调整肩部，再次放大胸围和腰围",
    fabric: sample4.fabric,
    size_chart: size_chart(chest_offset: 4, waist_offset: 2, hip_offset: 4),
    created_by: pattern_maker,
    created_at: 14.days.ago
  )
  puts "  版本 v3 已创建"

  sample4.all_reviews.create!(
    sample_version: v3,
    reviewer: reviewer,
    verdict: :revise,
    feedback: "尺码问题基本解决，但肩部仍然有点问题。另外缝线不够平整，需要改进工艺。",
    issues: [
      { "type" => "肩部不合" },
      { "type" => "缝线不平整" }
    ],
    created_at: 10.days.ago
  )
  puts "  v3 评审记录已创建（修改）- 改版超次"

  v4 = sample4.sample_versions.create!(
    version_number: 4,
    description: "优化肩部线条，改进缝线工艺。已改版3次，需主管确认",
    fabric: sample4.fabric,
    size_chart: size_chart(chest_offset: 4, waist_offset: 2, hip_offset: 4),
    created_by: pattern_maker,
    created_at: 6.days.ago
  )
  puts "  版本 v4 已创建（第4版，超次）"

  sample4.all_reviews.create!(
    sample_version: v4,
    reviewer: reviewer,
    verdict: :pass,
    feedback: "本次改版后整体效果有明显提升，肩部和缝线问题都有改善。建议提交主管确认后定版。",
    issues: [],
    created_at: 2.days.ago
  )
  puts "  v4 评审记录已创建（通过，待主管确认）"
end

puts ""
puts "种子数据创建完成！"
puts "登录账号："
puts "  主管：admin@example.com / password"
puts "  设计师：designer@example.com / password"
puts "  版师：pattern@example.com / password"
puts "  评审人：reviewer@example.com / password"
