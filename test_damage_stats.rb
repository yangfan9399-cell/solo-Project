puts '=== 损耗统计口径验证 ==='
puts ''

puts '旧口径（仅damaged状态）：' + BorrowRecord.damaged.count.to_s
puts '新口径（with_damage）：' + BorrowRecord.with_damage.count.to_s

puts ''
puts '=== 新口径包含的借调记录 ==='
BorrowRecord.with_damage.each do |b|
  comp = b.compensation
  repair = b.repair_record
  comp_info = comp ? "赔付#{comp.amount}元(#{comp.status})" : "无赔付"
  repair_info = repair ? "有维修" : "无维修"
  puts "  ##{b.id}: #{b.prop.name} - 状态=#{b.status}, damage_type=#{b.damage_type || '无'}, #{comp_info}, #{repair_info}"
end

puts ''
puts '=== 按损耗类型统计 ==='
damages_by_type = BorrowRecord.with_damage.where.not(damage_type: nil).group(:damage_type).count
damages_by_type.each do |type, count|
  puts "  #{type}: #{count} 次"
end

puts ''
puts '=== 按损耗类型的赔付金额 ==='
comp_by_type = BorrowRecord.with_damage.joins(:compensation)
  .where.not(borrow_records: { damage_type: nil })
  .group("borrow_records.damage_type")
  .sum("compensations.amount")
comp_by_type.each do |type, amount|
  puts "  #{type}: #{amount} 元"
end

puts ''
puts '=== 按道具类别统计（抽几个看看）==='
Prop.limit(3).each do |prop|
  damage_count_old = prop.borrow_records.damaged.count
  damage_count_new = prop.borrow_records.with_damage.count
  comp_total = Compensation.joins(:borrow_record).where(borrow_records: { prop_id: prop.id }).sum(:amount)
  puts "  #{prop.name}: 旧口径损耗=#{damage_count_old}, 新口径损耗=#{damage_count_new}, 赔付总额=#{comp_total}"
end

puts ''
puts '=== 验证赔付争议样本是否进入统计 ==='
disputed_borrow = BorrowRecord.joins(:compensation).where(compensations: { status: :disputed }).first
if disputed_borrow
  puts "  争议借调: ##{disputed_borrow.id} - #{disputed_borrow.prop.name}"
  puts "  damage_type: #{disputed_borrow.damage_type}"
  puts "  是否在with_damage中: #{BorrowRecord.with_damage.exists?(disputed_borrow.id)}"
  puts "  赔付金额: #{disputed_borrow.compensation.amount}"
else
  puts "  没有找到争议赔付样本"
end
