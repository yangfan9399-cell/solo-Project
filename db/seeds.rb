puts "开始初始化数据..."

# 清空现有数据
[WorkflowNode, LossReport, AllocationItem, Allocation, Batch, Material, MaterialCategory, Store, Region, User].each(&:delete_all)

# 创建区域
regions = [
  { name: "华东区", code: "HD", description: "华东地区门店" },
  { name: "华南区", code: "HN", description: "华南地区门店" },
  { name: "华北区", code: "HB", description: "华北地区门店" }
]
regions_data = regions.map { |r| Region.create!(r) }

# 创建门店
stores_data = []
regions_data.each do |region|
  stores_data << Store.create!(
    region: region,
    name: "#{region.name}配送中心",
    code: "#{region.code}WH01",
    address: "#{region.name}配送中心地址",
    store_type: :warehouse
  )
  2.times do |i|
    stores_data << Store.create!(
      region: region,
      name: "#{region.name}餐厅#{i + 1}",
      code: "#{region.code}R0#{i + 1}",
      address: "#{region.name}餐厅地址#{i + 1}",
      store_type: :restaurant
    )
  end
end

# 创建物料分类
categories = [
  { name: "蔬菜类", code: "VEG" },
  { name: "肉类", code: "MEAT" },
  { name: "水产类", code: "SEA" },
  { name: "调料类", code: "COND" }
]
categories_data = categories.map { |c| MaterialCategory.create!(c) }

# 创建物料
materials = [
  { category: categories_data[0], name: "小白菜", code: "V001", unit: "kg", specification: "新鲜" },
  { category: categories_data[0], name: "菠菜", code: "V002", unit: "kg", specification: "新鲜" },
  { category: categories_data[1], name: "五花肉", code: "M001", unit: "kg", specification: "冷鲜" },
  { category: categories_data[1], name: "鸡腿肉", code: "M002", unit: "kg", specification: "冷鲜" },
  { category: categories_data[2], name: "鲈鱼", code: "S001", unit: "kg", specification: "活鲜" },
  { category: categories_data[2], name: "基围虾", code: "S002", unit: "kg", specification: "活鲜" },
  { category: categories_data[3], name: "生抽", code: "C001", unit: "L", specification: "500ml瓶装" },
  { category: categories_data[3], name: "蚝油", code: "C002", unit: "L", specification: "500ml瓶装" }
]
materials_data = materials.map { |m| Material.create!(m) }

# 创建用户
users = [
  { name: "张三", employee_id: "E001", role: :store_manager, store: stores_data[1] },
  { name: "李四", employee_id: "E002", role: :store_manager, store: stores_data[2] },
  { name: "王五", employee_id: "E003", role: :store_manager, store: stores_data[3] },
  { name: "赵六", employee_id: "E004", role: :warehouse_dispatcher, store: stores_data[0] },
  { name: "钱七", employee_id: "E005", role: :finance_reviewer, store: nil }
]
users_data = users.map { |u| User.create!(u) }

# ==========================================
# 场景1: 正常调拨 - 从仓库调拨肉类到餐厅
# ==========================================
batch_normal = Batch.create!(
  material: materials_data[2], # 五花肉
  store: stores_data[0], # 华东区配送中心
  batch_number: "B20250601M001",
  production_date: Date.today - 1,
  expiry_date: Date.today + 10,
  quantity: 100,
  available_quantity: 100,
  status: :in_stock,
  warning_level: :normal
)

allocation_normal = Allocation.create!(
  source_store: stores_data[0],
  target_store: stores_data[1],
  creator: users_data[3], # 赵六 - 仓库调度
  allocation_number: Allocation.generate_number,
  status: :approved,
  remark: "餐厅日常备货"
)

AllocationItem.create!(
  allocation: allocation_normal,
  batch: batch_normal,
  quantity: 30,
  status: :in_transit
)

# ==========================================
# 场景2: 临期报损 - 菠菜临近过期需要报损
# ==========================================
batch_expiry = Batch.create!(
  material: materials_data[1], # 菠菜
  store: stores_data[1],
  batch_number: "B20250603V002",
  production_date: Date.today - 5,
  expiry_date: Date.today + 2, # 临期
  quantity: 30,
  available_quantity: 0,
  status: :lost,
  warning_level: :warning
)

LossReport.create!(
  batch: batch_expiry,
  reporter: users_data[0], # 张三 - 门店店长
  reviewer: users_data[4], # 钱七 - 财务复核
  report_number: LossReport.generate_number,
  loss_type: :near_expiry,
  quantity: 30,
  status: :approved,
  reason: "菠菜临近保质期，剩余2天，无法继续销售"
)

# ==========================================
# 场景3: 门店拒收 - 鲈鱼被拒收需走报损审核
# ==========================================
batch_rejection = Batch.create!(
  material: materials_data[4], # 鲈鱼
  store: stores_data[0],
  batch_number: "B20250606S001",
  production_date: Date.today - 1,
  expiry_date: Date.today + 3,
  quantity: 20,
  available_quantity: 0,
  status: :lost,
  warning_level: :normal
)

allocation_rejection = Allocation.create!(
  source_store: stores_data[0],
  target_store: stores_data[2],
  creator: users_data[3],
  allocation_number: Allocation.generate_number,
  status: :rejected,
  remark: "门店反馈鲈鱼有异味"
)

