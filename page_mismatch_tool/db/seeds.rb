p1 = Project.find_or_create_by!(name: "明史稿·本纪 第一册") do |p|
  p.description = "明史稿本纪部分影印本，原书共120页，扫描后存在缺页及重复页问题"
  p.pdf_filename = "mingshigao_benji_01.pdf"
  p.total_pages = 120
  p.status = "in_progress"
end

p2 = Project.find_or_create_by!(name: "四库全书·经部 春秋左传") do |p|
  p.description = "四库全书经部春秋左传影印本，含封面及目录页，正文页码从第3页开始"
  p.pdf_filename = "siku_jing_chunqiu.pdf"
  p.total_pages = 85
  p.status = "draft"
end

p3 = Project.find_or_create_by!(name: "永乐大典·卷2272-2274") do |p|
  p.description = "永乐大典残卷影印，存在多处缺页及插入页，页码混乱需重新整理"
  p.pdf_filename = "yongle_dadian_2272.pdf"
  p.total_pages = 56
  p.status = "completed"
end

p4 = Project.find_or_create_by!(name: "资治通鉴·周纪") do |p|
  p.description = "资治通鉴周纪影印本，页码基本正确，仅有少量错位"
  p.pdf_filename = "zztj_zhouji.pdf"
  p.total_pages = 200
  p.status = "draft"
end

p5 = Project.find_or_create_by!(name: "清实录·乾隆朝 第一册") do |p|
  p.description = "清实录乾隆朝第一册影印本，存在重复扫描页及空白页"
  p.pdf_filename = "qingshilu_qianlong_01.pdf"
  p.total_pages = 150
  p.status = "in_progress"
end

if p1.page_mappings.empty?
  (1..120).each do |i|
    attrs = { pdf_page_index: i, project: p1 }

    if [15, 16].include?(i)
      attrs[:actual_page_number] = 14
      attrs[:status] = PageMapping::DUPLICATE
      attrs[:notes] = "第14页重复扫描"
    elsif i == 45
      attrs[:actual_page_number] = nil
      attrs[:status] = PageMapping::MISSING
      attrs[:notes] = "原书第45页缺失"
    elsif i == 46
      attrs[:actual_page_number] = nil
      attrs[:status] = PageMapping::INSERTED
      attrs[:notes] = "插入的补页"
    elsif i == 88
      attrs[:actual_page_number] = 80
      attrs[:status] = PageMapping::MISNUMBERED
      attrs[:notes] = "PDF第88页对应实际第80页，错位8页"
    elsif i == 89
      attrs[:actual_page_number] = 81
      attrs[:status] = PageMapping::MISNUMBERED
      attrs[:notes] = "错位延续"
    else
      if i < 15
        attrs[:actual_page_number] = i
      elsif i < 17
        attrs[:actual_page_number] = 14
      elsif i == 17
        attrs[:actual_page_number] = 15
      elsif i < 45
        attrs[:actual_page_number] = i - 2
      elsif i == 45
        attrs[:actual_page_number] = nil
      elsif i == 46
        attrs[:actual_page_number] = nil
      elsif i < 88
        attrs[:actual_page_number] = i - 3
      else
        attrs[:actual_page_number] = i - 8
      end
    end

    p1.page_mappings.create!(attrs)
  end
end

if p2.page_mappings.empty?
  (1..85).each do |i|
    attrs = { pdf_page_index: i, project: p2 }

    if i <= 2
      attrs[:actual_page_number] = nil
      attrs[:status] = PageMapping::BLANK
      attrs[:notes] = i == 1 ? "封面" : "目录页"
    elsif i == 3
      attrs[:actual_page_number] = 1
      attrs[:notes] = "正文起始页"
    else
      attrs[:actual_page_number] = i - 2
    end

    p2.page_mappings.create!(attrs)
  end
end

