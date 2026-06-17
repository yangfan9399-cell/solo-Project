puts "正在初始化石窟壁画颜料病害观察系统数据..."

projects_data = [
  {
    name: "莫高窟第257窟西壁壁画",
    code: "MGK-257-XB",
    location: "敦煌莫高窟 第257窟",
    dynasty: "北魏",
    description: "第257窟西壁九色鹿王本生壁画，北魏时期代表作品。壁画以矿物质颜料为主，含朱砂、石青、石绿、白垩等。主要病害为起甲和酥碱，近年来有加剧趋势。",
    status: "active",
    start_date: "2021-03-15",
    end_date: nil
  },
  {
    name: "莫高窟第320窟南壁壁画",
    code: "MGK-320-NB",
    location: "敦煌莫高窟 第320窟",
    dynasty: "唐代",
    description: "第320窟南壁观无量寿经变壁画，盛唐时期精品。壁画色彩保存相对完好，主要病害为变色和裂隙，需重点监测。",
    status: "active",
    start_date: "2020-06-10",
    end_date: nil
  },
  {
    name: "莫高窟第17窟藏经洞壁画",
    code: "MGK-017-CJD",
    location: "敦煌莫高窟 第17窟",
    dynasty: "唐代",
    description: "第17窟藏经洞洪辩法师影窟壁画。由于历史上藏经影响，壁画存在多处病害，包括起甲、酥碱、变色等，是重点保护对象。",
    status: "active",
    start_date: "2019-09-01",
    end_date: nil
  },
  {
    name: "榆林窟第25窟壁画",
    code: "YLK-025-MAIN",
    location: "瓜州榆林窟 第25窟",
    dynasty: "唐代",
    description: "榆林窟第25窟观无量寿经变壁画，中唐时期代表作品。壁画保存状况较好，主要监测对象为轻微裂隙和局部变色。",
    status: "completed",
    start_date: "2018-04-20",
    end_date: "2023-11-30"
  },
  {
    name: "炳灵寺第169窟壁画",
    code: "BLS-169-MAIN",
    location: "永靖炳灵寺 第169窟",
    dynasty: "西秦",
    description: "炳灵寺第169窟建弘元年题记壁画，是我国最早有明确纪年的石窟壁画之一。由于地理位置和气候因素，病害类型复杂。",
    status: "active",
    start_date: "2022-05-12",
    end_date: nil
  }
]

puts "  创建项目..."
projects = projects_data.map do |data|
  Project.find_or_create_by!(code: data[:code]) do |p|
    p.name = data[:name]
    p.location = data[:location]
    p.dynasty = data[:dynasty]
    p.description = data[:description]
    p.status = data[:status]
    p.start_date = data[:start_date]
    p.end_date = data[:end_date]
  end
end

puts "  创建记录和标注..."

disease_types = ["flaking", "efflorescence", "discoloration", "crack", "other"]
severities = ["mild", "mild", "moderate", "moderate", "moderate", "severe"]
diseases_i18n = {
  flaking: "起甲",
  efflorescence: "酥碱",
  discoloration: "变色",
  crack: "裂隙",
  other: "其他"
}

descriptions = {
  flaking: [
    "壁画颜料层片状脱落，露出地仗层",
    "局部起甲严重，颜料层卷曲",
    "边缘起甲，有进一步扩大趋势",
    "片状剥落，面积约数平方厘米"
  ],
  efflorescence: [
    "可溶性盐析出，表面泛白",
    "酥碱区域有粉末状结晶",
    "地仗层酥松，强度下降",
    "底部盐析明显，呈白霜状"
  ],
  discoloration: [
    "朱砂变色，呈暗黑色",
    "石青颜料褪色明显",
    "整体色调变暗，对比度下降",
    "局部变黑，可能为烟熏所致"
  ],
  crack: [
    "横向裂隙，长约20cm",
    "地仗层开裂，未穿透",
    "网状裂隙，分布密集",
    "垂直裂隙，有逐渐加长趋势"
  ],
  other: [
    "水渍痕迹，形状不规则",
    "昆虫排泄物污染",
    "修复痕迹，与原壁有差异",
    "粉尘覆盖，影响观察"
  ]
}

