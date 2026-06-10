User.find_or_create_by!(username: "admin") do |u|
  u.name = "管理员"
  u.password = "admin123"
  u.role = "admin"
end

User.find_or_create_by!(username: "supervisor") do |u|
  u.name = "主管张"
  u.password = "super123"
  u.role = "supervisor"
end

User.find_or_create_by!(username: "technician") do |u|
  u.name = "技师李"
  u.password = "tech123"
  u.role = "technician"
end

User.find_or_create_by!(username: "receptionist") do |u|
  u.name = "前台王"
  u.password = "recep123"
  u.role = "receptionist"
end

patient1 = Patient.find_or_create_by!(id_card: "110101199003074512") do |p|
  p.name = "张三"
  p.phone = "13800138001"
  p.gender = "男"
  p.birth_date = Date.new(1990, 3, 7)
  p.address = "北京市朝阳区"
end

patient2 = Patient.find_or_create_by!(id_card: "310101198506127890") do |p|
  p.name = "李四"
  p.phone = "13900139002"
  p.gender = "女"
  p.birth_date = Date.new(1985, 6, 12)
  p.address = "上海市浦东新区"
end

patient3 = Patient.find_or_create_by!(id_card: "440101199512153678") do |p|
  p.name = "王五"
  p.phone = "13600136003"
  p.gender = "男"
  p.birth_date = Date.new(1995, 12, 15)
  p.address = "广东省广州市"
end

patient4 = Patient.find_or_create_by!(id_card: "330101198809204567") do |p|
  p.name = "赵六"
  p.phone = "13700137004"
  p.gender = "女"
  p.birth_date = Date.new(1988, 9, 20)
  p.address = "浙江省杭州市"
end

patient5 = Patient.find_or_create_by!(id_card: "210101199205087890") do |p|
  p.name = "孙七"
  p.phone = "13500135005"
  p.gender = "男"
  p.birth_date = Date.new(1992, 5, 8)
  p.address = "辽宁省沈阳市"
end

exam1 = Exam.find_or_create_by!(exam_no: "CT20240101001") do |e|
  e.patient = patient1
  e.exam_type = "ct"
  e.exam_date = Date.today - 3.days
  e.description = "头部CT平扫"
end

exam2 = Exam.find_or_create_by!(exam_no: "MRI20240102001") do |e|
  e.patient = patient2
  e.exam_type = "mri"
  e.exam_date = Date.today - 2.days
  e.description = "膝关节MRI"
end

exam3 = Exam.find_or_create_by!(exam_no: "XR20240103001") do |e|
  e.patient = patient3
  e.exam_type = "xray"
  e.exam_date = Date.today - 1.day
  e.description = "胸部X光片"
end

exam4 = Exam.find_or_create_by!(exam_no: "US20240104001") do |e|
  e.patient = patient4
  e.exam_type = "ultrasound"
  e.exam_date = Date.today - 4.days
  e.description = "腹部超声"
end

exam5 = Exam.find_or_create_by!(exam_no: "CT20240105001") do |e|
  e.patient = patient5
  e.exam_type = "ct"
  e.exam_date = Date.today - 5.days
  e.description = "肺部CT增强"
end

report1 = Report.find_or_create_by!(report_no: "RPT20240101001") do |r|
  r.exam = exam1
  r.issue_date = Date.today - 2.days
  r.status = "delivered"
  r.pickup_type = "self"
end

report2 = Report.find_or_create_by!(report_no: "RPT20240102001") do |r|
  r.exam = exam2
  r.issue_date = Date.today - 1.day
  r.status = "pickup_requested"
  r.pickup_type = "authorized"
end

report3 = Report.find_or_create_by!(report_no: "RPT20240103001") do |r|
  r.exam = exam3
  r.issue_date = Date.today
  r.status = "exception"
  r.remark = "id_mismatch"
end

report4 = Report.find_or_create_by!(report_no: "RPT20240104001") do |r|
  r.exam = exam4
  r.issue_date = Date.today - 3.days
  r.status = "delivered"
  r.pickup_type = "self"
  r.reissue_count = 3
end

report5 = Report.find_or_create_by!(report_no: "RPT20240105001") do |r|
  r.exam = exam5
  r.issue_date = Date.today - 2.days
  r.status = "reissue_requested"
  r.pickup_type = "delivery"
end

if report1.history_records.empty?
  report1.add_history("generated", "系统", "报告自动生成")
  report1.add_history("pickup_requested", "前台王", "本人领取")
  report1.add_history("confirmed", "技师李", "报告已确认")
  report1.add_history("delivered", "技师李", "报告已交付")
end

if report2.history_records.empty?
  report2.add_history("generated", "系统", "报告自动生成")
  report2.add_history("pickup_requested", "前台王", "授权代领")
end

if report3.history_records.empty?
  report3.add_history("generated", "系统", "报告自动生成")
  report3.add_history("pickup_requested", "前台王", "本人领取")
  report3.add_history("exception", "技师李", "身份证不符")
end

if report4.history_records.empty?
  4.times do
    report4.add_history("generated", "系统", "报告自动生成")
    report4.add_history("pickup_requested", "前台王", "本人领取")
    report4.add_history("confirmed", "技师李", "报告已确认")
    report4.add_history("delivered", "技师李", "报告已交付")
    report4.add_history("reissue_requested", "前台王", "补打申请")
    report4.add_history("reissued", "主管张", "补打已批准")
  end
end

if report5.history_records.empty?
  report5.add_history("generated", "系统", "报告自动生成")
  report5.add_history("pickup_requested", "前台王", "快递邮寄")
  report5.add_history("confirmed", "技师李", "报告已确认")
  report5.add_history("delivered", "技师李", "报告已交付")
  report5.add_history("reissue_requested", "前台王", "快递丢失，申请补打")
end

Authorization.find_or_create_by!(report: report2, auth_type: "power_of_attorney") do |a|
  a.file_path = "/uploads/auth/POA_20240102.pdf"
  a.receiver_name = "李四的代理人"
  a.receiver_id_card = "310101198001011234"
  a.remark = "患者授权委托书"
end