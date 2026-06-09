puts "=== 开始加载种子数据 ==="

departments = [
  { name: '技术研发部' },
  { name: '市场营销部' },
  { name: '财务金融部' },
  { name: '法务合规部' },
  { name: '人力资源部' }
]

departments.each do |d|
  Department.find_or_create_by!(name: d[:name])
end
puts "✓ 创建了 #{Department.count} 个部门"

dept_tech = Department.find_by(name: '技术研发部')
dept_marketing = Department.find_by(name: '市场营销部')
dept_finance = Department.find_by(name: '财务金融部')
dept_legal = Department.find_by(name: '法务合规部')
dept_hr = Department.find_by(name: '人力资源部')

users = [
  { name: '张明', role: :applicant, department: dept_tech },
  { name: '李华', role: :applicant, department: dept_marketing },
  { name: '王芳', role: :applicant, department: dept_finance },
  { name: '赵强', role: :applicant, department: dept_hr },
  { name: '陈律师', role: :legal, department: dept_legal },
  { name: '刘印章', role: :seal_admin, department: dept_legal },
  { name: '孙审计', role: :auditor, department: dept_legal }
]

users.each do |u|
  User.find_or_create_by!(name: u[:name]) do |user|
    user.role = u[:role]
    user.department = u[:department]
  end
end
puts "✓ 创建了 #{User.count} 个用户"

seals = [
  { name: '公司公章', seal_type: :official, status: :active },
  { name: '合同专用章', seal_type: :contract, status: :active },
  { name: '财务专用章', seal_type: :financial, status: :active },
  { name: '法人章', seal_type: :legal, status: :active },
  { name: '人事专用章', seal_type: :official, status: :inactive }
]

seals.each do |s|
  Seal.find_or_create_by!(name: s[:name]) do |seal|
    seal.seal_type = s[:seal_type]
    seal.status = s[:status]
  end
end
puts "✓ 创建了 #{Seal.count} 枚印章"

zhangming = User.find_by(name: '张明')
lihua = User.find_by(name: '李华')
wangfang = User.find_by(name: '王芳')
chenlawyer = User.find_by(name: '陈律师')
liuseal = User.find_by(name: '刘印章')
sunaudit = User.find_by(name: '孙审计')

official_seal = Seal.find_by(name: '公司公章')
contract_seal = Seal.find_by(name: '合同专用章')
financial_seal = Seal.find_by(name: '财务专用章')

contracts = [
  { title: '软件开发服务合同', version: 'v1.0', content: "甲方：XX科技有限公司\n乙方：YY软件股份有限公司\n\n鉴于甲方需要软件开发服务，乙方具备相应技术能力，双方经友好协商，达成如下协议：\n\n第一条 项目内容\n乙方为甲方开发企业管理系统一套，包括用户管理、权限管理、报表统计等模块。\n\n第二条 项目周期\n项目总周期为6个月，自合同签订之日起计算。\n\n第三条 合同金额\n合同总金额为人民币壹佰万元整（￥1,000,000.00）。\n\n第四条 付款方式\n合同签订后支付30%，验收合格后支付65%，质保期满后支付5%。\n\n第五条 知识产权\n本项目开发成果的知识产权归甲方所有。\n\n第六条 违约责任\n任何一方违约，应承担相应的违约责任。", applicant: zhangming, department: dept_tech },
  { title: '软件开发服务合同', version: 'v1.1', content: "甲方：XX科技有限公司\n乙方：YY软件股份有限公司\n\n鉴于甲方需要软件开发服务，乙方具备相应技术能力，双方经友好协商，达成如下协议：\n\n第一条 项目内容\n乙方为甲方开发企业管理系统一套，包括用户管理、权限管理、报表统计、数据分析等模块。\n\n第二条 项目周期\n项目总周期为7个月，自合同签订之日起计算。\n\n第三条 合同金额\n合同总金额为人民币壹佰贰拾万元整（￥1,200,000.00）。\n\n第四条 付款方式\n合同签订后支付30%，中期验收后支付30%，终验合格后支付35%，质保期满后支付5%。\n\n第五条 知识产权\n本项目开发成果的知识产权归甲方所有，乙方享有署名权。\n\n第六条 保密条款\n双方应对项目涉及的技术资料和商业信息严格保密。\n\n第七条 违约责任\n任何一方违约，应承担相应的违约责任，违约金不超过合同总额的20%。", applicant: zhangming, department: dept_tech },
  { title: '产品推广合作协议', version: 'v2.0', content: "甲方：XX科技有限公司\n乙方：ZZ营销策划有限公司\n\n第一条 合作内容\n乙方为甲方产品提供市场推广服务，包括线上广告投放、线下活动策划等。\n\n第二条 合作期限\n合作期限为一年，自2024年1月1日至2024年12月31日。\n\n第三条 服务费用\n年度服务费用为人民币伍拾万元整（￥500,000.00）。\n\n第四条 效果考核\n乙方应保证甲方产品年度销售额增长不低于30%。\n\n第五条 双方权利义务\n（具体条款略）", applicant: lihua, department: dept_marketing },
  { title: '财务咨询服务合同', version: 'v1.0', content: "甲方：XX科技有限公司\n乙方：WW会计师事务所\n\n第一条 服务范围\n乙方为甲方提供财务咨询、税务筹划、内部审计等服务。\n\n第二条 服务期限\n服务期限为两年，自合同签订之日起计算。\n\n第三条 服务费用\n年度咨询费用为人民币叁拾万元整（￥300,000.00），按季度支付。\n\n第四条 服务标准\n乙方应指派具有注册会计师资格的专业人员提供服务。", applicant: wangfang, department: dept_finance },
  { title: '员工劳动合同模板', version: 'v3.0', content: "甲方（用人单位）：XX科技有限公司\n乙方（劳动者）：\n\n根据《中华人民共和国劳动合同法》及相关法律法规，甲乙双方本着平等自愿、协商一致的原则，签订本劳动合同。\n\n第一条 合同期限\n本合同为固定期限劳动合同，期限为叁年。\n\n第二条 工作内容和工作地点\n（具体内容略）\n\n第三条 工作时间和休息休假\n（具体内容略）\n\n第四条 劳动报酬\n（具体内容略）\n\n第五条 社会保险和福利待遇\n（具体内容略）", applicant: zhangming, department: dept_hr }
]