if p3.page_mappings.empty?
  (1..56).each do |i|
    attrs = { pdf_page_index: i, project: p3 }

    if [7, 8].include?(i)
      attrs[:actual_page_number] = 6
      attrs[:status] = PageMapping::DUPLICATE
      attrs[:notes] = "第6页重复扫描"
    elsif [23, 37].include?(i)
      attrs[:actual_page_number] = nil
      attrs[:status] = PageMapping::MISSING
      attrs[:notes] = "原书第#{i - 1}页缺失"
    elsif i == 50
      attrs[:actual_page_number] = nil
      attrs[:status] = PageMapping::INSERTED
      attrs[:notes] = "插入的勘误页"
    elsif i == 51
      attrs[:actual_page_number] = nil
      attrs[:status] = PageMapping::INSERTED
      attrs[:notes] = "插入的补页"
    else
      attrs[:actual_page_number] = i
    end

    p3.page_mappings.create!(attrs)
  end
end

if p4.page_mappings.empty?
  (1..200).each do |i|
    attrs = { pdf_page_index: i, project: p4, actual_page_number: i }

    if i == 100
      attrs[:actual_page_number] = 99
      attrs[:status] = PageMapping::MISNUMBERED
      attrs[:notes] = "PDF第100页对应实际第99页"
    elsif i == 101
      attrs[:actual_page_number] = 100
      attrs[:status] = PageMapping::MISNUMBERED
      attrs[:notes] = "错位延续"
    end

    p4.page_mappings.create!(attrs)
  end
end

if p5.page_mappings.empty?
  (1..150).each do |i|
    attrs = { pdf_page_index: i, project: p5 }

    if [30, 31].include?(i)
      attrs[:actual_page_number] = 29
      attrs[:status] = PageMapping::DUPLICATE
      attrs[:notes] = "第29页重复扫描"
    elsif [60, 61].include?(i)
      attrs[:actual_page_number] = nil
      attrs[:status] = PageMapping::BLANK
      attrs[:notes] = "空白扫描页"
    elsif i == 90
      attrs[:actual_page_number] = nil
      attrs[:status] = PageMapping::MISSING
      attrs[:notes] = "原书第86页缺失"
    else
      attrs[:actual_page_number] = i
    end

    p5.page_mappings.create!(attrs)
  end
end

if p1.anomalies.empty?
  p1.page_mappings.where(status: PageMapping::DUPLICATE).each do |pm|
    p1.anomalies.create!(
      page_mapping: pm,
      anomaly_type: Anomaly::DUPLICATE,
      description: "PDF物理第#{pm.pdf_page_index}页与第#{pm.pdf_page_index - 1}页重复，实际页码均为#{pm.actual_page_number}",
      resolved: false
    )
  end

  p1.page_mappings.where(status: PageMapping::MISSING).each do |pm|
    p1.anomalies.create!(
      page_mapping: pm,
      anomaly_type: Anomaly::MISSING,
      description: "PDF物理第#{pm.pdf_page_index}页标记为缺失页",
      resolved: false
    )
  end

  p1.page_mappings.where(status: PageMapping::INSERTED).each do |pm|
    p1.anomalies.create!(
      page_mapping: pm,
      anomaly_type: Anomaly::INSERTED,
      description: "PDF物理第#{pm.pdf_page_index}页为插入页，非原书页码",
      resolved: false
    )
  end

  p1.page_mappings.where(status: PageMapping::MISNUMBERED).each do |pm|
    p1.anomalies.create!(
      page_mapping: pm,
      anomaly_type: Anomaly::MISNUMBERED,
      description: "PDF物理第#{pm.pdf_page_index}页实际页码为#{pm.actual_page_number}，存在错位",
      resolved: false
    )
  end
end

if p3.anomalies.empty?
  p3.page_mappings.where(status: PageMapping::DUPLICATE).each do |pm|
    p3.anomalies.create!(
      page_mapping: pm,
      anomaly_type: Anomaly::DUPLICATE,
      description: "PDF物理第#{pm.pdf_page_index}页为重复扫描页",
      resolved: true
    )
  end

  p3.page_mappings.where(status: PageMapping::MISSING).each do |pm|
    p3.anomalies.create!(
      page_mapping: pm,
      anomaly_type: Anomaly::MISSING,
      description: "PDF物理第#{pm.pdf_page_index}页缺失",
      resolved: true
    )
  end

  p3.page_mappings.where(status: PageMapping::INSERTED).each do |pm|
    p3.anomalies.create!(
      page_mapping: pm,
      anomaly_type: Anomaly::INSERTED,
      description: "PDF物理第#{pm.pdf_page_index}页为插入页",
      resolved: true
    )
  end