projects.each do |project|
  next if project.records.any?

  num_records = case project.code
                when "MGK-257-XB" then 4
                when "MGK-320-NB" then 3
                when "MGK-017-CJD" then 4
                when "YLK-025-MAIN" then 3
                else 2
                end

  start_year = case project.code
               when "MGK-257-XB" then 2021
               when "MGK-320-NB" then 2022
               when "MGK-017-CJD" then 2020
               when "YLK-025-MAIN" then 2020
               else 2023
               end

  num_records.times do |i|
    year = start_year + i
    version_type = i == 0 ? "survey" : (i == num_records - 1 ? "special" : "review")
    is_abnormal = (project.code == "MGK-017-CJD" && i >= 2) || (project.code == "MGK-257-XB" && i == 3)

    image_url_map = {
      "MGK-257-XB" => "/mural_images/mgk-257.svg",
      "MGK-320-NB" => "/mural_images/mgk-320.svg",
      "MGK-017-CJD" => "/mural_images/mgk-017.svg",
      "YLK-025-MAIN" => "/mural_images/ylk-025.svg",
      "BLS-169-MAIN" => "/mural_images/bls-169.svg"
    }

    record = project.records.create!(
      batch_number: "#{year}-#{version_type[0].upcase}-%03d" % (i + 1),
      record_date: Date.new(year, 6 + i, 15),
      photographer: ["张研究员", "李工程师", "王技师", "赵博士"][i % 4],
      observer: ["陈教授", "刘研究员", "周博士", "吴老师"][i % 4],
      weather: ["晴", "多云", "阴", "小雨"][i % 4],
      temperature: is_abnormal ? (40 + rand(0..5)) : (18 + rand(0..10)),
      humidity: is_abnormal ? (85 + rand(0..10)) : (40 + rand(0..25)),
      image_url: image_url_map[project.code],
      notes: is_abnormal ? "本次监测发现环境参数异常，需加强关注。部分病害区域有扩大迹象。" : (i == 0 ? "首次普查，建立基线数据。" : "定期复查，对比分析病害发展。"),
      version_type: version_type
    )

    num_annotations = case version_type
                      when "survey" then 8 + rand(5)
                      when "review" then 10 + rand(6)
                      else 6 + rand(4)
                      end

    if is_abnormal
      num_annotations += 5
    end

    num_annotations.times do |j|
      disease = disease_types[rand(0..4)]
      severity = is_abnormal && j < 6 ? "severe" : severities[rand(0..5)]

      x = 100 + rand(800)
      y = 80 + rand(500)
      width = 30 + rand(150)
      height = 20 + rand(120)

      desc_list = descriptions[disease.to_sym]
      description = desc_list[rand(0..desc_list.length - 1)]

      record.annotations.create!(
        disease_type: disease,
        severity: severity,
        x: x,
        y: y,
        width: width,
        height: height,
        description: description,
        color: nil
      )
    end

    record.scale_markers.create!(
      x: 50,
      y: 700,
      length_pixels: 200.0,
      length_cm: 10.0,
      orientation: "horizontal"
    )
  end
end

puts "  创建导出记录..."

project = Project.find_by(code: "MGK-257-XB")
if project && project.exports.empty?
  export_dir = Rails.root.join("storage", "exports")
  FileUtils.mkdir_p(export_dir)

  summary_content = <<~TXT
    ======================================================
    石窟壁画颜料病害观察系统 - 项目摘要报告
    ======================================================

    项目信息
    --------
    项目编号: MGK-257-XB
    项目名称: 莫高窟第257窟西壁壁画
    地理位置: 敦煌莫高窟 第257窟
    所属朝代: 北魏
    项目状态: 进行中

    统计概览
    --------
    记录批次: 4 批
    病害标注: 42 处
    病害面积: 128.5 cm²
    导出时间: 2024-06-15 14:30:00

    病害类型统计
    ------------
      起甲: 15 处
      酥碱: 12 处
      变色: 8 处
      裂隙: 5 处
      其他: 2 处

    严重程度统计
    ------------
      轻微: 18 处
      中等: 16 处
      重度: 8 处

    批次详情
    --------
      [2024-06-15] 专项 - 2024-S-004
        病害数: 15处 | 温度: 42.5°C | 湿度: 88%
        ⚠️ 异常: 温度过高、湿度过高、重度病害8处

      [2023-07-15] 复查 - 2023-R-003
        病害数: 12处 | 温度: 24.5°C | 湿度: 52%

      [2022-08-15] 复查 - 2022-R-002
        病害数: 9处 | 温度: 22.0°C | 湿度: 48%

      [2021-06-15] 普查 - 2021-S-001
        病害数: 6处 | 温度: 20.5°C | 湿度: 45%

    ======================================================
  TXT

  summary_path = File.join(export_dir, "MGK-257-XB_summary_20240615.txt")
  File.write(summary_path, summary_content)

  project.exports.create!(
    format: "summary",
    record_ids: project.records.first(4).pluck(:id),
    generated_at: DateTime.new(2024, 6, 15, 14, 30, 0),
    file_path: summary_path
  )

  csv_content = "项目编号,项目名称,批次号,记录日期,版本类型,病害类型,严重程度,位置X,位置Y,宽度,高度,描述\n"
  project.records.first(2).each do |r|
    r.annotations.first(5).each do |ann|
      csv_content << "#{project.code},#{project.name},#{r.batch_number},#{r.record_date},#{r.version_type_i18n},#{ann.disease_type_i18n},#{ann.severity_i18n},#{ann.x},#{ann.y},#{ann.width},#{ann.height},\"#{ann.description}\"\n"
    end
  end

  csv_path = File.join(export_dir, "MGK-257-XB_csv_20240610.csv")
  File.write(csv_path, csv_content)

  project.exports.create!(
    format: "csv",
    record_ids: project.records.first(2).pluck(:id),
    generated_at: DateTime.new(2024, 6, 10, 10, 15, 0),
    file_path: csv_path
  )
end

puts ""
puts "✓ 数据初始化完成！"
puts "  项目: #{Project.count} 个"
puts "  记录: #{Record.count} 条"
puts "  标注: #{Annotation.count} 处"
puts "  尺度尺: #{ScaleMarker.count} 个"
puts "  导出记录: #{Export.count} 个"
puts ""
puts "异常项目: #{Project.all.count { |p| p.has_abnormal_data? }} 个"
puts "异常记录: #{Record.all.count { |r| r.abnormal? }} 条"
