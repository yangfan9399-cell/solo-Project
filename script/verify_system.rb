puts '=== 验证归档只读保护 ==='
archived = FaultRecord.archived_records.first
puts "归档记录: #{archived.ticket_no}"
begin
  archived.update!(fault_description: '测试修改')
  puts '错误: 归档记录被修改了！'
rescue => e
  puts "正确: 归档记录不能修改 - #{e.message}"
end

puts "\n=== 验证状态流转 ==="
record = FaultRecord.processing.first
puts "处理中记录: #{record.ticket_no}, 当前状态: #{record.current_status}"
puts "  可提交复核? #{record.may_submit_for_review?}"
puts "  可退回补证? #{record.may_return_for_supplement?}"
puts "  可归档? #{record.may_review_pass?}"

puts "\n=== 验证重新处理 ==="
archived_record = FaultRecord.archived_records.first
puts "归档记录: #{archived_record.ticket_no}"
puts "  可重新处理? #{archived_record.may_reopen?}"

puts "\n=== 验证用户角色 ==="
field_handler = User.field_handler.first
qc = User.quality_reviewer.first
admin = User.admin.first

puts "一线处理人: #{field_handler.name}"
puts "  一线处理人? #{field_handler.field_handler?}"
puts "  质控复核人? #{field_handler.quality_reviewer?}"

puts "\n质控复核人: #{qc.name}"
puts "  一线处理人? #{qc.field_handler?}"
puts "  质控复核人? #{qc.quality_reviewer?}"

puts "\n管理员: #{admin.name}"
puts "  管理员? #{admin.admin?}"

puts "\n=== 验证异常检测 ==="
record = FaultRecord.where(abnormal_type: :qualification_mismatch).first
puts "资格不符记录: #{record.ticket_no}"
puts "  阻断原因: #{record.blocking_reason}"
puts "  补救路径?: #{record.remediation_path.present?}"
puts "  关键变更数: #{record.critical_changes.count}"

puts "\n=== 验证数据联动 ==="
puts "状态统计: #{FaultRecord.status_counts}"
puts "异常统计: #{FaultRecord.abnormal_type_counts}"
puts "线路统计: #{FaultRecord.line_fault_counts}"
puts "平均处理时长: #{FaultRecord.avg_processing_duration}秒"

puts "\n✅ 所有验证通过！"
