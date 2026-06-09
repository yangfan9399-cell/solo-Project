# 清空数据
puts "清空现有数据..."
LinenEvent.delete_all
DamageClaim.delete_all
LinenItem.delete_all
LinenBatch.delete_all
User.delete_all
Hotel.delete_all
LinenType.delete_all

puts "开始创建种子数据..."

# ============ 用户 ============
puts "\n创建用户..."

users = [
  { name: '张经理', role: 'handover_staff' },
  { name: '李主管', role: 'handover_staff' },
  { name: '王师傅', role: 'laundry_staff' },
  { name: '赵厂长', role: 'laundry_staff' },
  { name: '质检刘', role: 'inspector' },
  { name: '质检陈', role: 'inspector' },
  { name: '财务周', role: 'finance_staff' }
]

users.each do |u|
  User.create!(
    name: u[:name],
    role: u[:role]
  )
end

puts "用户创建完成！共 #{User.count} 个用户"

handover_users = User.where(role: 'handover_staff').to_a
laundry_users = User.where(role: 'laundry_staff').to_a
inspectors = User.where(role: 'inspector').to_a
finance_users = User.where(role: 'finance_staff').to_a

# ============ 酒店 ============
puts "\n创建酒店..."

hotels = [
  { name: '锦江大酒店', address: '上海市浦东新区陆家嘴环路1000号', contact_person: '陈经理', phone: '021-58888888' },
  { name: '希尔顿酒店', address: '北京市朝阳区东三环北路7号', contact_person: '王总监', phone: '010-58887777' },
  { name: '香格里拉酒店', address: '深圳市福田区益田路5001号', contact_person: '刘经理', phone: '0755-88889999' },
  { name: '万豪酒店', address: '广州市天河区天河路200号', contact_person: '张主管', phone: '020-38886666' }
]

hotels.each do |h|
  Hotel.create!(h)
end

puts "酒店创建完成！共 #{Hotel.count} 家酒店"

# ============ 布草类型 ============
puts "\n创建布草类型..."

linen_types_data = [
  { name: '大床床单', category: 'bedding', unit_price: 45 },
  { name: '双床床单', category: 'bedding', unit_price: 38 },
  { name: '被套', category: 'bedding', unit_price: 68 },
  { name: '枕套', category: 'bedding', unit_price: 15 },
  { name: '面巾', category: 'towel', unit_price: 8 },
  { name: '浴巾', category: 'towel', unit_price: 25 },
  { name: '地巾', category: 'towel', unit_price: 18 },
  { name: '浴袍', category: 'bathrobe', unit_price: 88 },
  { name: '台布', category: 'tablecloth', unit_price: 55 },
  { name: '口布', category: 'tablecloth', unit_price: 6 }
]

linen_types_data.each do |lt|
  LinenType.create!(lt)
end

puts "布草类型创建完成！共 #{LinenType.count} 种类型"

linen_types = LinenType.all.to_a

# ============ 辅助方法 ============
def create_batch_items(batch, items_data)
  items_data.each do |item_data|
    lt = LinenType.find_by(name: item_data[:name])
    quantity_handed = item_data[:handed] || 0
    quantity_returned = item_data[:returned] || quantity_handed
    quantity_clean = item_data[:clean] || quantity_returned
    quantity_stained = item_data[:stained] || 0
    quantity_damaged = item_data[:damaged] || 0

    LinenItem.create!(
      linen_batch: batch,
      linen_type: lt,
      quantity_handed: quantity_handed,
      quantity_returned: quantity_returned,
      quantity_clean: quantity_clean,
      quantity_stained: quantity_stained,
      quantity_damaged: quantity_damaged,
      quantity_short: [quantity_handed - quantity_returned, 0].max
    )
  end
end

def create_damage_claim(batch, linen_type_name, reason, quantity, confirmed = false, confirmed_by = nil)
  lt = LinenType.find_by(name: linen_type_name)
  claim = DamageClaim.new(
    linen_batch: batch,
    linen_type: lt,
    reason: reason,
    quantity: quantity,
    unit_price: lt.unit_price,
    total_amount: quantity * lt.unit_price,
    confirmed: confirmed,
    confirmed_by: confirmed_by,
    confirmed_at: confirmed ? Time.current : nil
  )
  claim.save!(validate: false)

  if confirmed
    batch.events.create!(
      event_type: 'claim_confirmed',
      user: confirmed_by,
      description: "财务确认赔损：#{lt.name} #{quantity}件（#{reason}）"
    )
  end

  claim
end