item_rejection = AllocationItem.create!(
  allocation: allocation_rejection,
  batch: batch_rejection,
  quantity: 20,
  status: :rejected,
  rejection_reason: "鲈鱼有异味，拒绝收货"
)

LossReport.create!(
  allocation: allocation_rejection,
  batch: batch_rejection,
  reporter: users_data[1], # 李四 - 门店店长(收货方)
  reviewer: users_data[4],
  report_number: LossReport.generate_number,
  loss_type: :rejection,
  quantity: 20,
  status: :approved,
  reason: "门店拒收：鲈鱼有异味，经验收不符合收货标准"
)

# ==========================================
# 场景4: 数量差异 - 基围虾实际数量与调拨单不符
# ==========================================
batch_discrepancy = Batch.create!(
  material: materials_data[5], # 基围虾
  store: stores_data[0],
  batch_number: "B20250607S002",
  production_date: Date.today,
  expiry_date: Date.today + 5,
  quantity: 40,
  available_quantity: 0,
  status: :lost,
  warning_level: :normal
)

allocation_discrepancy = Allocation.create!(
  source_store: stores_data[0],
  target_store: stores_data[3],
  creator: users_data[3],
  allocation_number: Allocation.generate_number,
  status: :received,
  remark: "餐厅紧急备货"
)

item_discrepancy = AllocationItem.create!(
  allocation: allocation_discrepancy,
  batch: batch_discrepancy,
  quantity: 40,
  actual_quantity: 35, # 少了5kg
  status: :received
)

LossReport.create!(
  allocation: allocation_discrepancy,
  batch: batch_discrepancy,
  reporter: users_data[2], # 王五 - 门店店长(收货方)
  reviewer: users_data[4],
  report_number: LossReport.generate_number,
  loss_type: :quantity_discrepancy,
  quantity: 5,
  status: :approved,
  reason: "调拨单数量40kg，实际收货35kg，数量差异5kg"
)

# ==========================================
# 待处理的调拨单和报损单
# ==========================================
# 待审批调拨
Batch.create!(
  material: materials_data[6], # 生抽
  store: stores_data[0],
  batch_number: "B20250608C001",
  production_date: Date.today - 30,
  expiry_date: Date.today + 180,
  quantity: 50,
  available_quantity: 50,
  status: :in_stock,
  warning_level: :normal
)

Allocation.create!(
  source_store: stores_data[0],
  target_store: stores_data[1],
  creator: users_data[3],
  allocation_number: Allocation.generate_number,
  status: :pending,
  remark: "调料补充"
)

# 待审核报损
batch_pending = Batch.create!(
  material: materials_data[3], # 鸡腿肉
  store: stores_data[2],
  batch_number: "B20250609M002",
  production_date: Date.today - 2,
  expiry_date: Date.today + 3,
  quantity: 25,
  available_quantity: 0,
  status: :lost,
  warning_level: :warning
)

LossReport.create!(
  batch: batch_pending,
  reporter: users_data[1],
  report_number: LossReport.generate_number,
  loss_type: :near_expiry,
  quantity: 25,
  status: :pending,
  reason: "鸡腿肉临近保质期，剩余3天"
)

puts "=" * 50
puts "数据初始化完成！"
puts "=" * 50
puts "区域: #{Region.count}"
puts "门店: #{Store.count}"
puts "  - 仓库: #{Store.where(store_type: :warehouse).count}"
puts "  - 餐厅: #{Store.where(store_type: :restaurant).count}"
puts "物料分类: #{MaterialCategory.count}"
puts "物料: #{Material.count}"
puts "用户: #{User.count}"
puts "  - 门店店长: #{User.where(role: :store_manager).count}"
puts "  - 仓库调度: #{User.where(role: :warehouse_dispatcher).count}"
puts "  - 财务复核: #{User.where(role: :finance_reviewer).count}"
puts "批次: #{Batch.count}"
puts "调拨单: #{Allocation.count}"
puts "  - 待审批: #{Allocation.where(status: :pending).count}"
puts "  - 已批准: #{Allocation.where(status: :approved).count}"
puts "  - 已发货: #{Allocation.where(status: :in_transit).count}"
puts "  - 已收货: #{Allocation.where(status: :received).count}"
puts "  - 已拒收: #{Allocation.where(status: :rejected).count}"
puts "报损单: #{LossReport.count}"
puts "  - 待审核: #{LossReport.where(status: :pending).count}"
puts "  - 已批准: #{LossReport.where(status: :approved).count}"
puts "=" * 50
puts "样本场景:"
puts "  1. 正常调拨 - 仓库调拨肉类到餐厅 (调拨单号: #{allocation_normal.allocation_number})"
puts "  2. 临期报损 - 菠菜临近过期报损 (报损单号: #{LossReport.where(loss_type: :near_expiry).first.report_number})"
puts "  3. 门店拒收 - 鲈鱼被拒收走报损审核 (报损单号: #{LossReport.where(loss_type: :rejection).first.report_number})"
puts "  4. 数量差异 - 基围虾实际数量少5kg (报损单号: #{LossReport.where(loss_type: :quantity_discrepancy).first.report_number})"
puts "=" * 50
