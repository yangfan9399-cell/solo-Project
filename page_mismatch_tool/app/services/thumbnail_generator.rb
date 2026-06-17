class ThumbnailGenerator
  PAGE_WIDTH = 240
  PAGE_HEIGHT = 320

  STATUS_STYLES = {
    normal:   { paper: "#f5f0e1", border: "#8b7355", tint: "" },
    missing:  { paper: "#e8dcd0", border: "#a0522d", tint: "missing" },
    duplicate:{ paper: "#f0e6d0", border: "#cd853f", tint: "duplicate" },
    inserted: { paper: "#e8efe0", border: "#556b2f", tint: "inserted" },
    blank:    { paper: "#f8f5ef", border: "#a9a9a9", tint: "blank" },
    misnumbered: { paper: "#f5f0d0", border: "#b8860b", tint: "misnumbered" }
  }.freeze

  def initialize(page_mapping)
    @mapping = page_mapping
    @status = @mapping.status.to_sym
    @pdf_index = @mapping.pdf_page_index
    @actual_page = @mapping.actual_page_number
    @project_name = @mapping.project.name rescue "古籍"
    @style = STATUS_STYLES[@status] || STATUS_STYLES[:normal]
  end

  def generate
    seed = @pdf_index * 31 + @mapping.project.id * 7
    srand(seed)

    svg = %{<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 #{PAGE_WIDTH} #{PAGE_HEIGHT}" preserveAspectRatio="xMidYMid meet">}
    svg << background
    svg << paper_texture
    svg << page_border
    svg << central_columns
    svg << page_corner_marks

    case @style[:tint]
    when "missing"
      svg << missing_overlay
    when "duplicate"
      svg << duplicate_mark
    when "inserted"
      svg << inserted_mark
    when "misnumbered"
      svg << misnumbered_mark
    when "blank"
      svg << blank_overlay
    end

    svg << footer_text
    svg << %{</svg>}
    svg
  end

  private

  def background
    %{<rect width="#{PAGE_WIDTH}" height="#{PAGE_HEIGHT}" fill="#{@style[:paper]}" rx="3" ry="3"/>}
  end

  def paper_texture
    lines = ""
    80.times do
      x = rand(PAGE_WIDTH)
      y = rand(PAGE_HEIGHT)
      len = rand(5..20)
      opacity = "%.2f" % [rand(0.02..0.06)]
      lines << %{<line x1="#{x}" y1="#{y}" x2="#{x + len}" y2="#{y}" stroke="#6b5d4d" stroke-width="0.3" opacity="#{opacity}"/>}
    end
    40.times do
      cx = rand(PAGE_WIDTH)
      cy = rand(PAGE_HEIGHT)
      r = rand(0.5..2)
      opacity = "%.2f" % [rand(0.02..0.08)]
      lines << %{<circle cx="#{cx}" cy="#{cy}" r="#{r}" fill="#6b5d4d" opacity="#{opacity}"/>}
    end
    lines
  end

  def page_border
    border_color = @style[:border]
    lines = %{<rect x="15" y="15" width="#{PAGE_WIDTH - 30}" height="#{PAGE_HEIGHT - 30}" fill="none" stroke="#{border_color}" stroke-width="1.2" rx="2" ry="2"/>}
    lines << %{<rect x="22" y="22" width="#{PAGE_WIDTH - 44}" height="#{PAGE_HEIGHT - 44}" fill="none" stroke="#{border_color}" stroke-width="0.5" opacity="0.6"/>}
    lines
  end

  def central_columns
    return "" if @style[:tint] == "blank"

    text = ""
    col_count = 8
    col_width = (PAGE_WIDTH - 60) / col_count
    chars_per_col = 16

    col_count.times do |col|
      x = 30 + col * col_width + col_width / 2
      chars = []
      chars_per_col.times do |row|
        if rand > 0.08
          chars << random_char
        else
          chars << ""
        end
      end

      char_size = 11
      start_y = 38
      chars.each_with_index do |ch, i|
        y = start_y + i * (char_size + 3)
        opacity = rand > 0.85 ? "0.4" : "0.85"
        text << %{<text x="#{x}" y="#{y}" font-size="#{char_size}" fill="#3d3225" text-anchor="middle" font-family="serif" opacity="#{opacity}" writing-mode="vertical-rl">#{ch}</text>} if ch.present?
      end
    end

    fish_x = PAGE_WIDTH / 2
    fish_y = PAGE_HEIGHT / 2
    text << %{
      <path d="M#{fish_x - 18},#{fish_y} L#{fish_x - 8},#{fish_y - 10} L#{fish_x},#{fish_y - 6} L#{fish_x + 8},#{fish_y - 10} L#{fish_x + 18},#{fish_y} L#{fish_x + 8},#{fish_y + 10} L#{fish_x},#{fish_y + 6} L#{fish_x - 8},#{fish_y + 10} Z" fill="none" stroke="#{@style[:border]}" stroke-width="0.8" opacity="0.7"/>
      <line x1="#{fish_x}" y1="#{fish_y - 20}" x2="#{fish_x}" y2="#{fish_y + 20}" stroke="#{@style[:border]}" stroke-width="0.5" opacity="0.5"/>
    }

    text
  end

  def page_corner_marks
    marks = ""
    corners = [
      [20, 20], [PAGE_WIDTH - 20, 20],
      [20, PAGE_HEIGHT - 20], [PAGE_WIDTH - 20, PAGE_HEIGHT - 20]
    ]
    corners.each do |x, y|
      marks << %{<circle cx="#{x}" cy="#{y}" r="2.5" fill="none" stroke="#{@style[:border]}" stroke-width="0.5" opacity="0.5"/>}
    end
    marks
  end

  def missing_overlay
    %{
      <rect x="15" y="15" width="#{PAGE_WIDTH - 30}" height="#{PAGE_HEIGHT - 30}" fill="#c44" fill-opacity="0.1" rx="2" ry="2"/>
      <g transform="translate(#{PAGE_WIDTH/2}, #{PAGE_HEIGHT/2 - 20})">
        <text x="0" y="0" font-size="20" fill="#8b0000" text-anchor="middle" font-weight="bold" font-family="serif">缺</text>
        <text x="0" y="24" font-size="16" fill="#8b0000" text-anchor="middle" font-family="serif">佚</text>
        <text x="0" y="50" font-size="11" fill="#8b0000" text-anchor="middle" opacity="0.8">原页不存</text>
      </g>
      <line x1="30" y1="60" x2="#{PAGE_WIDTH - 30}" y2="#{PAGE_HEIGHT - 60}" stroke="#8b0000" stroke-width="0.5" stroke-dasharray="3,4" opacity="0.3"/>
      <line x1="#{PAGE_WIDTH - 30}" y1="60" x2="30" y2="#{PAGE_HEIGHT - 60}" stroke="#8b0000" stroke-width="0.5" stroke-dasharray="3,4" opacity="0.3"/>
    }
  end

  def duplicate_mark
    %{
      <rect x="15" y="15" width="#{PAGE_WIDTH - 30}" height="#{PAGE_HEIGHT - 30}" fill="#cd853f" fill-opacity="0.08" rx="2" ry="2"/>
      <g transform="translate(#{PAGE_WIDTH - 40}, 40)">
        <circle cx="0" cy="0" r="16" fill="#cd853f" opacity="0.9"/>
        <text x="0" y="-2" font-size="10" fill="white" text-anchor="middle" font-weight="bold">重</text>
        <text x="0" y="10" font-size="8" fill="white" text-anchor="middle">複</text>
      </g>
      <rect x="22" y="22" width="#{PAGE_WIDTH - 44}" height="#{PAGE_HEIGHT - 44}" fill="none" stroke="#cd853f" stroke-width="2" stroke-dasharray="4,2" opacity="0.4" rx="1" ry="1"/>
    }
  end

  def inserted_mark
    %{
      <rect x="15" y="15" width="#{PAGE_WIDTH - 30}" height="#{PAGE_HEIGHT - 30}" fill="#556b2f" fill-opacity="0.06" rx="2" ry="2"/>
      <g transform="translate(40, 40)">
        <rect x="-16" y="-16" width="32" height="32" rx="4" fill="#556b2f" opacity="0.85"/>
        <text x="0" y="-2" font-size="10" fill="white" text-anchor="middle" font-weight="bold">插</text>
        <text x="0" y="10" font-size="8" fill="white" text-anchor="middle">入</text>
      </g>
      <line x1="22" y1="22" x2="28" y2="28" stroke="#556b2f" stroke-width="1" opacity="0.6"/>
      <line x1="#{PAGE_WIDTH - 28}" y1="#{PAGE_HEIGHT - 28}" x2="#{PAGE_WIDTH - 22}" y2="#{PAGE_HEIGHT - 22}" stroke="#556b2f" stroke-width="1" opacity="0.6"/>
    }
  end

  def misnumbered_mark
    %{
      <rect x="15" y="15" width="#{PAGE_WIDTH - 30}" height="#{PAGE_HEIGHT - 30}" fill="#b8860b" fill-opacity="0.08" rx="2" ry="2"/>
      <g transform="translate(#{PAGE_WIDTH - 40}, #{PAGE_HEIGHT - 40})">
        <polygon points="0,-16 14,8 -14,8" fill="#b8860b" opacity="0.9"/>
        <text x="0" y="3" font-size="11" fill="white" text-anchor="middle" font-weight="bold">!</text>
      </g>
      <text x="#{PAGE_WIDTH/2}" y="50" font-size="9" fill="#8b6914" text-anchor="middle" opacity="0.7">页码错配</text>
      <line x1="40" y1="#{PAGE_HEIGHT - 50}" x2="#{PAGE_WIDTH - 40}" y2="#{PAGE_HEIGHT - 50}" stroke="#b8860b" stroke-width="1" stroke-dasharray="2,2" opacity="0.4"/>
    }
  end

  def blank_overlay
    %{
      <rect x="22" y="22" width="#{PAGE_WIDTH - 44}" height="#{PAGE_HEIGHT - 44}" fill="#f8f5ef"/>
      <text x="#{PAGE_WIDTH/2}" y="#{PAGE_HEIGHT/2}" font-size="14" fill="#aaa" text-anchor="middle" font-family="serif" opacity="0.5">空白页</text>
    }
  end

  def footer_text
    footer = %{<text x="#{PAGE_WIDTH/2}" y="#{PAGE_HEIGHT - 28}" font-size="9" fill="#6b5d4d" text-anchor="middle" opacity="0.7">}
    footer << "第#{@pdf_index}葉"
    footer << %{</text>}
    if @actual_page.present?
      footer << %{<text x="#{PAGE_WIDTH/2}" y="#{PAGE_HEIGHT - 17}" font-size="7" fill="#8b7355" text-anchor="middle" opacity="0.6">实第 #{@actual_page} 页</text>}
    end
    footer
  end

  def random_char
    common_chars = [
      "之", "乎", "者", "也", "曰", "云", "以", "为", "而", "则",
      "于", "其", "所", "者", "不", "亦", "可", "谓", "如", "若",
      "然", "故", "是", "此", "有", "无", "大", "小", "中", "上",
      "下", "天", "地", "人", "事", "物", "心", "道", "德", "仁",
      "义", "礼", "智", "信", "文", "武", "周", "召", "孔", "孟",
      "一", "二", "三", "四", "五", "六", "七", "八", "九", "十",
      "百", "千", "万", "年", "月", "日", "时", "世", "代", "国",
      "家", "朝", "野", "山", "水", "江", "河", "海", "川", "原",
      "帝", "王", "侯", "将", "相", "臣", "民", "兵", "农", "工",
      "書", "詩", "禮", "易", "春秋", "史", "記", "傳", "論", "註"
    ]
    common_chars.sample
  end
end