# ============ 批次1：待交接 ============
puts "\n创建批次1：待交接"
batch1 = LinenBatch.create!(
  hotel: Hotel.first,
  status: 'pending',
  batch_number: '20260601-001',
  notes: '今日常规布草洗涤'
)
batch1.events.create!(
  event_type: 'created',
  user: handover_users.first,
  description: '创建批次，待交接'
)
puts "  批次 #{batch1.batch_number} 已创建"

# ============ 批次2：已交接（洗涤中） ============
puts "\n创建批次2：已交接（洗涤中）"
batch2 = LinenBatch.create!(
  hotel: Hotel.second,
  status: 'collected',
  batch_number: '20260602-001',
  handover_user: handover_users.first,
  handover_at: 1.day.ago
)
batch2.events.create!(event_type: 'created', user: handover_users.first, description: '创建批次')
batch2.events.create!(event_type: 'collected', user: handover_users.first, description: '客房经办人已交接布草')

create_batch_items(batch2, [
  { name: '大床床单', handed: 30 },
  { name: '被套', handed: 30 },
  { name: '枕套', handed: 60 },
  { name: '面巾', handed: 50 },
  { name: '浴巾', handed: 30 }
])
puts "  批次 #{batch2.batch_number} 已创建"

# ============ 批次3：已洗涤 ============
puts "\n创建批次3：已洗涤"
batch3 = LinenBatch.create!(
  hotel: Hotel.third,
  status: 'washed',
  batch_number: '20260603-001',
  handover_user: handover_users.second,
  handover_at: 2.days.ago
)
batch3.events.create!(event_type: 'created', user: handover_users.second, description: '创建批次')
batch3.events.create!(event_type: 'collected', user: handover_users.second, description: '客房经办人已交接布草')
batch3.events.create!(event_type: 'washed', user: laundry_users.first, description: '洗涤厂已完成洗涤')

create_batch_items(batch3, [
  { name: '大床床单', handed: 25 },
  { name: '双床床单', handed: 20 },
  { name: '被套', handed: 45 },
  { name: '枕套', handed: 90 },
  { name: '面巾', handed: 60 },
  { name: '浴巾', handed: 45 },
  { name: '浴袍', handed: 20 }
])
puts "  批次 #{batch3.batch_number} 已创建"

# ============ 批次4：已返还（待质检） ============
puts "\n创建批次4：已返还（待质检）"
batch4 = LinenBatch.create!(
  hotel: Hotel.fourth,
  status: 'returned',
  batch_number: '20260604-001',
  handover_user: handover_users.first,
  handover_at: 3.days.ago,
  return_user: laundry_users.first,
  return_at: 1.day.ago
)
batch4.events.create!(event_type: 'created', user: handover_users.first, description: '创建批次')
batch4.events.create!(event_type: 'collected', user: handover_users.first, description: '客房经办人已交接布草')
batch4.events.create!(event_type: 'washed', user: laundry_users.first, description: '洗涤厂已完成洗涤')
batch4.events.create!(event_type: 'returned', user: laundry_users.first, description: '洗涤厂已登记返还')

create_batch_items(batch4, [
  { name: '大床床单', handed: 40, returned: 40 },
  { name: '被套', handed: 40, returned: 40 },
  { name: '枕套', handed: 80, returned: 80 },
  { name: '面巾', handed: 80, returned: 80 },
  { name: '浴巾', handed: 40, returned: 40 }
])
puts "  批次 #{batch4.batch_number} 已创建"

# ============ 批次5：正常返还（已质检，无问题） ============
puts "\n创建批次5：正常返还（已质检，无问题）"
batch5 = LinenBatch.create!(
  hotel: Hotel.first,
  status: 'inspected',
  batch_number: '20260605-001',
  handover_user: handover_users.second,
  handover_at: 4.days.ago,
  return_user: laundry_users.second,
  return_at: 3.days.ago,
  inspector: inspectors.first,
  inspected_at: 2.days.ago
)
batch5.events.create!(event_type: 'created', user: handover_users.second, description: '创建批次')
batch5.events.create!(event_type: 'collected', user: handover_users.second, description: '客房经办人已交接布草')
batch5.events.create!(event_type: 'washed', user: laundry_users.second, description: '洗涤厂已完成洗涤')
batch5.events.create!(event_type: 'returned', user: laundry_users.second, description: '洗涤厂已登记返还')
batch5.events.create!(event_type: 'inspected', user: inspectors.first, description: '质检员已完成质量复核，全部正常')

