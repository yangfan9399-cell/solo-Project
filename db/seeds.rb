
puts "开始清除原有数据..."
StatusHistory.delete_all
InspectionRecord.delete_all
ReturnOrder.delete_all
Order.delete_all
LiveSession.delete_all
Product.delete_all
Anchor.delete_all
puts "原有数据清除完成"

puts "开始创建种子数据..."

anchors_data = [
  { name: '李佳欣', avatar_url: 'https://example.com/avatars/lijiaxin.jpg' },
  { name: '张伟', avatar_url: 'https://example.com/avatars/zhangwei.jpg' },
  { name: '王小明', avatar_url: 'https://example.com/avatars/wangxiaoming.jpg' }
]

anchors = anchors_data.map do |data|
  Anchor.create!(data)
end
puts "已创建 #{anchors.count} 个主播"

lijiaxin, zhangwei, wangxiaoming = anchors

products_data = [
  { name: '某品牌丝绒哑光口红 #正红色', sku: 'MZ-LIPSTICK-001', category: '美妆', original_price: 168.00, anchor: lijiaxin },
  { name: '水润保湿修护面霜 50ml', sku: 'MZ-CREAM-002', category: '美妆', original_price: 298.00, anchor: lijiaxin },
  { name: '男士纯棉圆领短袖T恤 白色', sku: 'FZ-T-SHIRT-001', category: '服装', original_price: 89.00, anchor: zhangwei },
  { name: '男士商务休闲牛仔裤 深蓝色', sku: 'FZ-JEANS-002', category: '服装', original_price: 259.00, anchor: zhangwei },
  { name: '真无线蓝牙耳机 降噪版', sku: 'SM-EARPHONE-001', category: '数码', original_price: 399.00, anchor: wangxiaoming },
  { name: '智能运动手表 心率监测版', sku: 'SM-WATCH-002', category: '数码', original_price: 599.00, anchor: wangxiaoming }
]

products = products_data.map do |data|
  Product.create!(data)
end
puts "已创建 #{products.count} 个商品"

lipstick, cream, tshirt, jeans, earphone, watch = products

now = Time.current

live_sessions_data = [
  {
    anchor: lijiaxin,
    title: '李佳欣美妆专场 - 夏季护肤好物分享',
    started_at: 25.days.ago.beginning_of_day + 19.hours,
    ended_at: 25.days.ago.beginning_of_day + 22.hours
  },
  {
    anchor: zhangwei,
    title: '张伟男装新品首发 - 夏日清凉穿搭',
    started_at: 20.days.ago.beginning_of_day + 20.hours,
    ended_at: 20.days.ago.beginning_of_day + 23.hours
  },
  {
    anchor: wangxiaoming,
    title: '王小明数码测评 - 618数码好物推荐',
    started_at: 15.days.ago.beginning_of_day + 19.hours,
    ended_at: 15.days.ago.beginning_of_day + 22.hours
  }
]

live_sessions = live_sessions_data.map do |data|
  LiveSession.create!(data)
end
puts "已创建 #{live_sessions.count} 场直播"

lijiaxin_live, zhangwei_live, wangxiaoming_live = live_sessions

orders_data = [
  {
    order_no: 'DD2026051700001',
    user_name: '李美丽',
    user_phone: '13800138001',
    product: lipstick,
    live_session: lijiaxin_live,
    quantity: 1,
    unit_price: 168.00,
    total_amount: 168.00,
    status: 'completed',
    created_at: 24.days.ago,
    updated_at: 24.days.ago
  },
  {
    order_no: 'DD2026051700002',
    user_name: '王小美',
    user_phone: '13800138002',
    product: cream,
    live_session: lijiaxin_live,
    quantity: 1,
    unit_price: 298.00,
    total_amount: 298.00,
    status: 'completed',
    created_at: 24.days.ago,
    updated_at: 24.days.ago
  },
  {
    order_no: 'DD2026052200001',
    user_name: '张先生',
    user_phone: '13900139001',
    product: tshirt,
    live_session: zhangwei_live,
    quantity: 2,
    unit_price: 89.00,
    total_amount: 178.00,
    status: 'completed',
    created_at: 19.days.ago,
    updated_at: 19.days.ago
  },
  {
    order_no: 'DD2026052200002',
    user_name: '李先生',
    user_phone: '13900139002',
    product: jeans,
    live_session: zhangwei_live,
    quantity: 1,
    unit_price: 259.00,
    total_amount: 259.00,
    status: 'completed',
    created_at: 19.days.ago,
    updated_at: 19.days.ago
  },
  {
    order_no: 'DD2026052700001',
    user_name: '数码爱好者',
    user_phone: '13700137001',
    product: earphone,
    live_session: wangxiaoming_live,
    quantity: 1,
    unit_price: 399.00,
    total_amount: 399.00,
    status: 'completed',
    created_at: 14.days.ago,
    updated_at: 14.days.ago
  },
  {
    order_no: 'DD2026052700002',
    user_name: '运动达人',
    user_phone: '13700137002',
    product: watch,
    live_session: wangxiaoming_live,
    quantity: 1,
    unit_price: 599.00,
    total_amount: 599.00,
    status: 'completed',
    created_at: 14.days.ago,
    updated_at: 14.days.ago
  }
]

orders = orders_data.map do |data|
  Order.create!(data)
end
puts "已创建 #{orders.count} 个订单"

order_lipstick, order_cream, order_tshirt, order_jeans, order_earphone, order_watch = orders

puts "开始创建退货单场景..."

