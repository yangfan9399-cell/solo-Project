puts "Creating sample data..."

User.create!(name: '张经理', email: 'zhang@example.com', role: :operator)
User.create!(name: '李品牌', email: 'li@brand.com', role: :brand_manager)
User.create!(name: '王法务', email: 'wang@legal.com', role: :legal)
User.create!(name: '陈运营', email: 'chen@ops.com', role: :publisher)

Respondent.create!(name: '李明', type: :employee, contact_info: '13800138001')
Respondent.create!(name: '张三', type: :customer, contact_info: '13800138002')
Respondent.create!(name: '王五', type: :partner, contact_info: '13800138003')
Respondent.create!(name: '赵六', type: :expert, contact_info: '13800138004')

interview1 = Interview.create!(
  title: '2024年度员工访谈 - 李明',
  content: '在过去的一年里，我感受到了公司的快速发展。作为技术部门的核心成员，我参与了多个重要项目，包括新产品的研发和技术架构的升级。公司给予了我们充分的资源支持，让我们能够专注于技术创新。',
  status: :published,
  publish_date: Date.today - 7,
  channel: :wechat,
  user_id: 1,
  respondent_id: 1
)

Authorization.create!(
  interview_id: interview1.id,
  file_path: '/documents/authorizations/liming.pdf',
  approved: true,
  approved_at: Date.today - 10,
  user_id: 1
)

ReviewRecord.create!(interview_id: interview1.id, reviewer_id: 2, stage: :brand_review, status: :approved, comment: '内容符合品牌定位', created_at: Date.today - 9)
ReviewRecord.create!(interview_id: interview1.id, reviewer_id: 3, stage: :legal_review, status: :approved, comment: '授权文件完整', created_at: Date.today - 8)
ReviewRecord.create!(interview_id: interview1.id, reviewer_id: 4, stage: :publish_review, status: :approved, comment: '可以发布', created_at: Date.today - 7)

interview2 = Interview.create!(
  title: '客户满意度调研 - 张三',
  content: '作为公司的长期客户，我对产品质量非常满意。特别是最新推出的AI功能，大大提升了我们的工作效率。希望公司能够继续保持这种创新精神。',
  status: :pending_publish,
  publish_date: Date.today + 3,
  channel: :xiaohongshu,
  user_id: 1,
  respondent_id: 2
)

SensitiveItem.create!(interview_id: interview2.id, content: 'AI功能', position: '第2段第3句', start_index: 50, end_index: 54, covered: false)

ReviewRecord.create!(interview_id: interview2.id, reviewer_id: 2, stage: :brand_review, status: :approved, comment: '内容积极正面', created_at: Date.today - 2)
ReviewRecord.create!(interview_id: interview2.id, reviewer_id: 3, stage: :legal_review, status: :approved, comment: '审核通过', created_at: Date.today - 1)

interview3 = Interview.create!(
  title: '合作伙伴访谈 - 王五',
  content: '我们与该公司的合作已经超过五年，双方建立了深厚的信任关系。未来我们计划在更多领域展开合作，共同开拓市场。',
  status: :rejected,
  publish_date: Date.today,
  channel: :website,
  user_id: 1,
  respondent_id: 3
)

ReviewRecord.create!(interview_id: interview3.id, reviewer_id: 2, stage: :brand_review, status: :rejected, comment: '内容涉及未公开的合作计划，需要修改', created_at: Date.today - 3)

interview4 = Interview.create!(
  title: '行业专家观点 - 赵六',
  content: '当前市场环境变化快速，企业需要不断创新才能保持竞争力。我建议公司加大研发投入，关注新兴技术趋势。',
  status: :pending_legal_review,
  publish_date: Date.today + 7,
  channel: :weibo,
  user_id: 1,
  respondent_id: 4
)

Authorization.create!(
  interview_id: interview4.id,
  file_path: '/documents/authorizations/zhaoliu.pdf',
  approved: true,
  approved_at: Date.today - 4,
  user_id: 1
)

ReviewRecord.create!(interview_id: interview4.id, reviewer_id: 2, stage: :brand_review, status: :approved, comment: '专家观点有价值', created_at: Date.today - 4)

interview5 = Interview.create!(
  title: '新产品发布会访谈',
  content: '本次发布会将推出革命性的新产品，预计将改变整个行业格局。产品定价将在发布会上公布，敬请期待。',
  status: :pending_brand_review,
  publish_date: Date.today + 14,
  channel: :douyin,
  user_id: 1,
  respondent_id: 1
)

interview6 = Interview.create!(
  title: '内部培训访谈记录',
  content: '本次培训涵盖了最新的技术栈和工作流程，参与培训的员工反馈非常积极。培训内容包括前端框架、后端架构和DevOps实践。',
  status: :draft,
  publish_date: nil,
  channel: :website,
  user_id: 1,
  respondent_id: 1
)

puts "Sample data created successfully!"