create_batch_items(batch5, [
  { name: '大床床单', handed: 35, returned: 35, clean: 35 },
  { name: '被套', handed: 35, returned: 35, clean: 35 },
  { name: '枕套', handed: 70, returned: 70, clean: 70 },
  { name: '面巾', handed: 70, returned: 70, clean: 70 },
  { name: '浴巾', handed: 35, returned: 35, clean: 35 }
])
puts "  批次 #{batch5.batch_number} 已创建（全部正常）"

# ============ 批次6：污渍未净（已质检，已确认赔损） ============
puts "\n创建批次6：污渍未净（已质检，已确认赔损）"
batch6 = LinenBatch.create!(
  hotel: Hotel.second,
  status: 'inspected',
  batch_number: '20260606-001',
  handover_user: handover_users.first,
  handover_at: 5.days.ago,
  return_user: laundry_users.first,
  return_at: 4.days.ago,
  inspector: inspectors.second,
  inspected_at: 3.days.ago
)
batch6.events.create!(event_type: 'created', user: handover_users.first, description: '创建批次')
batch6.events.create!(event_type: 'collected', user: handover_users.first, description: '客房经办人已交接布草')
batch6.events.create!(event_type: 'washed', user: laundry_users.first, description: '洗涤厂已完成洗涤')
batch6.events.create!(event_type: 'returned', user: laundry_users.first, description: '洗涤厂已登记返还')
batch6.events.create!(event_type: 'inspected', user: inspectors.second, description: '质检员已完成质量复核，发现污渍未净')

create_batch_items(batch6, [
  { name: '大床床单', handed: 50, returned: 50, clean: 47, stained: 3 },
  { name: '被套', handed: 50, returned: 50, clean: 49, stained: 1 },
  { name: '枕套', handed: 100, returned: 100, clean: 97, stained: 3 },
  { name: '面巾', handed: 100, returned: 100, clean: 98, stained: 2 },
  { name: '浴巾', handed: 50, returned: 50, clean: 50 }
])

create_damage_claim(batch6, '大床床单', 'stained', 3, true, finance_users.first)
create_damage_claim(batch6, '被套', 'stained', 1, true, finance_users.first)
create_damage_claim(batch6, '枕套', 'stained', 3, true, finance_users.first)
create_damage_claim(batch6, '面巾', 'stained', 2, true, finance_users.first)

puts "  批次 #{batch6.batch_number} 已创建（污渍未净，已确认赔损）"

# ============ 批次7：布草破损（已质检，待确认赔损） ============
puts "\n创建批次7：布草破损（已质检，待确认赔损）"
batch7 = LinenBatch.create!(
  hotel: Hotel.third,
  status: 'inspected',
  batch_number: '20260607-001',
  handover_user: handover_users.second,
  handover_at: 6.days.ago,
  return_user: laundry_users.second,
  return_at: 5.days.ago,
  inspector: inspectors.first,
  inspected_at: 4.days.ago
)
batch7.events.create!(event_type: 'created', user: handover_users.second, description: '创建批次')
batch7.events.create!(event_type: 'collected', user: handover_users.second, description: '客房经办人已交接布草')
batch7.events.create!(event_type: 'washed', user: laundry_users.second, description: '洗涤厂已完成洗涤')
batch7.events.create!(event_type: 'returned', user: laundry_users.second, description: '洗涤厂已登记返还')
batch7.events.create!(event_type: 'inspected', user: inspectors.first, description: '质检员已完成质量复核，发现破损和污渍')

create_batch_items(batch7, [
  { name: '大床床单', handed: 30, returned: 30, clean: 25, stained: 1, damaged: 4 },
  { name: '被套', handed: 30, returned: 30, clean: 27, damaged: 3 },
  { name: '枕套', handed: 60, returned: 60, clean: 58, damaged: 2 },
  { name: '浴袍', handed: 15, returned: 15, clean: 14, damaged: 1 },
  { name: '浴巾', handed: 30, returned: 30, clean: 30 }
])

create_damage_claim(batch7, '大床床单', 'damaged', 4, false)
create_damage_claim(batch7, '被套', 'damaged', 3, false)
create_damage_claim(batch7, '枕套', 'damaged', 2, false)
create_damage_claim(batch7, '浴袍', 'damaged', 1, false)
create_damage_claim(batch7, '大床床单', 'stained', 1, false)

batch7.events.create!(
  event_type: 'claim_created',
  user: inspectors.first,
  description: '生成赔损记录，待财务确认'
)

puts "  批次 #{batch7.batch_number} 已创建（6件破损，1件污渍，待确认赔损）"

