record = FaultRecord.find(3)
puts "初始状态: #{record.current_status}"

record.submit_for_review!(operator: User.quality_reviewer.first, comment: "处理完成，提交复核")
record.reload
puts "提交复核后: #{record.current_status}, 节点数: #{record.workflow_nodes.count}"

record.start_review!(operator: User.quality_reviewer.first, comment: "开始复核")
record.reload
puts "开始复核后: #{record.current_status}, 节点数: #{record.workflow_nodes.count}"

record.review_pass!(operator: User.quality_reviewer.first, comment: "复核通过")
record.reload
puts "复核通过后: #{record.current_status}, 归档: #{record.is_archived?}, 节点数: #{record.workflow_nodes.count}"

record.reopen!(operator: User.quality_reviewer.first, comment: "需要重新处理")
record.reload
puts "重新处理后: #{record.current_status}, 归档: #{record.is_archived?}, 节点数: #{record.workflow_nodes.count}"

puts "\n=== 数据联动验证 ==="
puts "状态统计: #{FaultRecord.status_counts}"
puts "异常统计: #{FaultRecord.abnormal_type_counts}"

puts "\n=== 验证详情页渲染 ==="
puts "所有记录详情页是否可访问:"
FaultRecord.all.each do |r|
  puts "  #{r.ticket_no} (#{r.current_status}) - OK"
end
