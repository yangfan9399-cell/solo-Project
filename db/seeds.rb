User.destroy_all
Material.destroy_all
License.destroy_all
UsageScenario.destroy_all
ReviewLog.destroy_all

puts '创建用户...'
copyright_manager = User.create!(name: '版权经办人', email: 'copyright@example.com', role: 'copyright_manager', department: 'copyright')
content_manager = User.create!(name: '内容负责人', email: 'content@example.com', role: 'content_manager', department: 'content')
legal_reviewer = User.create!(name: '法务复核员', email: 'legal@example.com', role: 'legal_reviewer', department: 'legal')
operations = User.create!(name: '运营专员', email: 'operations@example.com', role: 'operations', department: 'operations')

puts '创建素材...'
material1 = Material.create!(name: '品牌Logo', material_type: 'graphic', description: '公司品牌标识', copyright_holder: '品牌方A', created_by: copyright_manager)
material2 = Material.create!(name: '产品宣传视频', material_type: 'video', description: '2024年度产品宣传视频', copyright_holder: '制作公司B', created_by: copyright_manager)
material3 = Material.create!(name: '背景音乐', material_type: 'audio', description: '产品页面背景音乐', copyright_holder: '音乐版权方C', created_by: copyright_manager)
material4 = Material.create!(name: '产品图片集', material_type: 'image', description: '产品展示图片', copyright_holder: '摄影工作室D', created_by: copyright_manager)

puts '创建授权...'

license1 = License.create!(
  material: material1,
  licensor: '品牌方A',
  license_type: 'exclusive',
  start_date: Date.new(2024, 1, 1),
  end_date: Date.new(2025, 12, 31),
  authorized_channels: '["web", "ios", "android"]',
  contract_file: 'contract_brand_a.pdf',
  status: 'active',
  risk_reason: 'none'
)

license2 = License.create!(
  material: material2,
  licensor: '制作公司B',
  license_type: 'non_exclusive',
  start_date: Date.new(2023, 6, 1),
  end_date: Date.new(2024, 5, 31),
  authorized_channels: '["web", "h5"]',
  contract_file: 'contract_studio_b.pdf',
  status: 'expired',
  risk_reason: 'expired'
)

license3 = License.create!(
  material: material3,
  licensor: '音乐版权方C',
  license_type: 'non_exclusive',
  start_date: Date.new(2024, 1, 1),
  end_date: Date.new(2025, 12, 31),
  authorized_channels: '["web"]',
  contract_file: nil,
  status: 'document_missing',
  risk_reason: 'document_missing'
)

license4 = License.create!(
  material: material4,
  licensor: '摄影工作室D',
  license_type: 'exclusive',
  start_date: Date.new(2024, 1, 1),
  end_date: Date.new(2025, 12, 31),
  authorized_channels: '["web"]',
  contract_file: 'contract_photo_d.pdf',
  status: 'active',
  risk_reason: 'none'
)

puts '创建使用场景...'

scenario1 = UsageScenario.create!(
  material: material1,
  license: license1,
  column_name: '首页',
  channel: 'web',
  usage_scope: '首页顶部导航栏',
  bound_by: content_manager,
  status: 'active',
  approval_status: 'operations_confirmed'
)

scenario2 = UsageScenario.create!(
  material: material2,
  license: license2,
  column_name: '详情页',
  channel: 'web',
  usage_scope: '产品详情页视频展示区',
  bound_by: content_manager,
  status: 'blocked',
  approval_status: 'pending'
)

scenario3 = UsageScenario.create!(
  material: material3,
  license: license3,
  column_name: '列表页',
  channel: 'ios',
  usage_scope: '列表页背景音乐',
  bound_by: content_manager,
  status: 'blocked',
  approval_status: 'pending'
)

scenario4 = UsageScenario.create!(
  material: material4,
  license: license4,
  column_name: '广告位',
  channel: 'android',
  usage_scope: '首页轮播广告',
  bound_by: content_manager,
  status: 'pending',
  approval_status: 'pending'
)

puts '创建审核记录...'

ReviewLog.create!(
  usage_scenario: scenario1,
  reviewer: legal_reviewer,
  review_type: 'legal_review',
  status: 'approved',
  comment: '授权文件完整，使用范围符合',
  reviewed_at: Time.new(2024, 1, 15, 10, 0, 0)
)

ReviewLog.create!(
  usage_scenario: scenario1,
  reviewer: operations,
  review_type: 'operations_confirmation',
  status: 'approved',
  comment: '确认上架',
  reviewed_at: Time.new(2024, 1, 16, 14, 0, 0)
)

ReviewLog.create!(
  usage_scenario: scenario2,
  reviewer: legal_reviewer,
  review_type: 'legal_review',
  status: 'rejected',
  comment: '授权已到期，请续授权',
  reviewed_at: Time.new(2024, 6, 1, 10, 0, 0)
)

puts '数据初始化完成！'