def create_return_order_with_full_flow(order:, reason:, status_flow:, refund_amount:, inspection_attrs:, damaged: false, missing_items: false, operator: '系统管理员')
  return_order = ReturnOrder.create!(
    order: order,
    reason: reason,
    refund_amount: refund_amount,
    damaged: damaged,
    missing_items: missing_items,
    created_at: (order.created_at + 2.days),
    updated_at: (order.created_at + 2.days)
  )

  base_time = return_order.created_at

  event_flow_map = {
    'pending' => nil,
    'customer_service_approved' => :approve_by_customer_service,
    'warehouse_received' => :receive_by_warehouse,
    'inspected' => :complete_inspection,
    'reviewed' => :review_by_operation,
    'resold' => :resale,
    'reported_loss' => :report_loss,
    'disputed' => :raise_dispute
  }

  status_flow.each_cons(2).with_index do |(from_status, to_status), idx|
    event = event_flow_map[to_status]
    next unless event

    time = base_time + (idx + 1).hours

    if return_order.aasm.current_state.to_s == from_status.to_s
      return_order.send("#{event}!") if return_order.aasm.may_fire_event?(event)
    end

    history = return_order.status_histories.find_by(to_status: to_status.to_s)
    if history
      history.update!(
        created_at: time,
        updated_at: time,
        operator_name: operator,
        note: operator_note_for(to_status)
      )
    end
  end

  if inspection_attrs.present?
    inspection_time = base_time + 4.hours
    return_order.inspection_records.create!(
      inspection_attrs.merge(created_at: inspection_time, updated_at: inspection_time)
    )
  end

  final_time = base_time + (status_flow.size - 1).hours
  return_order.update!(updated_at: final_time)

  return_order
end

def operator_note_for(status)
  {
    'pending' => '客户发起退货申请',
    'customer_service_approved' => '客服审核通过，符合退货条件',
    'warehouse_received' => '仓库已签收退货商品',
    'inspected' => '质检人员已完成商品检验',
    'reviewed' => '运营已复核质检结果',
    'resold' => '商品已重新上架销售',
    'reported_loss' => '商品已做报损处理',
    'disputed' => '退款存在争议，需进一步处理'
  }[status.to_s]
end

puts "创建样本1 - 【正常二次上架】..."
return_order_1 = create_return_order_with_full_flow(
  order: order_lipstick,
  reason: '颜色与图片略有差异，不太适合自己的肤色',
  status_flow: %w[pending customer_service_approved warehouse_received inspected reviewed resold],
  refund_amount: 168.00,
  damaged: false,
  missing_items: false,
  inspection_attrs: {
    inspector_name: '质检员张姐',
    condition: 'excellent',
    missing_items_count: 0,
    damage_description: '',
    quality_score: 95,
    final_decision: 'resale',
    photos: []
  }
)
puts "样本1创建完成 - 退货单号: #{return_order_1.return_no}"

puts "创建样本2 - 【商品破损报损】..."
return_order_2 = create_return_order_with_full_flow(
  order: order_tshirt,
  reason: '收到商品有污渍，影响穿着，要求退货',
  status_flow: %w[pending customer_service_approved warehouse_received inspected reviewed reported_loss],
  refund_amount: 178.00,
  damaged: true,
  missing_items: false,
  inspection_attrs: {
    inspector_name: '质检员李哥',
    condition: 'poor',
    missing_items_count: 0,
    damage_description: '领口有明显污渍且无法清洗，衣身有多处轻微霉斑',
    quality_score: 30,
    final_decision: 'loss',
    photos: []
  }
)
puts "样本2创建完成 - 退货单号: #{return_order_2.return_no}"

puts "创建样本3 - 【少件禁止二次上架】..."
return_order_3 = create_return_order_with_full_flow(
  order: order_earphone,
  reason: '拆开包装后发现缺少充电线，无法正常使用',
  status_flow: %w[pending customer_service_approved warehouse_received inspected reviewed],
  refund_amount: 399.00,
  damaged: false,
  missing_items: true,
  inspection_attrs: {
    inspector_name: '质检员王姐',
    condition: 'good',
    missing_items_count: 1,
    damage_description: '缺少充电线，耳机主机及其他配件完好',
    quality_score: 70,
    final_decision: 'loss',
    photos: []
  }
)
puts "样本3创建完成 - 退货单号: #{return_order_3.return_no} (停留在 reviewed 状态)"

puts "创建样本4 - 【退款争议】..."
return_order_4 = create_return_order_with_full_flow(
  order: order_cream,
  reason: '使用后面部出现红肿瘙痒过敏症状，要求退货并赔偿医药费',
  status_flow: %w[pending customer_service_approved warehouse_received inspected disputed],
  refund_amount: 0.00,
  damaged: false,
  missing_items: false,
  inspection_attrs: {
    inspector_name: '质检员赵哥',
    condition: 'fair',
    missing_items_count: 0,
    damage_description: '已开封使用约1/3，瓶身完好，内包装齐全',
    quality_score: 50,
    final_decision: 'dispute',
    photos: []
  }
)
puts "样本4创建完成 - 退货单号: #{return_order_4.return_no} (退款争议状态)"

puts ""
puts "============================================"
puts "种子数据创建完成！统计信息："
puts "  主播数量: #{Anchor.count}"
puts "  商品数量: #{Product.count}"
puts "  直播场次: #{LiveSession.count}"
puts "  订单数量: #{Order.count}"
puts "  退货单数量: #{ReturnOrder.count}"
puts "  质检记录数量: #{InspectionRecord.count}"
puts "  状态历史记录数量: #{StatusHistory.count}"
puts "============================================"
puts ""
puts "退货单详情："
ReturnOrder.all.each do |ro|
  puts "  #{ro.return_no} - 商品: #{ro.product.name} - 当前状态: #{ro.status}"
end
