require_relative "config/environment"

project = Project.first
puts "=== Test 1: Create component ==="
c = project.components.new(code: "VERIFY-001", component_type: "梁", status: "在原位", orientation: "东", position: "验证位置", batch_tag: "BATCH-VERIFY", material: "楠木", layer: 1, length: 100, width: 50, height: 30, notes: "验证构件")
if c.save
  puts "OK: component created id=#{c.id}, full_code=#{c.full_code}"
else
  puts "FAIL: #{c.errors.full_messages.join(", ")}"
end

puts ""
puts "=== Test 2: Update component ==="
old_status = c.status
c.update(status: "已拆卸")
c.reload
puts "OK: status changed from #{old_status} to #{c.status}"
latest_v = c.latest_version
puts "   latest version: v#{latest_v.version_number}, event: #{latest_v.event_type}" if latest_v

puts ""
puts "=== Test 3: Create defect ==="
d = c.defects.new(defect_type: "开裂", severity: "严重", description: "梁端纵向裂缝", location_on_component: "东端上部", discovered_at: Date.current)
if d.save
  puts "OK: defect created id=#{d.id}"
else
  puts "FAIL: #{d.errors.full_messages.join(", ")}"
end

puts ""
puts "=== Test 4: Update defect ==="
d.update(repaired: true, repaired_at: Date.current, repair_notes: "已修补")
d.reload
puts "OK: defect repaired=#{d.repaired}"

puts ""
puts "=== Test 5: Create reassembly record ==="
r = c.reassembly_records.new(checked_by: "张工", result: "一致", notes: "位置吻合")
r.checked_at = Time.current
if r.save
  puts "OK: reassembly record created id=#{r.id}, result=#{r.result}"
else
  puts "FAIL: #{r.errors.full_messages.join(", ")}"
end

puts ""
puts "=== Test 6: Version rollback ==="
target_v = c.component_versions.order(version_number: :asc).first
snapshot = target_v.snapshot_object
puts "   rollback target: v#{target_v.version_number}, snapshot status=#{snapshot["status"]}"
c.skip_version_track = true
restore_attrs = {}
%w[code component_type position orientation status notes].each { |k| restore_attrs[k] = snapshot[k] if snapshot.key?(k) }
c.update(restore_attrs)
c.create_version("update", "系统", "回滚到版本 #{target_v.version_number}")
c.reload
puts "OK: after rollback status=#{c.status}, code=#{c.code}"
latest_v2 = c.latest_version
puts "   new version: v#{latest_v2.version_number}, event: #{latest_v2.event_type}"

puts ""
puts "=== Test 7: Reassembly check via controller params ==="
params_raw = { checked_by: "李工", result: "位置偏差", notes: "偏东2cm" }
r2 = c.reassembly_records.new(params_raw)
r2.checked_at = Time.current
if r2.save
  puts "OK: reassembly check created with raw params, id=#{r2.id}"
else
  puts "FAIL: #{r2.errors.full_messages.join(", ")}"
end

puts ""
puts "All tests completed!"
