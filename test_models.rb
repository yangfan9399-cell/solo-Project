puts '=== 测试作用域方法 ==='
puts ''
puts 'Project 作用域:'
puts "  active: #{Project.respond_to?(:active)}"
puts "  completed: #{Project.respond_to?(:completed)}"
puts "  by_status: #{Project.respond_to?(:by_status)}"
puts "  search: #{Project.respond_to?(:search)}"
puts ''
puts 'Project 实例方法:'
project = Project.new
puts "  components_count: #{project.respond_to?(:components_count)}"
puts "  defects_count: #{project.respond_to?(:defects_count)}"
puts "  completion_rate: #{project.respond_to?(:completion_rate)}"
puts "  abnormal_components: #{project.respond_to?(:abnormal_components)}"
puts ''
puts 'Component 作用域:'
puts "  by_type: #{Component.respond_to?(:by_type)}"
puts "  by_status: #{Component.respond_to?(:by_status)}"
puts "  by_orientation: #{Component.respond_to?(:by_orientation)}"
puts "  by_batch: #{Component.respond_to?(:by_batch)}"
puts "  search: #{Component.respond_to?(:search)}"
puts ''
puts 'Component 实例方法:'
component = Component.new
puts "  full_code: #{component.respond_to?(:full_code)}"
puts "  defect_count: #{component.respond_to?(:defect_count)}"
puts "  latest_version: #{component.respond_to?(:latest_version)}"
puts "  has_anomaly?: #{component.respond_to?(:has_anomaly?)}"
puts "  create_version: #{component.respond_to?(:create_version)}"
puts ''
puts 'Component photo_refs 序列化:'
component.photo_refs = ["photo1.jpg", "photo2.jpg"]
puts "  photo_refs=Array: #{component.photo_refs == ["photo1.jpg", "photo2.jpg"]}"
puts ''
puts 'Defect 作用域:'
puts "  unrepaired: #{Defect.respond_to?(:unrepaired)}"
puts "  by_type: #{Defect.respond_to?(:by_type)}"
puts "  by_severity: #{Defect.respond_to?(:by_severity)}"
puts "  critical: #{Defect.respond_to?(:critical)}"
puts ''
puts 'Defect 实例方法:'
defect = Defect.new(severity: "严重")
puts "  critical?: #{defect.respond_to?(:critical?)}"
puts "  critical? 实际值(严重): #{defect.critical? == true}"
puts "  component_code: #{defect.respond_to?(:component_code)}"
puts ''
puts 'ComponentVersion 作用域:'
puts "  by_batch: #{ComponentVersion.respond_to?(:by_batch)}"
puts "  by_event: #{ComponentVersion.respond_to?(:by_event)}"
puts "  latest_first: #{ComponentVersion.respond_to?(:latest_first)}"
puts ''
puts 'ComponentVersion 实例方法:'
version = ComponentVersion.new
puts "  snapshot_object: #{version.respond_to?(:snapshot_object)}"
puts "  changed_fields_list: #{version.respond_to?(:changed_fields_list)}"
puts "  previous_version: #{version.respond_to?(:previous_version)}"
puts "  next_version: #{version.respond_to?(:next_version)}"
puts ''
puts 'ComponentVersion store 访问器:'
version.code = "TEST001"
version.component_type = "梁"
version.status = "在原位"
puts "  code=: #{version.code == "TEST001"}"
puts "  component_type=: #{version.component_type == "梁"}"
puts "  status=: #{version.status == "在原位"}"
puts ''
puts 'ComponentVersion changed_fields 序列化:'
version.changed_fields = ["code", "status"]
puts "  changed_fields=Array: #{version.changed_fields == ["code", "status"]}"
puts ''
puts 'ReassemblyRecord 作用域:'
puts "  verified: #{ReassemblyRecord.respond_to?(:verified)}"
puts "  unverified: #{ReassemblyRecord.respond_to?(:unverified)}"
puts "  by_result: #{ReassemblyRecord.respond_to?(:by_result)}"
puts ''
puts 'ReassemblyRecord 实例方法:'
record = ReassemblyRecord.new(result: "一致")
puts "  passed?: #{record.respond_to?(:passed?)}"
puts "  passed? 实际值(一致): #{record.passed? == true}"
puts "  component_code: #{record.respond_to?(:component_code)}"
puts ''
puts '=== 所有测试完成 ==='
