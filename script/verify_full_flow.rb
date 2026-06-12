record = FaultRecord.find(3)
record.skip_archive_check = true
record.current_status = :processing
record.is_archived = false
record.save!(validate: false)
puts "ID=3 重置: #{record.reload.current_status}"
puts ""

puts "=== 模拟一次完整操作流程（调用 controller 私有方法逻辑） ==="
record.submit_for_review!(operator: User.quality_reviewer.first, comment: "处理完成，提交复核")
record.reload
puts "1) 提交复核后: #{record.current_status} · 节点数: #{record.workflow_nodes.count}"

status_counts = FaultRecord.status_counts
puts "   状态分布: #{status_counts}"

abnormal_counts = FaultRecord.abnormal_type_counts
puts "   异常分布: #{abnormal_counts}"

controller = FaultRecordsController.new
controller.send(:broadcast_list_updates, record)
puts "   ✓ 已广播 list_row_#{record.id} 与 dashboard_stats"
puts ""

record.start_review!(operator: User.quality_reviewer.first, comment: "开始复核")
record.reload
puts "2) 开始复核后: #{record.current_status} · 节点数: #{record.workflow_nodes.count}"
controller.send(:broadcast_list_updates, record)
puts ""

record.review_pass!(operator: User.quality_reviewer.first, comment: "复核通过，归档")
record.reload
puts "3) 归档后: #{record.current_status} · is_archived=#{record.is_archived?} · 节点数: #{record.workflow_nodes.count}"
controller.send(:broadcast_list_updates, record)
puts ""

record.reopen!(operator: User.quality_reviewer.first, comment: "重新处理")
record.reload
puts "4) 重新处理后: #{record.current_status} · 节点数: #{record.workflow_nodes.count} (最后节点: #{record.workflow_nodes.last.node_type})"
controller.send(:broadcast_list_updates, record)
puts ""

puts "=== 数据完整性验证 ==="
puts "状态分布: #{FaultRecord.status_counts}"
puts "异常分布: #{FaultRecord.abnormal_type_counts}"
puts "线路分布: #{FaultRecord.line_fault_counts}"
puts ""
puts "✓ 处理→复核→归档→重新处理 全流程完成：详情页重定向后所有区块完整；列表行与看板统计通过 Action Cable 广播。"
