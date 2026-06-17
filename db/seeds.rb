puts "初始化《旧城门铭文拓片整理系统》种子数据..."

rubbings = [
  {
    no: 'JC-001',
    title: '东门铭文拓片',
    dynasty: '唐代',
    location: '长安城遗址',
    dating: '贞观年间',
    status: '已审核',
    remarks: '出土于1985年，保存完好，为研究唐代城门制度重要资料。',
    created_by: '张明',
    inscriptions: [
      { content: '长安城东大门', line_number: 1, column_number: 1, position: '上', is_broken: false },
      { content: '贞观十年建', line_number: 2, column_number: 1, position: '上', is_broken: false },
      { content: '城门外郭', line_number: 1, column_number: 2, position: '右', is_broken: false },
      { content: '阔十丈高八丈', line_number: 2, column_number: 2, position: '右', is_broken: false }
    ],
    character_boxes: [
      { char_index: 1, x: 50, y: 30, width: 40, height: 40, char: '长', note: '首字，完整清晰' },
      { char_index: 2, x: 95, y: 30, width: 40, height: 40, char: '安', note: '' },
      { char_index: 3, x: 140, y: 30, width: 40, height: 40, char: '城', note: '' },
      { char_index: 4, x: 185, y: 30, width: 40, height: 40, char: '东', note: '' },
      { char_index: 5, x: 230, y: 30, width: 40, height: 40, char: '大', note: '' },
      { char_index: 6, x: 275, y: 30, width: 40, height: 40, char: '门', note: '' },
      { char_index: 7, x: 50, y: 80, width: 40, height: 40, char: '贞', note: '' },
      { char_index: 8, x: 95, y: 80, width: 40, height: 40, char: '观', note: '' }
    ],
    footnotes: [
      { content: '唐代长安城共设十二座城门，东门为其中之一。', source: '《唐六典》', page: '卷二十三', note: '官制门' },
      { content: '贞观十年即公元636年。', source: '《资治通鉴》', page: '卷一百九十四', note: '' }
    ],
    versions: [
      { version: '1.0', changelog: '初始创建，录入基本信息', changed_by: '张明', batch: 'INIT' },
      { version: '1.1', changelog: '添加释文内容', changed_by: '张明', batch: 'BATCH_20240115' },
      { version: '1.2', changelog: '添加字框标注', changed_by: '李华', batch: 'BATCH_20240120' },
      { version: '1.3', changelog: '添加脚注引用，审核通过', changed_by: '王芳', batch: 'BATCH_20240201' }
    ]
  },
  {
    no: 'JC-002',
    title: '西门铭文拓片',
    dynasty: '唐代',
    location: '长安城遗址',
    dating: '开元年间',
    status: '待审核',
    remarks: '部分字迹模糊，需进一步辨认。',
    created_by: '李华',
    inscriptions: [
      { content: '安福门', line_number: 1, column_number: 1, position: '中', is_broken: false },
      { content: '开[元]十[五]年', line_number: 2, column_number: 1, position: '中', is_broken: true, broken_note: '元、五二字残缺' },
      { content: '重修', line_number: 3, column_number: 1, position: '中', is_broken: false }
    ],
    character_boxes: [
      { char_index: 1, x: 100, y: 50, width: 45, height: 45, char: '安', note: '' },
      { char_index: 2, x: 150, y: 50, width: 45, height: 45, char: '福', note: '' },
      { char_index: 3, x: 200, y: 50, width: 45, height: 45, char: '门', note: '' },
      { char_index: 4, x: 100, y: 100, width: 45, height: 45, char: '开', note: '' },
      { char_index: 5, x: 150, y: 100, width: 45, height: 45, char: '[', note: '残缺字占位' },
      { char_index: 6, x: 200, y: 100, width: 45, height: 45, char: '十', note: '' }
    ],
    footnotes: [
      { content: '安福门为长安城西面中门。', source: '《长安志》', page: '卷六', note: '' }
    ],
    versions: [
      { version: '1.0', changelog: '初始创建', changed_by: '李华', batch: 'INIT' },
      { version: '1.1', changelog: '添加释文，标记断字', changed_by: '李华', batch: 'BATCH_20240301' }
    ]
  },
  {
    no: 'JC-003',
    title: '南门铭文拓片',
    dynasty: '宋代',
    location: '开封城遗址',
    dating: '大中祥符年间',
    status: '整理中',
    remarks: '新出土拓片，正在整理中。',
    created_by: '王芳',
    inscriptions: [
      { content: '朱雀门', line_number: 1, column_number: 1, position: '上', is_broken: false },
      { content: '大中祥符三年', line_number: 2, column_number: 1, position: '上', is_broken: false },
      { content: '敕建', line_number: 3, column_number: 1, position: '上', is_broken: false }
    ],
    character_boxes: [
      { char_index: 1, x: 80, y: 40, width: 42, height: 42, char: '朱', note: '' },
      { char_index: 2, x: 125, y: 40, width: 42, height: 42, char: '雀', note: '' },
      { char_index: 3, x: 170, y: 40, width: 42, height: 42, char: '门', note: '' }
    ],
    footnotes: [],
    versions: [
      { version: '1.0', changelog: '初始创建', changed_by: '王芳', batch: 'INIT' },
      { version: '1.1', changelog: '添加释文和部分字框', changed_by: '王芳', batch: 'BATCH_20240401' }
    ]
  },
  {
    no: 'JC-004',
    title: '北门铭文拓片',
    dynasty: '明代',
    location: '北京城遗址',
    dating: '永乐年间',
    status: '待整理',
    remarks: '尚未开始整理。',
    created_by: '赵强',
    inscriptions: [],
    character_boxes: [],
    footnotes: [],
    versions: [
      { version: '1.0', changelog: '初始创建，录入基本信息', changed_by: '赵强', batch: 'INIT' }
    ]
  },
  {
    no: 'JC-005',
    title: '玄武门铭文拓片',
    dynasty: '唐代',
    location: '大明宫遗址',
    dating: '贞观八年',
    status: '已完成',
    remarks: '玄武门为唐代宫城北门，此拓片记录了其建造年代。',
    created_by: '张明',
    inscriptions: [
      { content: '玄武门', line_number: 1, column_number: 1, position: '中', is_broken: false },
      { content: '贞观八年造', line_number: 2, column_number: 1, position: '中', is_broken: false },
      { content: '御林军宿卫', line_number: 3, column_number: 1, position: '中', is_broken: false }
    ],
    character_boxes: [
      { char_index: 1, x: 70, y: 35, width: 40, height: 40, char: '玄', note: '' },
      { char_index: 2, x: 115, y: 35, width: 40, height: 40, char: '武', note: '' },
      { char_index: 3, x: 160, y: 35, width: 40, height: 40, char: '门', note: '' },
      { char_index: 4, x: 70, y: 80, width: 40, height: 40, char: '贞', note: '' },
      { char_index: 5, x: 115, y: 80, width: 40, height: 40, char: '观', note: '' },
      { char_index: 6, x: 160, y: 80, width: 40, height: 40, char: '八', note: '' },
      { char_index: 7, x: 205, y: 80, width: 40, height: 40, char: '年', note: '' }
    ],
    footnotes: [
      { content: '玄武门为唐代大明宫正北门，因临玄武池而得名。', source: '《唐两京城坊考》', page: '卷一', note: '' },
      { content: '贞观八年即公元634年，为大明宫始建之年。', source: '《旧唐书·太宗本纪》', page: '卷二', note: '' }
    ],
    versions: [
      { version: '1.0', changelog: '初始创建', changed_by: '张明', batch: 'INIT' },
      { version: '1.1', changelog: '完成释文整理', changed_by: '张明', batch: 'BATCH_20240215' },
      { version: '1.2', changelog: '完成字框标注', changed_by: '李华', batch: 'BATCH_20240220' }
    ]
  }
]