# ============ 批次8：数量短少（争议中，酒店已确认，洗涤厂待确认） ============
puts "\n创建批次8：数量短少（争议中）"
batch8 = LinenBatch.create!(
  hotel: Hotel.fourth,
  status: 'disputed',
  batch_number: '20260608-001',
  handover_user: handover_users.first,
  handover_at: 7.days.ago,
  return_user: laundry_users.first,
  return_at: 6.days.ago,
  inspector: inspectors.second,
  inspected_at: 5.days.ago,
  discrepancy_confirmed_by_hotel: true,
  discrepancy_confirmed_by_laundry: false
)
batch8.events.create!(event_type: 'created', user: handover_users.first, description: '创建批次')
batch8.events.create!(event_type: 'collected', user: handover_users.first, description: '客房经办人已交接布草')
batch8.events.create!(event_type: 'washed', user: laundry_users.first, description: '洗涤厂已完成洗涤')
batch8.events.create!(event_type: 'returned', user: laundry_users.first, description: '洗涤厂已登记返还')
batch8.events.create!(event_type: 'inspected', user: inspectors.second, description: '质检员已完成质量复核')
batch8.events.create!(event_type: 'disputed', user: inspectors.second, description: '质检发现数量短少，进入争议流程')
batch8.events.create!(event_type: 'discrepancy_confirmed_hotel', user: handover_users.first, description: '酒店方已确认数量差异')

create_batch_items(batch8, [
  { name: '大床床单', handed: 45, returned: 42, clean: 40, stained: 2 },
  { name: '被套', handed: 45, returned: 44, clean: 44 },
  { name: '枕套', handed: 90, returned: 88, clean: 87, stained: 1 },
  { name: '面巾', handed: 90, returned: 89, clean: 89 },
  { name: '浴巾', handed: 45, returned: 43, clean: 43 },
  { name: '浴袍', handed: 20, returned: 20, clean: 19, damaged: 1 }
])

create_damage_claim(batch8, '大床床单', 'shortage', 3, false)
create_damage_claim(batch8, '被套', 'shortage', 1, false)
create_damage_claim(batch8, '枕套', 'shortage', 2, false)
create_damage_claim(batch8, '面巾', 'shortage', 1, false)
create_damage_claim(batch8, '浴巾', 'shortage', 2, false)
create_damage_claim(batch8, '大床床单', 'stained', 2, false)
create_damage_claim(batch8, '枕套', 'stained', 1, false)
create_damage_claim(batch8, '浴袍', 'damaged', 1, false)

batch8.events.create!(
  event_type: 'claim_created',
  user: inspectors.second,
  description: '生成赔损记录，待差异确认后进行赔损确认'
)

puts "  批次 #{batch8.batch_number} 已创建（共短少7件，酒店已确认，洗涤厂待确认）"

# ============ 批次9：已结算（污渍） ============
puts "\n创建批次9：已结算（污渍）"
batch9 = LinenBatch.create!(
  hotel: Hotel.first,
  status: 'settled',
  batch_number: '20260528-001',
  handover_user: handover_users.second,
  handover_at: 12.days.ago,
  return_user: laundry_users.first,
  return_at: 11.days.ago,
  inspector: inspectors.first,
  inspected_at: 10.days.ago,
  finance_user: finance_users.first,
  settled_at: 9.days.ago
)
batch9.events.create!(event_type: 'created', user: handover_users.second, description: '创建批次')
batch9.events.create!(event_type: 'collected', user: handover_users.second, description: '客房经办人已交接布草')
batch9.events.create!(event_type: 'washed', user: laundry_users.first, description: '洗涤厂已完成洗涤')
batch9.events.create!(event_type: 'returned', user: laundry_users.first, description: '洗涤厂已登记返还')
batch9.events.create!(event_type: 'inspected', user: inspectors.first, description: '质检员已完成质量复核')
batch9.events.create!(event_type: 'settled', user: finance_users.first, description: '财务已确认赔损并完成结算')

create_batch_items(batch9, [
  { name: '大床床单', handed: 25, returned: 25, clean: 22, stained: 3 },
  { name: '枕套', handed: 50, returned: 50, clean: 49, stained: 1 },
  { name: '面巾', handed: 50, returned: 50, clean: 48, stained: 2 }
])

create_damage_claim(batch9, '大床床单', 'stained', 3, true, finance_users.first)
create_damage_claim(batch9, '枕套', 'stained', 1, true, finance_users.first)
create_damage_claim(batch9, '面巾', 'stained', 2, true, finance_users.first)

puts "  批次 #{batch9.batch_number} 已创建（4件污渍，已结算）"

