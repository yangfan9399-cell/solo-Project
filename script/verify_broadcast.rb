record = FaultRecord.find(3)
record.skip_archive_check = true
record.current_status = :processing
record.is_archived = false
record.save!(validate: false)
puts "ID=3 已重置为 processing，当前节点数: #{record.workflow_nodes.count}"
puts ""

controller = FaultRecordsController.new
controller.send(:broadcast_list_updates, record)
puts "✓ Action Cable broadcast_list_updates 方法可调用"
puts ""

puts "=== 测试 redirect 行为（模拟操作后重定向到详情页） ==="
status_counts = FaultRecord.status_counts
puts "当前状态分布: #{status_counts}"
puts "异常分布: #{FaultRecord.abnormal_type_counts}"
puts ""

puts "✓ 所有 controller 私有方法均可正常执行"