end

if p5.anomalies.empty?
  p5.page_mappings.where(status: [PageMapping::DUPLICATE, PageMapping::BLANK, PageMapping::MISSING]).each do |pm|
    type = case pm.status
           when PageMapping::DUPLICATE then Anomaly::DUPLICATE
           when PageMapping::MISSING then Anomaly::MISSING
           when PageMapping::BLANK then Anomaly::MISNUMBERED
           end
    desc = case pm.status
           when PageMapping::DUPLICATE then "PDF物理第#{pm.pdf_page_index}页为重复扫描页"
           when PageMapping::MISSING then "PDF物理第#{pm.pdf_page_index}页缺失"
           when PageMapping::BLANK then "PDF物理第#{pm.pdf_page_index}页为空白扫描页"
           end
    p5.anomalies.create!(
      page_mapping: pm,
      anomaly_type: type,
      description: desc,
      resolved: false
    )
  end
end

if p1.batches.empty?
  b1 = p1.batches.create!(
    name: "初始扫描",
    description: "第一次扫描后的页码映射",
    snapshot: p1.page_mappings.order(:pdf_page_index).map { |pm|
      { pdf_page_index: pm.pdf_page_index, actual_page_number: pm.actual_page_number, status: pm.status, notes: pm.notes }
    }.to_json
  )

  b2 = p1.batches.create!(
    name: "修正重复页",
    description: "标记第15-16页为重复页后的版本",
    snapshot: p1.page_mappings.order(:pdf_page_index).map { |pm|
      { pdf_page_index: pm.pdf_page_index, actual_page_number: pm.actual_page_number, status: pm.status, notes: pm.notes }
    }.to_json
  )

  csv_content = "PDF物理页码,实际页码,状态,备注\n"
  p1.page_mappings.order(:pdf_page_index).limit(30).each do |pm|
    csv_content += "#{pm.pdf_page_index},#{pm.actual_page_number || '无'},#{pm.status},#{pm.notes || ''}\n"
  end

  p1.export_records.create!(
    batch: b1,
    format: "csv",
    filename: "明史稿_本纪_初始扫描_前30页.csv",
    content: csv_content
  )

  bookmark_json = {
    title: p1.name,
    children: p1.page_mappings.order(:pdf_page_index).limit(30).map { |pm|
      { page: pm.pdf_page_index, title: "第#{pm.actual_page_number || '?'}页" }
    }
  }.to_json

  p1.export_records.create!(
    batch: b2,
    format: "bookmark_json",
    filename: "明史稿_本纪_修正重复页_书签.json",
    content: bookmark_json
  )
end

if p3.batches.empty?
  b3 = p3.batches.create!(
    name: "最终定稿",
    description: "所有异常已处理的最终版本",
    snapshot: p3.page_mappings.order(:pdf_page_index).map { |pm|
      { pdf_page_index: pm.pdf_page_index, actual_page_number: pm.actual_page_number, status: pm.status, notes: pm.notes }
    }.to_json
  )

  csv_full = "PDF物理页码,实际页码,状态,备注\n"
  p3.page_mappings.order(:pdf_page_index).each do |pm|
    csv_full += "#{pm.pdf_page_index},#{pm.actual_page_number || '无'},#{pm.status},#{pm.notes || ''}\n"
  end

  p3.export_records.create!(
    batch: b3,
    format: "csv",
    filename: "永乐大典_残卷_最终定稿.csv",
    content: csv_full
  )

  bookmark_full = {
    title: p3.name,
    children: p3.page_mappings.order(:pdf_page_index).map { |pm|
      { page: pm.pdf_page_index, title: "第#{pm.actual_page_number || '?'}页" }
    }
  }.to_json

  p3.export_records.create!(
    batch: b3,
    format: "bookmark_json",
    filename: "永乐大典_残卷_书签.json",
    content: bookmark_full
  )
end

puts "种子数据初始化完成！"
puts "  项目: #{Project.count} 个"
puts "  页码映射: #{PageMapping.count} 条"
puts "  异常记录: #{Anomaly.count} 条"
puts "  批次记录: #{Batch.count} 条"
puts "  导出记录: #{ExportRecord.count} 条"