contracts.each do |c|
  Contract.find_or_create_by!(title: c[:title], version: c[:version]) do |contract|
    contract.content = c[:content]
    contract.applicant = c[:applicant]
    contract.department = c[:department]
  end
end
puts "✓ 创建了 #{Contract.count} 份合同"

contract_v1 = Contract.find_by(title: '软件开发服务合同', version: 'v1.0')
contract_v1_1 = Contract.find_by(title: '软件开发服务合同', version: 'v1.1')
contract_marketing = Contract.find_by(title: '产品推广合作协议')
contract_finance = Contract.find_by(title: '财务咨询服务合同')
contract_hr = Contract.find_by(title: '员工劳动合同模板')

puts "\n=== 创建场景一：正常用印（已完成归档） ==="
app1 = SealApplication.create!(
  contract: contract_v1_1,
  seal: contract_seal,
  applicant: zhangming,
  purpose: '与YY软件股份有限公司签订软件开发服务合同，用于企业管理系统项目建设。',
  use_count: 6,
  status: :draft
)
app1.submit!
sleep 0.1
app1.legal_approve!(chenlawyer, '合同条款完整，法律风险可控，同意用印。')
sleep 0.1
app1.seal_approve!(liuseal, '已核对用印材料，执行用印6次。')
sleep 0.1
app1.archive_approve!(sunaudit, '软件开发服务合同_盖章版.pdf', 12, 0)
puts "✓ 正常用印申请 ##{app1.id} 已创建并完成归档"

puts "\n=== 创建场景二：合同版本不一致 ==="
app2 = SealApplication.create!(
  contract: contract_v1,
  seal: contract_seal,
  applicant: zhangming,
  purpose: '与YY软件股份有限公司签订软件开发服务合同。',
  use_count: 4,
  status: :draft
)
app2.submit!
sleep 0.1
app2.legal_approve!(chenlawyer, '')
puts "✓ 合同版本不一致申请 ##{app2.id} 已创建（已触发版本冲突阻断）"

puts "\n=== 创建场景三：审批人缺席 ==="
app3 = SealApplication.create!(
  contract: contract_marketing,
  seal: official_seal,
  applicant: lihua,
  purpose: '与ZZ营销策划有限公司签订产品推广合作协议，用于2024年度市场推广。',
  use_count: 2,
  status: :draft
)
app3.submit!
sleep 0.1
app3.legal_approve!(chenlawyer, '推广合作协议条款合规，同意用印。')
sleep 0.1
app3.mark_approver_absent!(chenlawyer, '印章管理员刘印章外出培训，预计下周返岗。')
puts "✓ 审批人缺席申请 ##{app3.id} 已创建"

puts "\n=== 创建场景四：归档缺页 ==="
app4 = SealApplication.create!(
  contract: contract_finance,
  seal: financial_seal,
  applicant: wangfang,
  purpose: '与WW会计师事务所签订财务咨询服务合同，用于财务咨询和税务筹划。',
  use_count: 3,
  status: :draft
)
app4.submit!
sleep 0.1
app4.legal_approve!(chenlawyer, '财务咨询合同条款规范，无法律风险。')
sleep 0.1
app4.seal_approve!(liuseal, '已执行用印3次。')
sleep 0.1
app4.archive_approve!(sunaudit, '财务咨询服务合同_盖章版.pdf', 15, 2)
puts "✓ 归档缺页申请 ##{app4.id} 已创建（缺页2页）"

puts "\n=== 创建其他示例申请（增加数据丰富度） ==="

app5 = SealApplication.create!(
  contract: contract_hr,
  seal: official_seal,
  applicant: zhangming,
  purpose: '用于批量签订新员工劳动合同。',
  use_count: 50,
  status: :draft
)
app5.submit!
sleep 0.1
app5.legal_approve!(chenlawyer, '劳动合同模板符合劳动法规定，同意用印。')
puts "✓ 待印章管理员用印申请 ##{app5.id} 已创建"

app6 = SealApplication.create!(
  contract: contract_marketing,
  seal: contract_seal,
  applicant: lihua,
  purpose: '补充协议签订',
  use_count: 1,
  status: :draft
)
app6.submit!
puts "✓ 待法务审核申请 ##{app6.id} 已创建"

app7 = SealApplication.create!(
  contract: contract_v1_1,
  seal: official_seal,
  applicant: zhangming,
  purpose: '项目验收用印',
  use_count: 2,
  status: :draft
)
app7.submit!
sleep 0.1
app7.legal_reject!(chenlawyer, '验收文件不完整，请补充验收报告后重新申请。')
puts "✓ 法务驳回申请 ##{app7.id} 已创建"

puts "\n=== 种子数据加载完成 ==="
puts "总计："
puts "  部门: #{Department.count} 个"
puts "  用户: #{User.count} 个"
puts "  印章: #{Seal.count} 枚"
puts "  合同: #{Contract.count} 份"
puts "  用印申请: #{SealApplication.count} 份"
puts "  审批节点: #{ApprovalNode.count} 个"
puts "  归档记录: #{Archive.count} 份"
