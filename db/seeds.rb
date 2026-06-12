ActiveRecord::Base.transaction do
  frontline = User.find_or_create_by!(name: '张老师') do |u|
    u.role = :frontline_processor
    u.password = 'password123'
    u.password_confirmation = 'password123'
  end

  reviewer = User.find_or_create_by!(name: '李主任') do |u|
    u.role = :quality_reviewer
    u.password = 'password123'
    u.password_confirmation = 'password123'
  end

  frontline2 = User.find_or_create_by!(name: '王老师') do |u|
    u.role = :frontline_processor
    u.password = 'password123'
    u.password_confirmation = 'password123'
  end

  reviewer2 = User.find_or_create_by!(name: '赵副主任') do |u|
    u.role = :quality_reviewer
    u.password = 'password123'
    u.password_confirmation = 'password123'
  end

  puts "Created users: #{User.count}"

  GradeCorrection.destroy_all

  gc1 = GradeCorrection.create!(
    application_no: 'GC20260001',
    student_name: '张三',
    student_id: '2023001001',
    course_name: '高等数学',
    course_code: 'MATH1001',
    original_score: 85,
    corrected_score: 92,
    application_reason: '期末考试卷面成绩录入错误，实际得分应为92分。经核对答题卡和评分标准，第3大题第2小题满分10分，学生答对但未给分。',
    source: 'online',
    applicant: '张三',
    application_date: 7.days.ago.to_date,
    current_owner: reviewer,
    status: 'archived',
    conclusion: '经复核，确认成绩录入错误，同意更正。原始成绩85分，更正为92分。已通知学生及任课教师。',
    evidence_conclusion: :evidence_sufficient,
    notification_confirmed: true,
    amount: 0,
    responsible_party: '教务处录入人员',
    critical_time: 2.days.ago
  )
  gc1.processing_nodes.create!(
    node_type: 'create', operator: frontline, content: '学生在线提交成绩更正申请', status: 'pending',
    business_record: '学生通过教务系统提交申请，附原始成绩单扫描件和答题卡照片'
  )
  gc1.processing_nodes.create!(
    node_type: 'accept', operator: frontline, content: '受理申请，材料齐全', status: 'accepted',
    business_record: '核对学生身份、课程信息，申请材料完整'
  )
  gc1.processing_nodes.create!(
    node_type: 'processing', operator: frontline, content: '联系任课教师王教授核实情况', status: 'processing',
    business_record: '王教授确认评分有误，第3大题第2小题学生答案正确，应得10分',
    on_site_explanation: '经与王教授电话沟通并核对原始试卷，确认分数录入错误'
  )
  gc1.processing_nodes.create!(
    node_type: 'submit_review', operator: frontline, content: '处理完成，提交复核', status: 'reviewing',
    business_record: '已核实情况，原始成绩85分，建议更正为92分'
  )
  gc1.processing_nodes.create!(
    node_type: 'approve', operator: reviewer, content: '复核通过，同意更正', status: 'archived',
    business_record: '复核所有材料，确认情况属实，同意成绩更正'
  )
  gc1.attachments.create!(
    processing_node: gc1.processing_nodes.first,
    file_name: '成绩单扫描件.pdf',
    file_type: 'application/pdf',
    description: '学生原始成绩单',
    evidence_type: 'transcript'
  )
  gc1.attachments.create!(
    processing_node: gc1.processing_nodes.third,
    file_name: '试卷答题卡.jpg',
    file_type: 'image/jpeg',
    description: '学生答题卡照片，显示第3大题第2小题答对',
    evidence_type: 'exam_paper'
  )
  gc1.diff_records.create!(
    processing_node: gc1.processing_nodes.fourth,
    field_name: 'corrected_score',
    old_value: '85',
    new_value: '92',
    operator: frontline
  )
  gc1.diff_records.create!(
    processing_node: gc1.processing_nodes.fourth,
    field_name: 'evidence_conclusion',
    old_value: 'pending',
    new_value: 'sufficient',
    operator: frontline
  )
  puts "Created 正常交付样本: #{gc1.application_no}"

  gc2 = GradeCorrection.create!(
    application_no: 'GC20260002',
    student_name: '李四',
    student_id: '2023001002',
    course_name: '大学物理',
    course_code: 'PHYS1002',
    original_score: 58,
    corrected_score: 75,
    application_reason: '学生认为平时成绩计算有误，申请重新核算。',
    source: 'offline',
    applicant: '李四',
    application_date: 5.days.ago.to_date,
    current_owner: reviewer,
    status: 'rejected',
    conclusion: '申请资格不符，予以驳回。',
    block_reason: '1. 学生已修完该课程并取得最终成绩，根据《本科生成绩管理规定》第15条，成绩公布后超过15个工作日不予受理；2. 学生无法提供任课教师签字的成绩异议证明；3. 平时成绩构成包含考勤、作业、小测验等多项，学生仅对其中一项有异议但无法提供充分证据。',
    remedy_path: '1. 学生需在成绩公布后15个工作日内提交申请；2. 需提供任课教师出具的成绩复核意见书；3. 如有考试试卷评分异议，需在考试结束后3个工作日内提出书面申请；4. 建议学生申请成绩复查而非更正，复查流程需填写《成绩复查申请表》并经学院教学秘书签字。',
    evidence_conclusion: :evidence_insufficient,
    notification_confirmed: true,
    amount: 0,
    responsible_party: '学生本人',
    critical_time: 3.days.ago
  )
  gc2.processing_nodes.create!(
    node_type: 'create', operator: frontline2, content: '学生线下提交纸质申请', status: 'pending',
    business_record: '学生提交《成绩更正申请表》，但未附任课教师证明'
  )
  gc2.processing_nodes.create!(
    node_type: 'accept', operator: frontline2, content: '受理申请，待补充材料', status: 'accepted',
    business_record: '初步受理，告知学生需补充任课教师证明材料'
  )
  gc2.processing_nodes.create!(
    node_type: 'processing', operator: frontline2, content: '审核申请材料', status: 'processing',
    business_record: '发现申请已超过15个工作日受理期限，且缺少必要证明材料',
    on_site_explanation: '经核查教务系统记录，该课程成绩已于30日前公布，超出受理时限'
  )
  gc2.processing_nodes.create!(
    node_type: 'submit_review', operator: frontline2, content: '初审不通过，建议驳回', status: 'reviewing',
    business_record: '资格不符：超出受理时限、材料不全，建议驳回申请'
  )
  gc2.processing_nodes.create!(
    node_type: 'reject', operator: reviewer, content: '申请驳回，资格不符', status: 'rejected',
    business_record: '复核确认：超出受理时限，证据不足，不符合《本科生成绩管理规定》相关条款'
  )
  gc2.attachments.create!(
    processing_node: gc2.processing_nodes.first,
    file_name: '成绩更正申请表.pdf',
    file_type: 'application/pdf',
    description: '学生填写的申请表',
    evidence_type: 'appeal_letter'
  )
  gc2.attachments.create!(
    processing_node: gc2.processing_nodes.third,
    file_name: '教务系统记录截图.png',
    file_type: 'image/png',
    description: '显示成绩公布日期为30日前',
    evidence_type: 'other'
  )
  gc2.diff_records.create!(
    processing_node: gc2.processing_nodes.fourth,
    field_name: 'evidence_conclusion',
    old_value: 'pending',
    new_value: 'insufficient',
    operator: frontline2
  )
  gc2.diff_records.create!(
    processing_node: gc2.processing_nodes.fourth,
    field_name: 'block_reason',
    old_value: '',
    new_value: '超出受理时限且材料不全',
    operator: frontline2
  )
  puts "Created 资格不符样本: #{gc2.application_no}"

  gc3 = GradeCorrection.create!(
    application_no: 'GC20260003',
    student_name: '王五',
    student_id: '2023001003',
    course_name: '计算机网络',
    course_code: 'CS2001',
    original_score: 72,
    corrected_score: 85,
    application_reason: '期末机考成绩统计错误，系统显示的成绩与实际作答情况不符。',
    source: 'email',
    applicant: '刘老师（任课教师）',
    application_date: 10.days.ago.to_date,
    current_owner: frontline,
    status: 'returned',
    conclusion: '存在时间窗口冲突，需进一步核实。',
    block_reason: '1. 成绩更正申请提交时间与下学期选课时间窗口重叠，可能影响学生选课优先级；2. 该课程成绩为前置课程要求，成绩变更可能影响已选课程的资格审核；3. 机考系统日志显示成绩统计期间有系统维护记录，需技术部门出具正式说明。',
    remedy_path: '1. 待选课窗口期结束后（预计3个工作日）再进行成绩更正操作；2. 需信息技术中心出具机考系统故障的正式技术鉴定报告；3. 核实学生下学期选课情况，如因成绩变更影响选课资格，需单独处理；4. 通知学生和相关学院教学秘书，说明时间冲突情况及预计处理时间。',
    evidence_conclusion: :evidence_pending,
    notification_confirmed: false,
    amount: 500,
    responsible_party: '信息技术中心',
    critical_time: 1.day.from_now
  )
  gc3.processing_nodes.create!(
    node_type: 'create', operator: frontline, content: '任课教师邮件提交申请', status: 'pending',
    business_record: '刘老师发邮件说明机考成绩统计问题，附系统截图和班级成绩对照表'
  )
  gc3.processing_nodes.create!(
    node_type: 'accept', operator: frontline, content: '受理教师申请', status: 'accepted',
    business_record: '核对教师身份和课程信息，申请事由合理'
  )
  gc3.processing_nodes.create!(
    node_type: 'processing', operator: frontline, content: '联系信息中心核查系统日志', status: 'processing',
    business_record: '信息中心反馈成绩统计期间有2小时系统维护，可能影响成绩计算',
    on_site_explanation: '发现当前处于选课窗口期，成绩变更可能影响学生选课'
  )
  gc3.processing_nodes.create!(
    node_type: 'submit_review', operator: frontline, content: '技术问题待确认，提交复核', status: 'reviewing',
    business_record: '存在时间窗口冲突问题，建议退回待技术部门出具正式报告'
  )
  gc3.processing_nodes.create!(
    node_type: 'return', operator: reviewer2, content: '退回补证：时间窗口冲突', status: 'returned',
    business_record: '存在选课时间窗口冲突问题，需技术部门出具正式报告，待选课结束后再处理'
  )
  gc3.attachments.create!(
    processing_node: gc3.processing_nodes.first,
    file_name: '教师申请邮件.eml',
    file_type: 'message/rfc822',
    description: '任课教师申请邮件原文',
    evidence_type: 'appeal_letter'
  )
  gc3.attachments.create!(
    processing_node: gc3.processing_nodes.third,
    file_name: '系统维护记录.xlsx',
    file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    description: '信息中心提供的系统维护记录',
    evidence_type: 'other'
  )
  gc3.diff_records.create!(
    processing_node: gc3.processing_nodes.third,
    field_name: 'critical_time',
    old_value: '',
    new_value: 1.day.from_now.to_s,
    operator: frontline
  )
  gc3.diff_records.create!(
    processing_node: gc3.processing_nodes.third,
    field_name: 'amount',
    old_value: '0',
    new_value: '500',
    operator: frontline
  )
  gc3.diff_records.create!(
    processing_node: gc3.processing_nodes.fifth,
    field_name: 'responsible_party',
    old_value: '',
    new_value: '信息技术中心',
    operator: reviewer2
  )
  puts "Created 时间窗口冲突样本: #{gc3.application_no}"

  gc4 = GradeCorrection.create!(
    application_no: 'GC20260004',
    student_name: '赵六',
    student_id: '2023001004',
    course_name: '线性代数',
    course_code: 'MATH2001',
    original_score: 60,
    corrected_score: 88,
    application_reason: '平时作业成绩漏登，共5次作业成绩未计入总分。',
    source: 'online',
    applicant: '赵六',
    application_date: 14.days.ago.to_date,
    current_owner: frontline2,
    status: 'processing',
    conclusion: '处理完成，待学生确认通知。',
    block_reason: '1. 成绩更正通知书已于5个工作日前发送至学生预留邮箱，但学生尚未确认收到；2. 电话联系3次均未接通，短信已发送但未回复；3. 根据规定，需学生本人确认后方可完成最终归档。',
    remedy_path: '1. 通过辅导员联系学生，确认是否收到通知；2. 如7个工作日内仍无法联系到学生，将按照《学生成绩管理规定》进行公告送达；3. 公告送达满10个工作日后视为已送达，可完成归档；4. 同步更新学生联系方式，确保后续通知送达。',
    evidence_conclusion: :evidence_sufficient,
    notification_confirmed: false,
    amount: 0,
    responsible_party: '任课教师',
    critical_time: 5.days.ago
  )
  gc4.processing_nodes.create!(
    node_type: 'create', operator: frontline2, content: '学生在线提交申请', status: 'pending',
    business_record: '学生提交作业成绩截图和教师确认邮件'
  )
  gc4.processing_nodes.create!(
    node_type: 'accept', operator: frontline2, content: '受理申请', status: 'accepted',
    business_record: '材料齐全，受理申请'
  )
  gc4.processing_nodes.create!(
    node_type: 'processing', operator: frontline2, content: '核实作业成绩', status: 'processing',
    business_record: '任课教师确认5次作业成绩漏登，平时成绩应为95分而非40分。综合计算后课程成绩应为88分。',
    on_site_explanation: '已发送成绩更正通知书至学生邮箱，等待确认'
  )
  gc4.attachments.create!(
    processing_node: gc4.processing_nodes.first,
    file_name: '作业成绩截图.zip',
    file_type: 'application/zip',
    description: '5次作业的成绩系统截图',
    evidence_type: 'transcript'
  )
  gc4.attachments.create!(
    processing_node: gc4.processing_nodes.third,
    file_name: '通知书发送记录.png',
    file_type: 'image/png',
    description: '邮件发送成功截图',
    evidence_type: 'notification'
  )
  gc4.diff_records.create!(
    processing_node: gc4.processing_nodes.third,
    field_name: 'corrected_score',
    old_value: '60',
    new_value: '88',
    operator: frontline2
  )
  gc4.diff_records.create!(
    processing_node: gc4.processing_nodes.third,
    field_name: 'evidence_conclusion',
    old_value: 'pending',
    new_value: 'sufficient',
    operator: frontline2
  )
  puts "Created 通知未确认样本: #{gc4.application_no}"

  gc5 = GradeCorrection.create!(
    application_no: 'GC20260005',
    student_name: '孙七',
    student_id: '2023001005',
    course_name: '数据结构',
    course_code: 'CS2002',
    original_score: 78,
    corrected_score: 82,
    application_reason: '实验报告成绩批改有误，申请复核。',
    source: 'online',
    applicant: '孙七',
    application_date: 3.days.ago.to_date,
    current_owner: frontline,
    status: 'pending',
    evidence_conclusion: :evidence_pending,
    notification_confirmed: false,
    amount: 0,
    responsible_party: '助教',
    critical_time: 7.days.from_now
  )
  gc5.processing_nodes.create!(
    node_type: 'create', operator: frontline, content: '学生在线提交申请', status: 'pending',
    business_record: '附实验报告原文和评分标准'
  )
  puts "Created 待处理样本: #{gc5.application_no}"

  gc6 = GradeCorrection.create!(
    application_no: 'GC20260006',
    student_name: '周八',
    student_id: '2023001006',
    course_name: '概率论',
    course_code: 'MATH3001',
    original_score: 65,
    corrected_score: 78,
    application_reason: '期末考试成绩统计错误。',
    source: 'offline',
    applicant: '周八',
    application_date: 4.days.ago.to_date,
    current_owner: frontline2,
    status: 'accepted',
    evidence_conclusion: :evidence_pending,
    notification_confirmed: false,
    amount: 0,
    responsible_party: '教务处',
    critical_time: 6.days.from_now
  )
  gc6.processing_nodes.create!(
    node_type: 'create', operator: frontline2, content: '学生提交纸质申请', status: 'pending'
  )
  gc6.processing_nodes.create!(
    node_type: 'accept', operator: frontline2, content: '已受理', status: 'accepted'
  )
  puts "Created 已受理样本: #{gc6.application_no}"

  gc7 = GradeCorrection.create!(
    application_no: 'GC20260007',
    student_name: '吴九',
    student_id: '2023001007',
    course_name: '操作系统',
    course_code: 'CS3001',
    original_score: 70,
    corrected_score: 85,
    application_reason: '课程设计成绩未计入总分。',
    source: 'online',
    applicant: '吴九',
    application_date: 8.days.ago.to_date,
    current_owner: reviewer2,
    status: 'reviewing',
    evidence_conclusion: :evidence_sufficient,
    notification_confirmed: false,
    amount: 200,
    responsible_party: '任课教师',
    critical_time: 2.days.ago
  )
  gc7.processing_nodes.create!(
    node_type: 'create', operator: frontline, content: '学生提交申请', status: 'pending'
  )
  gc7.processing_nodes.create!(
    node_type: 'accept', operator: frontline, content: '受理', status: 'accepted'
  )
  gc7.processing_nodes.create!(
    node_type: 'processing', operator: frontline, content: '核实情况，确认课程设计成绩漏登', status: 'processing'
  )
  gc7.processing_nodes.create!(
    node_type: 'submit_review', operator: frontline, content: '提交复核', status: 'reviewing'
  )
  gc7.attachments.create!(
    processing_node: gc7.processing_nodes.third,
    file_name: '课程设计报告.pdf',
    file_type: 'application/pdf',
    description: '学生课程设计报告，成绩为优秀',
    evidence_type: 'teacher_proof'
  )
  gc7.diff_records.create!(
    processing_node: gc7.processing_nodes.third,
    field_name: 'corrected_score',
    old_value: '70',
    new_value: '85',
    operator: frontline
  )
  gc7.diff_records.create!(
    processing_node: gc7.processing_nodes.third,
    field_name: 'evidence_conclusion',
    old_value: 'pending',
    new_value: 'sufficient',
    operator: frontline
  )
  puts "Created 待复核样本: #{gc7.application_no}"

  puts "\n=== Summary ==="
  puts "Total users: #{User.count}"
  puts "Total grade corrections: #{GradeCorrection.count}"
  puts "Status breakdown:"
  GradeCorrection.group(:status).count.each do |status, count|
    puts "  #{status}: #{count}"
  end
  puts "With block reason: #{GradeCorrection.with_block_reason.count}"
  puts "Notification unconfirmed: #{GradeCorrection.notification_unconfirmed.count}"
  puts "Total processing nodes: #{ProcessingNode.count}"
  puts "Total diff records: #{DiffRecord.count}"
  puts "Total attachments: #{Attachment.count}"
end