rubbings.each do |rubbing_data|
  rubbing = Rubbing.create!(
    no: rubbing_data[:no],
    title: rubbing_data[:title],
    dynasty: rubbing_data[:dynasty],
    location: rubbing_data[:location],
    dating: rubbing_data[:dating],
    status: rubbing_data[:status],
    remarks: rubbing_data[:remarks],
    created_by: rubbing_data[:created_by]
  )

  inscriptions = []
  rubbing_data[:inscriptions].each do |inscription_data|
    inscriptions << rubbing.inscriptions.create!(inscription_data)
  end

  rubbing_data[:character_boxes].each_with_index do |box_data, index|
    inscription = inscriptions.first || inscriptions[index % inscriptions.size]
    rubbing.character_boxes.create!(box_data.merge(inscription: inscription)) if inscription
  end

  rubbing_data[:footnotes].each do |footnote_data|
    rubbing.footnotes.create!(footnote_data)
  end

  rubbing_data[:versions].each do |version_data|
    rubbing.versions.create!(version_data)
  end

  puts "创建拓片记录: #{rubbing.no} - #{rubbing.title}"
end

puts "\n种子数据初始化完成！"
puts "创建拓片数: #{Rubbing.count}"
puts "创建释文数: #{Inscription.count}"
puts "创建字框数: #{CharacterBox.count}"
puts "创建脚注数: #{Footnote.count}"
puts "创建版本数: #{Version.count}"
