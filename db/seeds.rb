Project.transaction do
  puts "开始创建种子数据..."

  project1 = Project.create!(
    name: "紫禁城太和殿斗拱修缮工程",
    code: "THD-2024-001",
    location: "北京故宫",
    building_type: "殿堂",
    era: "清代",
    status: "拆卸中",
    description: "太和殿是紫禁城中最大的宫殿建筑，本次工程主要针对檐部斗拱进行拆卸、检测、修复和复装工作。太和殿斗拱为清代官式做法，形制宏大，工艺精湛。",
    started_at: "2024-03-15",
    completed_at: nil
  )

  project2 = Project.create!(
    name: "应县木塔二层梁柱检测",
    code: "YXMT-2024-002",
    location: "山西应县",
    building_type: "塔",
    era: "辽代",
    status: "普查中",
    description: "应县木塔是中国现存最古老最高大的木结构塔式建筑，本次对二层梁柱体系进行全面检测，评估结构安全性。",
    started_at: "2024-05-01",
    completed_at: nil
  )

  project3 = Project.create!(
    name: "拙政园远香堂木构件普查",
    code: "ZZY-YXT-003",
    location: "苏州",
    building_type: "楼阁",
    era: "明代",
    status: "已完成",
    description: "远香堂是拙政园的主体建筑，为明代遗构。本次普查对所有木构件进行编号、检测和记录，建立完整的构件档案。",
    started_at: "2023-09-01",
    completed_at: "2024-02-28"
  )

  puts "项目创建完成，共 #{Project.count} 个项目"

  operators = ["张工", "李工", "王师傅", "赵工", "陈师傅", "刘工", "周师傅", "吴工"]
  materials = ["楠木", "松木", "榆木", "柏木", "杉木", "榉木", "柞木"]
  orientations = ["东", "南", "西", "北", "东南", "东北", "西南", "西北"]
  statuses = Component::STATUSES
  defect_types = Defect::DEFECT_TYPES
  severities = Defect::SEVERITIES
  event_types = ComponentVersion::EVENT_TYPES
  results = ReassemblyRecord::RESULTS - ["未核对"]

  def random_in_range(min, max)
    rand(min..max).to_f
  end

  thd_component_codes = []

  (1..5).each do |i|
    thd_component_codes << { code: "L-#{sprintf('%03d', i)}", type: "梁", position: "明间#{['东缝','西缝','中缝'][i%3]}梁", layer: 3 }
  end

  (1..6).each do |i|
    thd_component_codes << { code: "Z-#{sprintf('%03d', i)}", type: "柱", position: "#{['东','西','南','北'][i%4]}檐柱", layer: 1 + (i % 2) }
  end

  (1..8).each do |i|
    thd_component_codes << { code: "D-#{sprintf('%03d', i)}", type: "斗", position: "斗拱第#{i}攒坐斗", layer: 4 + (i % 2) }
  end

  (1..6).each do |i|
    thd_component_codes << { code: "G-#{sprintf('%03d', i)}", type: "拱", position: "斗拱第#{i}攒华拱", layer: 5 + (i % 3) }
  end

  (1..4).each do |i|
    thd_component_codes << { code: "S-#{sprintf('%03d', i)}", type: "升", position: "斗拱第#{i}攒齐心斗", layer: 6 + (i % 2) }
  end

  (1..3).each do |i|
    thd_component_codes << { code: "F-#{sprintf('%03d', i)}", type: "枋", position: "#{['额','平板','穿插'][i%3]}枋", layer: 2 + i }
  end

  thd_components = []
  thd_component_codes.each_with_index do |item, idx|
    batch = (idx / 5) + 1
    status_idx = idx % statuses.length
    component = project1.components.create!(
      code: item[:code],
      component_type: item[:type],
      position: item[:position],
      orientation: orientations[idx % orientations.length],
      layer: item[:layer],
      material: materials[idx % materials.length],
      length: random_in_range(80, 600).round(1),
      width: random_in_range(15, 80).round(1),
      height: random_in_range(10, 120).round(1),
      status: statuses[status_idx],
      notes: "#{item[:type]}构件，位于#{item[:position]}，材质为#{materials[idx % materials.length]}。",
      photo_refs: ["P#{sprintf('%03d', idx*2+1)}", "P#{sprintf('%03d', idx*2+2)}"],
      batch_tag: "BATCH-#{sprintf('%02d', batch)}"
    )
    thd_components << component
  end

  puts "太和殿项目创建 #{thd_components.length} 个构件"

  yxmt_components = []
  component_types_yxmt = ["梁", "柱", "斗", "拱", "枋", "檩", "椽"]
  (1..20).each do |i|
    ctype = component_types_yxmt[i % component_types_yxmt.length]
    layer = (i % 4) + 1
    batch = (i / 4) + 1
    component = project2.components.create!(
      code: "#{ctype[0]}-#{sprintf('%03d', i)}",
      component_type: ctype,
      position: "二层#{['东','西','南','北','东南','东北'][i%6]}面#{ctype}",
      orientation: orientations[i % orientations.length],
      layer: layer,
      material: materials[(i+2) % materials.length],
      length: random_in_range(60, 450).round(1),
      width: random_in_range(12, 60).round(1),
      height: random_in_range(8, 100).round(1),
      status: statuses[i % statuses.length],
      notes: "应县木塔二层#{ctype}构件，编号#{sprintf('%03d', i)}。",
      photo_refs: i.even? ? ["YX-#{sprintf('%04d', i*2)}", "YX-#{sprintf('%04d', i*2+1)}"] : ["YX-#{sprintf('%04d', i*3)}"],
      batch_tag: "YX-B#{sprintf('%02d', batch)}"
    )
    yxmt_components << component
  end

  puts "应县木塔项目创建 #{yxmt_components.length} 个构件"

  zzy_components = []
  component_types_zzy = ["梁", "柱", "斗", "拱", "升", "枋", "雀替", "驼峰"]
  (1..18).each do |i|
    ctype = component_types_zzy[i % component_types_zzy.length]
    layer = (i % 3) + 1
    batch = (i / 6) + 1
    component = project3.components.create!(
      code: "#{ctype[0]}-#{sprintf('%03d', i)}",
      component_type: ctype,
      position: "#{['明间','次间','稍间'][i%3]}#{ctype}",
      orientation: orientations[(i+1) % orientations.length],
      layer: layer,
      material: materials[(i+3) % materials.length],
      length: random_in_range(50, 400).round(1),
      width: random_in_range(10, 50).round(1),
      height: random_in_range(6, 90).round(1),
      status: statuses[(i+2) % statuses.length],
      notes: "远香堂#{ctype}构件，苏州明代建筑风格。",
      photo_refs: ["ZZY-#{sprintf('%03d', i*2)}", "ZZY-#{sprintf('%03d', i*2+1)}", "ZZY-#{sprintf('%03d', i*2+2)}"],
      batch_tag: "ZZY-B#{sprintf('%02d', batch)}"
    )
    zzy_components << component
  end

  puts "拙政园项目创建 #{zzy_components.length} 个构件"

  all_components = thd_components + yxmt_components + zzy_components

  defect_descriptions = {
    "开裂" => ["顺纹开裂，裂缝较直", "斜向开裂，延伸较长", "端头发裂，呈放射状", "干缩裂缝，深度较浅"],
    "腐朽" => ["心材腐朽，面积较大", "边材腐朽，表层松软", "局部腐朽，呈蜂窝状", "槽朽，内部空洞"],
    "虫蛀" => ["虫蛀孔洞分布密集", "白蚁蛀蚀，内部中空", "虫道纵横交错", "表层虫蛀，深度较浅"],
    "残缺" => ["端部缺角，残损面积约1/5", "侧面缺损，呈不规则形", "底部残缺，影响承重", "局部剥落，表层破损"],
    "变形" => ["弯曲变形，挠度较大", "扭曲变形，两端错位", "翘曲变形，板面不平", "压缩变形，断面变形"],
    "松动" => ["榫卯松动，缝隙明显", "连接松动，有晃动感", "铁件锈蚀导致松动", "木构件干缩松动"],
    "磨损" => ["表面磨损，纹理消失", "端头磨损，尺寸减小", "接触面磨损，凹凸不平", "长期摩擦导致磨损"],
    "脱落" => ["表层漆皮脱落", "木纤维脱落，起毛", "附饰件脱落", "榫头局部脱落"]
  }

  location_on_components = ["端部", "中部", "根部", "表面", "内部", "左侧", "右侧", "上侧", "下侧", "榫头处", "卯口处"]

  all_components.each_with_index do |component, comp_idx|
    defect_count = rand(0..5)
    next if defect_count.zero? && comp_idx % 3 != 0

    actual_defect_count = defect_count.zero? ? 1 : defect_count

    actual_defect_count.times do |i|
      dtype = defect_types[(comp_idx + i) % defect_types.length]
      severity = severities[(comp_idx + i * 2) % severities.length]
      repaired = [true, false, false].sample
      discovered_date = (Date.parse("2024-01-01") + rand(0..180).days).to_s

      defect = component.defects.create!(
        defect_type: dtype,
        severity: severity,
        description: defect_descriptions[dtype].sample,
        measured_size: "#{rand(5..200)}mm x #{rand(3..80)}mm x #{rand(2..50)}mm",
        location_on_component: location_on_components[(comp_idx + i) % location_on_components.length],
        discovered_at: discovered_date,
        repaired: repaired,
        repaired_at: repaired ? (Date.parse(discovered_date) + rand(10..60).days).to_s : nil,
        repair_notes: repaired ? "#{operators.sample}负责修复，采用#{['拼接','嵌补','更换','加固'][i%4]}工艺" : nil
      )
    end
  end

  puts "缺损记录创建完成，共 #{Defect.count} 条"

  all_components.each_with_index do |component, comp_idx|
    version_count = rand(2..8)
    base_time = component.created_at

    component.create_version("create", operators[comp_idx % operators.length], "构件初始录入")

    (1...version_count).each do |v_idx|
      event_type = event_types[(comp_idx + v_idx) % event_types.length]
      event_type = "update" if event_type == "create"
      operator = operators[(comp_idx + v_idx + 1) % operators.length]
      time_offset = v_idx * rand(1..7).days + rand(1..23).hours

      notes = case event_type
              when "update"
                "更新构件#{['位置描述','尺寸数据','材质信息','照片编号'][v_idx%4]}"
              when "status_change"
                "状态变更为#{statuses[(comp_idx + v_idx) % statuses.length]}"
              when "defect_added"
                "新增#{defect_types[v_idx % defect_types.length]}缺损记录"
              when "reassembly"
                "复装作业完成，核对人：#{operator}"
              when "batch_import"
                "第#{v_idx}批数据导入"
              else
                "系统自动更新"
              end

      version_time = base_time + time_offset
      version = component.component_versions.create!(
        version_number: v_idx + 1,
        batch_tag: component.batch_tag,
        event_type: event_type,
        object_snapshot: {
          code: component.code,
          component_type: component.component_type,
          position: component.position,
          orientation: component.orientation,
          status: component.status,
          notes: notes
        },
        changed_fields: ["code", "component_type", "position", "orientation", "status", "notes"].sample(rand(1..4)),
        operator: operator,
        notes: notes,
        recorded_at: version_time
      )
    end
  end

  puts "版本记录创建完成，共 #{ComponentVersion.count} 条"

  components_with_reassembly = all_components.select { |c| c.status.in?(%w[已复装 待复装 异常]) }
  components_with_reassembly = components_with_reassembly.sample(components_with_reassembly.length / 2)

  components_with_reassembly.each_with_index do |component, idx|
    result = results[idx % results.length]
    checked_at = component.updated_at + rand(1..14).days

    component.reassembly_records.create!(
      checked_by: operators[idx % operators.length],
      checked_at: checked_at,
      result: result,
      position_deviation: result == "位置偏差" ? "偏移#{rand(5..30)}mm" : nil,
      notes: case result
             when "一致"
               "复装位置准确，榫卯咬合紧密，符合规范要求。"
             when "位置偏差"
               "存在轻微位置偏差，需微调后再次核对。"
             when "需调整"
               "安装角度需调整，垫片厚度不足。"
             when "异常"
               "发现异常情况，构件有新的损伤，需进一步检查。"
             else
               "复装核对完成。"
             end,
      verified: [true, true, false].sample
    )
  end

  puts "复装核对记录创建完成，共 #{ReassemblyRecord.count} 条"

  puts "\n===== 种子数据统计 ====="
  puts "项目数: #{Project.count}"
  puts "构件总数: #{Component.count}"
  puts "  - 太和殿项目: #{project1.components.count} 个"
  puts "  - 应县木塔项目: #{project2.components.count} 个"
  puts "  - 拙政园项目: #{project3.components.count} 个"
  puts "缺损记录总数: #{Defect.count}"
  puts "版本记录总数: #{ComponentVersion.count}"
  puts "复装核对记录总数: #{ReassemblyRecord.count}"
  puts "\n构件类型分布:"
  Component.group(:component_type).count.each do |type, count|
    puts "  - #{type}: #{count} 个"
  end
  puts "\n构件状态分布:"
  Component.group(:status).count.each do |status, count|
    puts "  - #{status}: #{count} 个"
  end
  puts "\n缺损类型分布:"
  Defect.group(:defect_type).count.each do |type, count|
    puts "  - #{type}: #{count} 条"
  end
  puts "\n严重程度分布:"
  Defect.group(:severity).count.each do |sev, count|
    puts "  - #{sev}: #{count} 条"
  end
  puts "\n版本事件类型分布:"
  ComponentVersion.group(:event_type).count.each do |type, count|
    puts "  - #{type}: #{count} 条"
  end
  puts "\n复装核对结果分布:"
  ReassemblyRecord.group(:result).count.each do |result, count|
    puts "  - #{result}: #{count} 条"
  end
  puts "\n种子数据创建完成！"
end