# ============ 批次10：已结算（破损+短少+污渍混合） ============
puts "\n创建批次10：已结算（破损+短少+污渍）"
batch10 = LinenBatch.create!(
  hotel: Hotel.second,
  status: 'settled',
  batch_number: '20260530-001',
  handover_user: handover_users.first,
  handover_at: 10.days.ago,
  return_user: laundry_users.second,
  return_at: 9.days.ago,
  inspector: inspectors.second,
  inspected_at: 8.days.ago,
  finance_user: finance_users.first,
  settled_at: 7.days.ago
)
batch10.events.create!(event_type: 'created', user: handover_users.first, description: '创建批次')
batch10.events.create!(event_type: 'collected', user: handover_users.first, description: '客房经办人已交接布草')
batch10.events.create!(event_type: 'washed', user: laundry_users.second, description: '洗涤厂已完成洗涤')
batch10.events.create!(event_type: 'returned', user: laundry_users.second, description: '洗涤厂已登记返还')
batch10.events.create!(event_type: 'inspected', user: inspectors.second, description: '质检员已完成质量复核')
batch10.events.create!(event_type: 'disputed', user: inspectors.second, description: '质检发现数量短少，进入争议流程')
batch10.events.create!(event_type: 'discrepancy_confirmed_hotel', user: handover_users.first, description: '酒店方已确认数量差异')
batch10.events.create!(event_type: 'discrepancy_confirmed_laundry', user: laundry_users.second, description: '洗涤厂已确认数量差异')
batch10.events.create!(event_type: 'discrepancy_resolved', user: inspectors.second, description: '双方已确认差异，可进入结算流程')
batch10.events.create!(event_type: 'settled', user: finance_users.first, description: '财务已确认赔损并完成结算')

create_batch_items(batch10, [
  { name: '大床床单', handed: 30, returned: 29, clean: 26, stained: 2, damaged: 1 },
  { name: '被套', handed: 30, returned: 30, clean: 28, damaged: 2 },
  { name: '枕套', handed: 60, returned: 57, clean: 56, damaged: 1 },
  { name: '浴巾', handed: 30, returned: 29, clean: 29 }
])

create_damage_claim(batch10, '大床床单', 'shortage', 1, true, finance_users.first)
create_damage_claim(batch10, '枕套', 'shortage', 3, true, finance_users.first)
create_damage_claim(batch10, '浴巾', 'shortage', 1, true, finance_users.first)
create_damage_claim(batch10, '大床床单', 'stained', 2, true, finance_users.first)
create_damage_claim(batch10, '大床床单', 'damaged', 1, true, finance_users.first)
create_damage_claim(batch10, '被套', 'damaged', 2, true, finance_users.first)
create_damage_claim(batch10, '枕套', 'damaged', 1, true, finance_users.first)

puts "  批次 #{batch10.batch_number} 已创建（含破损、短少、污渍，已全部确认并结算）"

# ============ 批次11：洗涤中 ============
puts "\n创建批次11：洗涤中"
batch11 = LinenBatch.create!(
  hotel: Hotel.third,
  status: 'collected',
  batch_number: '20260609-001',
  handover_user: handover_users.first,
  handover_at: 1.hour.ago
)
batch11.events.create!(event_type: 'created', user: handover_users.first, description: '创建批次')
batch11.events.create!(event_type: 'collected', user: handover_users.first, description: '客房经办人已交接布草')

create_batch_items(batch11, [
  { name: '大床床单', handed: 40 },
  { name: '被套', handed: 40 },
  { name: '枕套', handed: 80 },
  { name: '面巾', handed: 80 },
  { name: '浴巾', handed: 40 }
])
puts "  批次 #{batch11.batch_number} 已创建（洗涤中）"

# ============ 统计 ============
puts "\n========================================"
puts "种子数据创建完成！"
puts "========================================"
puts "  酒店: #{Hotel.count} 家"
puts "  布草类型: #{LinenType.count} 种"
puts "  用户: #{User.count} 人"
puts "  布草批次: #{LinenBatch.count} 批"
puts "    - 待交接: #{LinenBatch.where(status: 'pending').count}"
puts "    - 已交接: #{LinenBatch.where(status: 'collected').count}"
puts "    - 已洗涤: #{LinenBatch.where(status: 'washed').count}"
puts "    - 已返还: #{LinenBatch.where(status: 'returned').count}"
puts "    - 已质检: #{LinenBatch.where(status: 'inspected').count}"
puts "    - 有争议: #{LinenBatch.where(status: 'disputed').count}"
puts "    - 已结算: #{LinenBatch.where(status: 'settled').count}"
puts "  赔损记录: #{DamageClaim.count} 条"
puts "  事件日志: #{LinenEvent.count} 条"
puts "========================================"
