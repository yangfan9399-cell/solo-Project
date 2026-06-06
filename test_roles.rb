u_stage = User.find_by(role: :stage_manager)
u_crew = User.find_by(role: :crew_leader)
u_asset = User.find_by(role: :asset_auditor)

puts '=== 角色测试 ==='
puts "舞美经办人: #{u_stage&.name} - #{u_stage&.role}"
puts "剧组负责人: #{u_crew&.name} - #{u_crew&.role}"
puts "资产复核人: #{u_asset&.name} - #{u_asset&.role}"

def check_role(user, *roles)
  return false unless user
  roles.include?(user.role.to_sym)
end

puts ''
puts '=== 权限测试 ==='
puts "舞美经办人能否确认借调? #{check_role(u_stage, :crew_leader) ? '可以' : '不可以'}"
puts "剧组负责人能否确认借调? #{check_role(u_crew, :crew_leader) ? '可以' : '不可以'}"
puts "资产复核人能否确认借调? #{check_role(u_asset, :crew_leader) ? '可以' : '不可以'}"
puts ''
puts "舞美经办人能否出库? #{check_role(u_stage, :asset_auditor) ? '可以' : '不可以'}"
puts "剧组负责人能否出库? #{check_role(u_crew, :asset_auditor) ? '可以' : '不可以'}"
puts "资产复核人能否出库? #{check_role(u_asset, :asset_auditor) ? '可以' : '不可以'}"

puts ''
puts '=== 控制器 before_action 配置检查 ==='
controller = BorrowRecordsController.new
puts "BorrowRecordsController before_actions: #{BorrowRecordsController._process_action_callbacks.select { |c| c.kind == :before }.map(&:filter).inspect}"
